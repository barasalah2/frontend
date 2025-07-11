import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertConversationSchema, insertMessageSchema, insertWorkPackageSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Chat API endpoints - Compatible with original frontend
  app.post("/api/genie", async (req, res) => {
    try {
      const { question, conv_id } = req.body;
      
      if (!question || typeof question !== "string") {
        return res.status(400).json({ error: "Question is required" });
      }

      let conversationId = conv_id;

      // Create new conversation if none exists
      if (!conversationId) {
        const conversation = await storage.createConversation({
          title: question.slice(0, 50) + "...",
          category: "general",
          userId: "default_user",
          metadata: {}
        });
        conversationId = conversation.id;
      }

      // Save user message
      await storage.createMessage({
        conversationId,
        content: question,
        sender: "user",
        messageType: "text"
      });

      // Generate AI response (compatible with original backend)
      let response = generateAIResponse(question);
      
      // Check if response should include work package data
      let data_array = null;
      if (question.toLowerCase().includes("cwa") || question.toLowerCase().includes("work package") || question.toLowerCase().includes("progress")) {
        const workPackages = await storage.getWorkPackagesByCwa("CWA-2301");
        data_array = workPackages.map(wp => ({
          "WP ID": wp.wpId,
          "Description": wp.description,
          "Status": wp.status,
          "Progress": `${wp.progress}%`,
          "Due Date": wp.dueDate?.toISOString().split('T')[0] || "",
          "Assigned Team": wp.assignedTeam || ""
        }));
      }

      // Save bot response
      await storage.createMessage({
        conversationId,
        content: response,
        sender: "bot",
        messageType: data_array ? "table" : "text",
        data: data_array ? { table: data_array } : null
      });

      // Response format compatible with original frontend
      res.json({
        content: response,
        conv_id: conversationId,
        data_array: data_array
      });

    } catch (error) {
      console.error("Error in /api/genie:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // DataVisAgent endpoint
  app.post("/api/datavis", async (req, res) => {
    try {
      const { columns, data_snippet } = req.body;
      
      if (!columns || !data_snippet) {
        return res.status(400).json({ error: "Columns and data_snippet are required" });
      }

      // Generate visualization configuration based on data analysis
      const visualizations = generateVisualizationConfig(columns, data_snippet);
      
      res.json({ visualizations });
    } catch (error) {
      console.error("Error in /api/datavis:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Conversation management
  app.get("/api/conversations", async (req, res) => {
    try {
      const { user_id = "default_user", category } = req.query;
      
      let conversations;
      if (category && typeof category === "string") {
        conversations = await storage.getConversationsByCategory(user_id as string, category);
      } else {
        conversations = await storage.getConversations(user_id as string);
      }
      
      res.json(conversations);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const messages = await storage.getMessages(id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/conversations", async (req, res) => {
    try {
      const validatedData = insertConversationSchema.parse(req.body);
      const conversation = await storage.createConversation(validatedData);
      res.json(conversation);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid conversation data", details: error.errors });
      }
      console.error("Error creating conversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.delete("/api/conversations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid conversation ID" });
      }

      const deleted = await storage.deleteConversation(id);
      if (!deleted) {
        return res.status(404).json({ error: "Conversation not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting conversation:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Work package management
  app.get("/api/workpackages", async (req, res) => {
    try {
      const { cwa_id } = req.query;
      
      let workPackages;
      if (cwa_id && typeof cwa_id === "string") {
        workPackages = await storage.getWorkPackagesByCwa(cwa_id);
      } else {
        workPackages = await storage.getWorkPackages();
      }
      
      res.json(workPackages);
    } catch (error) {
      console.error("Error fetching work packages:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/workpackages", async (req, res) => {
    try {
      const validatedData = insertWorkPackageSchema.parse(req.body);
      const workPackage = await storage.createWorkPackage(validatedData);
      res.json(workPackage);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid work package data", details: error.errors });
      }
      console.error("Error creating work package:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

function generateAIResponse(question: string): string {
  // Simple response generation based on keywords
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes("cwa") && lowerQuestion.includes("progress")) {
    return "Here's the current progress status for CWA-2301. I've analyzed the work packages and found 3 active packages with varying completion rates. The overall progress is 35% complete with one critical issue: CWA-2301-003 is 3 days behind schedule. I recommend reallocating resources from Team Alpha to accelerate concrete pour activities.";
  }
  
  if (lowerQuestion.includes("gantt") || lowerQuestion.includes("schedule")) {
    return "I've generated a Gantt chart visualization showing the project timeline. The chart displays the current status of all work packages with their dependencies and critical path highlighted.";
  }
  
  if (lowerQuestion.includes("resource") && lowerQuestion.includes("allocation")) {
    return "Based on the current work package status, here's the resource allocation analysis. Team Alpha is overallocated with 75% utilization on Foundation Preparation. I recommend redistributing 2 members to Team Gamma to address the concrete pour delays.";
  }
  
  if (lowerQuestion.includes("report")) {
    return "I've generated a comprehensive AWP progress report including work package status, resource utilization, schedule adherence, and recommendations for optimization. The report includes interactive visualizations and is ready for export.";
  }
  
  return "I've analyzed your query and can provide detailed insights about work packages, schedules, resource allocation, and project progress. Please specify what aspect of the AWP system you'd like me to focus on.";
}

function generateVisualizationConfig(columns: any[], data_snippet: any[]) {
  // Analyze column types
  const columnTypes = columns.map(col => {
    const sampleValues = data_snippet.map(row => row[col.name]).filter(v => v != null);
    
    // Check if it's a time/date column
    if (col.name.toLowerCase().includes('date') || col.name.toLowerCase().includes('time')) {
      return { ...col, type: 'time' };
    }
    
    // Check if it's numeric
    const numericValues = sampleValues.filter(v => !isNaN(Number(v)));
    if (numericValues.length > sampleValues.length * 0.8) {
      return { ...col, type: 'numeric' };
    }
    
    // Otherwise categorical
    return { ...col, type: 'categorical' };
  });

  const visualizations = [];
  
  // Find time + numeric combinations for line charts
  const timeColumns = columnTypes.filter(col => col.type === 'time');
  const numericColumns = columnTypes.filter(col => col.type === 'numeric');
  const categoricalColumns = columnTypes.filter(col => col.type === 'categorical');
  
  if (timeColumns.length > 0 && numericColumns.length > 0) {
    visualizations.push({
      type: 'line',
      x: timeColumns[0].name,
      y: numericColumns[0].name,
      color: null,
      title: `${numericColumns[0].name} over Time`,
      transform: 'count'
    });
  }
  
  // Categorical distributions
  if (categoricalColumns.length > 0) {
    visualizations.push({
      type: 'pie',
      x: null,
      y: categoricalColumns[0].name,
      color: null,
      title: `Distribution of ${categoricalColumns[0].name}`,
      transform: 'count'
    });
  }
  
  // Numeric + categorical for bar charts
  if (numericColumns.length > 0 && categoricalColumns.length > 0) {
    visualizations.push({
      type: 'bar',
      x: categoricalColumns[0].name,
      y: numericColumns[0].name,
      color: null,
      title: `${numericColumns[0].name} by ${categoricalColumns[0].name}`,
      transform: 'aggregate_sum'
    });
  }
  
  return visualizations;
}
