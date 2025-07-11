import * as XLSX from 'xlsx';

export function exportToExcel(data: any[][], filename: string = 'workpack_data') {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Convert array of arrays to worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Work Packages');
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const finalFilename = `${filename}_${timestamp}.xlsx`;
    
    // Write the file
    XLSX.writeFile(wb, finalFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
  }
}

export function exportTableDataToExcel(tableData: any[], filename: string = 'workpack_table') {
  if (!Array.isArray(tableData) || tableData.length === 0) {
    console.warn('No table data to export');
    return;
  }

  try {
    // Extract headers from the first object
    const headers = Object.keys(tableData[0]);
    
    // Convert objects to array of arrays
    const rows = tableData.map(row => headers.map(header => row[header] || ''));
    
    // Combine headers and data
    const fullData = [headers, ...rows];
    
    exportToExcel(fullData, filename);
  } catch (error) {
    console.error('Error exporting table data to Excel:', error);
  }
}

export function exportWorkPackageReport(workPackages: any[], metadata: any = {}) {
  if (!Array.isArray(workPackages) || workPackages.length === 0) {
    console.warn('No work packages to export');
    return;
  }

  try {
    const wb = XLSX.utils.book_new();
    
    // Summary sheet
    const summaryData = [
      ['Workpacks Report'],
      ['Generated:', new Date().toLocaleString()],
      ['Total Work Packages:', workPackages.length],
      [''],
      ['Status Summary:'],
    ];
    
    // Calculate status summary
    const statusCounts = workPackages.reduce((acc, wp) => {
      const status = wp.Status || wp.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      summaryData.push([status, count]);
    });
    
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
    
    // Detailed data sheet
    const headers = Object.keys(workPackages[0]);
    const detailData = [headers, ...workPackages.map(wp => headers.map(h => wp[h] || ''))];
    const detailWs = XLSX.utils.aoa_to_sheet(detailData);
    XLSX.utils.book_append_sheet(wb, detailWs, 'Work Packages');
    
    // Generate filename
    const timestamp = new Date().toISOString().slice(0, 10);
    const filename = `workpacks_report_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, filename);
  } catch (error) {
    console.error('Error exporting work package report:', error);
  }
}
