import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface VisualizationSpec {
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'histogram';
  x: string | null;
  y: string | null;
  color: string | null;
  title: string;
  transform?: string | null; // Legacy support
  transform_x?: string | null; // New separate transforms
  transform_y?: string | null;
}

interface DynamicChartProps {
  data: any[];
  specs: VisualizationSpec[];
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f97316', '#6b7280', '#ec4899', '#84cc16'
];

// Transform functions for different chart types
function applyTransform(data: any[], column: string, transform: string | null): any[] {
  if (!transform) return data;
  
  if (transform === 'count') {
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ [column]: name, count: value }));
  }
  
  if (transform === 'aggregate_sum') {
    // For aggregate_sum, we need a second column to sum - this should be handled at chart level
    const sums = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      const value = parseFloat(String(item[column]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sums).map(([name, value]) => ({ [column]: name, sum: value }));
  }
  
  if (transform.startsWith('date_group:')) {
    const groupType = transform.split(':')[1];
    const grouped = data.reduce((acc, item) => {
      const dateValue = item[column];
      if (dateValue) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            let key;
            switch (groupType) {
              case 'year':
                key = date.getFullYear().toString();
                break;
              case 'quarter':
                key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                break;
              case 'month_year':
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                break;
              case 'day':
                key = date.toISOString().split('T')[0];
                break;
              default:
                key = dateValue;
            }
            acc[key] = (acc[key] || 0) + 1;
          }
        } catch (e) {
          // Skip invalid dates
        }
      }
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ [column]: date, count }));
  }
  
  if (transform.startsWith('bin:')) {
    const binParam = transform.split(':')[1];
    const values = data.map(item => parseFloat(String(item[column])) || 0).filter(v => !isNaN(v));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binCount = binParam === 'auto' ? Math.ceil(Math.sqrt(values.length)) : parseInt(binParam) || 10;
    const binWidth = (max - min) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });
    
    return bins.map(bin => ({ [column]: bin.range, count: bin.count }));
  }
  
  if (transform.startsWith('topk:')) {
    const k = parseInt(transform.split(':')[1]) || 10;
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, k);
    return sorted.map(([name, value]) => ({ [column]: name, count: value }));
  }
  
  return data;
}

function processPieChart(data: any[], spec: VisualizationSpec): any[] {
  const column = spec.y || spec.x;
  if (!column || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  const transform = yTransform || xTransform || spec.transform;
  
  const transformed = applyTransform(data, column, transform);
  return transformed.map(item => ({
    name: item[column],
    value: item.count || item.sum || 1,
    percentage: Math.round(((item.count || item.sum || 1) / data.length) * 100)
  }));
}

function processBarChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // If y-transform is count OR if the title contains "Count", count occurrences by x-column
  if (yTransform === 'count' || spec.transform === 'count' || spec.title?.includes('Count')) {
    let processedData = data;
    
    // Apply x-transform (like topk) first if specified
    if (xTransform && xTransform.startsWith('topk:')) {
      const k = parseInt(xTransform.split(':')[1]) || 10;
      const counts = data.reduce((acc, item) => {
        const key = item[xColumn] || 'Unknown';
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a).slice(0, k);
      const topKeys = sorted.map(([name]) => name);
      processedData = data.filter(item => topKeys.includes(item[xColumn]));
    }
    
    const counts = processedData.reduce((acc, item) => {
      let key = item[xColumn] || 'Unknown';
      
      // Handle dates - format for better readability
      if (xColumn.includes('date') || xColumn.includes('start') || xColumn.includes('finish')) {
        try {
          const date = new Date(key);
          if (!isNaN(date.getTime())) {
            key = date.toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'short' 
            });
          }
        } catch (e) {
          // Keep original value if not a valid date
        }
      }
      
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const result = Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, value]) => ({ [xColumn]: name, count: value }));
    
    return result;
  }
  
  // If y is null and no transform, count occurrences
  if (!yColumn) {
    const counts = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ [xColumn]: name, count: value }));
  }
  
  if (spec.transform === 'aggregate_sum' && yColumn) {
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sums).map(([name, value]) => ({ [xColumn]: name, [yColumn]: value }));
  }
  
  // Note: topk is now handled in the count section above
  
  return applyTransform(data, xColumn, xTransform || spec.transform);
}

function processLineChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // Handle date grouping for line charts
  if (xTransform && xTransform.startsWith('date_group:')) {
    const groupType = xTransform.split(':')[1];
    const grouped = data.reduce((acc, item) => {
      const dateValue = item[xColumn];
      if (dateValue) {
        try {
          const date = new Date(dateValue);
          if (!isNaN(date.getTime())) {
            let key;
            switch (groupType) {
              case 'year':
                key = date.getFullYear().toString();
                break;
              case 'quarter':
                key = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                break;
              case 'month_year':
                key = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short' 
                });
                break;
              default:
                key = dateValue;
            }
            
            if (!acc[key]) {
              acc[key] = { [xColumn]: key, count: 0, sum: 0 };
            }
            acc[key].count += 1;
            if (yColumn) {
              const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
              acc[key].sum += value;
              acc[key][yColumn] = yTransform === 'count' ? acc[key].count : acc[key].sum;
            }
          }
        } catch (e) {
          // Keep original value if not a valid date
        }
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a, b) => a[xColumn].localeCompare(b[xColumn]));
  }
  
  if (xTransform === 'aggregate_sum' && yColumn) {
    // For aggregate_sum, we need to group by x and sum y values
    const grouped = data.reduce((acc, item) => {
      const xValue = item[xColumn];
      const yValue = parseFloat(String(item[yColumn])) || 0;
      
      if (xValue) {
        let key = xValue;
        // Handle date grouping if it's a date column
        if (xColumn.includes('date') || xColumn.includes('start') || xColumn.includes('finish')) {
          try {
            const date = new Date(xValue);
            if (!isNaN(date.getTime())) {
              key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            }
          } catch (e) {
            // Keep original value if not a valid date
          }
        }
        
        if (!acc[key]) {
          acc[key] = { [xColumn]: key, [yColumn]: 0 };
        }
        acc[key][yColumn] += yValue;
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a, b) => a[xColumn].localeCompare(b[xColumn]));
  }
  
  return applyTransform(data, xColumn, xTransform || spec.transform);
}

function processScatterChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // For scatter plots, we typically want raw values
  return data.map(item => {
    let xValue = item[xColumn];
    let yValue = item[yColumn];
    
    // Try to parse dates for x-axis if it looks like a date
    if (xColumn.includes('date') || xColumn.includes('start') || xColumn.includes('finish')) {
      try {
        const date = new Date(xValue);
        if (!isNaN(date.getTime())) {
          xValue = date.getTime(); // Use timestamp for scatter plot
        }
      } catch (e) {
        // Keep original value if not a valid date
      }
    }
    
    // Try to parse numbers for y-axis
    if (typeof yValue === 'string') {
      const parsed = parseFloat(yValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        yValue = parsed;
      }
    }
    
    return {
      [xColumn]: xValue,
      [yColumn]: yValue
    };
  });
}

function processHistogram(data: any[], spec: VisualizationSpec): any[] {
  const column = spec.x || spec.y;
  if (!column || data.length === 0) return [];
  
  return applyTransform(data, column, spec.transform || 'bin:auto');
}

export function DynamicChart({ data, specs }: DynamicChartProps) {
  const processedCharts = useMemo(() => {
    return specs.map((spec, index) => {
      let chartData = [];
      
      if (spec.type === 'pie') {
        chartData = processPieChart(data, spec);
      } else if (spec.type === 'bar') {
        chartData = processBarChart(data, spec);
      } else if (spec.type === 'line') {
        chartData = processLineChart(data, spec);
      } else if (spec.type === 'scatter') {
        chartData = processScatterChart(data, spec);
      } else if (spec.type === 'histogram') {
        chartData = processHistogram(data, spec);
      }
      
      return {
        ...spec,
        data: chartData,
        id: `chart-${index}`
      };
    });
  }, [data, specs]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          {label && <p className="font-semibold text-workpack-text dark:text-white">{label}</p>}
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
              {entry.payload?.percentage && ` (${entry.payload.percentage}%)`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0 || !specs || specs.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No visualization data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {processedCharts.map((chart, index) => (
        <div key={chart.id} className="bg-gray-50 dark:bg-slate-900 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-4 text-workpack-text dark:text-white">
            {chart.title}
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'pie' ? (
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chart.data.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              ) : chart.type === 'bar' ? (
                <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={chart.transform_y === 'count' || chart.transform === 'count' || chart.title?.includes('Count') ? 'count' : chart.y || 'count'} radius={[4, 4, 0, 0]}>
                    {chart.data.map((entry: any, dataIndex: number) => (
                      <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chart.type === 'line' ? (
                <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={chart.transform_y === 'count' || chart.transform === 'count' || chart.title?.includes('Count') ? 'count' : chart.y || 'count'} 
                    stroke={COLORS[0]} 
                    strokeWidth={2}
                    dot={{ fill: COLORS[0] }}
                  />
                </LineChart>
              ) : chart.type === 'scatter' ? (
                <ScatterChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Scatter dataKey={chart.y} fill={COLORS[0]} />
                </ScatterChart>
              ) : chart.type === 'histogram' ? (
                <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x || chart.y} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chart.data.map((entry: any, dataIndex: number) => (
                      <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>Chart type "{chart.type}" not supported yet</p>
                </div>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}