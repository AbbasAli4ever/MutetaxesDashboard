import {
  LuFileText,
  LuClock,
  LuCircleCheckBig,
  LuDollarSign,
} from "react-icons/lu";
import type {
  StatCardData,
  RegistrationStatusData,
  TrendData,
  RevenueData,
  Registration,
} from "./types";

export const statCardsData: StatCardData[] = [
  {
    title: "Total Registrations",
    value: "4",
    change: "+12%",
    period: "from last month",
    icon: LuFileText,
    iconBg: "bg-blue-light-50 dark:bg-blue-light-500/10",
    iconColor: "text-blue-light-500",
  },
  {
    title: "Pending Review",
    value: "1",
    change: "Requires immediate attention",
    period: "",
    icon: LuClock,
    iconBg: "bg-warning-50 dark:bg-warning-500/10",
    iconColor: "text-warning-500",
    alert: true,
  },
  {
    title: "Completed",
    value: "2",
    change: "+8%",
    period: "this month",
    icon: LuCircleCheckBig,
    iconBg: "bg-success-50 dark:bg-success-500/10",
    iconColor: "text-success-500",
  },
  {
    title: "Total Revenue",
    value: "$1,799.97",
    change: "+18%",
    period: "from last month",
    icon: LuDollarSign,
    iconBg: "bg-theme-purple-500/10",
    iconColor: "text-theme-purple-500",
  },
];

export const registrationStatusData: RegistrationStatusData[] = [
  { name: "Pending", value: 25, count: 1 },
  { name: "In Progress", value: 25, count: 1 },
  { name: "Completed", value: 50, count: 2 },
];

export const registrationTrendData: TrendData[] = [
  { month: "Oct", registrations: 15 },
  { month: "Nov", registrations: 20 },
  { month: "Dec", registrations: 25 },
  { month: "Jan", registrations: 35 },
];

export const revenueTrendData: RevenueData[] = [
  { month: "Oct", revenue: 2500 },
  { month: "Nov", revenue: 5000 },
  { month: "Dec", revenue: 7500 },
  { month: "Jan", revenue: 10000 },
];

export const recentRegistrationsData: Registration[] = [
  {
    id: "REG-001",
    name: "John Doe",
    type: "Business Registration",
    date: "2026-01-26",
    status: "completed",
  },
  {
    id: "REG-002",
    name: "Jane Smith",
    type: "LLC Formation",
    date: "2026-01-20",
    status: "pending",
  },
  {
    id: "REG-003",
    name: "Tech Innovations Inc",
    type: "Corporation Setup",
    date: "2026-01-15",
    status: "in-progress",
  },
  {
    id: "REG-004",
    name: "Green Solutions",
    type: "Non-Profit Registration",
    date: "2026-01-10",
    status: "in-progress",
  },
];

export const PIE_COLORS = ["#465fff", "#12b76a", "#fb6514"];

export const CHART_COLORS = {
  pending: "#465fff",
  inProgress: "#12b76a",
  completed: "#fb6514",
};
