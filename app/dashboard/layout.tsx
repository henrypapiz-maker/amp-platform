import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import TopNav from "@/components/layout/TopNav";
import DemoBrief from "@/components/DemoBrief";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // v2: Check if org has selected a methodology template
  const session = await auth();
  if (session?.user) {
    const orgId = (session.user as any).orgId;
    if (orgId) {
      try {
        const { orgMethodology } = await import("@/lib/db/schema-v2");
        const result = await db.select()
          .from(orgMethodology)
          .where(eq(orgMethodology.orgId, orgId))
          .limit(1);
        if (result.length === 0) {
          redirect("/onboarding");
        }
      } catch {
        // v2 tables not yet migrated — skip onboarding check
      }
    }
  }

  return (
    <div className="min-h-screen bg-stone-900">
      <TopNav />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
      <DemoBrief />
    </div>
  );
}
