// Permission action types
export type PermissionAction = 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';

// Module names that map to permission prefixes (must match backend)
export type PermissionModule =
  | 'REGISTRATIONS'
  | 'USER_MANAGEMENT'
  | 'PAYMENTS'
  | 'COMPLIANCE'
  | 'REPORTS'
  | 'MESSAGES'
  | 'SUPPORT_TICKETS'
  | 'BADGE_CREATION';

// Permission code format: MODULE_ACTION (e.g., REGISTRATION_READ)
export type PermissionCode = `${PermissionModule}_${PermissionAction}`;

// Module permission configuration for nav items
export interface ModulePermissionConfig {
  module: PermissionModule;
  // Optional: specific permissions required (defaults to any permission in the module)
  requiredPermissions?: PermissionAction[];
}

// User permission levels (derived from their permissions)
export type ModuleAccessLevel = 'none' | 'read' | 'write' | 'full';

// Utility type for checking permissions
export interface ModuleAccess {
  canRead: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  accessLevel: ModuleAccessLevel;
  hasAnyAccess: boolean;
}
