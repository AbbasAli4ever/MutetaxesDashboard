"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

type Role = "user" | "admin";

type RoleContextType = {
  role: Role;
  toggleRole: () => void;
};

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within a RoleProvider");
  }
  return context;
};

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [role, setRole] = useState<Role>("user");
  const pathname = usePathname();

  // Sync role from URL — if the user navigates to /admin/* manually,
  // update role so the sidebar reflects the correct nav items.
  useEffect(() => {
    const roleFromPath: Role = pathname.startsWith("/admin") ? "admin" : "user";
    setRole(roleFromPath);
    localStorage.setItem("dashboardRole", roleFromPath);
  }, [pathname]);

  const toggleRole = () => {
    setRole((prev) => {
      const next = prev === "user" ? "admin" : "user";
      localStorage.setItem("dashboardRole", next);
      return next;
    });
  };

  return (
    <RoleContext.Provider value={{ role, toggleRole }}>
      {children}
    </RoleContext.Provider>
  );
};
