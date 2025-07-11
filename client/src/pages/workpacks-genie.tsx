import { useState, useEffect } from "react";
import { ConversationSidebar } from "@/components/sidebar/conversation-sidebar";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import { useChat } from "@/hooks/use-chat";
import { useConversations } from "@/hooks/use-conversations";
import { Menu, Download, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkpacksGenie() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  
  const { conversations, createConversation, deleteConversation } = useConversations();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    loadConversation,
    currentConversationId,
    conversationTitle 
  } = useChat(selectedConversationId);

  // Load initial conversation or create one
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const handleNewConversation = async () => {
    const conversation = await createConversation({
      title: "New AWP Conversation",
      category: "general",
      userId: "default_user",
      metadata: {}
    });
    setSelectedConversationId(conversation.id);
  };

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
    loadConversation(conversationId);
  };

  const handleDeleteConversation = async (conversationId: number) => {
    await deleteConversation(conversationId);
    if (selectedConversationId === conversationId) {
      setSelectedConversationId(null);
    }
  };

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log("Exporting report...");
  };

  const handleVisualize = () => {
    // TODO: Implement visualization functionality
    console.log("Opening visualization...");
  };



  return (
    <div className="flex h-screen overflow-hidden bg-workpack-bg-light dark:bg-workpack-bg-dark">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <ConversationSidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onNewConversation={handleNewConversation}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
        />
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold workpack-text dark:text-white">
                  {conversationTitle || "Workpacks Genie™"}
                </h2>
                <p className="text-sm workpack-slate dark:text-slate-400">
                  {currentConversationId ? `Active conversation • ${messages.length} messages` : "AWP Assistant"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleExportReport}
                className="bg-workpack-green hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                onClick={handleVisualize}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Visualize
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto chat-scroll p-6 space-y-6">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center h-full"
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-workpack-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold workpack-text dark:text-white mb-2">
                  Welcome to Workpacks Genie™
                </h3>
                <p className="workpack-slate dark:text-slate-400 max-w-md">
                  Your Advanced Work Package assistant. Ask about CWA progress, generate reports, 
                  or request visualizations to optimize your project management.
                </p>
              </div>
            </motion.div>
          ) : (
            <>
              {messages.map((message) => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                />
              ))}
              {isLoading && <TypingIndicator />}
            </>
          )}
        </div>

        {/* Chat Input */}
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  );
}
