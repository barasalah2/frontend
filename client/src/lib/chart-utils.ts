export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface GanttDataPoint {
  id: string;
  name: string;
  start: Date;
  end: Date;
  progress: number;
  status: string;
  team?: string;
}

export function transformWorkPackageDataForChart(data: any[]): ChartDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  // Group by status and count
  const statusCounts = data.reduce((acc, item) => {
    const status = item.Status || item.status || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(statusCounts).map(([status, count], index) => ({
    name: status,
    value: count as number,
    color: getStatusColor(status, index)
  }));
}

export function transformWorkPackageDataForGantt(data: any[]): GanttDataPoint[] {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data.map((item, index) => {
    const id = item['WP ID'] || item.wpId || `wp-${index}`;
    const name = item.Description || item.description || `Work Package ${index + 1}`;
    const progress = parseInt(item.Progress || item.progress || '0');
    const status = item.Status || item.status || 'Planned';
    const team = item['Assigned Team'] || item.assignedTeam;
    
    // Create synthetic dates for demonstration
    const baseDate = new Date();
    const start = new Date(baseDate.getTime() + (index * 7 * 24 * 60 * 60 * 1000)); // Start dates spaced a week apart
    const end = new Date(start.getTime() + (14 * 24 * 60 * 60 * 1000)); // 2 weeks duration
    
    return {
      id,
      name,
      start,
      end,
      progress,
      status,
      team
    };
  });
}

export function getStatusColor(status: string, fallbackIndex: number = 0): string {
  const colors = {
    'in progress': '#10B981',
    'completed': '#3B82F6',
    'delayed': '#EF4444',
    'planned': '#F59E0B',
    'on hold': '#94A3B8',
    'cancelled': '#6B7280'
  };

  const normalizedStatus = status.toLowerCase();
  if (colors[normalizedStatus as keyof typeof colors]) {
    return colors[normalizedStatus as keyof typeof colors];
  }

  // Fallback color scheme
  const fallbackColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];
  return fallbackColors[fallbackIndex % fallbackColors.length];
}

export function calculateProjectMetrics(data: any[]) {
  if (!Array.isArray(data) || data.length === 0) {
    return {
      totalPackages: 0,
      completedPackages: 0,
      overallProgress: 0,
      delayedPackages: 0,
      onTrackPackages: 0
    };
  }

  const totalPackages = data.length;
  const completedPackages = data.filter(item => 
    (item.Status || item.status || '').toLowerCase().includes('completed')
  ).length;
  
  const delayedPackages = data.filter(item => 
    (item.Status || item.status || '').toLowerCase().includes('delayed')
  ).length;

  const progressSum = data.reduce((sum, item) => {
    const progress = parseInt(item.Progress || item.progress || '0');
    return sum + progress;
  }, 0);

  const overallProgress = totalPackages > 0 ? Math.round(progressSum / totalPackages) : 0;
  const onTrackPackages = totalPackages - delayedPackages - completedPackages;

  return {
    totalPackages,
    completedPackages,
    overallProgress,
    delayedPackages,
    onTrackPackages
  };
}
