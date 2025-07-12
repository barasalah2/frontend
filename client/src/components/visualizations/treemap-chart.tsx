import React, { useMemo, useState } from 'react';

const COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#06b6d4", "#84cc16", "#f97316", "#ec4899", "#6366f1"
];

interface TreemapNode {
  name: string;
  value: number;
  children?: TreemapNode[];
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

interface TreemapChartProps {
  chart: {
    data: any[];
    x: string;
    y: string;
    series?: string;
    title: string;
  };
}

// Proper area-proportional treemap layout algorithm
function layoutTreemap(nodes: TreemapNode[], width: number, height: number): TreemapNode[] {
  if (nodes.length === 0) return [];
  
  const totalValue = nodes.reduce((sum, node) => sum + node.value, 0);
  if (totalValue === 0) return [];
  
  const totalArea = width * height;
  
  // Sort nodes by value (largest first) for better visual hierarchy
  const sortedNodes = [...nodes].sort((a, b) => b.value - a.value);
  
  // Calculate actual areas proportional to values
  const nodesWithArea = sortedNodes.map(node => ({
    ...node,
    area: (node.value / totalValue) * totalArea
  }));
  
  // Squarified treemap algorithm for better proportional representation
  const result: TreemapNode[] = [];
  let currentY = 0;
  let remainingNodes = [...nodesWithArea];
  
  while (remainingNodes.length > 0 && currentY < height) {
    // Calculate optimal row height based on remaining area
    const remainingArea = remainingNodes.reduce((sum, node) => sum + node.area, 0);
    const availableHeight = height - currentY;
    let optimalRowHeight = Math.sqrt(remainingArea * availableHeight / width);
    
    // Find nodes that fit well in this row height
    let rowNodes: TreemapNode[] = [];
    let rowArea = 0;
    let bestAspectRatio = Infinity;
    
    // Try different numbers of nodes to find best aspect ratios
    for (let i = 1; i <= Math.min(6, remainingNodes.length); i++) {
      const testNodes = remainingNodes.slice(0, i);
      const testRowArea = testNodes.reduce((sum, node) => sum + node.area, 0);
      const testRowHeight = testRowArea / width;
      
      // Calculate worst aspect ratio in this configuration
      let worstAspectRatio = 0;
      testNodes.forEach(node => {
        const nodeWidth = (node.area / testRowArea) * width;
        const aspectRatio = Math.max(nodeWidth / testRowHeight, testRowHeight / nodeWidth);
        worstAspectRatio = Math.max(worstAspectRatio, aspectRatio);
      });
      
      // Keep this configuration if it's better
      if (worstAspectRatio < bestAspectRatio && testRowHeight <= availableHeight) {
        bestAspectRatio = worstAspectRatio;
        rowNodes = testNodes;
        rowArea = testRowArea;
        optimalRowHeight = testRowHeight;
      }
    }
    
    // If no good configuration found, take at least one node
    if (rowNodes.length === 0) {
      rowNodes = [remainingNodes[0]];
      rowArea = rowNodes[0].area;
      optimalRowHeight = Math.min(rowArea / width, availableHeight);
    }
    
    // Layout nodes in this row with proper proportional widths
    let currentX = 0;
    const actualRowHeight = Math.min(optimalRowHeight, availableHeight);
    
    rowNodes.forEach(node => {
      const proportionalWidth = rowArea > 0 ? (node.area / rowArea) * width : width / rowNodes.length;
      
      result.push({
        ...node,
        x: currentX,
        y: currentY,
        width: Math.max(10, proportionalWidth), // Minimum width for visibility
        height: Math.max(10, actualRowHeight)   // Minimum height for visibility
      });
      
      currentX += proportionalWidth;
    });
    
    // Remove processed nodes and move to next row
    remainingNodes = remainingNodes.slice(rowNodes.length);
    currentY += actualRowHeight;
  }
  
  return result;
}

export default function TreemapChart({ chart }: TreemapChartProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<{x: number, y: number} | null>(null);
  
  const treemapData = useMemo(() => {
    if (!chart.data || chart.data.length === 0) return [];
    
    // console.log('Treemap chart data sample:', chart.data.slice(0, 3));
    // console.log('Chart config:', { x: chart.x, y: chart.y, series: chart.series });
    
    // Check if data is already processed (has 'name' and 'value' fields)
    const firstItem = chart.data[0];
    const isProcessedData = firstItem && typeof firstItem === 'object' && 'name' in firstItem && 'value' in firstItem;
    
    if (isProcessedData) {
      // console.log('Data is already processed, using directly');
      // Data is already aggregated, use it directly
      return chart.data
        .map((item, index) => ({
          name: String(item.name || 'Unknown'),
          value: Number(item.value) || 0,
          color: COLORS[index % COLORS.length]
        }))
        .filter(item => item.value > 0) // Filter out zero values
        .sort((a, b) => b.value - a.value);
    }
    
    // Process raw data
    // console.log('Processing raw data');
    const groupedData: { [key: string]: number } = {};
    
    chart.data.forEach(item => {
      const xValue = String(item[chart.x] || 'Unknown');
      const yValue = Number(item[chart.y]) || 0;
      
      if (!groupedData[xValue]) {
        groupedData[xValue] = 0;
      }
      
      // Handle transform_y
      if (chart.transform_y === 'count') {
        groupedData[xValue] += 1; // Count occurrences
      } else {
        groupedData[xValue] += yValue; // Sum values
      }
    });
    
    // Convert to nodes array
    const nodes: TreemapNode[] = Object.entries(groupedData)
      .filter(([key, value]) => value > 0) // Only include non-zero values
      .map(([key, value], index) => ({
        name: key,
        value: value,
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
    
    // console.log('Treemap nodes:', nodes);
    return nodes;
  }, [chart.data, chart.x, chart.y, chart.series]);
  
  const layoutNodes = useMemo(() => {
    return layoutTreemap(treemapData, 800, 500);
  }, [treemapData]);
  
  if (!treemapData.length) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No treemap data available</p>
      </div>
    );
  }
  
  return (
    <div className="w-full bg-white dark:bg-slate-800 rounded-lg p-4">
      <svg width="100%" height="500" viewBox="0 0 800 500" className="border border-gray-200 dark:border-slate-700 rounded">
        {layoutNodes.map((node, index) => (
          <g key={`${node.name}-${index}`}>
            <rect
              x={node.x}
              y={node.y}
              width={node.width}
              height={node.height}
              fill={node.color}
              stroke="#fff"
              strokeWidth="2"
              opacity={hoveredNode === node.name ? 0.8 : 0.7}
              className="cursor-pointer transition-opacity duration-200"
              onMouseEnter={(e) => {
                setHoveredNode(node.name);
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltipPosition({
                  x: rect.left + rect.width / 2,
                  y: rect.top - 10
                });
              }}
              onMouseLeave={() => {
                setHoveredNode(null);
                setTooltipPosition(null);
              }}
            />
            {/* Label */}
            {node.width && node.height && node.width > 40 && node.height > 25 && (
              <text
                x={(node.x || 0) + (node.width || 0) / 2}
                y={(node.y || 0) + (node.height || 0) / 2 - 2}
                textAnchor="middle"
                className="fill-white text-xs font-medium pointer-events-none drop-shadow-sm"
                style={{ fontSize: Math.min(11, Math.max(8, (node.width || 0) / 10)) }}
              >
                {node.name.length > 12 ? `${node.name.slice(0, 9)}...` : node.name}
              </text>
            )}
            {/* Value */}
            {node.width && node.height && node.width > 40 && node.height > 35 && (
              <text
                x={(node.x || 0) + (node.width || 0) / 2}
                y={(node.y || 0) + (node.height || 0) / 2 + 12}
                textAnchor="middle"
                className="fill-white text-xs opacity-90 pointer-events-none drop-shadow-sm"
                style={{ fontSize: Math.min(9, Math.max(7, (node.width || 0) / 12)) }}
              >
                {node.value.toLocaleString()}
              </text>
            )}
          </g>
        ))}
      </svg>
      
      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3">
        {treemapData.slice(0, 10).map((node, index) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded"
              style={{ backgroundColor: node.color }}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {node.name}: {node.value.toLocaleString()} {chart.y ? `(${chart.y})` : ''}
            </span>
          </div>
        ))}
        {treemapData.length > 10 && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            +{treemapData.length - 10} more
          </span>
        )}
      </div>
      
      {/* Tooltip */}
      {hoveredNode && tooltipPosition && (
        <div 
          className="fixed z-50 p-2 bg-black text-white text-sm rounded shadow-lg pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`
          }}
        >
          <div className="font-medium">{hoveredNode}</div>
          <div className="text-xs opacity-75">
            {chart.y}: {treemapData.find(n => n.name === hoveredNode)?.value?.toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}