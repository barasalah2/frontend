export interface ChatMessage {
  id: number;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  metadata?: {
    hasTable?: boolean;
    tableData?: string[];
    headers?: string[];
    hasVisualization?: boolean;
    downloadable?: boolean;
  };
}

export interface ConversationInfo {
  id: number;
  title: string;
  category: string;
  preview: string;
  messageCount: number;
  timestamp: string;
  isActive?: boolean;
}

export interface WorkPackageData {
  id: string;
  description: string;
  status: string;
  progress: number;
  dueDate: string;
  assignedTeam: string;
}

export type ConversationCategory = 
  | "general"
  | "project-planning" 
  | "cwa-analysis"
  | "scheduling"
  | "resource-planning";
