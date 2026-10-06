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
  DocumentRecord
} from '@/types';

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
  confirmExtractedData: (docId: string, verifiedData: any) => Promise<void>;
  syncWithSupabase: () => Promise<void>;
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

        const updateData: any = {};
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
          set((state) => ({
            skills: [...state.skills, {
              id: data.id,
              name: data.name,
              category: data.category as any,
              proficiency: data.proficiency as any,
              verificationStatus: data.verification_status as any,
            }],
          }));
        }
      },

      removeSkill: async (id) => {
        const supabase = createClient();
        await supabase.from('skills').delete().eq('id', id);
        set((state) => ({ skills: state.skills.filter((s) => s.id !== id) }));
      },

      updateSkillVerification: async (id, status) => {
        const supabase = createClient();
        await supabase.from('skills').update({ verification_status: status }).eq('id', id);
        set((state) => ({
          skills: state.skills.map((s) => (s.id === id ? { ...s, verificationStatus: status } : s)),
        }));
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
          set((state) => ({
            projects: [...state.projects, {
              id: data.id,
              title: data.title,
              description: data.description || '',
              techStack: data.tech_stack || [],
              architectureSummary: data.architecture_summary || '',
              studentContribution: data.student_contribution || '',
              githubUrl: data.github_url,
              liveUrl: data.live_url,
              keyChallenges: data.key_challenges || [],
              verificationStatus: data.verification_status as any,
            }],
          }));
        }
      },

      updateProject: async (id, data) => {
        const supabase = createClient();
        const updateData: any = {};
        if (data.title) updateData.title = data.title;
        if (data.description) updateData.description = data.description;
        if (data.techStack) updateData.tech_stack = data.techStack;
        if (data.githubUrl) updateData.github_url = data.githubUrl;

        await supabase.from('projects').update(updateData).eq('id', id);
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
        }));
      },

      removeProject: async (id) => {
        const supabase = createClient();
        await supabase.from('projects').delete().eq('id', id);
        set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
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
              verificationStatus: data.verification_status as any,
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
          set((state) => ({
            experiences: [...state.experiences, {
              id: data.id,
              company: data.company,
              role: data.role,
              location: data.location || '',
              startDate: data.start_date,
              endDate: data.end_date,
              isCurrent: data.is_current || false,
              description: data.description || '',
              achievements: data.achievements || [],
              verificationStatus: data.verification_status as any,
            }],
          }));
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
          set((state) => ({
            certifications: [...state.certifications, {
              id: data.id,
              name: data.name,
              issuer: data.issuer,
              issueDate: data.issue_date,
              credentialUrl: data.credential_url,
              verificationStatus: data.verification_status as any,
            }],
          }));
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

      confirmExtractedData: async (docId, verifiedData) => {
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
            set((state) => ({
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
                verificationStatus: profileData.verification_status as any,
              }
            }));
          }

          // Fetch skills
          const { data: skillsData } = await supabase.from('skills').select('*').eq('user_id', user.id);
          if (skillsData) {
            set({ skills: skillsData.map(s => ({
              id: s.id,
              name: s.name,
              category: s.category as any,
              proficiency: s.proficiency as any,
              verificationStatus: s.verification_status as any
            }))});
          }

          // Fetch projects
          const { data: projectsData } = await supabase.from('projects').select('*').eq('user_id', user.id);
          if (projectsData) {
            set({ projects: projectsData.map(p => ({
              id: p.id,
              title: p.title,
              description: p.description || '',
              techStack: p.tech_stack || [],
              architectureSummary: p.architecture_summary || '',
              studentContribution: p.student_contribution || '',
              githubUrl: p.github_url,
              liveUrl: p.live_url,
              keyChallenges: p.key_challenges || [],
              verificationStatus: p.verification_status as any,
            }))});
          }

          // Fetch experiences
          const { data: experiencesData } = await supabase.from('experiences').select('*').eq('user_id', user.id);
          if (experiencesData) {
            set({ experiences: experiencesData.map(e => ({
              id: e.id,
              company: e.company,
              role: e.role,
              location: e.location || '',
              startDate: e.start_date,
              endDate: e.end_date,
              isCurrent: e.is_current || false,
              description: e.description || '',
              achievements: e.achievements || [],
              verificationStatus: e.verification_status as any,
            }))});
          }

          // Fetch education
          const { data: educationData } = await supabase.from('education').select('*').eq('user_id', user.id);
          if (educationData) {
            set({ education: educationData.map(e => ({
              id: e.id,
              institution: e.institution,
              degree: e.degree,
              fieldOfStudy: e.field_of_study,
              startYear: e.start_year || 0,
              endYear: e.end_year || 0,
              cgpa: e.cgpa || 0,
              verificationStatus: e.verification_status as any,
            }))});
          }

          // Fetch certifications
          const { data: certificationsData } = await supabase.from('certifications').select('*').eq('user_id', user.id);
          if (certificationsData) {
            set({ certifications: certificationsData.map(c => ({
              id: c.id,
              name: c.name,
              issuer: c.issuer,
              issueDate: c.issue_date,
              credentialUrl: c.credential_url,
              verificationStatus: c.verification_status as any,
            }))});
          }

          // Fetch documents
          const { data: documentsData } = await supabase.from('documents').select('*').eq('user_id', user.id);
          if (documentsData) {
            set({ documents: documentsData.map(d => ({
              id: d.id,
              fileName: d.file_name,
              fileUrl: d.file_url,
              docType: d.doc_type as any,
              status: d.status as any,
              createdAt: d.created_at,
            }))});
          }
          
        } catch (error) {
          console.error("Failed to sync with Supabase:", error);
        }
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
