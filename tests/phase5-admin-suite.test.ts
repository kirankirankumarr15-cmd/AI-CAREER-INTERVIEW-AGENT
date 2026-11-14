import { describe, it, expect } from 'vitest';
import { buildPermissions, isStaffRole, normalizeAdminRole } from '@/lib/admin/permissions';
import { sanitizeCsvCell, parseCsvText, detectMapping } from '@/lib/admin/csv';
import { ADMIN_ROLES, PERMISSIONS } from '@/lib/admin/types';

describe('Phase 5 — Admin/TPO Suite Domain Tests', () => {
  describe('RBAC & Role Permissions', () => {
    it('defines all 6 institutional roles', () => {
      expect(ADMIN_ROLES).toContain('super_admin');
      expect(ADMIN_ROLES).toContain('institution_admin');
      expect(ADMIN_ROLES).toContain('tpo');
      expect(ADMIN_ROLES).toContain('department_coordinator');
      expect(ADMIN_ROLES).toContain('faculty');
      expect(ADMIN_ROLES).toContain('student');
      expect(ADMIN_ROLES).toHaveLength(6);
    });

    it('correctly classifies staff vs student roles', () => {
      expect(isStaffRole('super_admin')).toBe(true);
      expect(isStaffRole('institution_admin')).toBe(true);
      expect(isStaffRole('tpo')).toBe(true);
      expect(isStaffRole('department_coordinator')).toBe(true);
      expect(isStaffRole('faculty')).toBe(true);
      expect(isStaffRole('student')).toBe(false);
    });

    it('normalizes roles safely', () => {
      expect(normalizeAdminRole('super_admin')).toBe('super_admin');
      expect(normalizeAdminRole('admin')).toBe('institution_admin');
      expect(normalizeAdminRole('tpo')).toBe('tpo');
      expect(normalizeAdminRole('department_coordinator')).toBe('department_coordinator');
      expect(normalizeAdminRole('faculty')).toBe('faculty');
      expect(normalizeAdminRole('unknown_role')).toBe('student');
      expect(normalizeAdminRole(null)).toBe('student');
    });

    it('grants global permissions to super_admin', () => {
      const { permissions, scopes } = buildPermissions('super_admin');
      expect(permissions['platform.manage']).toBe(true);
      expect(permissions['institution.settings.write']).toBe(true);
      expect(permissions['audit.read']).toBe(true);
      expect(scopes['platform.manage']).toBe('global');
    });

    it('restricts department coordinator scope to department', () => {
      const { permissions, scopes } = buildPermissions('department_coordinator');
      expect(permissions['platform.manage']).toBe(false);
      expect(permissions['institution.settings.write']).toBe(false);
      expect(permissions['students.read']).toBe(true);
      expect(scopes['students.read']).toBe('department');
    });

    it('denies institutional management permissions to student role', () => {
      const { permissions } = buildPermissions('student');
      expect(permissions['platform.manage']).toBe(false);
      expect(permissions['institution.settings.write']).toBe(false);
      expect(permissions['import.execute']).toBe(false);
      expect(permissions['audit.read']).toBe(false);
      expect(permissions['users.manage']).toBe(false);
    });
  });

  describe('CSV Sanitization & Formula Injection Defense', () => {
    it('sanitizes dangerous spreadsheet formula characters', () => {
      expect(sanitizeCsvCell('=1+1')).toBe("'=1+1");
      expect(sanitizeCsvCell('+cmd|')).toBe("'+cmd|");
      expect(sanitizeCsvCell('-SUM(A1:A10)')).toBe("'-SUM(A1:A10)");
      expect(sanitizeCsvCell('@HYPERLINK("http://evil.com")')).toBe("'@HYPERLINK(\"http://evil.com\")");
    });

    it('handles embedded quotes and commas by CSV standard', () => {
      expect(sanitizeCsvCell('Computer Science, Engineering')).toBe('"Computer Science, Engineering"');
    });

    it('leaves safe alphanumeric text and identifiers intact', () => {
      expect(sanitizeCsvCell('Prof. Ramesh Rao')).toBe('Prof. Ramesh Rao');
      expect(sanitizeCsvCell('4PM22CS045')).toBe('4PM22CS045');
      expect(sanitizeCsvCell('student@pesitm.edu.in')).toBe('student@pesitm.edu.in');
    });

    it('parses CSV text and detects standard headers', () => {
      const csv = 'USN,Full Name,Email,Department,Batch\n4PM22CS001,Aarav Sharma,aarav@pesitm.edu.in,CSE,2026';
      const parsed = parseCsvText(csv);
      expect(parsed.headers).toEqual(['USN', 'Full Name', 'Email', 'Department', 'Batch']);
      expect(parsed.rows).toHaveLength(1);

      const mapping = detectMapping(parsed.headers);
      expect(mapping['USN']).toBe('student_id');
      expect(mapping['Full Name']).toBe('full_name');
      expect(mapping['Email']).toBe('email');
    });
  });
});
