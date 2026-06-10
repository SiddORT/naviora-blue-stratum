import type { Metadata } from "next";
import { UsersTable } from "@/features/users/UsersTable";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage platform users and their roles
        </p>
      </div>
      <UsersTable />
    </div>
  );
}
