import { redirect } from "next/navigation";

export default function SimulatorRootPage() {
  redirect("/admin/simulator/vendors");
}
