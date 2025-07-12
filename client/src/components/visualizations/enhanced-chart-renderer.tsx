import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  LineChart, 
  Line, 
  ScatterChart, 
  Scatter, 
  AreaChart, 
  Area, 
  ComposedChart, 
  ReferenceLine,
  Legend
} from 'recharts';

const COLORS = [
  '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
  '#06b6d4', '#f97316', '#6b7280', '#ec4899', '#84cc16',
  '#f472b6', '#14b8a6', '#fb7185', '#22d3ee', '#a78bfa',
  '#fbbf24', '#f87171', '#34d399', '#60a5fa', '#c084fc'
];

interface EnhancedChartProps {
  chart: {
    type: string;
    data: any[];
    x?: string | null;
    y?: string | null;
    series?: string | null;
    title: string;
    transform_x?: string | null;
    transform_y?: string | null;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
        {label && <p className="font-semibold text-workpack-text dark:text-white">{label}</p>}
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
            {entry.payload?.percentage && ` (${entry.payload.percentage}%)`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function EnhancedChartRenderer({ chart }: EnhancedChartProps) {
  if (!chart.data || chart.data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No data available for visualization</p>
      </div>
    );
  }

  const renderChart = () => {
    switch (chart.type) {
      case 'pie':
      case 'donut':
        return (
          <PieChart>
            <Pie
              data={chart.data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${name}: ${percentage}%`}
              outerRadius={100}
              innerRadius={chart.type === 'donut' ? 50 : 0}
              fill="#8884d8"
              dataKey="value"
            >
              {chart.data.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend />
          </PieChart>
        );

      case 'bar':
      case 'horizontal_bar':
        const isHorizontal = chart.type === 'horizontal_bar';
        
        // Select the appropriate dataKey for chart rendering
        const dataKey = chart.transform_y === 'sum' && chart.y ? chart.y :
                        chart.transform_y === 'count' || chart.title?.includes('Count') ? 'count' :
                        chart.y || 'value';

        return (
          <BarChart 
            data={chart.data} 
            layout={isHorizontal ? "horizontal" : "vertical"}
            margin={{ top: 20, right: 30, left: isHorizontal ? 120 : 40, bottom: isHorizontal ? 20 : 100 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            {isHorizontal ? (
              <>
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }} 
                  label={{ value: dataKey, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey={chart.x} 
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                  label={{ value: chart.x, angle: -90, position: 'insideLeft' }}
                />
              </>
            ) : (
              <>
                <XAxis 
                  dataKey={chart.x} 
                  tick={{ fontSize: 11 }}
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  interval={0}
                  label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  width={60}
                  label={{ value: dataKey, angle: -90, position: 'insideLeft' }}
                />
              </>
            )}
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey}
              radius={isHorizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]}
            >
              {chart.data.map((entry: any, dataIndex: number) => (
                <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        );

      case 'stacked_bar':
      case 'grouped_bar':
        const stackId = chart.type === 'stacked_bar' ? "stack" : undefined;
        const seriesKeys = chart.data.length > 0 ? 
          Object.keys(chart.data[0]).filter(key => 
            key !== chart.x && 
            key !== 'name' && 
            key !== 'count' && 
            key !== 'value' &&
            typeof chart.data[0][key] === 'number'
          ) : [];
        
        return (
          <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {seriesKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                stackId={stackId}
                fill={COLORS[index % COLORS.length]}
                radius={chart.type === 'stacked_bar' && index === seriesKeys.length - 1 ? [4, 4, 0, 0] : undefined}
              />
            ))}
          </BarChart>
        );

      case 'line':
        // Check if this is a multi-series line chart
        const hasSeriesData = chart.data.some(item => chart.series && item[chart.series!]);
        
        if (hasSeriesData && chart.series) {
          // For multi-series line charts, we need to restructure the data
          // Group by x-axis value and create columns for each series
          const xAxisKey = chart.x!;
          const yAxisKey = chart.y || 'value';
          const seriesKey = chart.series;
          
          const groupedByX = chart.data.reduce((acc, item) => {
            const xValue = item[xAxisKey];
            if (!acc[xValue]) {
              acc[xValue] = { [xAxisKey]: xValue };
            }
            acc[xValue][item[seriesKey]] = item[yAxisKey];
            return acc;
          }, {} as Record<string, any>);
          
          const restructuredData = Object.values(groupedByX);
          const seriesValues = [...new Set(chart.data.map(item => item[seriesKey]).filter(Boolean))];
          
          return (
            <LineChart data={restructuredData} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={xAxisKey} 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
                label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                width={60}
                label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {seriesValues.map((seriesValue, index) => (
                <Line
                  key={seriesValue}
                  type="monotone"
                  dataKey={String(seriesValue)}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={3}
                  name={String(seriesValue)}
                  dot={{ r: 5, fill: COLORS[index % COLORS.length] }}
                  activeDot={{ r: 7, stroke: COLORS[index % COLORS.length] }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          );
        } else {
          // Single line chart
          return (
            <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey={chart.x} 
                tick={{ fontSize: 11 }}
                angle={-45}
                textAnchor="end"
                height={100}
                label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                tick={{ fontSize: 12 }} 
                width={60}
                label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                type="monotone"
                dataKey={chart.y || 'value'}
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ r: 5, fill: COLORS[0] }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          );
        }

      case 'area':
        return (
          <AreaChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey={chart.y || 'value'}
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.6}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case 'scatter':
      case 'bubble':
        return (
          <ScatterChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="x"
              type="number"
              tick={{ fontSize: 11 }}
              name={chart.x}
              domain={['dataMin', 'dataMax']}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey="y"
              type="number"
              tick={{ fontSize: 12 }}
              width={60}
              name={chart.y}
              domain={['dataMin', 'dataMax']}
              label={{ value: chart.y, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
                      <p className="text-sm font-semibold text-workpack-text dark:text-white">
                        {chart.x}: {data.originalX || data.x}
                      </p>
                      <p className="text-sm text-workpack-text dark:text-white">
                        {chart.y}: {data.originalY || data.y}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Scatter
              dataKey="y"
              fill={COLORS[0]}
            />
          </ScatterChart>
        );

      case 'histogram':
        // For histograms, determine the correct x-axis column based on which column was binned
        let histogramXKey = chart.x;
        
        // If y column has bin transform, use y column as x-axis
        if (chart.transform_y && chart.transform_y.startsWith('bin:')) {
          histogramXKey = chart.y;
        }
        
        return (
          <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={histogramXKey} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: histogramXKey, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey="count"
              fill={COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      case 'waterfall':
        return (
          <ComposedChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: 'Cumulative Value', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={0} stroke="#666" strokeDasharray="2 2" />
            <Bar
              dataKey="cumulative"
              fill={COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </ComposedChart>
        );

      case 'funnel':
        return (
          <BarChart data={chart.data} layout="horizontal" margin={{ top: 20, right: 30, left: 120, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              type="number" 
              tick={{ fontSize: 12 }}
              label={{ value: chart.y || 'Value', position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              dataKey={chart.x} 
              type="category" 
              tick={{ fontSize: 11 }}
              width={120}
              label={{ value: chart.x, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={chart.y || 'value'}
              fill={COLORS[0]}
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        );

      case 'box':
      case 'violin':
      case 'heatmap':
      case 'treemap':
      case 'sunburst':
      case 'radar':
        // For advanced chart types not directly supported by recharts,
        // fall back to bar chart representation
        return (
          <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={chart.y || 'value'}
              fill={COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );

      default:
        // Default fallback to bar chart
        return (
          <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: chart.y || 'Value', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar
              dataKey={chart.y || 'value'}
              fill={COLORS[0]}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        );
    }
  };

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}