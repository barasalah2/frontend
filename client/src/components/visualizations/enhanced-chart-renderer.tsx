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
import TreemapChart from './treemap-chart';

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
          <div style={{ width: '100%', height: '500px' }}>
            <PieChart width={800} height={500}>
              <Pie
                data={chart.data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={150}
                innerRadius={chart.type === 'donut' ? 75 : 0}
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
          </div>
        );

      case 'bar':
        // Select the appropriate dataKey for chart rendering
        const dataKey = chart.transform_y === 'sum' && chart.y ? chart.y :
                        chart.transform_y === 'count' || chart.title?.includes('Count') ? 'count' :
                        chart.y || 'value';

        return (
          <div style={{ width: '100%', height: '450px' }}>
            <BarChart 
              width={800}
              height={450}
              data={chart.data} 
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey={chart.x} 
              type="category"
              tick={{ fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={100}
              interval={0}
              label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
            />
            <YAxis 
              type="number"
              tick={{ fontSize: 12 }} 
              width={60}
              label={{ value: dataKey, angle: -90, position: 'insideLeft' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey={dataKey}
              radius={[4, 4, 0, 0]}
            >
              {chart.data.map((entry: any, dataIndex: number) => (
                <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
              ))}
            </Bar>
            </BarChart>
          </div>
        );

      case 'horizontal_bar':
        // Enhanced horizontal bar chart with proper data key detection
        const hBarDataKey = chart.data[0]?.count !== undefined ? 'count' : 'value';
        
        // Ensure data has the required structure and is sorted for better visualization
        const horizontalData = chart.data
          .filter(item => item && typeof item === 'object') // Filter out invalid items
          .map((item, index) => {
            const categoryValue = item[chart.x || 'category'] || item.name || `Item ${index + 1}`;
            const numericValue = Number(item[hBarDataKey] || item.value || item.count || 0);
            
            return {
              ...item,
              [hBarDataKey]: numericValue,
              [chart.x || 'category']: String(categoryValue),
              // Ensure we have clean numeric values
              value: numericValue,
              count: numericValue
            };
          })
          .filter(item => !isNaN(item[hBarDataKey]) && item[hBarDataKey] > 0) // Filter out invalid values
          .sort((a, b) => (b[hBarDataKey] || 0) - (a[hBarDataKey] || 0)); // Sort by value descending
        
        console.log('Horizontal bar chart enhanced:', {
          dataKey: hBarDataKey,
          data: horizontalData.slice(0, 3),
          totalItems: horizontalData.length,
          chartSpec: {
            x: chart.x,
            y: chart.y,
            series: chart.series,
            transform_x: chart.transform_x,
            transform_y: chart.transform_y
          }
        });
        
        // If no data, show empty state
        if (!horizontalData.length) {
          return (
            <div className="flex items-center justify-center h-[400px] text-gray-500">
              No data available for horizontal bar chart
            </div>
          );
        }

        return (
          <div style={{ width: '100%', height: '500px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={horizontalData} 
                layout="vertical"
                margin={{ top: 20, right: 50, left: 120, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  type="number" 
                  tick={{ fontSize: 12 }} 
                  domain={[0, 'dataMax']}
                  label={{ value: chart.y || 'Value', position: 'insideBottom', offset: -10 }}
                />
                <YAxis 
                  dataKey={chart.x} 
                  type="category"
                  tick={{ fontSize: 11 }}
                  width={120}
                  interval={0}
                  label={{ value: chart.x || 'Category', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border border-gray-300 rounded shadow">
                          <p className="font-semibold">{label}</p>
                          <p className="text-blue-600">
                            {chart.y || 'Value'}: {payload[0].value?.toLocaleString()}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey={hBarDataKey}
                  fill={COLORS[0]}
                  radius={[0, 4, 4, 0]}
                  name={chart.y || 'Count'}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'stacked_bar':
      case 'grouped_bar':
        const stackId = chart.type === 'stacked_bar' ? "stack" : undefined;
        
        // For stacked bar charts, find all numeric columns that have meaningful data
        const allNumericKeys = chart.data.length > 0 ? 
          Object.keys(chart.data[0]).filter(key => {
            const value = chart.data[0][key];
            return key !== chart.x && 
                   key !== 'name' && 
                   key !== 'count' && 
                   key !== 'value' &&
                   typeof value === 'number' &&
                   !isNaN(value);
          }) : [];
        
        // Filter to only include series that have non-zero values in at least one data point
        const seriesKeys = allNumericKeys.filter(key => 
          chart.data.some(item => item[key] > 0)
        );
        
        console.log('Stacked bar processed data:', chart.data.slice(0, 2));
        console.log('Series values found:', seriesKeys);
        
        return (
          <div style={{ width: '100%', height: '500px' }}>
            <BarChart 
              data={chart.data} 
              width={800} 
              height={500}
              margin={{ top: 20, right: 30, left: 40, bottom: 100 }}
            >
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
                domain={[0, 'dataMax']}
                label={{ value: chart.y || 'Count', angle: -90, position: 'insideLeft' }}
              />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {seriesKeys.length > 0 ? (
              seriesKeys.map((key, index) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId={stackId}
                  fill={COLORS[index % COLORS.length]}
                  radius={chart.type === 'stacked_bar' && index === seriesKeys.length - 1 ? [4, 4, 0, 0] : undefined}
                />
              ))
            ) : (
              // Fallback: if no series detected, show count/value
              <Bar
                dataKey="count"
                fill={COLORS[0]}
                radius={[4, 4, 0, 0]}
              />
            )}
            </BarChart>
          </div>
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
            <div style={{ width: '100%', height: '450px' }}>
              <LineChart data={restructuredData} width={800} height={450} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
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
            </div>
          );
        } else {
          // Single line chart
          return (
            <div style={{ width: '100%', height: '450px' }}>
              <LineChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
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
            </div>
          );
        }

      case 'area':
        return (
          <div style={{ width: '100%', height: '450px' }}>
            <AreaChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
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
          </div>
        );

      case 'bubble':
        // Special handling for bubble charts with size-based bubbles
        if (chart.series && chart.data.some(item => item.scaledSize)) {
          return (
            <div style={{ width: '100%', height: '450px' }}>
              <ScatterChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 130, left: 40, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey={chart.x}
                  type="number"
                  tick={{ fontSize: 11 }}
                  name={chart.x}
                  label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey={chart.y}
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
                          <p className="font-semibold">{data.name}</p>
                          <p className="text-sm">{chart.x}: {data.x}</p>
                          <p className="text-sm">{chart.y}: {data.y}</p>
                          <p className="text-sm">{chart.series}: {data.size}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Size: {data.sizePercent}% of total</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {chart.data.map((entry: any, index: number) => (
                  <Scatter
                    key={`bubble-${index}`}
                    name={entry.name}
                    data={[entry]}
                    fill={COLORS[index % COLORS.length]}
                    shape={(props: any) => {
                      const { cx, cy, payload } = props;
                      const radius = payload.bubbleRadius || Math.sqrt(payload.scaledSize || 50) / 2;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={radius}
                          fill={COLORS[index % COLORS.length]}
                          fillOpacity={0.6}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                        />
                      );
                    }}
                  />
                ))}
              </ScatterChart>
            </div>
          );
        }
        // Fall through to regular scatter chart if no special bubble data
        
      case 'scatter':
        // Check if x-axis contains dates or categorical data (like quarters)
        const hasDateData = chart.data.some(item => {
          const xValue = item.x || item[chart.x];
          return xValue && typeof xValue === 'string' && (
            !isNaN(new Date(xValue).getTime()) || 
            String(xValue).includes('Q') || // Quarter format like "2025-Q1"
            String(xValue).includes('-') // Date-like format
          );
        });

        // Check if data has categorical x values (transformed dates)
        const hasCategoricalX = chart.data.some(item => {
          const xValue = item.x || item[chart.x];
          return xValue && typeof xValue === 'string' && isNaN(Number(xValue));
        });

        // Handle series data for multi-colored scatter plots
        if (chart.series) {
          const seriesValues = [...new Set(chart.data.map(item => item[chart.series]).filter(Boolean))];
          
          // Get unique x-values in the order they appear in the data (already sorted)
          const xValues = [...new Set(chart.data.map(item => item[chart.x]))];
          
          return (
            <div style={{ width: '100%', height: '450px' }}>
              <ScatterChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 130, left: 40, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey={chart.x}
                  type="category"
                  tick={{ fontSize: 11, angle: -45, textAnchor: "end" }}
                  name={chart.x}
                  label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
                  height={100}
                  interval={0}
                  domain={xValues}
                />
                <YAxis 
                  dataKey={chart.y}
                  type="number"
                  tick={{ fontSize: 12 }}
                  width={60}
                  name={chart.y}
                  domain={['dataMin', 'dataMax']}
                  label={{ value: chart.y, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                {seriesValues.map((seriesValue, index) => (
                  <Scatter
                    key={seriesValue}
                    name={String(seriesValue)}
                    data={chart.data.filter(item => item[chart.series] === seriesValue)}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </ScatterChart>
            </div>
          );
        } else {
          // Single series scatter plot
          return (
            <div style={{ width: '100%', height: '450px' }}>
              <ScatterChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey={chart.x}
                  type={hasDateData ? "category" : "number"}
                  tick={{ fontSize: 11, angle: hasDateData ? -45 : 0, textAnchor: hasDateData ? "end" : "middle" }}
                  name={chart.x}
                  domain={hasDateData ? undefined : ['dataMin', 'dataMax']}
                  label={{ value: chart.x, position: 'insideBottom', offset: -5 }}
                  height={hasDateData ? 100 : undefined}
                  interval={hasDateData ? 0 : undefined}
                />
                <YAxis 
                  dataKey={chart.y}
                  type="number"
                  tick={{ fontSize: 12 }}
                  width={60}
                  name={chart.y}
                  domain={['dataMin', 'dataMax']}
                  label={{ value: chart.y, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Scatter
                  dataKey={chart.y}
                  fill={COLORS[0]}
                />
              </ScatterChart>
            </div>
          );
        }

      case 'histogram':
        // For histograms, determine the correct x-axis column based on which column was binned
        let histogramXKey = chart.x;
        
        // If y column has bin transform, use y column as x-axis
        if (chart.transform_y && chart.transform_y.startsWith('bin:')) {
          histogramXKey = chart.y;
        }
        
        return (
          <div style={{ width: '100%', height: '450px' }}>
            <BarChart data={chart.data} width={800} height={450} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
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
          </div>
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

      case 'treemap':
        return <TreemapChart chart={chart} />;

      case 'box':
      case 'violin':
      case 'heatmap':
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
    <div className="h-[500px] w-full relative">
      <ResponsiveContainer width="100%" height="100%">
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}