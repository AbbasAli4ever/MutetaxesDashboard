"use client";
import React, { createContext, useContext } from "react";
import { useAuth } from "@/context/AuthContext";

type Role = "user" | "admin";

type RoleContextType = {
  role: Role;
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
  const { user } = useAuth();

  // Role is derived from the server-authoritative user.type — no manual toggle
  const role: Role = user?.type === "ADMIN" ? "admin" : "user";

  return (
    <RoleContext.Provider value={{ role }}>
      {children}
    </RoleContext.Provider>
  );
};
