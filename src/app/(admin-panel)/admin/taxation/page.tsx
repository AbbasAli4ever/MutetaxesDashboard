import ReportsContent from "@/components/reports/ReportsContent";
import PageAccessGuard from "@/components/common/PageAccessGuard";

export default function AdminReports() {
  return (
    <PageAccessGuard module="REPORTS">
      <ReportsContent />
    </PageAccessGuard>
  );
}
