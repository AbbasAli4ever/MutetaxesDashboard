"use client";

import AdminSupportTicketsContent from "@/components/support-tickets/AdminSupportTicketsContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";

export default function SupportTickets() {
  return (
    <PageAccessGuard module="SUPPORT_TICKETS">
      <AdminSupportTicketsContent />
    </PageAccessGuard>
  );
}
