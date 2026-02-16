"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RootPage() {
  const router = useRouter();

  useEffect(() => {
    const savedRole = localStorage.getItem("dashboardRole");
    if (savedRole === "admin") {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [router]);

  return null;
}
