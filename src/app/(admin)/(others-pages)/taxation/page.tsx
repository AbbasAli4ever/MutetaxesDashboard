import TaxationContent from "@/components/taxation/TaxationContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taxation | MuteTaxes",
  description: "Manage your Hong Kong tax obligations",
};

export default function Taxation() {
  return <TaxationContent />;
}
