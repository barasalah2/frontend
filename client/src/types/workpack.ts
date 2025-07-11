export interface WorkPackage {
  id: string;
  description: string;
  status: WorkPackageStatus;
  progress: number;
  dueDate?: Date;
  assignedTeam?: string;
  cwaId?: string;
  priority?: WorkPackagePriority;
  estimatedHours?: number;
  actualHours?: number;
  dependencies?: string[];
}

export type WorkPackageStatus = 
  | "Planned"
  | "In Progress" 
  | "Completed"
  | "Delayed"
  | "On Hold"
  | "Cancelled";

export type WorkPackagePriority = "Low" | "Medium" | "High" | "Critical";

export interface ConversationMetadata {
  workPackageIds?: string[];
  cwaId?: string;
  projectId?: string;
  lastAnalyzedDate?: Date;
}

export interface ChatMessage {
  id: number;
  content: string;
  sender: "user" | "bot";
  timestamp: Date;
  messageType?: "text" | "table" | "visualization" | "report";
  data?: {
    table?: any[];
    chart?: any;
    report?: any;
  };
}

export interface ProjectMetrics {
  totalPackages: number;
  completedPackages: number;
  overallProgress: number;
  delayedPackages: number;
  onTrackPackages: number;
  resourceUtilization?: number;
  criticalPathDuration?: number;
}

export interface VisualizationConfig {
  type: "gantt" | "progress" | "resource" | "timeline";
  title: string;
  data: any[];
  options?: {
    showCriticalPath?: boolean;
    showResourceAllocation?: boolean;
    timeRange?: {
      start: Date;
      end: Date;
    };
  };
}

export interface AWPReport {
  id: string;
  title: string;
  generatedDate: Date;
  reportType: "progress" | "resource" | "schedule" | "comprehensive";
  workPackages: WorkPackage[];
  metrics: ProjectMetrics;
  recommendations: string[];
  charts: VisualizationConfig[];
}
