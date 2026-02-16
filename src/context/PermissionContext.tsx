"use client";
import React, { createContext, useContext, useMemo } from "react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule, ModuleAccess, PermissionAction } from "@/types/permissions";

interface PermissionContextType {
  module: PermissionModule;
  access: ModuleAccess;
  can: (action: PermissionAction) => boolean;
  isReadOnly: boolean;
}

const PermissionContext = createContext<PermissionContextType | null>(null);

/**
 * Provider that sets the current module context for permission checks.
 * Wrap your module/page content with this to enable simplified permission checks.
 */
export const ModulePermissionProvider: React.FC<{
  module: PermissionModule;
  children: React.ReactNode;
}> = ({ module, children }) => {
  const permissions = usePermissions();

  const value = useMemo(() => {
    const access = permissions.getModuleAccess(module);
    return {
      module,
      access,
      can: (action: PermissionAction) => permissions.can(module, action),
      isReadOnly: permissions.isReadOnly(module),
    };
  }, [module, permissions]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

/**
 * Hook to access the current module's permission context.
 * Must be used within a ModulePermissionProvider.
 */
export const useModulePermission = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error(
      "useModulePermission must be used within a ModulePermissionProvider"
    );
  }
  return context;
};

/**
 * Component that conditionally renders children based on permission.
 * Use within a ModulePermissionProvider.
 * 
 * @example
 * <PermissionGate action="CREATE">
 *   <CreateButton />
 * </PermissionGate>
 * 
 * @example
 * <PermissionGate action="DELETE" fallback={<DisabledDeleteButton />}>
 *   <DeleteButton />
 * </PermissionGate>
 */
export const PermissionGate: React.FC<{
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ action, children, fallback = null }) => {
  const { can } = useModulePermission();
  return can(action) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component that renders children only if user has read-only access.
 * Useful for showing indicators or disabled states.
 */
export const ReadOnlyIndicator: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { isReadOnly } = useModulePermission();
  return isReadOnly ? <>{children}</> : null;
};

/**
 * Standalone permission gate that doesn't require ModulePermissionProvider.
 * Use when you need to check permissions for a specific module inline.
 * 
 * @example
 * <StandalonePermissionGate module="REGISTRATION" action="CREATE">
 *   <CreateRegistrationButton />
 * </StandalonePermissionGate>
 */
export const StandalonePermissionGate: React.FC<{
  module: PermissionModule;
  action: PermissionAction;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, action, children, fallback = null }) => {
  const { can } = usePermissions();
  return can(module, action) ? <>{children}</> : <>{fallback}</>;
};

/**
 * Component that conditionally renders based on whether user has any access to a module.
 * 
 * @example
 * <ModuleAccessGate module="REGISTRATION">
 *   <RegistrationSection />
 * </ModuleAccessGate>
 */
export const ModuleAccessGate: React.FC<{
  module: PermissionModule;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ module, children, fallback = null }) => {
  const { hasModuleAccess } = usePermissions();
  return hasModuleAccess(module) ? <>{children}</> : <>{fallback}</>;
};

export default PermissionContext;
