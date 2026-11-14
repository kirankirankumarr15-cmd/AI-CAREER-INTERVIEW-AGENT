import {
  ADMIN_ROLES,
  PERMISSIONS,
  type AdminRole,
  type Permission,
  type PermissionScope,
  type StaffRole,
} from './types';

export const STAFF_ROLES: StaffRole[] = [
  'super_admin',
  'institution_admin',
  'tpo',
  'department_coordinator',
  'faculty',
];

const ALL_NONE = Object.fromEntries(PERMISSIONS.map((p) => [p, 'none'])) as Record<Permission, PermissionScope>;

function scopes(overrides: Partial<Record<Permission, PermissionScope>>): Record<Permission, PermissionScope> {
  return { ...ALL_NONE, ...overrides };
}

export const DEFAULT_ROLE_SCOPES: Record<AdminRole, Record<Permission, PermissionScope>> = {
  super_admin: Object.fromEntries(PERMISSIONS.map((p) => [p, 'global'])) as Record<Permission, PermissionScope>,
  institution_admin: scopes({
    'institution.settings.read': 'organization',
    'institution.settings.write': 'organization',
    'students.read': 'organization',
    'students.write': 'organization',
    'analytics.read': 'organization',
    'skillgaps.read': 'organization',
    'import.execute': 'organization',
    'consent.read': 'organization',
    'consent.write': 'organization',
    'assessments.manage': 'organization',
    'audit.read': 'organization',
    'users.read': 'organization',
    'users.manage': 'organization',
    'roles.manage': 'organization',
    'reports.export': 'organization',
    'integrations.manage': 'organization',
  }),
  tpo: scopes({
    'institution.settings.read': 'organization',
    'students.read': 'organization',
    'students.write': 'organization',
    'analytics.read': 'organization',
    'skillgaps.read': 'organization',
    'import.execute': 'organization',
    'consent.read': 'organization',
    'assessments.manage': 'organization',
    'audit.read': 'organization',
    'users.read': 'organization',
    'reports.export': 'organization',
  }),
  department_coordinator: scopes({
    'students.read': 'department',
    'students.write': 'department',
    'analytics.read': 'department',
    'skillgaps.read': 'department',
    'import.execute': 'department',
    'assessments.manage': 'department',
    'reports.export': 'department',
  }),
  faculty: scopes({
    'students.read': 'department',
    'analytics.read': 'department',
    'skillgaps.read': 'department',
    'assessments.manage': 'department',
  }),
  student: scopes({
    'students.read': 'self',
    'analytics.read': 'self',
    'skillgaps.read': 'self',
    'consent.read': 'self',
    'consent.write': 'self',
  }),
};

export const PERMISSION_DEFINITIONS: Array<{
  key: Permission;
  label: string;
  group: 'Platform' | 'Institution' | 'Students' | 'Analytics' | 'Governance';
  description: string;
}> = [
  { key: 'platform.manage', label: 'Platform management', group: 'Platform', description: 'Manage the CareerPilot platform across institutions.' },
  { key: 'institution.settings.read', label: 'View institution settings', group: 'Institution', description: 'View institution profile, readiness methodology, departments and batches.' },
  { key: 'institution.settings.write', label: 'Edit institution settings', group: 'Institution', description: 'Change institution configuration, readiness weights, thresholds and taxonomy.' },
  { key: 'students.read', label: 'View students', group: 'Students', description: 'View student directory and scoped student records.' },
  { key: 'students.write', label: 'Manage students', group: 'Students', description: 'Edit student academic mapping and deactivate accounts.' },
  { key: 'analytics.read', label: 'Cohort analytics', group: 'Analytics', description: 'View readiness distribution, comparisons and student drilldown.' },
  { key: 'skillgaps.read', label: 'Skill gap reports', group: 'Analytics', description: 'View skill gap heatmaps and individual evidence.' },
  { key: 'import.execute', label: 'CSV import', group: 'Students', description: 'Preview and commit bulk student roster imports.' },
  { key: 'consent.read', label: 'View consent records', group: 'Governance', description: 'View DPDP consent coverage and privacy requests.' },
  { key: 'consent.write', label: 'Manage consent & privacy', group: 'Governance', description: 'Configure consent purposes and resolve privacy requests.' },
  { key: 'assessments.manage', label: 'Assessment management', group: 'Institution', description: 'Manage institutional assessments and view integrity signals.' },
  { key: 'audit.read', label: 'View audit logs', group: 'Governance', description: 'Review administrative and data-access audit trails.' },
  { key: 'users.read', label: 'View staff directory', group: 'Governance', description: 'View staff accounts and invitations.' },
  { key: 'users.manage', label: 'Manage users', group: 'Governance', description: 'Invite staff, assign roles, deactivate accounts.' },
  { key: 'roles.manage', label: 'Manage permissions', group: 'Governance', description: 'Change the institution permission matrix.' },
  { key: 'reports.export', label: 'Export reports', group: 'Analytics', description: 'Export CSV reports containing scoped institutional data.' },
  { key: 'integrations.manage', label: 'Manage integrations', group: 'Institution', description: 'Configure email, WhatsApp, webhook and LMS integrations.' },
];

