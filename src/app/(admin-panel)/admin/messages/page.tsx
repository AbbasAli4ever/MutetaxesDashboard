"use client";

import AdminMessagesContent from "@/components/messages/AdminMessagesContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";

export default function Messages() {
  return (
    <PageAccessGuard module="MESSAGES">
      <AdminMessagesContent />
    </PageAccessGuard>
  );
}
