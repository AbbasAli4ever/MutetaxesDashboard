"use client";
import React, { createContext, useContext, useState, useEffect } from "react";

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

  useEffect(() => {
    const savedRole = localStorage.getItem("dashboardRole") as Role | null;
    if (savedRole === "user" || savedRole === "admin") {
      setRole(savedRole);
    }
  }, []);

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
