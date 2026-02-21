import { headers } from "next/headers";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/models/User";

export default async function AdminDashboardPage() {
  const headersList = await headers();
  const userName = headersList.get("x-user-id") ?? "Admin";

  return (
    <DashboardLayout
      role={UserRole.ADMIN}
      userName={userName}
      heading="Admin Control Panel"
      description="Oversee users, approve providers, and manage platform operations."
      icon="🛡️"
    />
  );
}
