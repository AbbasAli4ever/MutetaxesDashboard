"use client";

import { useRole } from "@/context/RoleContext";
import TaxationContent from "@/components/taxation/TaxationContent";
import ReportsContent from "@/components/reports/ReportsContent";

export default function Taxation() {
  const { role } = useRole();
  return role === "admin" ? <ReportsContent /> : <TaxationContent />;
}
