import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createClient } from '@/utils/supabase/client';
import {
  StudentProfile,
  EducationItem,
  SkillItem,
  ProjectItem,
  ExperienceItem,
  CertificationItem,
  DocumentRecord,
  VerificationStatus
} from '@/types';
import {
  syncEntireProfileToVectorDB,
  syncSkillsChunkToVectorDB,
  syncProjectChunkToVectorDB,
  syncCertificationChunkToVectorDB,
  syncExperienceChunkToVectorDB,
  deleteFromVectorDB
} from '@/lib/rag/sync';

const defaultProfile: StudentProfile = {
  id: '',
  email: '',
  fullName: '',
  phone: '',
  location: '',
  college: '',
  branch: '',
  graduationYear: new Date().getFullYear(),
  cgpa: 0,
  targetRole: '',
  targetCompanies: [],
  preferredLocations: [],
  readinessScore: 0,
  verificationStatus: 'Unverified',
};

interface ProfileState {
  profile: StudentProfile;
  education: EducationItem[];
  skills: SkillItem[];
  projects: ProjectItem[];
  experiences: ExperienceItem[];
  certifications: CertificationItem[];
  documents: DocumentRecord[];

  updateProfile: (data: Partial<StudentProfile>) => Promise<void>;
  addSkill: (skill: Omit<SkillItem, 'id'>) => Promise<void>;
  removeSkill: (id: string) => Promise<void>;
  updateSkillVerification: (id: string, status: SkillItem['verificationStatus']) => Promise<void>;
  addProject: (project: Omit<ProjectItem, 'id'>) => Promise<void>;
  updateProject: (id: string, data: Partial<ProjectItem>) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  addEducation: (edu: Omit<EducationItem, 'id'>) => Promise<void>;
  addExperience: (exp: Omit<ExperienceItem, 'id'>) => Promise<void>;
  addCertification: (cert: Omit<CertificationItem, 'id'>) => Promise<void>;
  addDocument: (doc: DocumentRecord) => Promise<void>;
  updateDocumentStatus: (id: string, status: DocumentRecord['status']) => Promise<void>;
  confirmExtractedData: (docId: string) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
  syncVectorKnowledgeBase: () => Promise<{ total: number; synced: number }>;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: defaultProfile,
      education: [],
      skills: [],
      projects: [],
      experiences: [],
      certifications: [],
      documents: [],

      updateProfile: async (data) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const updateData: Record<string, string | number | undefined> = {};
        if (data.fullName) updateData.full_name = data.fullName;
        if (data.location) updateData.location = data.location;
        if (data.college) updateData.college = data.college;
        if (data.branch) updateData.branch = data.branch;
        if (data.graduationYear) updateData.graduation_year = data.graduationYear;
        if (data.cgpa) updateData.cgpa = data.cgpa;
        if (data.githubUrl) updateData.github_url = data.githubUrl;
        if (data.linkedInUrl) updateData.linkedin_url = data.linkedInUrl;
        if (data.portfolioUrl) updateData.portfolio_url = data.portfolioUrl;
        if (data.targetRole) updateData.target_role = data.targetRole;

