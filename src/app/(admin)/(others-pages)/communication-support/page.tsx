import CommunicationSupportContent from "@/components/communication-support/CommunicationSupportContent";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Communication & Support | MuteTaxes",
  description: "Connect with your accountant and get support",
};

export default function CommunicationSupport() {
  return <CommunicationSupportContent />;
}
