import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import bcrypt from "bcryptjs";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function seed() {
  console.log("🌱 Seeding database...");

  // Create organization
  const [org] = await db.insert(schema.organizations)
    .values({ name: "Alio Foundry" })
    .returning();
  console.log("  ✅ Organization created:", org.name);

  // Create users
  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  const [henry] = await db.insert(schema.users).values({
    orgId: org.id,
    name: "Henry Papiz",
    email: "henry@aliofoundry.com",
    passwordHash: hash("admin123"),
    role: "admin",
  }).returning();

  await db.insert(schema.users).values([
    {
      orgId: org.id,
      name: "Angus Gow",
      email: "angus@aliofoundry.com",
      passwordHash: hash("analyst123"),
      role: "analyst",
    },
    {
      orgId: org.id,
      name: "Andrew Rufener",
      email: "andrew@aliofoundry.com",
      passwordHash: hash("analyst123"),
      role: "analyst",
    },
    {
      orgId: org.id,
      name: "Client Viewer",
      email: "client@example.com",
      passwordHash: hash("viewer123"),
      role: "viewer",
    },
  ]);
  console.log("  ✅ 4 users created");

  // Persona configuration
  await db.insert(schema.personaConfig).values({
    orgId: org.id,
    acquisitionThesis: "Capability Buy",
    horizonBias: "H1 — Defend & Extend Core",
    integrationPhilosophy: "Full Integration (100-Day)",
    riskTolerance: "Moderate",
    irrHurdle: 3,
    processMaturity: 3,
    strategicClarity: 4,
    primarySectors: "Industrial Manufacturing, Aerospace & Defense, Tech-Enabled Services",
    updatedBy: henry.id,
  });
  console.log("  ✅ Persona config created");

  // Sample targets
  await db.insert(schema.targets).values([
    {
      orgId: org.id,
      name: "Precision Dynamics LLC",
      sector: "Aerospace & Defense",
      revenue: "$24M",
      status: "inflight",
      currentGate: 3,
      compositeScore: "71.00",
      notes: "Strong fit on capability gap; integration complexity TBD",
      createdBy: henry.id,
    },
    {
      orgId: org.id,
      name: "MidWest Fabricators Inc",
      sector: "Industrial Mfg",
      revenue: "$41M",
      status: "inflight",
      currentGate: 5,
      compositeScore: "64.00",
      notes: "ERP migration risk flagged in G5",
      createdBy: henry.id,
    },
    {
      orgId: org.id,
      name: "Alloy Systems Group",
      sector: "Manufacturing",
      revenue: "$18M",
      status: "new",
      currentGate: 0,
      notes: "Sourced via Fultonbridge",
      createdBy: henry.id,
    },
    {
      orgId: org.id,
      name: "TechSource Analytics",
      sector: "Tech-Enabled Services",
      revenue: "$9M",
      status: "closed",
      currentGate: 7,
      compositeScore: "82.00",
      outcome: "pursue",
      notes: "PURSUE — IC approved Dec 2025",
      createdBy: henry.id,
    },
    {
      orgId: org.id,
      name: "Cascade Industrial",
      sector: "Industrial Mfg",
      revenue: "$33M",
      status: "closed",
      currentGate: 4,
      compositeScore: "38.00",
      outcome: "pass",
      notes: "PASS — margin profile below threshold",
      createdBy: henry.id,
    },
  ]);
  console.log("  ✅ 5 sample targets created");

  // AI settings (disabled by default)
  await db.insert(schema.aiSettings).values({
    orgId: org.id,
    aiEnabled: false,
  });
  console.log("  ✅ AI settings created (disabled)");

  console.log("\n✅ Seed complete!");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
