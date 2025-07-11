import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, Paperclip } from "lucide-react";

interface ChatInputProps {
  onSendMessage: (message: string) => Promise<void>;
  disabled?: boolean;
}

const quickActions = [
  "📊 Generate Progress Report",
  "📅 Show Critical Path", 
  "👥 Resource Allocation",
  "🔍 Analyze CWA Status",
  "📈 Performance Metrics"
];

export function ChatInput({ onSendMessage, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;

    const message = input.trim();
    setInput("");
    await onSendMessage(message);
  };

  const handleQuickAction = async (action: string) => {
    const cleanAction = action.replace(/^[^\w\s]+\s*/, ""); // Remove emoji prefix
    setInput(cleanAction);
    await onSendMessage(cleanAction);
  };

  return (
    <div className="bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700 p-4">
      <form onSubmit={handleSubmit} className="flex space-x-3">
        <div className="flex-1 relative">
          <Input
            type="text"
            placeholder="Ask about work packages, generate reports, or request visualizations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={disabled}
            className="pr-12 py-3 bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 focus:ring-workpack-blue focus:border-workpack-blue"
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 workpack-slate dark:text-slate-400 hover:text-workpack-blue"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
        </div>
        <Button
          type="submit"
          disabled={!input.trim() || disabled}
          className="px-6 py-3 bg-workpack-blue hover:bg-blue-700 text-white"
        >
          <span className="mr-2">Send</span>
          <Send className="h-4 w-4" />
        </Button>
      </form>

      {/* Quick Actions */}
      <div className="flex items-center flex-wrap gap-2 mt-3">
        <span className="text-xs workpack-slate dark:text-slate-400">Quick actions:</span>
        {quickActions.map((action, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors text-xs"
            onClick={() => handleQuickAction(action)}
          >
            {action}
          </Badge>
        ))}
      </div>
    </div>
  );
}
