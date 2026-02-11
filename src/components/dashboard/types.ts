import { LucideIcon } from "react-icons/lu";

export interface StatCardData {
  title: string;
  value: string;
  change: string;
  period: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  alert?: boolean;
}

export interface RegistrationStatusData {
  name: string;
  value: number;
  count: number;
}

export interface TrendData {
  month: string;
  registrations: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
}

export interface Registration {
  id: string;
  name: string;
  type: string;
  date: string;
  status: "completed" | "pending" | "in-progress";
}

export type TimeView = "weekly" | "monthly" | "yearly";
