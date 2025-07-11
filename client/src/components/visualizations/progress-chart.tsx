import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

interface ProgressChartProps {
  data: any[];
  type?: 'pie' | 'bar';
}

export function ProgressChart({ data, type = 'pie' }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      return [];
    }
    
    // Get all column names from the first row
    const columns = Object.keys(data[0]);
    
    // Find status-like columns (containing 'status', 'state', 'phase', 'progress', 'cwp')
    const statusColumns = columns.filter(col => 
      col.toLowerCase().includes('status') || 
      col.toLowerCase().includes('state') ||
      col.toLowerCase().includes('phase') ||
      col.toLowerCase().includes('progress') ||
      col.toLowerCase().includes('cwp')
    );
    
    // Use first status column, or fall back to any categorical column
    let groupColumn = statusColumns[0];
    if (!groupColumn) {
      // Find categorical columns (columns with limited unique values)
      const categoricalColumns = columns.filter(col => {
        // Skip ID and description columns
        if (col.toLowerCase().includes('id') || col.toLowerCase().includes('description')) {
          return false;
        }
        
        const sampleValues = data.slice(0, 20).map(item => item[col]);
        const uniqueValues = new Set(sampleValues);
        return uniqueValues.size < 15 && uniqueValues.size > 1;
      });
      groupColumn = categoricalColumns[0];
    }
    
    if (!groupColumn) {
      return [];
    }
    
    // Group by the selected column
    const statusCounts = data.reduce((acc, item) => {
      const status = item[groupColumn] || 'Unknown';
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

    return sortedEntries.map(([status, count]) => ({
      name: status,
      value: count,
      percentage: Math.round((count / data.length) * 100)
    }));
  }, [data]);

  const COLORS = [
    '#10b981', // green
    '#3b82f6', // blue  
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // purple
    '#6b7280'  // gray
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
          <p className="font-semibold text-workpack-text dark:text-white">{data.name}</p>
          <p className="text-sm">Count: {data.value}</p>
          <p className="text-sm">Percentage: {data.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-workpack-slate dark:text-slate-400">
        No data available for visualization
      </div>
    );
  }

  if (type === 'bar') {
    return (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
              {chartData.map((_, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            label={({ name, percentage }) => `${name}: ${percentage}%`}
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}