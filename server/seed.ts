import { db } from "./db";
import { users, conversations, messages, workPackages } from "@shared/schema";

async function seed() {
  console.log("Seeding database...");

  try {
    // Clear existing data
    await db.delete(messages);
    await db.delete(conversations);
    await db.delete(workPackages);
    await db.delete(users);

    // Seed sample work packages
    const sampleWorkPackages = [
      {
        wpId: "CWA-2301-001",
        description: "Foundation Preparation",
        status: "In Progress",
        progress: 75,
        dueDate: new Date("2024-01-15"),
        assignedTeam: "Team Alpha",
        cwaId: "CWA-2301"
      },
      {
        wpId: "CWA-2301-002",
        description: "Steel Framework",
        status: "Planned",
        progress: 0,
        dueDate: new Date("2024-01-22"),
        assignedTeam: "Team Beta",
        cwaId: "CWA-2301"
      },
      {
        wpId: "CWA-2301-003",
        description: "Concrete Pour",
        status: "Delayed",
        progress: 30,
        dueDate: new Date("2024-01-18"),
        assignedTeam: "Team Gamma",
        cwaId: "CWA-2301"
      }
    ];

    await db.insert(workPackages).values(sampleWorkPackages);

    // Seed sample conversations
    const sampleConversations = [
      {
        title: "CWA-2301 Progress Review",
        category: "cwa-analysis",
        userId: "default_user",
        metadata: JSON.stringify({ projectId: "CWA-2301" })
      },
      {
        title: "Schedule Planning Q1 2025",
        category: "scheduling", 
        userId: "default_user",
        metadata: JSON.stringify({ quarter: "Q1-2025" })
      },
      {
        title: "Resource Allocation Updates",
        category: "resource-planning",
        userId: "default_user",
        metadata: JSON.stringify({ department: "engineering" })
      }
    ];

    const insertedConversations = await db.insert(conversations).values(sampleConversations).returning();

    // Seed sample messages for each conversation
    for (const conv of insertedConversations) {
      const sampleMessages = [
        {
          conversationId: conv.id,
          content: "Hello! How can I help you with your AWP today?",
          sender: "bot" as const,
          messageType: "text" as const,
          data: null
        },
        {
          conversationId: conv.id,
          content: conv.title.includes("CWA") ? "Can you show me the progress for CWA-2301?" : 
                   conv.title.includes("Schedule") ? "What's the current schedule status?" :
                   "How are our resources allocated?",
          sender: "user" as const,
          messageType: "text" as const,
          data: null
        }
      ];

      await db.insert(messages).values(sampleMessages);
    }

    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed().catch(console.error);
}

export { seed };