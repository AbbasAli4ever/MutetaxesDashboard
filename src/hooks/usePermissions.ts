"use client";
import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  PermissionModule,
  PermissionAction,
  ModuleAccess,
  ModuleAccessLevel,
} from "@/types/permissions";

/**
 * Hook for checking user permissions at module and action level.
 * Provides utilities to check if user can access specific modules and perform specific actions.
 */
export const usePermissions = () => {
  const { user, hasPermission } = useAuth();
  const userPermissions = user?.permissions || [];

  // Normalize permissions to uppercase for consistent matching
  const normalizedPermissions = useMemo(
    () => userPermissions.map((p) => p.toUpperCase()),
    [userPermissions]
  );

  /**
   * Check if user has a specific permission
   * @param module - The module name (e.g., 'REGISTRATION')
   * @param action - The action (e.g., 'READ')
   */
  const can = useCallback(
    (module: PermissionModule, action: PermissionAction): boolean => {
      const permissionCode = `${module}_${action}`.toUpperCase();
      return hasPermission(permissionCode);
    },
    [hasPermission]
  );

  /**
   * Check if user has any permission for a module (READ, CREATE, UPDATE, or DELETE)
   * Used to determine if a nav item should be visible
   */
  const hasModuleAccess = useCallback(
    (module: PermissionModule): boolean => {
      const actions: PermissionAction[] = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
      return actions.some((action) => can(module, action));
    },
    [can]
  );

  /**
   * Get detailed access information for a module
   */
  const getModuleAccess = useCallback(
    (module: PermissionModule): ModuleAccess => {
      const canRead = can(module, 'READ');
      const canCreate = can(module, 'CREATE');
      const canUpdate = can(module, 'UPDATE');
      const canDelete = can(module, 'DELETE');

      let accessLevel: ModuleAccessLevel = 'none';
      
      if (canCreate && canUpdate && canDelete) {
        accessLevel = 'full';
      } else if (canUpdate || canDelete) {
        accessLevel = 'write';
      } else if (canRead) {
        accessLevel = 'read';
      }

      return {
        canRead,
        canCreate,
        canUpdate,
        canDelete,
        accessLevel,
        hasAnyAccess: canRead || canCreate || canUpdate || canDelete,
      };
    },
    [can]
  );

  /**
   * Check if user can only read in a module (no write permissions)
   */
  const isReadOnly = useCallback(
    (module: PermissionModule): boolean => {
      const access = getModuleAccess(module);
      return access.canRead && !access.canCreate && !access.canUpdate && !access.canDelete;
    },
    [getModuleAccess]
  );

  /**
   * Filter an array of items based on module permissions
   * Items without a permissionModule are always shown
   */
  const filterByPermission = useCallback(
    <T extends { permissionModule?: PermissionModule }>(items: T[]): T[] => {
      return items.filter((item) => {
        if (!item.permissionModule) return true;
        return hasModuleAccess(item.permissionModule);
      });
    },
    [hasModuleAccess]
  );

  /**
   * Get all permissions the user has for a specific module
   */
  const getModulePermissions = useCallback(
    (module: PermissionModule): PermissionAction[] => {
      const actions: PermissionAction[] = ['READ', 'CREATE', 'UPDATE', 'DELETE'];
      return actions.filter((action) => can(module, action));
    },
    [can]
  );

  return {
    can,
    hasModuleAccess,
    getModuleAccess,
    isReadOnly,
    filterByPermission,
    getModulePermissions,
    userPermissions,
  };
};

export default usePermissions;