        const { error } = await supabase.from('profiles').update(updateData).eq('id', user.id);
        if (!error) {
          set((state) => ({ profile: { ...state.profile, ...data } }));
        }
      },

      addSkill: async (skill) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('skills').insert({
          user_id: user.id,
          name: skill.name,
          category: skill.category,
          proficiency: skill.proficiency,
          verification_status: skill.verificationStatus || 'Unverified'
        }).select().single();

        if (data && !error) {
          const newSkill: SkillItem = {
            id: data.id,
            name: data.name,
            category: data.category as SkillItem['category'],
            proficiency: data.proficiency as SkillItem['proficiency'],
            verificationStatus: (data.verification_status || 'Unverified') as VerificationStatus,
          };
          const updatedSkills = [...get().skills, newSkill];
          set({ skills: updatedSkills });
          syncSkillsChunkToVectorDB(user.id, updatedSkills).catch(() => {});
        }
      },

      removeSkill: async (id) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('skills').delete().eq('id', id);
        const updatedSkills = get().skills.filter((s) => s.id !== id);
        set({ skills: updatedSkills });
        if (user) {
          syncSkillsChunkToVectorDB(user.id, updatedSkills).catch(() => {});
        }
      },

      updateSkillVerification: async (id, status) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('skills').update({ verification_status: status }).eq('id', id);
        const updatedSkills = get().skills.map((s) => (s.id === id ? { ...s, verificationStatus: status } : s));
        set({ skills: updatedSkills });
        if (user) {
          syncSkillsChunkToVectorDB(user.id, updatedSkills).catch(() => {});
        }
      },

      addProject: async (project) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('projects').insert({
          user_id: user.id,
          title: project.title,
          description: project.description,
          tech_stack: project.techStack,
          architecture_summary: project.architectureSummary,
          student_contribution: project.studentContribution,
          github_url: project.githubUrl,
          live_url: project.liveUrl,
          key_challenges: project.keyChallenges,
          verification_status: project.verificationStatus || 'Unverified'
        }).select().single();

        if (data && !error) {
          const newProj: ProjectItem = {
            id: data.id,
            title: data.title,
            description: data.description || '',
            techStack: data.tech_stack || [],
            architectureSummary: data.architecture_summary || '',
            studentContribution: data.student_contribution || '',
            githubUrl: data.github_url,
            liveUrl: data.live_url,
            keyChallenges: data.key_challenges || [],
            verificationStatus: (data.verification_status || 'Unverified') as VerificationStatus,
          };
          set((state) => ({
            projects: [...state.projects, newProj],
          }));
          syncProjectChunkToVectorDB(user.id, newProj).catch(() => {});
        }
      },

      updateProject: async (id, data) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const updateData: Record<string, string | string[] | undefined> = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.techStack) updateData.tech_stack = data.techStack;
        if (data.githubUrl) updateData.github_url = data.githubUrl;

        await supabase.from('projects').update(updateData).eq('id', id);
        const updatedProjects = get().projects.map((p) => (p.id === id ? { ...p, ...data } : p));
        set({ projects: updatedProjects });

        const targetProj = updatedProjects.find((p) => p.id === id);
        if (user && targetProj) {
          syncProjectChunkToVectorDB(user.id, targetProj).catch(() => {});
        }
      },

      removeProject: async (id) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('projects').delete().eq('id', id);
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
        if (user) {
          deleteFromVectorDB(user.id, 'project', id).catch(() => {});
        }
      },

      addEducation: async (edu) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('education').insert({
          user_id: user.id,
          institution: edu.institution,
          degree: edu.degree,
          field_of_study: edu.fieldOfStudy,
          start_year: edu.startYear,
          end_year: edu.endYear,
          cgpa: edu.cgpa,
          verification_status: edu.verificationStatus || 'Unverified'
        }).select().single();

        if (data && !error) {
          set((state) => ({
            education: [...state.education, {
              id: data.id,
              institution: data.institution,
              degree: data.degree,
              fieldOfStudy: data.field_of_study,
              startYear: data.start_year || 0,
              endYear: data.end_year || 0,
              cgpa: data.cgpa || 0,
              verificationStatus: (data.verification_status || 'Unverified') as VerificationStatus,
            }],
          }));
        }
      },

      addExperience: async (exp) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('experiences').insert({
          user_id: user.id,
          company: exp.company,
          role: exp.role,
          location: exp.location,
          start_date: exp.startDate,
          end_date: exp.endDate,
          is_current: exp.isCurrent,
          description: exp.description,
          achievements: exp.achievements,
          verification_status: exp.verificationStatus || 'Unverified'
        }).select().single();

        if (data && !error) {
          const newExp: ExperienceItem = {
            id: data.id,
            company: data.company,
            role: data.role,
            location: data.location || '',
            startDate: data.start_date,
            endDate: data.end_date,
            isCurrent: data.is_current || false,
            description: data.description || '',
            achievements: data.achievements || [],
            verificationStatus: (data.verification_status || 'Unverified') as VerificationStatus,
          };
          set((state) => ({
            experiences: [...state.experiences, newExp],
          }));
          syncExperienceChunkToVectorDB(user.id, newExp).catch(() => {});
        }
      },

      addCertification: async (cert) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('certifications').insert({
          user_id: user.id,
          name: cert.name,
          issuer: cert.issuer,
          issue_date: cert.issueDate,
          credential_url: cert.credentialUrl,
          verification_status: cert.verificationStatus || 'Unverified'
        }).select().single();

        if (data && !error) {
          const newCert: CertificationItem = {
            id: data.id,
            name: data.name,
            issuer: data.issuer,
            issueDate: data.issue_date,
            credentialUrl: data.credential_url,
            verificationStatus: (data.verification_status || 'Unverified') as VerificationStatus,
          };
          set((state) => ({
            certifications: [...state.certifications, newCert],
          }));
          syncCertificationChunkToVectorDB(user.id, newCert).catch(() => {});
        }
      },

      addDocument: async (doc) => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('documents').insert({
          id: doc.id,
          user_id: user.id,
          file_name: doc.fileName,
          file_url: doc.fileUrl,
          doc_type: doc.docType,
          status: doc.status
        });

        if (!error) {
          set((state) => ({ documents: [doc, ...state.documents] }));
        }
      },

      updateDocumentStatus: async (id, status) => {
        const supabase = createClient();
        await supabase.from('documents').update({ status }).eq('id', id);
        set((state) => ({ documents: state.documents.map((d) => (d.id === id ? { ...d, status } : d)) }));
      },

      confirmExtractedData: async (docId) => {
        const supabase = createClient();
        await supabase.from('documents').update({ status: 'Confirmed' }).eq('id', docId);
        set((state) => {
          const updatedDocs = state.documents.map((d) => d.id === docId ? { ...d, status: 'Confirmed' as const } : d);
          return { documents: updatedDocs };
        });
      },

      syncWithSupabase: async () => {
        try {
          const supabase = createClient();
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Fetch profile
          const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
          if (profileData) {
            set(() => ({
              profile: {
                id: profileData.id,
                email: profileData.email,
                fullName: profileData.full_name || '',
                college: profileData.college || '',
                branch: profileData.branch || '',
                location: profileData.location || '',
                phone: profileData.phone || '',
                graduationYear: profileData.graduation_year || 0,
                cgpa: profileData.cgpa || 0,
                githubUrl: profileData.github_url,
                linkedInUrl: profileData.linkedin_url,
                portfolioUrl: profileData.portfolio_url,
                targetRole: profileData.target_role || '',
                targetCompanies: profileData.target_companies || [],
                preferredLocations: profileData.preferred_locations || [],
                readinessScore: profileData.readiness_score || 0,
                verificationStatus: (profileData.verification_status || 'Unverified') as VerificationStatus,
              }
            }));
          }

          // Fetch skills
          const { data: skillsData } = await supabase.from('skills').select('*').eq('user_id', user.id);
          if (skillsData) {
            set({ skills: skillsData.map((s: { id: string; name: string; category: string; proficiency: string; verification_status: string }) => ({
              id: s.id,
              name: s.name,
              category: s.category as SkillItem['category'],
              proficiency: s.proficiency as SkillItem['proficiency'],
              verificationStatus: (s.verification_status || 'Unverified') as VerificationStatus
            }))});
          }

          // Fetch projects
          const { data: projectsData } = await supabase.from('projects').select('*').eq('user_id', user.id);
          if (projectsData) {
            set({ projects: projectsData.map((p: { id: string; title: string; description: string; tech_stack: string[]; architecture_summary: string; student_contribution: string; github_url: string; live_url: string; key_challenges: string[]; verification_status: string }) => ({
              id: p.id,
              title: p.title,
              description: p.description || '',
              techStack: p.tech_stack || [],
              architectureSummary: p.architecture_summary || '',
              studentContribution: p.student_contribution || '',
              githubUrl: p.github_url,
              liveUrl: p.live_url,
              keyChallenges: p.key_challenges || [],
              verificationStatus: (p.verification_status || 'Unverified') as VerificationStatus,
            }))});
          }

          // Fetch experiences
          const { data: experiencesData } = await supabase.from('experiences').select('*').eq('user_id', user.id);
          if (experiencesData) {
            set({ experiences: experiencesData.map((e: { id: string; company: string; role: string; location: string; start_date: string; end_date: string; is_current: boolean; description: string; achievements: string[]; verification_status: string }) => ({
              id: e.id,
              company: e.company,
              role: e.role,
              location: e.location || '',
              startDate: e.start_date,
              endDate: e.end_date,
              isCurrent: e.is_current || false,
              description: e.description || '',
              achievements: e.achievements || [],
              verificationStatus: (e.verification_status || 'Unverified') as VerificationStatus,
            }))});
          }

          // Fetch education
          const { data: educationData } = await supabase.from('education').select('*').eq('user_id', user.id);
          if (educationData) {
            set({ education: educationData.map((e: { id: string; institution: string; degree: string; field_of_study: string; start_year: number; end_year: number; cgpa: number; verification_status: string }) => ({
              id: e.id,
              institution: e.institution,
              degree: e.degree,
              fieldOfStudy: e.field_of_study,
              startYear: e.start_year || 0,
              endYear: e.end_year || 0,
              cgpa: e.cgpa || 0,
              verificationStatus: (e.verification_status || 'Unverified') as VerificationStatus,
            }))});
          }

          // Fetch certifications
          const { data: certificationsData } = await supabase.from('certifications').select('*').eq('user_id', user.id);
          if (certificationsData) {
            set({ certifications: certificationsData.map((c: { id: string; name: string; issuer: string; issue_date: string; credential_url: string; verification_status: string }) => ({
              id: c.id,
              name: c.name,
              issuer: c.issuer,
              issueDate: c.issue_date,
              credentialUrl: c.credential_url,
              verificationStatus: (c.verification_status || 'Unverified') as VerificationStatus,
            }))});
          }

          // Fetch documents
          const { data: documentsData } = await supabase.from('documents').select('*').eq('user_id', user.id);
          if (documentsData) {
            set({ documents: documentsData.map((d: { id: string; file_name: string; file_url: string; doc_type: string; status: string; created_at: string }) => ({
              id: d.id,
              fileName: d.file_name,
              fileUrl: d.file_url,
              docType: d.doc_type as DocumentRecord['docType'],
              status: d.status as DocumentRecord['status'],
              createdAt: d.created_at,
            }))});
          }
          
        } catch (error) {
          console.error("Failed to sync with Supabase:", error);
        }
      },

      syncVectorKnowledgeBase: async () => {
        const state = get();
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { total: 0, synced: 0 };
        return await syncEntireProfileToVectorDB(user.id, {
          profile: state.profile,
          skills: state.skills,
          projects: state.projects,
          experiences: state.experiences,
        });
      },
    }),
    {
      name: 'careerpilot-profile-store',
      storage: createJSONStorage(() => (typeof window !== 'undefined' ? localStorage : {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      })),
    }
  )
);