export const ROLE_META: Record<AdminRole, { label: string; description: string; tone: string }> = {
  super_admin: {
    label: 'Super Admin',
    description: 'CareerPilot platform owner. Cross-institution governance.',
    tone: 'violet',
  },
  institution_admin: {
    label: 'Institution Admin',
    description: 'Full governance of one institution, its staff and configuration.',
    tone: 'blue',
  },
  tpo: {
    label: 'TPO',
    description: 'Placement operations, student management, imports and analytics.',
    tone: 'sky',
  },
  department_coordinator: {
    label: 'Department Coordinator',
    description: 'Department-scoped student management, imports and analytics.',
    tone: 'emerald',
  },
  faculty: {
    label: 'Faculty',
    description: 'Read-only department analytics and limited assessment visibility.',
    tone: 'amber',
  },
  student: {
    label: 'Student',
    description: 'Own profile, assessments and consent only.',
    tone: 'slate',
  },
};

export function normalizeAdminRole(role: string | null | undefined): AdminRole {
  if (!role) return 'student';
  if (role === 'admin') return 'institution_admin';
  return (ADMIN_ROLES as readonly string[]).includes(role) ? (role as AdminRole) : 'student';
}

export function isStaffRole(role: AdminRole): role is StaffRole {
  return role !== 'student';
}

export function scopeAllows(scope: PermissionScope): boolean {
  return scope !== 'none';
}

export function buildPermissions(
  role: AdminRole,
  overrides: Array<{ permission: string; allowed: boolean }> = []
): {
  permissions: Record<Permission, boolean>;
  scopes: Record<Permission, PermissionScope>;
} {
  const base = DEFAULT_ROLE_SCOPES[role] ?? DEFAULT_ROLE_SCOPES.student;
  const effective = { ...base };
  const overrideMap = new Map(overrides.map((o) => [o.permission, o.allowed]));

  for (const permission of PERMISSIONS) {
    const override = overrideMap.get(permission);
    if (override === false) effective[permission] = 'none';
    if (override === true && effective[permission] === 'none') {
      // Overrides may re-enable a permission, but never widen the maximum scope
      // configured for the role in code (least privilege).
      effective[permission] = base[permission] === 'none' ? 'none' : base[permission];
    }
  }

  const permissions = Object.fromEntries(
    PERMISSIONS.map((p) => [p, effective[p] !== 'none'])
  ) as Record<Permission, boolean>;

  return { permissions, scopes: effective };
}

export function pickPermissionSnapshot(role: AdminRole): Record<Permission, PermissionScope> {
  return { ...DEFAULT_ROLE_SCOPES[role] };
}

export function roleCan(role: AdminRole, permission: Permission): boolean {
  return DEFAULT_ROLE_SCOPES[role]?.[permission] !== 'none';
}

export const SENSITIVE_ACTIONS = new Set<string>([
  'user.role_changed',
  'user.deactivated',
  'permissions.updated',
  'import.committed',
  'consent.purpose_updated',
  'privacy_request.resolved',
  'integration.updated',
  'report.exported',
]);
