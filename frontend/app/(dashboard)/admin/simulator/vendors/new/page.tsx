import { VendorForm } from "@/features/simulators/VendorForm";

export const metadata = { title: "Add Simulator Vendor | Naviora" };

export default function NewVendorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Add Simulator Vendor</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Register a new simulator vendor and its integration connection.
        </p>
      </div>
      <VendorForm />
    </div>
  );
}
