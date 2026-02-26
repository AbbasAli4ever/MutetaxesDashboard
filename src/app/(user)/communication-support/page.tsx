"use client";

import CommunicationSupportContent from "@/components/communication-support/CommunicationSupportContent";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";

export default function CommunicationSupport() {
  return (
    <ComingSoonOverlay title="Coming Soon" subtitle="Customer communication & support features are under development.">
      <CommunicationSupportContent />
    </ComingSoonOverlay>
  );
}
