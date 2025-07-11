import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ScatterChart, Scatter } from 'recharts';

interface VisualizationSpec {
  type: 'line' | 'bar' | 'scatter' | 'pie' | 'histogram';
  x: string | null;
  y: string | null;
  color: string | null;
  title: string;
  transform: string | null;
}

interface DynamicChartProps {
  data: any[];
  specs: VisualizationSpec[];
}

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f97316', '#6b7280', '#ec4899', '#84cc16'
];

export function DynamicChart({ data, specs }: DynamicChartProps) {
  const processedCharts = useMemo(() => {
    return specs.map((spec, index) => {
      let chartData = [];
      
      if (spec.type === 'pie') {
        // For pie charts, aggregate by the y column
        const column = spec.y;
        if (column && data.length > 0) {
          const counts = data.reduce((acc, item) => {
            const value = item[column] || 'Unknown';
            acc[value] = (acc[value] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);
          
          chartData = Object.entries(counts).map(([name, value]) => ({
            name,
            value,
            percentage: Math.round((value / data.length) * 100)
          }));
        }
      } else if (spec.type === 'bar') {
        // For bar charts, aggregate by x column
        const xColumn = spec.x;
        const yColumn = spec.y;
        
        if (xColumn && yColumn && data.length > 0) {
          if (spec.transform === 'count') {
            const counts = data.reduce((acc, item) => {
              const key = item[xColumn] || 'Unknown';
              acc[key] = (acc[key] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);
            
            chartData = Object.entries(counts).map(([name, value]) => ({
              [xColumn]: name,
              [yColumn]: value
            }));
          } else if (spec.transform === 'aggregate_sum') {
            const sums = data.reduce((acc, item) => {
              const key = item[xColumn] || 'Unknown';
              const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
              acc[key] = (acc[key] || 0) + value;
              return acc;
            }, {} as Record<string, number>);
            
            chartData = Object.entries(sums).map(([name, value]) => ({
              [xColumn]: name,
              [yColumn]: value
            }));
          }
        }
      } else if (spec.type === 'line') {
        // For line charts, typically time series
        const xColumn = spec.x;
        const yColumn = spec.y;
        
        if (xColumn && yColumn && data.length > 0) {
          const timeCounts = data.reduce((acc, item) => {
            const timeValue = item[xColumn];
            if (timeValue) {
              try {
                const date = new Date(timeValue);
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
          
          chartData = Object.entries(timeCounts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, count]) => ({
              [xColumn]: new Date(month + '-01').toLocaleDateString('en-US', { 
                month: 'short', 
                year: 'numeric' 
              }),
              [yColumn]: count
            }));
        }
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
                  <Bar dataKey={chart.y} radius={[4, 4, 0, 0]}>
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
                    dataKey={chart.y} 
                    stroke={COLORS[0]} 
                    strokeWidth={2}
                    dot={{ fill: COLORS[0] }}
                  />
                </LineChart>
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