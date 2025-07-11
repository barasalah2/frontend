import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "./theme-provider";
import { ConversationInfo, ConversationCategory } from "@/lib/types";
import { 
  HardHat, 
  Plus, 
  Moon, 
  Sun, 
  Layers, 
  FolderKanban, 
  BarChart3, 
  Calendar, 
  Users, 
  Settings,
  User
} from "lucide-react";

interface SidebarProps {
  conversations: ConversationInfo[];
  activeConversationId: number | null;
  selectedCategory: ConversationCategory | "all";
  onConversationSelect: (id: number) => void;
  onNewConversation: () => void;
  onCategorySelect: (category: ConversationCategory | "all") => void;
}

const categoryIcons = {
  "all": Layers,
  "general": Layers,
  "project-planning": FolderKanban,
  "cwa-analysis": BarChart3,
  "scheduling": Calendar,
  "resource-planning": Users,
};

const categoryLabels = {
  "all": "All Conversations",
  "general": "General",
  "project-planning": "Project Planning", 
  "cwa-analysis": "CWA Analysis",
  "scheduling": "Scheduling",
  "resource-planning": "Resource Planning",
};

const categoryColors = {
  "general": "bg-blue-500",
  "project-planning": "bg-green-500",
  "cwa-analysis": "bg-orange-500", 
  "scheduling": "bg-purple-500",
  "resource-planning": "bg-emerald-500",
};

export function Sidebar({
  conversations,
  activeConversationId,
  selectedCategory,
  onConversationSelect,
  onNewConversation,
  onCategorySelect,
}: SidebarProps) {
  const { theme, toggleTheme } = useTheme();

  const filteredConversations = conversations.filter(
    conv => selectedCategory === "all" || conv.category === selectedCategory
  );

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return "1d ago";
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-workpack-blue rounded-lg flex items-center justify-center">
              <HardHat className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-workpack dark:text-white">
                Workpacks Genie™
              </h1>
              <p className="text-xs text-muted-foreground">AWP Assistant</p>
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="bg-secondary hover:bg-secondary/80"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-500" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <Button 
          onClick={onNewConversation}
          className="w-full bg-workpack-blue hover:bg-blue-700 text-white"
        >
          <Plus className="mr-2 h-4 w-4" />
          New AWP Conversation
        </Button>
      </div>
      
      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          FILTER BY CATEGORY
        </h3>
        <div className="space-y-2">
          {(Object.keys(categoryLabels) as Array<keyof typeof categoryLabels>).map((category) => {
            const Icon = categoryIcons[category];
            const isSelected = selectedCategory === category;
            
            return (
              <Button
                key={category}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => onCategorySelect(category)}
                className={`w-full justify-start text-sm ${
                  isSelected 
                    ? "bg-workpack-blue text-white hover:bg-blue-700" 
                    : "text-workpack dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="mr-2 h-4 w-4" />
                {categoryLabels[category]}
              </Button>
            );
          })}
        </div>
      </div>
      
      {/* Conversation History */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">
            RECENT CONVERSATIONS
          </h3>
        </div>
        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-muted-foreground">
                  No conversations found
                </p>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={onNewConversation}
                  className="mt-2 text-workpack-blue hover:text-blue-700"
                >
                  Start a conversation
                </Button>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    conversation.id === activeConversationId
                      ? "bg-blue-50 dark:bg-slate-700 border-l-4 border-workpack-blue"
                      : "hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-workpack dark:text-white truncate">
                      {conversation.title}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatTimestamp(conversation.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mb-2">
                    {conversation.preview}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant="secondary" 
                      className={`text-xs text-white ${
                        categoryColors[conversation.category as keyof typeof categoryColors] || "bg-gray-500"
                      }`}
                    >
                      {categoryLabels[conversation.category as keyof typeof categoryLabels] || conversation.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {conversation.messageCount} messages
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-workpack-orange rounded-full flex items-center justify-center">
            <User className="text-white w-4 h-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-workpack dark:text-white">
              AWP Manager
            </p>
            <p className="text-xs text-muted-foreground">
              Construction Lead
            </p>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
