import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ConversationSidebar } from "@/components/sidebar/conversation-sidebar";
import { ChatInput } from "@/components/chat/chat-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { Button } from "@/components/ui/button";
import { EnhancedWorkPackageTable } from "@/components/tables/enhanced-work-package-table";
import { GanttChart } from "@/components/visualizations/gantt-chart";
import { ProgressChart } from "@/components/visualizations/progress-chart";
import { Menu, Download, BarChart3, Bot, User, TestTube } from "lucide-react";
import { Link } from "wouter";

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  table?: any[][];
  headers?: string[];
  downloadable?: boolean;
}

interface ConversationInfo {
  id: number;
  title: string;
  category: string;
  preview: string;
  messageCount: number;
  timestamp: string;
  isActive?: boolean;
}

export default function WorkpacksGenie() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [convId, setConvId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Local storage for conversations
  const [conversations, setConversations] = useState<ConversationInfo[]>(() => {
    const saved = localStorage.getItem('workpack-conversations');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [showVisualization, setShowVisualization] = useState(false);

  // Initial greeting
  useEffect(() => {
    setMessages([
      {
        id: Date.now(),
        text: 'Hello! I am Workpacks Genie. Ask me anything about work packages, CWA analysis, or project scheduling!',
        sender: 'bot'
      }
    ]);
  }, []);

  // Load conversation from local storage
  useEffect(() => {
    if (selectedConversationId) {
      const savedMessages = localStorage.getItem(`workpack-messages-${selectedConversationId}`);
      if (savedMessages) {
        setMessages(JSON.parse(savedMessages));
      }
      const savedConvId = localStorage.getItem(`workpack-convid-${selectedConversationId}`);
      if (savedConvId) {
        setConvId(parseInt(savedConvId));
      }
    }
  }, [selectedConversationId]);

  // Save messages to local storage
  const saveConversation = (conversationId: number, msgs: Message[], cId: number | null) => {
    localStorage.setItem(`workpack-messages-${conversationId}`, JSON.stringify(msgs));
    if (cId) {
      localStorage.setItem(`workpack-convid-${conversationId}`, cId.toString());
    }
    
    // Update conversation list
    const updatedConversations = [...conversations];
    const existingIndex = updatedConversations.findIndex(c => c.id === conversationId);
    const lastMessage = msgs[msgs.length - 1];
    
    const conversationInfo: ConversationInfo = {
      id: conversationId,
      title: msgs.length > 1 ? msgs[1].text.slice(0, 50) + '...' : 'New Conversation',
      category: 'general',
      preview: lastMessage?.text.slice(0, 100) + '...' || '',
      messageCount: msgs.length,
      timestamp: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      updatedConversations[existingIndex] = conversationInfo;
    } else {
      updatedConversations.unshift(conversationInfo);
    }
    
    setConversations(updatedConversations);
    localStorage.setItem('workpack-conversations', JSON.stringify(updatedConversations));
  };

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMsg: Message = { id: Date.now(), text: message.trim(), sender: 'user' };
    const typingMsg: Message = { id: Date.now() + 1, text: 'Thinking…', sender: 'bot' };

    const newMessages = [...messages, userMsg, typingMsg];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Use environment variable or fallback to localhost
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await fetch(`${apiUrl}/api/genie`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: message.trim(), conv_id: convId })
      });

      const payload = await res.json();
      console.log('API Response:', payload);

      if (payload.conv_id && payload.conv_id !== convId) {
        setConvId(payload.conv_id);
      }

      // Build table if any data_array exists
      let table = null;
      let headers = null;

      if (Array.isArray(payload.data_array) && payload.data_array.length > 0) {
        try {
          const parsedRows = payload.data_array.map((row: any) => {
            if (typeof row === 'string') {
              const obj = JSON.parse(row);
              if (!headers) headers = Object.keys(obj);
              return Object.values(obj);
            } else if (typeof row === 'object') {
              if (!headers) headers = Object.keys(row);
              return Object.values(row);
            }
            return [row];
          });
          table = parsedRows;
        } catch (err) {
          console.warn('Failed to parse table data:', err);
        }
      }

      // Compose new message(s)
      const contentMsg: Message = {
        id: Date.now() + 2,
        text: payload.content,
        sender: 'bot'
      };

      const tableMsg: Message | null = table && table.length > 0 ? {
        id: Date.now() + 3,
        text: '',
        sender: 'bot',
        table,
        headers,
        downloadable: true
      } : null;

      const finalMessages = tableMsg 
        ? [...newMessages.filter(m => m.id !== typingMsg.id), contentMsg, tableMsg]
        : [...newMessages.filter(m => m.id !== typingMsg.id), contentMsg];

      setMessages(finalMessages);
      
      // Save to local storage
      const currentConvId = selectedConversationId || Date.now();
      if (!selectedConversationId) {
        setSelectedConversationId(currentConvId);
      }
      saveConversation(currentConvId, finalMessages, payload.conv_id);

    } catch (err) {
      console.error('API Error:', err);
      const errorMessages = [...newMessages.filter(m => m.id !== typingMsg.id), {
        id: Date.now() + 4,
        text: '❌ Error fetching response. Please check your connection and try again.',
        sender: 'bot' as const
      }];
      setMessages(errorMessages);
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = (data: any[][], headers?: string[]) => {
    if (!Array.isArray(data) || data.length === 0) return;
    const fullData = headers ? [headers, ...data] : data;
    const ws = XLSX.utils.aoa_to_sheet(fullData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Results');
    XLSX.writeFile(wb, 'workpacks_output.xlsx');
  };

  const handleNewConversation = () => {
    const newConvId = Date.now();
    setSelectedConversationId(newConvId);
    setMessages([{
      id: Date.now(),
      text: 'Hello! I am Workpacks Genie. Ask me anything about work packages, CWA analysis, or project scheduling!',
      sender: 'bot'
    }]);
    setConvId(null);
  };

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId);
  };

  const handleDeleteConversation = (conversationId: number) => {
    const updatedConversations = conversations.filter(c => c.id !== conversationId);
    setConversations(updatedConversations);
    localStorage.removeItem(`workpack-messages-${conversationId}`);
    localStorage.removeItem(`workpack-convid-${conversationId}`);
    
    if (selectedConversationId === conversationId) {
      if (updatedConversations.length > 0) {
        setSelectedConversationId(updatedConversations[0].id);
      } else {
        handleNewConversation();
      }
    }
  };

  const handleExportReport = () => {
    const tableMessages = messages.filter(m => m.table && m.table.length > 0);
    if (tableMessages.length === 0) {
      alert('No data available to export');
      return;
    }
    
    tableMessages.forEach((msg, index) => {
      if (msg.table && msg.headers) {
        exportToExcel(msg.table, msg.headers);
      }
    });
  };

  const shouldShowGantt = (message: Message) => {
    return message.text.toLowerCase().includes('gantt') || 
           message.text.toLowerCase().includes('timeline') ||
           message.text.toLowerCase().includes('schedule');
  };

  const formatTableDataForChart = (table: any[][], headers: string[]) => {
    if (!table || !headers) return [];
    
    return table.map(row => {
      const obj: any = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  };

  return (
    <div className="h-screen flex overflow-hidden bg-workpack-bg-light dark:bg-workpack-bg-dark">
      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{ width: sidebarOpen ? 320 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden flex-shrink-0"
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
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold workpack-text dark:text-white">
                  Workpacks Genie™
                </h2>
                <p className="text-sm workpack-slate dark:text-slate-400">
                  {convId ? `Active conversation • ${messages.length} messages` : "AWP Assistant"}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/chart-test">
                <Button
                  variant="outline"
                  size="sm"
                >
                  <TestTube className="h-4 w-4 mr-2" />
                  Chart Test
                </Button>
              </Link>
              <Button
                onClick={handleExportReport}
                className="bg-workpack-green hover:bg-green-700 text-white"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Report
              </Button>
              <Button
                onClick={() => setShowVisualization(!showVisualization)}
                variant="outline"
                size="sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                {showVisualization ? 'Hide Charts' : 'Show Charts'}
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto chat-scroll p-6 space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isBot = msg.sender === 'bot';
              const hasTableData = msg.table && msg.table.length > 0;
              
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className={`flex items-start space-x-3 ${isBot ? '' : 'justify-end'}`}
                >
                  {isBot && (
                    <div className="w-8 h-8 bg-workpack-blue rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="text-white h-4 w-4" />
                    </div>
                  )}

                  <div className={`flex-1 ${isBot ? '' : 'flex justify-end'}`}>
                    <div className={`max-w-4xl ${isBot ? '' : 'max-w-2xl'}`}>
                      {/* Message Bubble */}
                      <div className={`rounded-xl p-4 shadow-sm ${
                        isBot 
                          ? "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-tl-none"
                          : "bg-workpack-blue text-white rounded-tr-none"
                      }`}>
                        {isBot ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {msg.text}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="leading-relaxed">{msg.text}</p>
                        )}
                      </div>

                      {/* Data Table */}
                      {hasTableData && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="mt-4"
                        >
                          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold workpack-text dark:text-white">
                                Work Package Data
                              </h4>
                              <Button
                                onClick={() => exportToExcel(msg.table!, msg.headers)}
                                size="sm"
                                className="bg-workpack-green hover:bg-green-700 text-white"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Export Excel
                              </Button>
                            </div>
                            
                            {msg.headers && msg.table && (
                              <EnhancedWorkPackageTable 
                                data={formatTableDataForChart(msg.table, msg.headers)} 
                                conversationId={convId}
                              />
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* Visualizations */}
                      {(showVisualization || shouldShowGantt(msg)) && hasTableData && msg.headers && msg.table && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="mt-4 space-y-4"
                        >
                          {/* Progress Status Chart */}
                          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                            <h4 className="font-semibold workpack-text dark:text-white mb-3">
                              Work Package Status Distribution
                            </h4>
                            <ProgressChart data={formatTableDataForChart(msg.table, msg.headers)} type="pie" />
                          </div>
                          
                          {/* Progress Bar Chart */}
                          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                            <h4 className="font-semibold workpack-text dark:text-white mb-3">
                              Progress by Work Package - Gantt View
                            </h4>
                            <GanttChart data={formatTableDataForChart(msg.table, msg.headers)} />
                          </div>
                          
                          {/* Status Count Chart */}
                          <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                            <h4 className="font-semibold workpack-text dark:text-white mb-3">
                              Status Count Analysis
                            </h4>
                            <ProgressChart data={formatTableDataForChart(msg.table, msg.headers)} type="bar" />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {!isBot && (
                    <div className="w-8 h-8 bg-workpack-orange rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="text-white h-4 w-4" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
          
          {isLoading && <TypingIndicator />}
        </div>

        {/* Chat Input */}
        <div className="flex-shrink-0">
          <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
        </div>
      </div>
    </div>
  );
}