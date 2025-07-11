import { Button } from "@/components/ui/button";
import { ConversationInfo } from "@/lib/types";
import { Menu, Download, BarChart3 } from "lucide-react";

interface MainHeaderProps {
  activeConversation: ConversationInfo | null;
  onSidebarToggle: () => void;
  onExportReport: () => void;
  onVisualize: () => void;
}

export function MainHeader({
  activeConversation,
  onSidebarToggle,
  onExportReport,
  onVisualize,
}: MainHeaderProps) {
  return (
    <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSidebarToggle}
            className="lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-lg font-semibold text-workpack dark:text-white">
              {activeConversation?.title || "New Conversation"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {activeConversation 
                ? `Active conversation • ${activeConversation.messageCount} messages`
                : "Start a new AWP conversation"
              }
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={onExportReport}
            className="bg-workpack-green hover:bg-green-700 text-white text-sm"
          >
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button 
            variant="secondary"
            onClick={onVisualize}
            className="text-sm"
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Visualize
          </Button>
        </div>
      </div>
    </div>
  );
}
