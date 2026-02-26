import TaxationContent from "@/components/taxation/TaxationContent";
import ComingSoonOverlay from "@/components/common/ComingSoonOverlay";
export default function Taxation() {
  return (
    <ComingSoonOverlay title="Coming Soon" subtitle="Customer taxation module is under development.">
      <TaxationContent />
    </ComingSoonOverlay>
  );
}
