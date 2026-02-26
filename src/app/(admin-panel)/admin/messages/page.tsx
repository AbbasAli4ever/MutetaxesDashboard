"use client";

import AdminMessagesContent from "@/components/messages/AdminMessagesContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";

export default function Messages() {
  return (
    <PageAccessGuard module="MESSAGES">
      <ComingSoonOverlay title="Coming Soon" subtitle="Admin messages module is under development.">
        <AdminMessagesContent />
      </ComingSoonOverlay>
    </PageAccessGuard>
  );
}
