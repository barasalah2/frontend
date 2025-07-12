import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DynamicChart } from "@/components/visualizations/dynamic-chart";
import { LocalStorageViewer } from "@/components/debug/localStorage-viewer";
import { BarChart3, Trash2, Download, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToExcel } from "@/lib/excel-export";

interface SavedChart {
  id: number;
  conversationId: number;
  charts: any[];
  data: any[];
  title: string;
  savedAt: string;
}

export function SavedChartsViewer() {
  const [savedCharts, setSavedCharts] = useState<SavedChart[]>([]);
  const [expandedCharts, setExpandedCharts] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    loadSavedCharts();
  }, []);

  const loadSavedCharts = () => {
    try {
      const charts = JSON.parse(localStorage.getItem('savedCharts') || '[]');
      setSavedCharts(charts.sort((a: SavedChart, b: SavedChart) => 
        new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading saved charts:', error);
      toast({
        title: "Error",
        description: "Failed to load saved charts",
        variant: "destructive",
      });
    }
  };

  const deleteChart = (chartId: number) => {
    try {
      const updatedCharts = savedCharts.filter(chart => chart.id !== chartId);
      localStorage.setItem('savedCharts', JSON.stringify(updatedCharts));
      setSavedCharts(updatedCharts);
      
      toast({
        title: "Chart Deleted",
        description: "Chart has been removed from saved charts",
      });
    } catch (error) {
      console.error('Error deleting chart:', error);
      toast({
        title: "Error",
        description: "Failed to delete chart",
        variant: "destructive",
      });
    }
  };

  const exportChartData = (chart: SavedChart) => {
    try {
      if (chart.data && chart.data.length > 0) {
        const headers = Object.keys(chart.data[0]);
        const rows = chart.data.map(row => Object.values(row));
        exportToExcel([headers, ...rows], `${chart.title.replace(/[^a-zA-Z0-9]/g, '_')}_data`);
        
        toast({
          title: "Export Complete",
          description: "Chart data has been exported to Excel",
        });
      }
    } catch (error) {
      console.error('Error exporting chart data:', error);
      toast({
        title: "Error",
        description: "Failed to export chart data",
        variant: "destructive",
      });
    }
  };

  const toggleChartExpansion = (chartId: number) => {
    setExpandedCharts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(chartId)) {
        newSet.delete(chartId);
      } else {
        newSet.add(chartId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown date';
    }
  };

  if (savedCharts.length === 0) {
    return (
      <div className="text-center py-8">
        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">
          No Saved Charts
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Charts you save will appear here for easy access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LocalStorageViewer />
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
          Saved Charts ({savedCharts.length})
        </h2>
        <Button
          onClick={loadSavedCharts}
          variant="outline"
          size="sm"
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {savedCharts.map((chart) => (
          <motion.div
            key={chart.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border border-gray-200 dark:border-gray-700">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      {chart.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-2">
                      <Badge variant="secondary">
                        {chart.charts.length} chart{chart.charts.length !== 1 ? 's' : ''}
                      </Badge>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Saved {formatDate(chart.savedAt)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => toggleChartExpansion(chart.id)}
                      variant="outline"
                      size="sm"
                    >
                      {expandedCharts.has(chart.id) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      onClick={() => exportChartData(chart)}
                      variant="outline"
                      size="sm"
                      disabled={!chart.data || chart.data.length === 0}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteChart(chart.id)}
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedCharts.has(chart.id) && (
                <CardContent>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <DynamicChart
                      data={chart.data}
                      specs={chart.charts}
                    />
                  </motion.div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}