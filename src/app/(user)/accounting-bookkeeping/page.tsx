import AccountingBookkeepingContent from "@/components/accounting-bookkeeping/AccountingBookkeepingContent";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";
export default function AccountingBookkeeping() {
  return (
    <ComingSoonOverlay title="Coming Soon" subtitle="Customer accounting & bookkeeping module is under development.">
      <AccountingBookkeepingContent />
    </ComingSoonOverlay>
  );
}
