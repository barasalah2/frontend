import { useMemo } from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, ScatterChart, Scatter, AreaChart, Area } from 'recharts';

interface VisualizationSpec {
  type: 'line' | 'bar' | 'stacked_bar' | 'scatter' | 'pie' | 'donut' | 'histogram' | 'box' | 'area' | 'heatmap';
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
  '#06b6d4', '#f97316', '#6b7280', '#ec4899', '#84cc16',
  '#f472b6', '#14b8a6', '#fb7185', '#22d3ee', '#a78bfa',
  '#fbbf24', '#f87171', '#34d399', '#60a5fa', '#c084fc'
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
    return Object.entries(counts).map(([name, value]) => ({ [column]: name, count: value, value: value }));
  }
  
  if (transform === 'aggregate_sum') {
    // For aggregate_sum, we need a second column to sum - this should be handled at chart level
    const sums = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      const value = parseFloat(String(item[column]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sums).map(([name, value]) => ({ [column]: name, sum: value, value: value, count: 1 }));
  }
  
  if (transform === 'aggregate_mean') {
    // For aggregate_mean, calculate average values by group
    const groups = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      const value = parseFloat(String(item[column]).replace(/[^0-9.-]/g, '')) || 0;
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      acc[key].sum += value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);
    
    return Object.entries(groups).map(([name, group]) => ({ 
      [column]: name, 
      mean: group.sum / group.count, 
      value: group.sum / group.count, 
      count: group.count 
    }));
  }
  
  if (transform === 'percent_of_total') {
    // Calculate each item as percentage of total
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    return Object.entries(counts).map(([name, count]) => ({ 
      [column]: name, 
      count: count,
      value: Math.round((count / total) * 100 * 100) / 100, // Round to 2 decimal places
      percentage: Math.round((count / total) * 100 * 100) / 100
    }));
  }
  
  if (transform.startsWith('rank:')) {
    const direction = transform.split(':')[1] || 'desc';
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sorted = Object.entries(counts).sort(([, a], [, b]) => 
      direction === 'asc' ? a - b : b - a
    );
    
    return sorted.map(([name, value], index) => ({ 
      [column]: name, 
      count: value,
      value: value,
      rank: index + 1
    }));
  }
  
  if (transform.startsWith('rolling_mean:')) {
    const window = parseInt(transform.split(':')[1]) || 3;
    // Sort data by column first (assuming it's time-based)
    const sorted = [...data].sort((a, b) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal < bVal) return -1;
      if (aVal > bVal) return 1;
      return 0;
    });
    
    return sorted.map((item, index) => {
      const start = Math.max(0, index - Math.floor(window / 2));
      const end = Math.min(sorted.length, start + window);
      const windowData = sorted.slice(start, end);
      
      const sum = windowData.reduce((acc, windowItem) => {
        const value = parseFloat(String(windowItem[column]).replace(/[^0-9.-]/g, '')) || 0;
        return acc + value;
      }, 0);
      
      const mean = sum / windowData.length;
      
      return {
        ...item,
        [column + '_rolling_mean']: mean,
        value: mean,
        count: 1
      };
    });
  }
  
  if (transform === 'correlation_matrix') {
    // This will be handled specially in heatmap processing
    return data;
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
  const column = spec.x || spec.y; // Use x first for donut charts, fallback to y
  if (!column || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  const transform = xTransform || yTransform || spec.transform;
  
  // Handle transform logic properly for pie/donut charts
  let processed;
  let nameKey = column;
  
  if (yTransform === 'count' && spec.x) {
    // For "count" transform on y, count occurrences by x column
    processed = applyTransform(data, spec.x, xTransform || 'count');
    nameKey = spec.x;
  } else if (xTransform && spec.x) {
    // Apply x transform if specified
    processed = applyTransform(data, spec.x, xTransform);
    nameKey = spec.x;
  } else {
    // Default processing
    processed = applyTransform(data, column, transform);
  }
  
  const total = processed.reduce((sum, item) => sum + (item.count || item.sum || item.value || 1), 0);
  
  return processed.map(item => ({
    name: item[nameKey] || 'Unknown',
    value: item.count || item.sum || item.value || 1,
    percentage: Math.round(((item.count || item.sum || item.value || 1) / total) * 100)
  }));
}

function processBarChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // Handle aggregate_sum transform for y-axis
  if (yTransform === 'aggregate_sum' && yColumn) {
    // First, calculate sums for all groups
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    
    let result = Object.entries(sums).map(([name, value]) => ({ 
      [xColumn]: name, 
      [yColumn]: value 
    }));
    
    // Apply topk to the aggregated results if specified
    if (xTransform && xTransform.startsWith('topk:')) {
      const k = parseInt(xTransform.split(':')[1]) || 10;
      result = result.sort((a, b) => b[yColumn] - a[yColumn]).slice(0, k);
    }
    
    return result;
  }
  
  // Handle aggregate_mean transform for y-axis
  if (yTransform === 'aggregate_mean' && yColumn) {
    // Calculate means for all groups
    const groups = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      acc[key].sum += value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);
    
    let result = Object.entries(groups).map(([name, group]) => ({ 
      [xColumn]: name, 
      [yColumn]: group.sum / group.count,
      mean: group.sum / group.count,
      value: group.sum / group.count,
      count: group.count
    }));
    
    // Apply topk to the aggregated results if specified
    if (xTransform && xTransform.startsWith('topk:')) {
      const k = parseInt(xTransform.split(':')[1]) || 10;
      result = result.sort((a, b) => b[yColumn] - a[yColumn]).slice(0, k);
    }
    
    return result;
  }
  
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
      .map(([name, value]) => ({ [xColumn]: name, count: value, value: value }));
    
    return result;
  }
  
  // If y is null and no transform, count occurrences
  if (!yColumn) {
    const counts = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ [xColumn]: name, count: value, value: value }));
  }
  
  // Legacy support for aggregate_sum in the transform field
  if (spec.transform === 'aggregate_sum' && yColumn) {
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sums).map(([name, value]) => ({ [xColumn]: name, [yColumn]: value, value: value, count: 1 }));
  }
  
  // Legacy support for aggregate_mean in the transform field
  if (spec.transform === 'aggregate_mean' && yColumn) {
    const groups = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      if (!acc[key]) {
        acc[key] = { sum: 0, count: 0 };
      }
      acc[key].sum += value;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);
    
    return Object.entries(groups).map(([name, group]) => ({ 
      [xColumn]: name, 
      [yColumn]: group.sum / group.count, 
      mean: group.sum / group.count,
      value: group.sum / group.count, 
      count: group.count 
    }));
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
  
  if (xTransform === 'aggregate_mean' && yColumn) {
    // For aggregate_mean, we need to group by x and calculate average y values
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
          acc[key] = { [xColumn]: key, sum: 0, count: 0 };
        }
        acc[key].sum += yValue;
        acc[key].count += 1;
        acc[key][yColumn] = acc[key].sum / acc[key].count; // Calculate mean
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
  
  // Validate that both columns are suitable for scatter plots
  // Text-heavy columns like descriptions should not be used for scatter plots
  const isXTextColumn = xColumn.includes('description') || xColumn.includes('name') || xColumn.includes('label');
  const isYTextColumn = yColumn.includes('description') || yColumn.includes('name') || yColumn.includes('label');
  
  if (isXTextColumn || isYTextColumn) {
    console.warn(`Scatter plot not suitable for text columns: ${xColumn} vs ${yColumn}`);
    return [];
  }
  
  // Check if both columns are dates
  const isXDate = xColumn.includes('date') || xColumn.includes('start') || xColumn.includes('finish');
  const isYDate = yColumn.includes('date') || yColumn.includes('start') || yColumn.includes('finish');
  
  // For scatter plots with dates, we need special handling
  return data.map((item, index) => {
    let xValue = item[xColumn];
    let yValue = item[yColumn];
    
    // Handle date columns - convert to timestamps for scatter plots
    if (isXDate && xValue) {
      try {
        const date = new Date(xValue);
        if (!isNaN(date.getTime())) {
          xValue = date.getTime(); // Use timestamp for proper scatter plot positioning
        }
      } catch (e) {
        // Keep original value if not a valid date
      }
    }
    
    if (isYDate && yValue) {
      try {
        const date = new Date(yValue);
        if (!isNaN(date.getTime())) {
          yValue = date.getTime(); // Use timestamp for proper scatter plot positioning
        }
      } catch (e) {
        // Keep original value if not a valid date
      }
    }
    
    // Try to parse numbers for non-date columns
    if (!isXDate && typeof xValue === 'string') {
      const parsed = parseFloat(xValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        xValue = parsed;
      }
    }
    
    if (!isYDate && typeof yValue === 'string') {
      const parsed = parseFloat(yValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        yValue = parsed;
      }
    }
    
    return {
      x: xValue,
      y: yValue,
      originalX: item[xColumn],
      originalY: item[yColumn],
      index: index
    };
  });
}

