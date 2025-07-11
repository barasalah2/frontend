import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/components/theme/theme-provider";
import { type Conversation } from "@shared/schema";
import { 
  Plus, 
  HardHat, 
  Moon, 
  Sun, 
  Layers, 
  FolderKanban, 
  Calendar, 
  Users, 
  Settings,
  User,
  Trash2,
  Search
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ConversationSidebarProps {
  conversations: Conversation[];
  selectedConversationId: number | null;
  onNewConversation: () => void;
  onSelectConversation: (id: number) => void;
  onDeleteConversation: (id: number) => void;
}

const categories = [
  { id: "all", label: "All Conversations", icon: Layers },
  { id: "project", label: "Project Planning", icon: FolderKanban },
  { id: "cwa", label: "CWA Analysis", icon: Calendar },
  { id: "scheduling", label: "Scheduling", icon: Calendar },
  { id: "resource", label: "Resource Planning", icon: Users },
];

const categoryColors = {
  "project": "bg-blue-500",
  "cwa": "bg-workpack-orange",
  "scheduling": "bg-purple-500",
  "resource": "bg-workpack-green",
  "general": "bg-gray-500"
};

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation
}: ConversationSidebarProps) {
  const { theme, toggleTheme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredConversations = conversations.filter(conv => {
    const matchesCategory = selectedCategory === "all" || conv.category === selectedCategory;
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const formatTimeAgo = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return "Unknown";
      }
      
      const now = new Date();
      const diffMs = now.getTime() - dateObj.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      
      if (diffHours < 1) return "Just now";
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffHours < 168) return `${Math.floor(diffHours / 24)}d ago`;
      return dateObj.toLocaleDateString();
    } catch (error) {
      console.warn('Error formatting date:', error);
      return "Unknown";
    }
  };

  return (
    <div className="w-80 bg-white dark:bg-slate-800 border-r border-gray-200 dark:border-slate-700 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-workpack-blue rounded-lg flex items-center justify-center">
              <HardHat className="text-white h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold workpack-text dark:text-white">
                Workpacks Genie™
              </h1>
              <p className="text-xs workpack-slate dark:text-slate-400">AWP Assistant</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="rounded-lg"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4 text-yellow-400" />
            ) : (
              <Moon className="h-4 w-4 workpack-slate" />
            )}
          </Button>
        </div>
        
        <Button onClick={onNewConversation} className="w-full bg-workpack-blue hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New AWP Conversation
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 workpack-slate dark:text-slate-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="p-4 border-b border-gray-200 dark:border-slate-700">
        <h3 className="text-sm font-medium workpack-slate dark:text-slate-400 mb-3">
          FILTER BY CATEGORY
        </h3>
        <div className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id;
            
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full justify-start ${
                  isSelected 
                    ? "bg-workpack-blue text-white" 
                    : "hover:bg-gray-100 dark:hover:bg-slate-700"
                }`}
              >
                <Icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto p-4">
        <h3 className="text-sm font-medium workpack-slate dark:text-slate-400 mb-3">
          RECENT CONVERSATIONS
        </h3>
        <div className="space-y-2">
          <AnimatePresence>
            {filteredConversations.map((conversation) => {
              const isSelected = selectedConversationId === conversation.id;
              const categoryColor = categoryColors[conversation.category as keyof typeof categoryColors] || categoryColors.general;
              
              return (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                    isSelected 
                      ? "bg-blue-50 dark:bg-slate-700 border-l-4 border-workpack-blue" 
                      : "hover:bg-gray-50 dark:hover:bg-slate-700"
                  }`}
                  onClick={() => onSelectConversation(conversation.id)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium workpack-text dark:text-white truncate flex-1">
                      {conversation.title}
                    </span>
                    <div className="flex items-center space-x-1">
                      <span className="text-xs workpack-slate dark:text-slate-400">
                        {formatTimeAgo(conversation.updatedAt)}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(conversation.id);
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center mt-2 space-x-2">
                    <Badge className={`${categoryColor} text-white text-xs`}>
                      {conversation.category}
                    </Badge>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {filteredConversations.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm workpack-slate dark:text-slate-400">
                {searchQuery ? "No conversations found" : "No conversations yet"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-workpack-orange rounded-full flex items-center justify-center">
            <User className="text-white h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium workpack-text dark:text-white">
              John Construction
            </p>
            <p className="text-xs workpack-slate dark:text-slate-400">AWP Manager</p>
          </div>
          <Button variant="ghost" size="icon">
            <Settings className="h-4 w-4 workpack-slate dark:text-slate-400" />
          </Button>
        </div>
      </div>
    </div>
  );
}
