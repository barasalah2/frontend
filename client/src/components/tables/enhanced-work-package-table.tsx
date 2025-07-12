import { useState, useMemo } from "react";
import { ChevronUp, ChevronDown, Search, Filter, X, BarChart3, Save, Code } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { DynamicChart } from "@/components/visualizations/dynamic-chart";

interface EnhancedWorkPackageTableProps {
  data: any[];
  conversationId?: number;
}

type SortDirection = "asc" | "desc" | null;

export function EnhancedWorkPackageTable({ data, conversationId }: EnhancedWorkPackageTableProps) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterField, setFilterField] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isGeneratingViz, setIsGeneratingViz] = useState(false);
  const [visualizationSpecs, setVisualizationSpecs] = useState<any[]>([]);
  const [showVisualizations, setShowVisualizations] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [showJsonDialog, setShowJsonDialog] = useState(false);
  const [chartJson, setChartJson] = useState("");
  const { toast } = useToast();

  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // Get unique values for filter dropdown
  const getUniqueValues = (field: string) => {
    if (!data || field === "all") return [];
    const values = [...new Set(data.map(row => row[field]))].filter(Boolean);
    return values.sort();
  };

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];

    let filtered = [...data];

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply column filter
    if (filterField !== "all" && filterValue !== "all") {
      filtered = filtered.filter(row => 
        String(row[filterField]).toLowerCase() === filterValue.toLowerCase()
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered.sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];

        if (aValue === bValue) return 0;

        const comparison = aValue < bValue ? -1 : 1;
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, filterField, filterValue, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterField("all");
    setFilterValue("all");
    setSortField(null);
    setSortDirection(null);
  };

  const handleGenerateVisualization = () => {
    setShowMessageDialog(true);
  };

  const handleJsonVisualization = () => {
    setShowJsonDialog(true);
  };

  const generateFromJson = () => {
    try {
      console.log('Generating charts from JSON input');
      const parsedSpecs = JSON.parse(chartJson);
      
      // Validate that it's an array of chart specifications
      if (!Array.isArray(parsedSpecs)) {
        throw new Error('Chart JSON must be an array of chart specifications');
      }
      
      // Validate each spec has required fields
      const validSpecs = parsedSpecs.filter(spec => {
        if (!spec.type) {
          console.warn('Skipping chart spec without type:', spec);
          return false;
        }
        return true;
      });
      
      if (validSpecs.length === 0) {
        throw new Error('No valid chart specifications found');
      }
      
      console.log('Valid chart specs:', validSpecs);
      setVisualizationSpecs(validSpecs);
      setShowVisualizations(true);
      setShowJsonDialog(false);
      setChartJson("");
      
      toast({
        title: "Success",
        description: `Generated ${validSpecs.length} chart(s) from JSON`,
      });
      
    } catch (error) {
      console.error('Error parsing chart JSON:', error);
      toast({
        title: "Error",
        description: `Invalid JSON format: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const generateVisualization = async () => {
    console.log('Generate visualization button clicked!');
    console.log('Data:', data);
    console.log('Data length:', data?.length);
    console.log('Conversation ID:', conversationId);
    
    if (!data || data.length === 0) {
      console.log('No data available for visualization');
      toast({
        title: "No Data",
        description: "Cannot generate visualization without data",
        variant: "destructive",
      });
      return;
    }

    console.log('Starting visualization generation...');
    setIsGeneratingViz(true);
    try {
      // Prepare column information
      const columnInfo = columns.map(col => ({
        name: col,
        type: detectColumnType(col, data)
      }));

      // Get first 10 rows as data snippet
      const dataSnippet = data.slice(0, 10);

      // Send to your external AI app (not the internal API)
      const AI_BACKEND_URL = 'http://localhost:5000/api/datavis'; // Your external AI app

      const requestPayload = {
        columns: columnInfo.map(col => ({ name: col.name })), // Only send column names as per your spec
        data_snippet: dataSnippet,
        total_rows: data.length,
        ...(conversationId && { conv_id: conversationId }), // Include conversation ID if available
        // Remove internal saving params when calling external app
        ...(userMessage.trim() && { message: userMessage.trim() })
      };

      console.log('Sending to AI backend:', AI_BACKEND_URL);
      console.log('Request payload:', requestPayload);
      console.log('Conv ID in payload:', requestPayload.conv_id);
      
      const response = await fetch(AI_BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI backend error:', errorText);
        throw new Error(`AI backend error: ${response.status} - ${errorText}`);
      }

      let result = await response.json();
      console.log('Received visualization data:', result);
      console.log('Type of result:', typeof result);
      
      // Handle case where response is a JSON string instead of object
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
          console.log('Parsed JSON string to object:', result);
        } catch (parseError) {
          console.error('Failed to parse JSON string response:', parseError);
          throw new Error('Invalid JSON response from AI backend');
        }
      }
      
      console.log('Final processed result:', result);
      console.log('Has visualizations?', result && result.visualizations);
      console.log('Is array?', Array.isArray(result?.visualizations));
      
      // Check if the response has the expected structure
      if (result && result.visualizations && Array.isArray(result.visualizations)) {
        // Validate and filter chart specifications
        const validSpecs = validateChartSpecs(result.visualizations);
        console.log('Setting visualization specs:', validSpecs);
        setVisualizationSpecs(validSpecs);
        setShowVisualizations(true);

        toast({
          title: "Visualization Generated",
          description: `Generated ${validSpecs.length} visualization(s)`,
        });
      } else {
        console.error('Invalid response format:', result);
        throw new Error('Invalid response format from AI backend');
      }

    } catch (error) {
      console.error('Error generating visualization:', error);
      console.error('Error details:', error.message);
      
      toast({
        title: "Error",
        description: `Failed to generate visualization: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingViz(false);
    }
  };

  // Validate chart specifications to filter out inappropriate combinations
  const validateChartSpecs = (specs: any[]) => {
    return specs.filter(spec => {
      // Check for scatter plots with text columns
      if (spec.type === 'scatter') {
        const isXTextColumn = spec.x && (spec.x.includes('description') || spec.x.includes('name') || spec.x.includes('label'));
        const isYTextColumn = spec.y && (spec.y.includes('description') || spec.y.includes('name') || spec.y.includes('label'));
        
        if (isXTextColumn || isYTextColumn) {
          console.warn(`Filtering out invalid scatter plot: ${spec.x} vs ${spec.y} (text columns not suitable for scatter plots)`);
          return false;
        }
      }
      
      // Check for histograms with text columns unless using count transform
      if (spec.type === 'histogram') {
        const column = spec.x || spec.y;
        const isTextColumn = column && (column.includes('description') || column.includes('name') || column.includes('label'));
        const hasCountTransform = spec.transform_x === 'count' || spec.transform_y === 'count' || 
                                 spec.transform === 'count' || spec.transform_x?.startsWith('topk:');
        
        if (isTextColumn && !hasCountTransform) {
          console.warn(`Filtering out invalid histogram: ${column} (text column without count transform)`);
          return false;
        }
      }

      // Check for box plots with invalid configurations
      if (spec.type === 'box' || spec.type === 'violin') {
        // Box plots need: categorical grouping variable (x) and numeric data (y)
        const isXCategorical = spec.x && (spec.x.includes('name') || spec.x.includes('description') || spec.x.includes('string_agg') || spec.x.includes('uom'));
        const isYNumeric = spec.y && (spec.y.includes('sum') || spec.y.includes('count') || !isNaN(Number(spec.y)));
        
        // Box plots showing distribution of categories (not numeric distributions) are invalid
        if (!isYNumeric || (spec.x && spec.x.includes('name') && spec.y && spec.y.includes('sum'))) {
          console.warn(`Filtering out invalid box plot: ${spec.x} vs ${spec.y} (box plots need categorical grouping + numeric distribution)`);
          return false;
        }
      }
      
      return true;
    });
  };

  const detectColumnType = (columnName: string, data: any[]) => {
    // Check if it's a time/date column
    if (columnName.toLowerCase().includes('date') || columnName.toLowerCase().includes('time')) {
      return 'time';
    }
    
    // Check sample values for numeric content
    const sampleValues = data.slice(0, 10).map(row => row[columnName]).filter(v => v != null);
    const numericValues = sampleValues.filter(v => !isNaN(Number(v)));
    
    if (numericValues.length > sampleValues.length * 0.8) {
      return 'numeric';
    }
    
    return 'categorical';
  };

  const handleSaveCharts = async () => {
    if (!visualizationSpecs.length) {
      toast({
        title: "No Charts",
        description: "No charts to save",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('=== SAVING CHARTS WITH UNIFIED STORAGE (TABLE) ===');
      console.log('Visualization specs:', visualizationSpecs);
      console.log('Conversation ID:', conversationId);
      
      const workingConversationId = conversationId || 1;
      console.log('Using conversation ID:', workingConversationId);
      
      if (!conversationId) {
        console.warn('No conversation ID provided, using fallback ID 1');
      }

      // Import unifiedStorage here to avoid circular imports
      const { unifiedStorage } = await import('@/lib/unified-storage');
      
      // Check if conversation exists, if not create it
      let conversation = unifiedStorage.getConversation(workingConversationId);
      if (!conversation) {
        console.log('Creating fallback conversation with ID:', workingConversationId);
        conversation = unifiedStorage.createConversation({
          title: "AWP Analysis",
          category: "general",
          userId: "default_user"
        });
        console.log('Created fallback conversation:', conversation.id);
      }

      // Save using unified storage system
      const savedChart = unifiedStorage.addChart(workingConversationId, {
        title: `Generated Charts - ${new Date().toLocaleString()}`,
        charts: visualizationSpecs,
        data: data,
        metadata: {
          savedFrom: 'work-package-table',
          chartCount: visualizationSpecs.length
        }
      });

      console.log('Chart saved to unified storage:', savedChart);

      // Also save via API for conversation display
      try {
        const response = await fetch('/api/charts/save', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            conversation_id: workingConversationId,
            chart_config: visualizationSpecs,
            chart_data: data,
            title: `Generated Charts - ${new Date().toLocaleString()}`
          }),
        });

        if (!response.ok) {
          console.warn('API save failed, but unified storage succeeded');
        }
      } catch (apiError) {
        console.warn('API save failed, but unified storage succeeded:', apiError);
      }

      toast({
        title: "Charts Saved",
        description: `Saved ${visualizationSpecs.length} chart${visualizationSpecs.length !== 1 ? 's' : ''} to conversation`,
      });

      // Trigger a custom event to refresh the charts in the conversation
      window.dispatchEvent(new Event('chartSaved'));
    } catch (error) {
      console.error('Error saving charts:', error);
      toast({
        title: "Error",
        description: "Failed to save charts",
        variant: "destructive",
      });
    }
  };

  const hasActiveFilters = searchTerm || filterField !== "all" || filterValue !== "all" || sortField;

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No work package data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateVisualization}
            disabled={isGeneratingViz}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            {isGeneratingViz ? 'Generating...' : 'Generate Charts'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleJsonVisualization}
          >
            <Code className="h-4 w-4 mr-2" />
            Custom JSON
          </Button>
          
          {showVisualizations && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowVisualizations(false)}
              >
                Hide Charts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSaveCharts()}
                disabled={!visualizationSpecs.length}
              >
                <Save className="h-4 w-4 mr-2" />
                Save Charts
              </Button>
            </div>
          )}
          
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-2" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Filter by Column</label>
              <Select value={filterField} onValueChange={setFilterField}>
                <SelectTrigger>
                  <SelectValue placeholder="Select column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Columns</SelectItem>
                  {columns.map(column => (
                    <SelectItem key={column} value={column}>{column}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {filterField !== "all" && (
              <div>
                <label className="block text-sm font-medium mb-2">Filter Value</label>
                <Select value={filterValue} onValueChange={setFilterValue}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Values</SelectItem>
                    {getUniqueValues(filterField).map(value => (
                      <SelectItem key={String(value)} value={String(value)}>
                        {String(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedData.length} of {data.length} records
        {hasActiveFilters && " (filtered)"}
      </div>

      {/* Table Container with Scroll */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="overflow-auto max-h-96 table-scroll">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0 z-10">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column}
                    onClick={() => handleSort(column)}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 select-none border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column}</span>
                      {getSortIcon(column)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAndSortedData.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={column}
                      className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-600 last:border-r-0"
                    >
                      <div className="max-w-xs truncate" title={String(row[column])}>
                        {row[column]}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredAndSortedData.length === 0 && data.length > 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No records match your current filters
        </div>
      )}

      {/* Dynamic Visualizations */}
      {showVisualizations && visualizationSpecs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4 text-workpack-text dark:text-white">
            Generated Visualizations
          </h3>
          <DynamicChart data={data} specs={visualizationSpecs} />
        </div>
      )}

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Message for Chart Generation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Optional Message (e.g., "Focus on status trends", "Show quarterly data")
              </label>
              <Textarea
                placeholder="Enter your message to guide the chart generation..."
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowMessageDialog(false);
                  setUserMessage("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowMessageDialog(false);
                  await generateVisualization();
                }}
                disabled={isGeneratingViz}
              >
                {isGeneratingViz ? 'Generating...' : 'Generate Charts'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* JSON Input Dialog */}
      <Dialog open={showJsonDialog} onOpenChange={setShowJsonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Custom Chart JSON</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Chart Specifications (JSON Array)
              </label>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Enter an array of chart specifications. Example:
              </div>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm mb-3">
                <pre>{`[
  {
    "type": "bar",
    "x": "cwp_name",
    "y": null,
    "title": "Count of CWP Names",
    "transform_x": "count"
  },
  {
    "type": "pie",
    "x": "status",
    "y": null,
    "title": "Status Distribution",
    "transform_x": "count"
  }
]`}</pre>
              </div>
              <Textarea
                placeholder="Enter your chart JSON specifications here..."
                value={chartJson}
                onChange={(e) => setChartJson(e.target.value)}
                className="min-h-[200px] font-mono"
              />
              <div className="text-xs text-gray-500 mt-2">
                Available chart types: bar, pie, line, scatter, histogram, stacked_bar, etc.
                Available transforms: count, sum, mean, date_group:month, topk:10, etc.
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowJsonDialog(false);
                  setChartJson("");
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={generateFromJson}
                disabled={!chartJson.trim()}
              >
                Generate Charts
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}