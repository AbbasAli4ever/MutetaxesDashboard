import AccountingReportsContent from "@/components/accounting-reports/AccountingReportsContent";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";
export default function AccountingReports() {
  return (
    <ComingSoonOverlay title="Coming Soon" subtitle="Customer accounting reports module is under development.">
      <AccountingReportsContent />
    </ComingSoonOverlay>
  );
}
