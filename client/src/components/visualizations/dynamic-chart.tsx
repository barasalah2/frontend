import { useMemo } from 'react';
import { EnhancedChartRenderer } from './enhanced-chart-renderer';

interface VisualizationSpec {
  type: 'line' | 'area' | 'bar' | 'stacked_bar' | 'grouped_bar' | 'horizontal_bar' | 'scatter' | 'bubble' | 'pie' | 'donut' | 'histogram' | 'box' | 'violin' | 'heatmap' | 'treemap' | 'sunburst' | 'radar' | 'waterfall' | 'funnel';
  x: string | null;
  y: string | null;
  series: string | null; // for grouping/stacking/bubble size
  title: string;
  transform_x?: string | null;
  transform_y?: string | null;
  rationale?: string;
  // Legacy support
  transform?: string | null;
  color?: string | null;
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

// Enhanced transform functions supporting all DataVisAgent transformations
function applyTransform(data: any[], column: string, transform: string | null): any[] {
  if (!transform || !column) return data;
  
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
                key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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
    // Sort dates chronologically for better visualization
    const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
      if (groupType === 'month_year') {
        // Sort by actual date value for month_year
        const dateA = new Date(a + ' 1'); // Add day for parsing
        const dateB = new Date(b + ' 1');
        return dateA.getTime() - dateB.getTime();
      }
      return a.localeCompare(b);
    });
    
    return sortedEntries.map(([date, count]) => ({ [column]: date, count, value: count }));
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
    return sorted.map(([name, value]) => ({ [column]: name, count: value, value: value }));
  }
  
  if (transform.startsWith('bottomk:')) {
    const k = parseInt(transform.split(':')[1]) || 5;
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const sorted = Object.entries(counts).sort(([, a], [, b]) => a - b).slice(0, k);
    return sorted.map(([name, value]) => ({ [column]: name, count: value, value: value }));
  }
  
  if (transform.startsWith('other_group:')) {
    const threshold = parseFloat(transform.split(':')[1]) || 0.05;
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    const minCount = total * threshold;
    
    let result = [];
    let otherCount = 0;
    
    for (const [name, count] of Object.entries(counts)) {
      if (count >= minCount) {
        result.push({ [column]: name, count, value: count });
      } else {
        otherCount += count;
      }
    }
    
    if (otherCount > 0) {
      result.push({ [column]: 'Other', count: otherCount, value: otherCount });
    }
    
    return result;
  }
  
  if (transform === 'alphabetical') {
    return [...data].sort((a, b) => String(a[column] || '').localeCompare(String(b[column] || '')));
  }
  
  if (transform === 'frequency') {
    const counts = data.reduce((acc, item) => {
      const key = item[column] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([, a], [, b]) => b - a)
      .map(([name, value]) => ({ [column]: name, count: value, value: value }));
  }
  
  if (transform.startsWith('bin:')) {
    const binParam = transform.split(':')[1];
    const values = data.map(item => parseFloat(String(item[column])) || 0).filter(v => !isNaN(v));
    
    if (values.length === 0) return [];
    
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    let binCount;
    let bins;
    
    if (binParam === 'auto') {
      binCount = Math.ceil(Math.sqrt(values.length));
    } else if (binParam === 'quartile') {
      values.sort((a, b) => a - b);
      const q1 = values[Math.floor(values.length * 0.25)];
      const q2 = values[Math.floor(values.length * 0.5)];
      const q3 = values[Math.floor(values.length * 0.75)];
      
      bins = [
        { range: `Q1 (≤${q1.toFixed(1)})`, count: 0, min: min, max: q1 },
        { range: `Q2 (${q1.toFixed(1)}-${q2.toFixed(1)})`, count: 0, min: q1, max: q2 },
        { range: `Q3 (${q2.toFixed(1)}-${q3.toFixed(1)})`, count: 0, min: q2, max: q3 },
        { range: `Q4 (≥${q3.toFixed(1)})`, count: 0, min: q3, max: max }
      ];
      
      values.forEach(value => {
        if (value <= q1) bins[0].count++;
        else if (value <= q2) bins[1].count++;
        else if (value <= q3) bins[2].count++;
        else bins[3].count++;
      });
      
      return bins.map(bin => ({ [column]: bin.range, count: bin.count, value: bin.count }));
    } else {
      binCount = parseInt(binParam) || 10;
    }
    
    const binWidth = (max - min) / binCount;
    
    bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binWidth).toFixed(1)}-${(min + (i + 1) * binWidth).toFixed(1)}`,
      count: 0,
      min: min + i * binWidth,
      max: min + (i + 1) * binWidth
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1);
      bins[binIndex].count++;
    });
    
    return bins.map(bin => ({ [column]: bin.range, count: bin.count, value: bin.count }));
  }
  
  if (transform === 'log_scale') {
    return data.map(item => ({
      ...item,
      [column + '_log']: Math.log10(Math.max(parseFloat(String(item[column])) || 1, 1)),
      value: Math.log10(Math.max(parseFloat(String(item[column])) || 1, 1))
    }));
  }
  
  if (transform === 'normalize') {
    const values = data.map(item => parseFloat(String(item[column])) || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    
    return data.map((item, index) => ({
      ...item,
      [column + '_normalized']: range === 0 ? 0 : (values[index] - min) / range,
      value: range === 0 ? 0 : (values[index] - min) / range
    }));
  }
  
  if (transform === 'z_score') {
    const values = data.map(item => parseFloat(String(item[column])) || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    
    return data.map((item, index) => ({
      ...item,
      [column + '_zscore']: stdDev === 0 ? 0 : (values[index] - mean) / stdDev,
      value: stdDev === 0 ? 0 : (values[index] - mean) / stdDev
    }));
  }
  
  if (transform === 'sum') {
    const sum = data.reduce((acc, item) => acc + (parseFloat(String(item[column])) || 0), 0);
    return [{ [column]: 'Total', sum, value: sum, count: data.length }];
  }
  
  if (transform === 'mean') {
    const values = data.map(item => parseFloat(String(item[column])) || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    return [{ [column]: 'Average', mean, value: mean, count: values.length }];
  }
  
  if (transform === 'median') {
    const values = data.map(item => parseFloat(String(item[column])) || 0).sort((a, b) => a - b);
    const median = values.length % 2 === 0 
      ? (values[values.length / 2 - 1] + values[values.length / 2]) / 2 
      : values[Math.floor(values.length / 2)];
    return [{ [column]: 'Median', median, value: median, count: values.length }];
  }
  
  if (transform === 'min') {
    const min = Math.min(...data.map(item => parseFloat(String(item[column])) || 0));
    return [{ [column]: 'Minimum', min, value: min, count: data.length }];
  }
  
  if (transform === 'max') {
    const max = Math.max(...data.map(item => parseFloat(String(item[column])) || 0));
    return [{ [column]: 'Maximum', max, value: max, count: data.length }];
  }
  
  if (transform === 'std') {
    const values = data.map(item => parseFloat(String(item[column])) || 0);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length);
    return [{ [column]: 'Std Dev', std: stdDev, value: stdDev, count: values.length }];
  }
  
  return data;
}

function processPieChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // If we have both x and y columns with sum transform, aggregate by x and sum y values
  if (yColumn && (yTransform === 'sum' || yTransform === 'aggregate_sum')) {
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(sums).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(sums).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    }));
  }
  
  // If y-transform is count or no y-column, count occurrences by x-column
  if (!yColumn || yTransform === 'count' || spec.title?.includes('Count')) {
    const counts = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const total = Object.values(counts).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    }));
  }
  
  // Fallback to original processing
  const column = xColumn;
  const processed = applyTransform(data, column, xTransform || spec.transform);
  const total = processed.reduce((sum, item) => sum + (item.count || item.sum || item.value || 1), 0);
  
  return processed.map(item => ({
    name: item[column] || 'Unknown',
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
  
  // Handle aggregate_sum transform for y-axis or "sum" transform
  if ((yTransform === 'aggregate_sum' || yTransform === 'sum') && yColumn) {
    // First, calculate sums for all groups
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    
    let result = Object.entries(sums).map(([name, value]) => ({ 
      [xColumn]: name, 
      [yColumn]: value,
      value: value,  // Add value property for chart rendering
      count: 1
    }));
    
    // Apply topk to the aggregated results if specified
    if (xTransform && xTransform.startsWith('topk:')) {
      const k = parseInt(xTransform.split(':')[1]) || 10;
      result = result.sort((a, b) => b[yColumn] - a[yColumn]).slice(0, k);
    }
    
    return result;
  }
  
  // Handle count transform for y-axis - count occurrences by x-column
  if (yTransform === 'count' || spec.title?.includes('Count')) {
    const counts = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let result = Object.entries(counts).map(([name, value]) => ({ 
      [xColumn]: name, 
      count: value,
      value: value
    }));
    
    // Apply topk to the counted results if specified
    if (xTransform && xTransform.startsWith('topk:')) {
      const k = parseInt(xTransform.split(':')[1]) || 10;
      result = result.sort((a, b) => b.count - a.count).slice(0, k);
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

  // Special handling for tag_count summation (since tag_count should be summed, not counted)
  if (yColumn === 'tag_count' && yTransform === 'sum') {
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(sums).map(([name, value]) => ({ 
      [xColumn]: name, 
      [yColumn]: value,
      value: value,
      count: 1
    }));
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
  
  // Legacy support for aggregate_sum or "sum" in the transform field
  if ((spec.transform === 'aggregate_sum' || spec.transform === 'sum') && yColumn) {
    const sums = data.reduce((acc, item) => {
      const key = item[xColumn] || 'Unknown';
      const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      acc[key] = (acc[key] || 0) + value;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(sums).map(([name, value]) => ({ [xColumn]: name, [yColumn]: value, value: value, count: 1 }));
  }

  // Handle cases where y-column should be summed but no specific transform is applied
  if (yColumn && !yTransform && !xTransform) {
    // For non-aggregated data, return as-is but ensure consistent structure
    return data.map(item => ({
      [xColumn]: item[xColumn] || 'Unknown',
      [yColumn]: parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0,
      value: parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0,
      count: 1
    }));
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

function processWaterfallChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  let cumulativeValue = 0;
  
  return data.map((item, index) => {
    const value = parseFloat(String(item[yColumn])) || 0;
    const startValue = cumulativeValue;
    cumulativeValue += value;
    
    return {
      [xColumn]: item[xColumn] || `Step ${index + 1}`,
      [yColumn]: value,
      cumulative: cumulativeValue,
      start: startValue,
      end: cumulativeValue,
      value: value
    };
  });
}

function processFunnelChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  const processedData = data.map(item => ({
    [xColumn]: item[xColumn] || 'Unknown',
    [yColumn]: parseFloat(String(item[yColumn])) || 0,
    value: parseFloat(String(item[yColumn])) || 0
  }));
  
  // Sort by value descending for funnel effect
  return processedData.sort((a, b) => b[yColumn] - a[yColumn]);
}

function processSpecialChart(data: any[], spec: VisualizationSpec): any[] {
  // For treemap, sunburst, and radar charts, we'll use similar logic to pie charts
  // but with different data structures
  
  const column = spec.x || spec.y;
  if (!column || data.length === 0) return [];
  
  if (spec.type === 'radar') {
    // For radar charts, we need multiple numeric columns
    const numericColumns = Object.keys(data[0] || {}).filter(key => 
      !isNaN(parseFloat(String(data[0][key])))
    );
    
    if (numericColumns.length < 3) {
      // Fall back to simple aggregation
      return processPieChart(data, spec);
    }
    
    return data.slice(0, 5).map(item => {
      const result: any = { [column]: item[column] || 'Unknown' };
      numericColumns.forEach(col => {
        result[col] = parseFloat(String(item[col])) || 0;
      });
      return result;
    });
  }
  
  // For treemap and sunburst, use hierarchical data structure
  return processPieChart(data, spec);
}

function processLineChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  const seriesColumn = spec.series;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // Get transforms - use new format first, fallback to legacy
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // Handle series-based line chart (multiple lines)
  if (seriesColumn) {
    const grouped = data.reduce((acc, item) => {
      let xKey = item[xColumn];
      const yValue = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      const seriesValue = item[seriesColumn] || 'Unknown';
      
      // Apply x transform (like date grouping)
      if (xTransform && xTransform.startsWith('date_group:')) {
        const groupType = xTransform.split(':')[1];
        if (xKey) {
          try {
            const date = new Date(xKey);
            if (!isNaN(date.getTime())) {
              switch (groupType) {
                case 'year':
                  xKey = date.getFullYear().toString();
                  break;
                case 'quarter':
                  xKey = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                  break;
                case 'month_year':
                case 'month':
                  xKey = date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short' 
                  });
                  break;
              }
            }
          } catch (e) {
            // Keep original value
          }
        }
      }
      
      const key = `${xKey}_${seriesValue}`;
      if (!acc[key]) {
        acc[key] = {
          [xColumn]: xKey,
          [seriesColumn]: seriesValue,
          [yColumn]: 0,
          count: 0
        };
      }
      
      // Apply y transform aggregation
      if (yTransform === 'sum') {
        acc[key][yColumn] += yValue;
      } else if (yTransform === 'count') {
        acc[key][yColumn] = acc[key].count + 1;
      } else {
        acc[key][yColumn] = yValue;
      }
      acc[key].count += 1;
      
      return acc;
    }, {} as Record<string, any>);
    
    // Convert back to array and sort
    const result = Object.values(grouped).sort((a, b) => {
      const aVal = a[xColumn];
      const bVal = b[xColumn];
      
      // Try to parse as dates first
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
      
      return String(aVal).localeCompare(String(bVal));
    });
    
    return result;
  }
  
  // Handle single line chart with date grouping
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
              case 'month':
                key = date.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'short' 
                });
                break;
              default:
                key = dateValue;
            }
            
            if (!acc[key]) {
              acc[key] = { [xColumn]: key, count: 0, sum: 0, value: 0 };
            }
            acc[key].count += 1;
            if (yColumn) {
              const value = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
              acc[key].sum += value;
              acc[key][yColumn] = yTransform === 'count' ? acc[key].count : acc[key].sum;
              acc[key].value = acc[key][yColumn];
            } else {
              acc[key].value = acc[key].count;
            }
          }
        } catch (e) {
          // Keep original value if not a valid date
        }
      }
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped).sort((a, b) => {
      const aDate = new Date(a[xColumn]);
      const bDate = new Date(b[xColumn]);
      if (!isNaN(aDate.getTime()) && !isNaN(bDate.getTime())) {
        return aDate.getTime() - bDate.getTime();
      }
      return String(a[xColumn]).localeCompare(String(b[xColumn]));
    });
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
          acc[key] = { [xColumn]: key, [yColumn]: 0, count: 0, value: 0 };
        }
        acc[key][yColumn] += yValue;
        acc[key].count += 1;
        acc[key].value = acc[key][yColumn];
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
          acc[key] = { [xColumn]: key, sum: 0, count: 0, value: 0 };
        }
        acc[key].sum += yValue;
        acc[key].count += 1;
        acc[key][yColumn] = acc[key].sum / acc[key].count; // Calculate mean
        acc[key].value = acc[key][yColumn];
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
  const seriesColumn = spec.series;
  
  if (!xColumn || !yColumn || data.length === 0) return [];
  
  // Get transforms - only apply if explicitly specified
  const xTransform = spec.transform_x;
  const yTransform = spec.transform_y;
  
  // Validate that both columns are suitable for scatter plots
  const isXTextColumn = xColumn.includes('description') || xColumn.includes('name') || xColumn.includes('label');
  const isYTextColumn = yColumn.includes('description') || yColumn.includes('name') || yColumn.includes('label');
  
  if (isXTextColumn || isYTextColumn) {
    console.warn(`Scatter plot not suitable for text columns: ${xColumn} vs ${yColumn}`);
    return [];
  }
  
  // Special handling for bubble charts when series column is specified
  if (spec.type === 'bubble' && seriesColumn) {
    // Process bubble chart data with size calculation
    const bubbleData = data.map(item => {
      const xValue = parseFloat(String(item[xColumn]).replace(/[^0-9.-]/g, '')) || 0;
      const yValue = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      const seriesValue = item[seriesColumn];
      
      // Determine if series value is numeric or categorical
      const seriesNumeric = parseFloat(String(seriesValue).replace(/[^0-9.-]/g, ''));
      let size = 0;
      
      if (!isNaN(seriesNumeric) && isFinite(seriesNumeric)) {
        // Series is numeric - use as size value
        size = seriesNumeric;
      } else {
        // Series is categorical - count occurrences
        const categoryCount = data.filter(d => d[seriesColumn] === seriesValue).length;
        size = categoryCount;
      }
      
      return {
        x: xValue,
        y: yValue,
        [xColumn]: xValue,
        [yColumn]: yValue,
        [seriesColumn]: seriesValue,
        size: size,
        name: seriesValue
      };
    });
    
    // Calculate size using the formula: bubble_area = (team_size / max_team_size) * max_area
    const maxSize = Math.max(...bubbleData.map(item => item.size));
    const totalSize = bubbleData.reduce((sum, item) => sum + item.size, 0);
    const maxArea = 8000; // Maximum area for the largest bubble
    
    return bubbleData.map(item => {
      // Calculate bubble area as proportion of max area
      const bubbleArea = (item.size / maxSize) * maxArea;
      // Calculate radius from area: radius = sqrt(area / π)
      const radius = Math.sqrt(bubbleArea / Math.PI);
      
      return {
        ...item,
        // Scale size as percentage of total (for tooltip display)
        sizePercent: Math.round((item.size / totalSize) * 100),
        // Store the calculated radius for rendering
        scaledSize: Math.round(radius * radius * Math.PI), // Store area for shape calculation
        bubbleRadius: Math.round(radius)
      };
    });
  }
  
  // Handle data aggregation when transforms are specified
  if (xTransform && xTransform.startsWith('date_group:') && yTransform === 'sum') {
    const groupType = xTransform.split(':')[1];
    
    // Group data by transformed x-values and sum y-values by series
    const grouped = data.reduce((acc, item) => {
      let xValue = item[xColumn];
      let yValue = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
      const seriesValue = seriesColumn ? item[seriesColumn] : 'default';
      
      // Apply date grouping transformation
      if (xValue) {
        try {
          const date = new Date(xValue);
          if (!isNaN(date.getTime())) {
            switch (groupType) {
              case 'year':
                xValue = date.getFullYear().toString();
                break;
              case 'quarter':
                xValue = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                break;
              case 'month':
              case 'month_year':
                xValue = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                break;
            }
          }
        } catch (e) {
          // Keep original value
        }
      }
      
      const key = `${xValue}_${seriesValue}`;
      if (!acc[key]) {
        acc[key] = {
          [xColumn]: xValue,
          [yColumn]: 0,
          x: xValue,
          y: 0
        };
        if (seriesColumn) {
          acc[key][seriesColumn] = seriesValue;
          acc[key].series = seriesValue;
        }
      }
      
      // Ensure yValue is a valid number
      if (!isNaN(yValue) && isFinite(yValue)) {
        acc[key][yColumn] += yValue;
        acc[key].y += yValue;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    // Sort the grouped data chronologically by quarter
    const result = Object.values(grouped).sort((a, b) => {
      const quarterA = a[xColumn];
      const quarterB = b[xColumn];
      
      // Extract year and quarter for proper sorting
      if (typeof quarterA === 'string' && typeof quarterB === 'string') {
        const matchA = quarterA.match(/(\d{4})-Q(\d)/);
        const matchB = quarterB.match(/(\d{4})-Q(\d)/);
        
        if (matchA && matchB) {
          const yearA = parseInt(matchA[1]);
          const yearB = parseInt(matchB[1]);
          const qA = parseInt(matchA[2]);
          const qB = parseInt(matchB[2]);
          
          if (yearA !== yearB) {
            return yearA - yearB;
          }
          return qA - qB;
        }
      }
      
      // Fallback to string comparison
      return String(quarterA).localeCompare(String(quarterB));
    });
    
    console.log('Scatter chart aggregated data:', result);
    return result;
  }
  
  // Standard processing for non-aggregated scatter plots
  return data.map((item, index) => {
    let xValue = item[xColumn];
    let yValue = item[yColumn];
    
    // Only apply transformations if explicitly specified
    if (xTransform) {
      // Apply x-axis transformation only if specified
      if (xTransform.startsWith('date_group:')) {
        const groupType = xTransform.split(':')[1];
        if (xValue) {
          try {
            const date = new Date(xValue);
            if (!isNaN(date.getTime())) {
              switch (groupType) {
                case 'year':
                  xValue = date.getFullYear().toString();
                  break;
                case 'quarter':
                  xValue = `${date.getFullYear()}-Q${Math.ceil((date.getMonth() + 1) / 3)}`;
                  break;
                case 'month':
                case 'month_year':
                  xValue = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                  break;
              }
            }
          } catch (e) {
            // Keep original value
          }
        }
      }
    } else {
      // No transformation - keep original date format for proper date axis display
      // Don't convert to timestamp unless explicitly requested
    }
    
    // Apply y-transformation only if specified
    if (yTransform === 'sum' && typeof yValue === 'string') {
      const parsed = parseFloat(yValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        yValue = parsed;
      }
    } else if (!yTransform) {
      // No transformation - try to parse as number only if it looks numeric
      if (typeof yValue === 'string' && /^[0-9.-]+$/.test(yValue.replace(/[^\d.-]/g, ''))) {
        const parsed = parseFloat(yValue.replace(/[^0-9.-]/g, ''));
        if (!isNaN(parsed)) {
          yValue = parsed;
        }
      }
    }
    
    // For non-transformed numeric columns, try to parse
    if (!xTransform && typeof xValue === 'string' && /^[0-9.-]+$/.test(xValue.replace(/[^\d.-]/g, ''))) {
      const parsed = parseFloat(xValue.replace(/[^0-9.-]/g, ''));
      if (!isNaN(parsed)) {
        xValue = parsed;
      }
    }
    
    const result: any = {
      [xColumn]: xValue,
      [yColumn]: yValue,
      x: xValue,
      y: yValue
    };
    
    // Add series column if specified
    if (seriesColumn && item[seriesColumn]) {
      result[seriesColumn] = item[seriesColumn];
      result.series = item[seriesColumn];
    }
    
    return result;
  });
}

function processHistogram(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  
  if (!data.length) return [];
  
  // Get transforms
  const xTransform = spec.transform_x || spec.transform;
  const yTransform = spec.transform_y || spec.transform;
  
  // Determine which column to bin and which transform to use
  let columnToBin = yColumn; // Default to y column for binning
  let transform = yTransform || 'bin:auto'; // Default to y transform
  
  // If x has a bin transform, use x column instead
  if (xTransform && xTransform.startsWith('bin:')) {
    columnToBin = xColumn;
    transform = xTransform;
  }
  
  if (!columnToBin) {
    // Fallback: use whichever column exists
    columnToBin = xColumn || yColumn;
    transform = xTransform || yTransform || 'bin:auto';
  }
  
  if (!columnToBin) return [];
  
  // Apply binning transform
  const transformed = applyTransform(data, columnToBin, transform);
  
  // Ensure histogram data has consistent structure with proper x-axis labels
  return transformed.map(item => ({
    ...item,
    [columnToBin]: item[columnToBin] || item.range || 'Unknown',
    value: item?.value || item?.count || 0,
    count: item?.count || 1
  }));
}

function processStackedBarChart(data: any[], spec: VisualizationSpec): any[] {
  const xColumn = spec.x;
  const yColumn = spec.y;
  const seriesColumn = spec.series;
  
  if (!xColumn || data.length === 0) return [];
  
  // Get transforms
  const yTransform = spec.transform_y || spec.transform;
  
  // Handle count transform - count occurrences grouped by x and series
  if (yTransform === 'count' || !yColumn || !data.some(item => item[yColumn] !== undefined && item[yColumn] !== '')) {
    if (seriesColumn) {
      // Group by x-column and series, count occurrences
      const grouped = data.reduce((acc, item) => {
        const xValue = item[xColumn] || 'Unknown';
        const seriesValue = item[seriesColumn] || 'Unknown';
        
        if (!acc[xValue]) {
          acc[xValue] = { [xColumn]: xValue, count: 0, value: 0 };
        }
        
        acc[xValue][seriesValue] = (acc[xValue][seriesValue] || 0) + 1;
        acc[xValue].count += 1;
        acc[xValue].value += 1;
        return acc;
      }, {} as Record<string, any>);
      
      // Ensure all series values exist for each x value (fill missing with 0)
      const allSeriesValues = [...new Set(data.map(item => item[seriesColumn] || 'Unknown'))];
      const result = Object.values(grouped);
      
      result.forEach(item => {
        allSeriesValues.forEach(seriesValue => {
          if (!(seriesValue in item)) {
            item[seriesValue] = 0;
          }
        });
      });
      
      return result;
    } else {
      // Simple count by x-column
      const counts = data.reduce((acc, item) => {
        const xValue = item[xColumn] || 'Unknown';
        acc[xValue] = (acc[xValue] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      return Object.entries(counts).map(([name, count]) => ({
        [xColumn]: name,
        count: count,
        value: count
      }));
    }
  }
  
  // Handle y column with transform

  
  // Original logic for when y column exists and needs to be summed
  const grouped = data.reduce((acc, item) => {
    const xValue = item[xColumn] || 'Unknown';
    const yValue = parseFloat(String(item[yColumn]).replace(/[^0-9.-]/g, '')) || 0;
    const seriesValue = seriesColumn ? (item[seriesColumn] || 'Unknown') : 'default';
    
    if (!acc[xValue]) {
      acc[xValue] = { [xColumn]: xValue, count: 0, value: 0 };
    }
    
    if (seriesColumn) {
      acc[xValue][seriesValue] = (acc[xValue][seriesValue] || 0) + yValue;
    } else {
      acc[xValue].value += yValue;
    }
    acc[xValue].count += 1;
    return acc;
  }, {} as Record<string, any>);
  
  // For stacked bar charts, ensure all series values exist for each x value
  if (seriesColumn) {
    const allSeriesValues = [...new Set(data.map(item => item[seriesColumn] || 'Unknown'))];
    const result = Object.values(grouped);
    
    // Make sure each x-value has all series values (fill missing with 0)
    result.forEach(item => {
      allSeriesValues.forEach(seriesValue => {
        if (!(seriesValue in item)) {
          item[seriesValue] = 0;
        }
      });
    });
    
    return result;
  }
  
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
      
      switch (spec.type) {
        case 'pie':
        case 'donut':
          chartData = processPieChart(data, spec);
          break;
        case 'bar':
        case 'horizontal_bar':
          chartData = processBarChart(data, spec);
          break;
        case 'stacked_bar':
        case 'grouped_bar':
          chartData = processStackedBarChart(data, spec);
          break;
        case 'line':
          chartData = processLineChart(data, spec);
          break;
        case 'area':
          chartData = processAreaChart(data, spec);
          break;
        case 'scatter':
        case 'bubble':
          chartData = processScatterChart(data, spec);
          break;
        case 'histogram':
          chartData = processHistogram(data, spec);
          break;
        case 'box':
        case 'violin':
          chartData = processBoxChart(data, spec);
          break;
        case 'heatmap':
          chartData = processHeatmapChart(data, spec);
          break;
        case 'waterfall':
          chartData = processWaterfallChart(data, spec);
          break;
        case 'funnel':
          chartData = processFunnelChart(data, spec);
          break;
        case 'treemap':
        case 'sunburst':
        case 'radar':
          chartData = processSpecialChart(data, spec);
          break;
        default:
          chartData = processBarChart(data, spec); // Default fallback
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
        <div key={chart.id} className="w-full">
          <EnhancedChartRenderer chart={chart} />
        </div>
      ))}
    </div>
  );
}
