import type { Metadata } from "next";
import DisplayClient from "./DisplayClient";

export const metadata: Metadata = {
  title: "受付案内 | シムレース体験",
};

export default function DisplayPage() {
  return <DisplayClient />;
}
