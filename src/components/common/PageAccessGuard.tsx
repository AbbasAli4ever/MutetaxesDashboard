"use client";

import React from "react";
import { LuShieldOff } from "react-icons/lu";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule } from "@/types/permissions";

interface PageAccessGuardProps {
  module: PermissionModule;
  children: React.ReactNode;
}

/**
 * Wraps a page and shows an access-denied message if the user has no
 * permissions for the given module. The page content is never rendered.
 */
export default function PageAccessGuard({ module, children }: PageAccessGuardProps) {
  const { hasModuleAccess } = usePermissions();

  if (!hasModuleAccess(module)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="p-5 bg-red-50 dark:bg-red-500/10 rounded-full mb-6">
          <LuShieldOff className="w-12 h-12 text-red-500 dark:text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Access Denied
        </h2>
        <p className="text-base text-gray-600 dark:text-gray-400 max-w-md mb-1">
          You don&apos;t have permission to view this page.
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-500 max-w-md">
          Please request access from your administrator to continue.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
