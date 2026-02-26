"use client";

import AdminSupportTicketsContent from "@/components/support-tickets/AdminSupportTicketsContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";

export default function SupportTickets() {
  return (
    <PageAccessGuard module="SUPPORT_TICKETS">
      <ComingSoonOverlay title="Coming Soon" subtitle="Admin support tickets tools are under development.">
        <AdminSupportTicketsContent />
      </ComingSoonOverlay>
    </PageAccessGuard>
  );
}
