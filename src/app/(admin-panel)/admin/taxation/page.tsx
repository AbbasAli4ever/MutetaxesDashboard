import ReportsContent from "@/components/reports/ReportsContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";

export default function AdminReports() {
  return (
    <PageAccessGuard module="REPORTS">
      <ComingSoonOverlay title="Coming Soon" subtitle="Admin compliance and taxation tools are under development.">
        <ReportsContent />
      </ComingSoonOverlay>
    </PageAccessGuard>
  );
}
