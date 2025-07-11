import { motion } from "framer-motion";
import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start space-x-3"
    >
      <div className="w-8 h-8 bg-workpack-blue rounded-full flex items-center justify-center flex-shrink-0">
        <Bot className="text-white h-4 w-4" />
      </div>
      <div className="bg-white dark:bg-slate-800 rounded-xl rounded-tl-none p-4 shadow-sm border border-gray-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <motion.div
            className="w-2 h-2 bg-workpack-slate rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0 }}
          />
          <motion.div
            className="w-2 h-2 bg-workpack-slate rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
          />
          <motion.div
            className="w-2 h-2 bg-workpack-slate rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
          />
          <span className="text-sm workpack-slate dark:text-slate-400 ml-2">
            Analyzing work packages...
          </span>
        </div>
      </div>
    </motion.div>
  );
}