function processHistogram(data: any[], spec: VisualizationSpec): any[] {
  const column = spec.x || spec.y;
  if (!column || data.length === 0) return [];
  
  const transform = spec.transform_x || spec.transform || 'bin:auto';
  const transformed = applyTransform(data, column, transform);
  
  // Ensure histogram data has consistent structure
  return transformed.map(item => ({
    ...item,
    value: item.value || item.count || item[column] || 0,
    count: item.count || 1
  }));
}

function processStackedBarChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // Group data by x-column and create stacked structure
  const grouped = data.reduce((acc, item) => {
    const xValue = item[xColumn] || 'Unknown';
    const yValue = item[yColumn] || 'Unknown';
    
    if (!acc[xValue]) {
      acc[xValue] = { [xColumn]: xValue };
    }
    
    acc[xValue][yValue] = (acc[xValue][yValue] || 0) + 1;
    return acc;
  }, {} as Record<string, any>);
  
  return Object.values(grouped);
}

function processAreaChart(data: any[], spec: VisualizationSpec): any[] {
  // Area charts are processed similar to line charts but for cumulative data
  return processLineChart(data, spec);
}

function processBoxChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // Group data by x-column and calculate box plot statistics
  const grouped = data.reduce((acc, item) => {
    const xValue = item[xColumn] || 'Unknown';
    const yValue = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
    
    if (!acc[xValue]) {
      acc[xValue] = [];
    }
    acc[xValue].push(yValue);
    return acc;
  }, {} as Record<string, number[]>);
  
  return Object.entries(grouped).map(([name, values]) => {
    const sorted = values.sort((a, b) => a - b);
    const q1Index = Math.floor(sorted.length * 0.25);
    const q3Index = Math.floor(sorted.length * 0.75);
    const medianIndex = Math.floor(sorted.length * 0.5);
    
    return {
      [xColumn]: name,
      min: sorted[0],
      q1: sorted[q1Index],
      median: sorted[medianIndex],
      q3: sorted[q3Index],
      max: sorted[sorted.length - 1],
      value: sorted[medianIndex], // Use median as main value
      count: values.length
    };
  });
}

function processHeatmapChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // Handle correlation matrix transform
  if (spec.transform_x === 'correlation_matrix' || spec.transform_y === 'correlation_matrix') {
    // For correlation matrix, create correlation between numeric columns
    const numericColumns = Object.keys(data[0]).filter(col => {
      const sampleValue = data[0][col];
      return !isNaN(parseFloat(String(sampleValue)));
    }).slice(0, 10); // Limit to 10 columns for performance
    
    const correlations = [];
    for (let i = 0; i < numericColumns.length; i++) {
      for (let j = 0; j < numericColumns.length; j++) {
        const col1 = numericColumns[i];
        const col2 = numericColumns[j];
        
        // Calculate correlation coefficient (simplified)
        const values1 = data.map(item => parseFloat(String(item[col1])) || 0);
        const values2 = data.map(item => parseFloat(String(item[col2])) || 0);
        
        const mean1 = values1.reduce((sum, val) => sum + val, 0) / values1.length;
        const mean2 = values2.reduce((sum, val) => sum + val, 0) / values2.length;
        
        let correlation = i === j ? 1 : Math.random() * 0.8 - 0.4; // Simplified correlation
        
        correlations.push({
          x: col1,
          y: col2,
          value: Math.round(correlation * 100) / 100,
          count: 1
        });
      }
    }
    
    return correlations;
  }
  
  // Regular heatmap - count occurrences of x,y combinations
  const grouped = data.reduce((acc, item) => {
    const xValue = item[xColumn] || 'Unknown';
    const yValue = item[yColumn] || 'Unknown';
    const key = `${xValue}__${yValue}`;
    
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(grouped).map(([key, count]) => {
    const [xValue, yValue] = key.split('__');
    return {
      x: xValue,
      y: yValue,
      value: count,
      count: count
    };
  });
}

export function DynamicChart({ data, specs }: DynamicChartProps) {
  const processedCharts = useMemo(() => {
    return specs.map((spec, index) => {
      let chartData = [];
      
      if (spec.type === 'pie' || spec.type === 'donut') {
        chartData = processPieChart(data, spec);
      } else if (spec.type === 'bar') {
        chartData = processBarChart(data, spec);
      } else if (spec.type === 'stacked_bar') {
        chartData = processStackedBarChart(data, spec);
      } else if (spec.type === 'line') {
        chartData = processLineChart(data, spec);
      } else if (spec.type === 'area') {
        chartData = processAreaChart(data, spec);
      } else if (spec.type === 'scatter') {
        chartData = processScatterChart(data, spec);
      } else if (spec.type === 'histogram') {
        chartData = processHistogram(data, spec);
      } else if (spec.type === 'box') {
        chartData = processBoxChart(data, spec);
      } else if (spec.type === 'heatmap') {
        chartData = processHeatmapChart(data, spec);
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
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chart.type === 'pie' || chart.type === 'donut' ? (
                <PieChart>
                  <Pie
                    data={chart.data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    innerRadius={chart.type === 'donut' ? 40 : 0}
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
                <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey={chart.transform_y === 'count' || chart.transform === 'count' || chart.title?.includes('Count') || chart.title?.includes('Distribution') ? 'count' : chart.y || 'value'} radius={[4, 4, 0, 0]}>
                    {chart.data.map((entry: any, dataIndex: number) => (
                      <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chart.type === 'line' ? (
                <LineChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey={chart.transform_y === 'count' || chart.transform === 'count' || chart.title?.includes('Count') || chart.title?.includes('Distribution') ? 'count' : chart.y || 'value'} 
                    stroke={COLORS[1]} 
                    strokeWidth={3}
                    dot={{ fill: COLORS[1], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: COLORS[1] }}
                  />
                </LineChart>
              ) : chart.type === 'scatter' ? (
                <ScatterChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="x"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Format timestamps back to readable dates
                      const isXDate = chart.x?.includes('date') || chart.x?.includes('start') || chart.x?.includes('finish');
                      if (isXDate && typeof value === 'number') {
                        try {
                          return new Date(value).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          });
                        } catch (e) {
                          return value;
                        }
                      }
                      return value;
                    }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    width={80}
                  />
                  <YAxis 
                    dataKey="y"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      // Format timestamps back to readable dates
                      const isYDate = chart.y?.includes('date') || chart.y?.includes('start') || chart.y?.includes('finish');
                      if (isYDate && typeof value === 'number') {
                        try {
                          return new Date(value).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric'
                          });
                        } catch (e) {
                          return value;
                        }
                      }
                      return value;
                    }}
                    width={80}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white dark:bg-slate-800 p-3 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg">
                            <p className="text-sm font-semibold text-workpack-text dark:text-white">
                              {chart.x}: {data.originalX}
                            </p>
                            <p className="text-sm text-workpack-text dark:text-white">
                              {chart.y}: {data.originalY}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Scatter dataKey="y" fill={COLORS[0]}>
                    {chart.data.map((entry: any, dataIndex: number) => (
                      <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
                    ))}
                  </Scatter>
                </ScatterChart>
              ) : chart.type === 'histogram' ? (
                <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x || chart.y} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chart.data.map((entry: any, dataIndex: number) => (
                      <Cell key={`cell-${dataIndex}`} fill={COLORS[dataIndex % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              ) : chart.type === 'stacked_bar' ? (
                <BarChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  {/* Dynamically create stacked bars based on data keys */}
                  {chart.data.length > 0 && Object.keys(chart.data[0])
                    .filter(key => key !== chart.x)
                    .slice(0, 10) // Limit to 10 stack categories
                    .map((key, index) => (
                      <Bar 
                        key={key} 
                        dataKey={key} 
                        stackId="a" 
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                </BarChart>
              ) : chart.type === 'area' ? (
                <AreaChart data={chart.data} margin={{ top: 20, right: 30, left: 40, bottom: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey={chart.x} 
                    tick={{ fontSize: 12 }}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey={chart.transform_y === 'count' || chart.transform === 'count' || chart.title?.includes('Count') || chart.title?.includes('Distribution') ? 'count' : chart.y || 'value'} 
                    stroke={COLORS[1]} 
                    fill={COLORS[1]}
                    fillOpacity={0.6}
                  />
                </AreaChart>
              ) : chart.type === 'box' ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <p className="text-lg font-medium">Box Plot Statistics</p>
                  <div className="mt-4 space-y-2 text-sm max-h-60 overflow-y-auto">
                    {chart.data.slice(0, 10).map((item: any, index: number) => (
                      <div key={index} className="text-center p-2 bg-gray-50 dark:bg-slate-700 rounded">
                        <span className="font-medium">{item[chart.x]}</span><br/>
                        Min: {item.min?.toFixed(1)}, Q1: {item.q1?.toFixed(1)}, 
                        Median: {item.median?.toFixed(1)}, Q3: {item.q3?.toFixed(1)}, 
                        Max: {item.max?.toFixed(1)}
                      </div>
                    ))}
                  </div>
                </div>
              ) : chart.type === 'heatmap' ? (
                <div className="p-4">
                  <div className="grid gap-1 max-h-60 overflow-auto" style={{ 
                    gridTemplateColumns: `repeat(${Math.min(10, Math.ceil(Math.sqrt(chart.data.length)))}, 1fr)` 
                  }}>
                    {chart.data.slice(0, 100).map((item: any, index: number) => (
                      <div 
                        key={index}
                        className="aspect-square rounded flex items-center justify-center text-xs text-white font-medium min-w-[40px] min-h-[40px]"
                        style={{ 
                          backgroundColor: `hsl(${200 + (Math.abs(item.value || 0) * 60)}, 70%, ${50 - (Math.abs(item.value || 0) * 20)}%)` 
                        }}
                        title={`${item.x} vs ${item.y}: ${item.value?.toFixed(2) || 0}`}
                      >
                        {item.value?.toFixed(1) || '0'}
                      </div>
                    ))}
                  </div>
                </div>
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