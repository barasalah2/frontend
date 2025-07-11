import { users, conversations, messages, workPackages, type User, type InsertUser, type Conversation, type InsertConversation, type Message, type InsertMessage, type WorkPackage, type InsertWorkPackage } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Conversation operations
  getConversations(userId: string): Promise<Conversation[]>;
  getConversationsByCategory(userId: string, category: string): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined>;
  deleteConversation(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  deleteMessage(id: number): Promise<boolean>;
  
  // Work package operations
  getWorkPackages(): Promise<WorkPackage[]>;
  getWorkPackagesByCwa(cwaId: string): Promise<WorkPackage[]>;
  getWorkPackage(id: number): Promise<WorkPackage | undefined>;
  createWorkPackage(workPackage: InsertWorkPackage): Promise<WorkPackage>;
  updateWorkPackage(id: number, updates: Partial<WorkPackage>): Promise<WorkPackage | undefined>;
  deleteWorkPackage(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private conversations: Map<number, Conversation>;
  private messages: Map<number, Message>;
  private workPackages: Map<number, WorkPackage>;
  private currentUserId: number;
  private currentConversationId: number;
  private currentMessageId: number;
  private currentWorkPackageId: number;

  constructor() {
    this.users = new Map();
    this.conversations = new Map();
    this.messages = new Map();
    this.workPackages = new Map();
    this.currentUserId = 1;
    this.currentConversationId = 1;
    this.currentMessageId = 1;
    this.currentWorkPackageId = 1;
    
    // Initialize with sample work packages for demonstration
    this.initializeSampleData();
  }

  private initializeSampleData() {
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

    sampleWorkPackages.forEach(wp => {
      const workPackage: WorkPackage = {
        ...wp,
        id: this.currentWorkPackageId++,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.workPackages.set(workPackage.id, workPackage);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Conversation operations
  async getConversations(userId: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversationsByCategory(userId: string, category: string): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter(conv => conv.userId === userId && conv.category === category)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentConversationId++;
    const now = new Date();
    const conversation: Conversation = {
      ...insertConversation,
      id,
      createdAt: now,
      updatedAt: now,
      metadata: insertConversation.metadata || null,
      category: insertConversation.category || "general"
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, updates: Partial<Conversation>): Promise<Conversation | undefined> {
    const conversation = this.conversations.get(id);
    if (!conversation) return undefined;
    
    const updated = { ...conversation, ...updates, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  async deleteConversation(id: number): Promise<boolean> {
    return this.conversations.delete(id);
  }

  // Message operations
  async getMessages(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
      messageType: insertMessage.messageType || "text",
      data: insertMessage.data || null
    };
    this.messages.set(id, message);
    return message;
  }

  async deleteMessage(id: number): Promise<boolean> {
    return this.messages.delete(id);
  }

  // Work package operations
  async getWorkPackages(): Promise<WorkPackage[]> {
    return Array.from(this.workPackages.values())
      .sort((a, b) => a.wpId.localeCompare(b.wpId));
  }

  async getWorkPackagesByCwa(cwaId: string): Promise<WorkPackage[]> {
    return Array.from(this.workPackages.values())
      .filter(wp => wp.cwaId === cwaId)
      .sort((a, b) => a.wpId.localeCompare(b.wpId));
  }

  async getWorkPackage(id: number): Promise<WorkPackage | undefined> {
    return this.workPackages.get(id);
  }

  async createWorkPackage(insertWorkPackage: InsertWorkPackage): Promise<WorkPackage> {
    const id = this.currentWorkPackageId++;
    const now = new Date();
    const workPackage: WorkPackage = {
      ...insertWorkPackage,
      id,
      createdAt: now,
      updatedAt: now,
      progress: insertWorkPackage.progress || 0,
      dueDate: insertWorkPackage.dueDate || null,
      assignedTeam: insertWorkPackage.assignedTeam || null,
      cwaId: insertWorkPackage.cwaId || null
    };
    this.workPackages.set(id, workPackage);
    return workPackage;
  }

  async updateWorkPackage(id: number, updates: Partial<WorkPackage>): Promise<WorkPackage | undefined> {
    const workPackage = this.workPackages.get(id);
    if (!workPackage) return undefined;
    
    const updated = { ...workPackage, ...updates, updatedAt: new Date() };
    this.workPackages.set(id, updated);
    return updated;
  }

  async deleteWorkPackage(id: number): Promise<boolean> {
    return this.workPackages.delete(id);
  }
}

export const storage = new MemStorage();
