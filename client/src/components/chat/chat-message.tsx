import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedWorkPackageTable } from "@/components/tables/enhanced-work-package-table";
import { GanttChart } from "@/components/visualizations/gantt-chart";
import { ProgressChart } from "@/components/visualizations/progress-chart";
import { type Message } from "@shared/schema";
import { Bot, User, Download, Maximize2, AlertCircle, BarChart3, EyeOff } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { exportToExcel } from "@/lib/excel-export";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [showCharts, setShowCharts] = useState(false);
  const isBot = message.sender === "bot";
  const hasTableData = message.data && message.data.table;

  const formatTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }
      return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }).format(dateObj);
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const handleExportTable = () => {
    if (hasTableData) {
      const tableData = message.data.table;
      const headers = Object.keys(tableData[0] || {});
      const rows = tableData.map((row: any) => Object.values(row));
      exportToExcel([headers, ...rows], `workpack_data_${message.id}`);
    }
  };

  const shouldShowGantt = message.content.toLowerCase().includes('gantt') || 
                         message.content.toLowerCase().includes('timeline') ||
                         message.content.toLowerCase().includes('schedule');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
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
    <div
      className={`rounded-xl p-4 shadow-sm ${
        isBot
          ? "bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-tl-none"
          : "bg-workpack-blue text-white rounded-tr-none"
      }`}
    >
      {/* 🔄 Force Markdown for both bot and user */}
      <div
        className={`prose prose-sm dark:prose-invert max-w-none ${
          !isBot ? "text-white prose-p:text-white prose-strong:text-white" : ""
        }`}
      >
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </ReactMarkdown>
      </div>
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
                  <h4 className="font-semibold workpack-text dark:text-white flex items-center">
                    <AlertCircle className="h-4 w-4 mr-2 text-workpack-orange" />
                    Work Package Analysis
                  </h4>
                  <div className="flex space-x-2">
                    <Button
                      onClick={() => setShowCharts(!showCharts)}
                      size="sm"
                      variant="outline"
                      className="text-workpack-blue border-workpack-blue hover:bg-workpack-blue hover:text-white"
                    >
                      {showCharts ? <EyeOff className="h-3 w-3 mr-1" /> : <BarChart3 className="h-3 w-3 mr-1" />}
                      {showCharts ? 'Hide Charts' : 'Show Charts'}
                    </Button>
                    <Button
                      onClick={handleExportTable}
                      size="sm"
                      className="bg-workpack-green hover:bg-green-700 text-white"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Export Excel
                    </Button>
                  </div>
                </div>
                <EnhancedWorkPackageTable 
                  data={message.data.table} 
                />
              </div>
            </motion.div>
          )}

          {/* Chart Visualizations */}
          {showCharts && hasTableData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-4 space-y-4"
            >
              {/* Progress Chart */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold workpack-text dark:text-white">
                    Data Distribution - Pie Chart
                  </h4>
                  <Button
                    onClick={() => setShowFullscreen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Full Screen
                  </Button>
                </div>
                <ProgressChart data={message.data.table} type="pie" />
              </div>
              
              {/* Gantt Chart / Timeline */}
              <div className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold workpack-text dark:text-white">
                    Timeline & Analysis
                  </h4>
                  <Button
                    onClick={() => setShowFullscreen(true)}
                    size="sm"
                    variant="outline"
                  >
                    <Maximize2 className="h-3 w-3 mr-1" />
                    Full Screen
                  </Button>
                </div>
                <GanttChart data={message.data.table} />
              </div>
            </motion.div>
          )}

          {/* Analysis Summary */}
          {isBot && hasTableData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 p-3 bg-blue-50 dark:bg-slate-700 rounded-lg border-l-4 border-workpack-blue"
            >
              <div className="flex items-start space-x-2">
                <AlertCircle className="text-workpack-blue mt-1 h-4 w-4" />
                <div>
                  <h5 className="font-medium workpack-text dark:text-white mb-1">
                    Analysis Summary
                  </h5>
                  <p className="text-sm workpack-slate dark:text-slate-300">
                    Based on the work package data, I've identified key insights and recommendations 
                    for optimizing project performance and resource allocation.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Timestamp */}
          <div className={`flex items-center space-x-2 mt-2 text-xs workpack-slate dark:text-slate-400 ${
            isBot ? '' : 'justify-end mr-11'
          }`}>
            <span>{isBot ? 'Workpacks Genie' : 'You'}</span>
            <span>•</span>
            <span>{formatTime(message.createdAt)}</span>
            {isBot && hasTableData && (
              <>
                <span>•</span>
                <Badge variant="secondary" className="text-workpack-green">
                  Generated analysis
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      {!isBot && (
        <div className="w-8 h-8 bg-workpack-orange rounded-full flex items-center justify-center flex-shrink-0">
          <User className="text-white h-4 w-4" />
        </div>
      )}
    </motion.div>
  );
}
