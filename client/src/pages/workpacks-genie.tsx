import { useState, useEffect } from "react";
import { ConversationSidebar } from "@/components/sidebar/conversation-sidebar";
import { ChatMessage } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { SavedChartsViewer } from "@/components/charts/saved-charts-viewer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useUnifiedChat } from "@/hooks/use-unified-chat";
import { useUnifiedConversations } from "@/hooks/use-unified-conversations";
import { Menu, Download, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";

export default function WorkpacksGenie() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  
  // Debug selected conversation ID
  console.log('WorkpacksGenie - selectedConversationId:', selectedConversationId);
  
  // Initialize storage system
  useEffect(() => {
    if (isInitialized) {
      console.log('Unified storage system initialized');
      console.log('Current conversation ID:', currentConversationId);
      console.log('Messages count:', messages.length);
      console.log('Charts count:', charts.length);
    }
  }, [isInitialized, currentConversationId, messages.length, charts.length]);
  
  const { conversations, createConversation, deleteConversation } = useUnifiedConversations();
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    currentConversationId,
    conversationTitle,
    saveChart,
    charts,
    isInitialized
  } = useUnifiedChat(selectedConversationId);

  // Debug localStorage content and trigger refresh
  useEffect(() => {
    const savedCharts = localStorage.getItem('savedCharts');
    console.log('=== WorkpacksGenie Debug ===');
    console.log('localStorage savedCharts (length):', savedCharts ? savedCharts.length : 0);
    console.log('selected conversation:', selectedConversationId);
    console.log('current conversation:', currentConversationId);
    console.log('messages count:', messages.length);
    
    if (savedCharts) {
      try {
        const parsed = JSON.parse(savedCharts);
        console.log('parsed charts count:', parsed.length);
        const forConversation = parsed.filter((chart: any) => chart.conversationId === selectedConversationId);
        console.log('charts for this conversation:', forConversation.length);
        
        // If we have charts for this conversation but no visualization messages, force refresh
        if (forConversation.length > 0) {
          const visualizationMessages = messages.filter(m => m.messageType === 'visualization');
          console.log('visualization messages found:', visualizationMessages.length);
          if (visualizationMessages.length === 0) {
            console.log('CHARTS EXIST BUT NOT SHOWING - forcing refresh...');
            // Force refresh of messages
            window.dispatchEvent(new Event('chartSaved'));
          }
        }
      } catch (e) {
        console.error('WorkpacksGenie - error parsing charts:', e);
      }
    }
  }, [selectedConversationId, currentConversationId, messages]);

  // Load initial conversation or create one
  useEffect(() => {
    console.log('Auto-select effect - conversations:', conversations.length, 'selectedConversationId:', selectedConversationId);
    if (conversations.length > 0 && !selectedConversationId) {
      const mostRecent = conversations[0];
      console.log('Auto-selecting conversation:', mostRecent.id);
      setSelectedConversationId(mostRecent.id);
    } else if (conversations.length === 0 && !selectedConversationId) {
      console.log('No conversations found, creating new one');
      // Create a default conversation
      createConversation({
        title: "AWP Analysis",
        category: "general"
      }).then(newConv => {
        console.log('Created new conversation:', newConv.id);
        setSelectedConversationId(newConv.id);
      });
    }
  }, [conversations, selectedConversationId, createConversation]);

  const handleNewConversation = async () => {
    const conversation = await createConversation({
      title: "New AWP Conversation",
      category: "general"
    });
    setSelectedConversationId(conversation.id);
  };

  const handleSelectConversation = (conversationId: number) => {
    if (conversationId !== selectedConversationId) {
      setSelectedConversationId(conversationId);
    }
  };

  const handleDeleteConversation = async (conversationId: number) => {
    await deleteConversation(conversationId);
    if (selectedConversationId === conversationId) {
      // Select the first available conversation or null
      const remaining = conversations.filter(c => c.id !== conversationId);
      if (remaining.length > 0) {
        setSelectedConversationId(remaining[0].id);
      } else {
        setSelectedConversationId(null);
      }
    }
  };

  const handleExportReport = () => {
    // TODO: Implement report export functionality
    console.log("Exporting report...");
  };

  const handleVisualize = () => {
    // Open saved charts viewer
    console.log("Opening saved charts viewer...");
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
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Saved Charts
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Saved Charts</DialogTitle>
                  </DialogHeader>
                  <SavedChartsViewer />
                </DialogContent>
              </Dialog>
              <Button
                onClick={handleExportReport}
                className="bg-workpack-green hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
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
                  conversationId={selectedConversationId}
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
