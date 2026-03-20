import { headers } from "next/headers";
import { DashboardLayout } from "@/components/shared/DashboardLayout";
import { UserRole } from "@/models/User";
import { RecommendationPanel } from "@/components/recommendations/RecommendationPanel";
import { SmartRecommendations } from "@/components/recommendations/SmartRecommendations";

export default async function CustomerDashboardPage() {
  const headersList = await headers();
  const userName = headersList.get("x-user-id") ?? "Customer"; // ID until /me hydrates name

  return (
    <DashboardLayout
      role={UserRole.CUSTOMER}
      userName={userName}
      heading="My Dashboard"
      description="Browse restaurants, track your orders, and manage your profile."
      icon="🛍️"
    >
      <div className="mt-8 space-y-12">
        <RecommendationPanel />
        <section>
            <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
                <span className="bg-primary text-primary-foreground p-1.5 rounded-lg text-sm">✨</span>
                Smart Recommendations
            </h2>
            <SmartRecommendations />
        </section>
      </div>
    </DashboardLayout>
  );
}
