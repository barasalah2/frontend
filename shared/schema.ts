import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull().default("general"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // 'user' or 'bot'
  messageType: text("message_type").default("text"), // 'text', 'table', 'visualization'
  data: jsonb("data"), // For storing table data, chart data, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workPackages = pgTable("work_packages", {
  id: serial("id").primaryKey(),
  wpId: text("wp_id").notNull().unique(),
  description: text("description").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").default(0),
  dueDate: timestamp("due_date"),
  assignedTeam: text("assigned_team"),
  cwaId: text("cwa_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  title: true,
  category: true,
  userId: true,
  metadata: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  content: true,
  sender: true,
  messageType: true,
  data: true,
});

export const insertWorkPackageSchema = createInsertSchema(workPackages).pick({
  wpId: true,
  description: true,
  status: true,
  progress: true,
  dueDate: true,
  assignedTeam: true,
  cwaId: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type WorkPackage = typeof workPackages.$inferSelect;
export type InsertWorkPackage = z.infer<typeof insertWorkPackageSchema>;
