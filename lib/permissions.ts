export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE_ROLES = 'user:manage_roles',
  USER_RESET_PASSWORD = 'user:reset_password',

  // Quiz Management
  QUIZ_CREATE = 'quiz:create',
  QUIZ_READ = 'quiz:read',
  QUIZ_UPDATE = 'quiz:update',
  QUIZ_DELETE = 'quiz:delete',
  QUIZ_PUBLISH = 'quiz:publish',

  // Batch Management
  BATCH_CREATE = 'batch:create',
  BATCH_READ = 'batch:read',
  BATCH_UPDATE = 'batch:update',
  BATCH_DELETE = 'batch:delete',
  BATCH_LIVE_MONITOR = 'batch:live_monitor',
  BATCH_RESULTS = 'batch:results',

  // Question Management
  QUESTION_CREATE = 'question:create',
  QUESTION_READ = 'question:read',
  QUESTION_UPDATE = 'question:update',
  QUESTION_DELETE = 'question:delete',
  QUESTION_IMPORT = 'question:import',

  // Subject Management
  SUBJECT_CREATE = 'subject:create',
  SUBJECT_READ = 'subject:read',
  SUBJECT_UPDATE = 'subject:update',
  SUBJECT_DELETE = 'subject:delete',

  // Response Management
  RESPONSE_READ = 'response:read',
  RESPONSE_REVIEW = 'response:review',
  RESPONSE_GRADE = 'response:grade',

  // Leaderboard
  LEADERBOARD_READ = 'leaderboard:read',
  LEADERBOARD_MANAGE = 'leaderboard:manage',

  // Audit & Security
  AUDIT_READ = 'audit:read',
  SECURITY_MANAGE = 'security:manage',

  // System Settings
  SETTINGS_READ = 'settings:read',
  SETTINGS_UPDATE = 'settings:update',
}

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  ADMIN: Object.values(Permission),
  INSTRUCTOR: [
    // Instructors can manage their own content
    Permission.QUIZ_CREATE,
    Permission.QUIZ_READ,
    Permission.QUIZ_UPDATE,
    Permission.QUIZ_DELETE,
    Permission.QUIZ_PUBLISH,

    Permission.BATCH_CREATE,
    Permission.BATCH_READ,
    Permission.BATCH_UPDATE,
    Permission.BATCH_DELETE,
    Permission.BATCH_LIVE_MONITOR,
    Permission.BATCH_RESULTS,

    Permission.QUESTION_CREATE,
    Permission.QUESTION_READ,
    Permission.QUESTION_UPDATE,
    Permission.QUESTION_DELETE,
    Permission.QUESTION_IMPORT,

    Permission.SUBJECT_CREATE,
    Permission.SUBJECT_READ,
    Permission.SUBJECT_UPDATE,
    Permission.SUBJECT_DELETE,

    Permission.RESPONSE_READ,
    Permission.RESPONSE_REVIEW,

    Permission.LEADERBOARD_READ,
    Permission.LEADERBOARD_MANAGE,

    Permission.AUDIT_READ,
  ],
}

export function hasPermission(role: string, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

export function hasAnyPermission(role: string, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: string, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}

export function getUserPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function canAccessAdminPanel(role: string): boolean {
  return role === 'ADMIN' || role === 'INSTRUCTOR'
}

export function canManageUsers(role: string): boolean {
  return role === 'ADMIN'
}

export function canAccessSystemSettings(role: string): boolean {
  return role === 'ADMIN'
}