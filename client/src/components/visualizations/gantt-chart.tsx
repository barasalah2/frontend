import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Cell as PieCell
} from 'recharts';

interface GanttChartProps {
  data: any[];
  spec?: any;
}

export function GanttChart({ data, spec }: GanttChartProps) {
  // Dynamically detect columns and create appropriate visualizations
  const { timelineData, statusData, columns } = useMemo(() => {
    if (!data || data.length === 0) {
      return { timelineData: [], statusData: [], columns: [] };
    }

    // Get all column names from the first row
    const columns = Object.keys(data[0]);
    
    // Find date-like columns (containing 'date', 'time', 'plan', 'schedule')
    const dateColumns = columns.filter(col => 
      col.toLowerCase().includes('date') || 
      col.toLowerCase().includes('time') ||
      col.toLowerCase().includes('plan') ||
      col.toLowerCase().includes('schedule')
    );
    
    // Find status-like columns (containing 'status', 'state', 'phase', 'cwp')
    const statusColumns = columns.filter(col => 
      col.toLowerCase().includes('status') || 
      col.toLowerCase().includes('state') ||
      col.toLowerCase().includes('phase') ||
      col.toLowerCase().includes('cwp')
    );

    // Create timeline data from date columns
    let timelineData = [];
    if (dateColumns.length > 0) {
      const dateColumn = dateColumns[0]; // Use first date column
      const monthCounts = data.reduce((acc, item) => {
        const dateValue = item[dateColumn];
        if (dateValue) {
          try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
              const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              acc[monthYear] = (acc[monthYear] || 0) + 1;
            }
          } catch (e) {
            // Skip invalid dates
          }
        }
        return acc;
      }, {} as Record<string, number>);

      let sortedEntries = Object.entries(monthCounts)
        .sort(([a], [b]) => a.localeCompare(b));
      
      // Limit to 20 data points
      if (sortedEntries.length > 20) {
        sortedEntries = sortedEntries.slice(0, 20);
      }

      timelineData = sortedEntries.map(([month, count]) => ({
        month,
        count,
        name: new Date(month + '-01').toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        })
      }));
    }

    // Create status data from status columns
    let statusData = [];
    if (statusColumns.length > 0) {
      const statusColumn = statusColumns[0]; // Use first status column
      const statusCounts = data.reduce((acc, item) => {
        const status = item[statusColumn] || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let sortedEntries = Object.entries(statusCounts)
        .sort(([, a], [, b]) => b - a); // Sort by count descending
      
      // Limit to 20 data points, group others as "Others"
      if (sortedEntries.length > 20) {
        const top19 = sortedEntries.slice(0, 19);
        const othersCount = sortedEntries.slice(19).reduce((sum, [, count]) => sum + count, 0);
        sortedEntries = [...top19, ['Others', othersCount]];
      }

      statusData = sortedEntries.map(([status, count]) => ({
        name: status,
        value: count,
        percentage: Math.round((count / data.length) * 100)
      }));
    }

    return { timelineData, statusData, columns };
  }, [data]);

  // Find categorical columns for additional charts
  const categoricalData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const categoricalColumns = columns.filter(col => {
      // Skip already used columns and high-cardinality columns
      if (col.toLowerCase().includes('date') || 
          col.toLowerCase().includes('plan') || 
          col.toLowerCase().includes('id') || 
          col.toLowerCase().includes('description') ||
          col.toLowerCase().includes('name')) {
        return false;
      }
      
      const sampleValues = data.slice(0, 50).map(item => item[col]);
      const uniqueValues = new Set(sampleValues);
      // Only use columns with very few unique values (max 8) to avoid individual record display
      return uniqueValues.size <= 8 && uniqueValues.size > 1;
    });

    return categoricalColumns.map(col => {
      const valueCounts = data.reduce((acc, item) => {
        const value = item[col] || 'Unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      let sortedEntries = Object.entries(valueCounts)
        .sort(([, a], [, b]) => b - a); // Sort by count descending
      
      // Limit to 20 data points, group others as "Others"
      if (sortedEntries.length > 20) {
        const top19 = sortedEntries.slice(0, 19);
        const othersCount = sortedEntries.slice(19).reduce((sum, [, count]) => sum + count, 0);
        sortedEntries = [...top19, ['Others', othersCount]];
      }

      return {
        column: col,
        data: sortedEntries.map(([name, count]) => ({
          name,
          value: count,
          percentage: Math.round((count / data.length) * 100)
        }))
      };
    });
  }, [data, columns]);

  const COLORS = [
    '#10b981', // green
    '#3b82f6', // blue  
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#06b6d4', // cyan
    '#f97316', // orange
    '#6b7280'  // gray
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-semibold text-workpack-text dark:text-white">{data.name}</p>
          <p className="text-sm">Count: {data.value || data.count}</p>
          {data.percentage && <p className="text-sm">Percentage: {data.percentage}%</p>}
        </div>
      );
    }
    return null;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data available for visualization
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Chart - if we have date data */}
      {timelineData.length > 0 && (
        <div className="h-64 w-full">
          <h3 className="text-lg font-semibold mb-4 text-workpack-text dark:text-white">
            Timeline Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {timelineData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Status Distribution Chart - if we have status data */}
      {statusData.length > 0 && (
        <div className="h-64 w-full">
          <h3 className="text-lg font-semibold mb-4 text-workpack-text dark:text-white">
            Status Distribution  
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie 
                data={statusData} 
                dataKey="value" 
                nameKey="name" 
                outerRadius={80}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {statusData.map((_, index) => (
                  <PieCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Additional categorical charts */}
      {categoricalData.map((catData, index) => (
        <div key={catData.column} className="h-64 w-full">
          <h3 className="text-lg font-semibold mb-4 text-workpack-text dark:text-white">
            {catData.column} Distribution
          </h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={catData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {catData.data.map((_, dataIndex) => (
                  <Cell key={`cell-${dataIndex}`} fill={COLORS[(index * 2 + dataIndex) % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ))}

      {/* Fallback message if no charts can be generated */}
      {timelineData.length === 0 && statusData.length === 0 && categoricalData.length === 0 && (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          <div className="text-center">
            <p className="text-lg font-medium">No suitable data for visualization</p>
            <p className="text-sm mt-2">
              Available columns: {columns.join(', ')}
            </p>
            <p className="text-sm mt-1">
              Try data with date, status, or categorical columns for better visualizations.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}