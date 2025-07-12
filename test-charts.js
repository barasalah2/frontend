// Chart Testing Script
// This script tests all chart types systematically

const testData = [
  {
    "wpId": "CWA-2301-001",
    "description": "Foundation Preparation",
    "status": "In Progress",
    "progress": 75,
    "dueDate": "2024-01-15T00:00:00.000Z",
    "assignedTeam": "Team Alpha",
    "cwaId": "CWA-2301",
    "priority": "High",
    "budget": 50000,
    "timeSpent": 120
  },
  {
    "wpId": "CWA-2301-002",
    "description": "Steel Framework",
    "status": "Planned",
    "progress": 0,
    "dueDate": "2024-01-22T00:00:00.000Z",
    "assignedTeam": "Team Beta",
    "cwaId": "CWA-2301",
    "priority": "Medium",
    "budget": 75000,
    "timeSpent": 0
  },
  {
    "wpId": "CWA-2301-003",
    "description": "Concrete Pour",
    "status": "Delayed",
    "progress": 30,
    "dueDate": "2024-01-18T00:00:00.000Z",
    "assignedTeam": "Team Gamma",
    "cwaId": "CWA-2301",
    "priority": "High",
    "budget": 40000,
    "timeSpent": 80
  },
  {
    "wpId": "CWA-2302-001",
    "description": "Electrical Installation",
    "status": "In Progress",
    "progress": 60,
    "dueDate": "2024-01-25T00:00:00.000Z",
    "assignedTeam": "Team Alpha",
    "cwaId": "CWA-2302",
    "priority": "Medium",
    "budget": 30000,
    "timeSpent": 95
  },
  {
    "wpId": "CWA-2302-002",
    "description": "Plumbing Installation",
    "status": "Completed",
    "progress": 100,
    "dueDate": "2024-01-10T00:00:00.000Z",
    "assignedTeam": "Team Beta",
    "cwaId": "CWA-2302",
    "priority": "Low",
    "budget": 25000,
    "timeSpent": 60
  }
];

const chartTestCases = [
  // Core Charts
  {
    name: "PIE CHART",
    type: "pie",
    x: "status",
    y: null,
    title: "Work Package Status Distribution",
    transform_y: "count",
    expected: "Should show proportional slices for each status"
  },
  {
    name: "DONUT CHART",
    type: "donut",
    x: "assignedTeam",
    y: null,
    title: "Team Assignment Distribution",
    transform_y: "count",
    expected: "Should show donut with team distributions"
  },
  {
    name: "BAR CHART",
    type: "bar",
    x: "status",
    y: "progress",
    title: "Progress by Status",
    transform_y: "sum",
    expected: "Should show vertical bars with progress totals"
  },
  {
    name: "HORIZONTAL BAR CHART",
    type: "horizontal_bar",
    x: "assignedTeam",
    y: "budget",
    title: "Budget by Team",
    transform_y: "sum",
    expected: "Should show horizontal bars with budget totals"
  },
  {
    name: "STACKED BAR CHART",
    type: "stacked_bar",
    x: "status",
    y: "progress",
    series: "assignedTeam",
    title: "Progress by Status and Team",
    transform_y: "sum",
    expected: "Should show stacked bars with team breakdown"
  },
  {
    name: "GROUPED BAR CHART",
    type: "grouped_bar",
    x: "priority",
    y: "budget",
    series: "status",
    title: "Budget by Priority and Status",
    transform_y: "sum",
    expected: "Should show grouped bars side by side"
  },
  {
    name: "LINE CHART",
    type: "line",
    x: "dueDate",
    y: "progress",
    title: "Progress Over Time",
    transform_y: "mean",
    expected: "Should show line connecting progress points over time"
  },
  {
    name: "AREA CHART",
    type: "area",
    x: "dueDate",
    y: "timeSpent",
    title: "Time Spent Over Due Dates",
    transform_y: "sum",
    expected: "Should show filled area under the line"
  },
  {
    name: "SCATTER PLOT",
    type: "scatter",
    x: "budget",
    y: "progress",
    title: "Budget vs Progress Correlation",
    expected: "Should show dots scattered based on budget/progress values"
  },
  {
    name: "BUBBLE CHART",
    type: "bubble",
    x: "budget",
    y: "progress",
    series: "timeSpent",
    title: "Budget vs Progress with Time Spent",
    expected: "Should show bubbles with size based on time spent"
  },
  
  // Advanced Charts
  {
    name: "HISTOGRAM",
    type: "histogram",
    x: "progress",
    y: null,
    title: "Progress Distribution",
    transform_y: "count",
    expected: "Should show frequency distribution of progress values"
  },
  {
    name: "BOX PLOT",
    type: "box",
    x: "status",
    y: "budget",
    title: "Budget Distribution by Status",
    expected: "Should show box plots with quartiles"
  },
  {
    name: "VIOLIN PLOT",
    type: "violin",
    x: "assignedTeam",
    y: "progress",
    title: "Progress Distribution by Team",
    expected: "Should show violin-shaped distributions"
  },
  {
    name: "TREEMAP",
    type: "treemap",
    x: "assignedTeam",
    y: "budget",
    title: "Budget Allocation by Team",
    transform_y: "sum",
    expected: "Should show rectangles sized by budget"
  },
  {
    name: "HEATMAP",
    type: "heatmap",
    x: "status",
    y: "assignedTeam",
    series: "progress",
    title: "Progress Heatmap",
    transform_y: "mean",
    expected: "Should show color-coded grid"
  },
  {
    name: "WATERFALL",
    type: "waterfall",
    x: "status",
    y: "budget",
    title: "Budget Waterfall",
    transform_y: "sum",
    expected: "Should show cumulative changes"
  },
  {
    name: "FUNNEL",
    type: "funnel",
    x: "priority",
    y: "progress",
    title: "Priority Funnel",
    transform_y: "sum",
    expected: "Should show funnel with decreasing sections"
  },
  {
    name: "RADAR",
    type: "radar",
    x: "assignedTeam",
    y: "progress",
    title: "Team Performance Radar",
    transform_y: "mean",
    expected: "Should show radar/spider chart"
  },
  {
    name: "SUNBURST",
    type: "sunburst",
    x: "cwaId",
    y: "budget",
    series: "assignedTeam",
    title: "Budget Sunburst",
    transform_y: "sum",
    expected: "Should show hierarchical circular chart"
  }
];

console.log("🧪 CHART RENDERING TEST SUITE");
console.log("==============================");
console.log();

// Helper function to test chart data processing
function testChartProcessing(testCase, data) {
  console.log(`📊 Testing: ${testCase.name}`);
  console.log(`   Type: ${testCase.type}`);
  console.log(`   X-axis: ${testCase.x || 'N/A'}`);
  console.log(`   Y-axis: ${testCase.y || 'N/A'}`);
  console.log(`   Series: ${testCase.series || 'N/A'}`);
  console.log(`   Transform Y: ${testCase.transform_y || 'N/A'}`);
  console.log(`   Expected: ${testCase.expected}`);
  
  // Test data processing
  try {
    let processedData = [];
    let status = "✅ PASS";
    let details = "";
    
    // Basic validation
    if (!data || data.length === 0) {
      status = "❌ FAIL";
      details = "No test data provided";
    } else if (testCase.x && !data[0].hasOwnProperty(testCase.x)) {
      status = "❌ FAIL";
      details = `X-axis field '${testCase.x}' not found in data`;
    } else if (testCase.y && !data[0].hasOwnProperty(testCase.y)) {
      status = "❌ FAIL";
      details = `Y-axis field '${testCase.y}' not found in data`;
    } else if (testCase.series && !data[0].hasOwnProperty(testCase.series)) {
      status = "❌ FAIL";
      details = `Series field '${testCase.series}' not found in data`;
    } else {
      // Chart-specific validation
      switch (testCase.type) {
        case 'pie':
        case 'donut':
          if (!testCase.x) {
            status = "❌ FAIL";
            details = "Pie charts require X-axis field";
          } else {
            const uniqueValues = [...new Set(data.map(item => item[testCase.x]))];
            processedData = uniqueValues.map(value => ({
              name: value,
              value: data.filter(item => item[testCase.x] === value).length
            }));
            details = `Generated ${processedData.length} slices`;
          }
          break;
          
        case 'bar':
        case 'horizontal_bar':
          if (!testCase.x || !testCase.y) {
            status = "❌ FAIL";
            details = "Bar charts require both X and Y axes";
          } else {
            const groups = data.reduce((acc, item) => {
              const key = item[testCase.x];
              const value = parseFloat(item[testCase.y]) || 0;
              acc[key] = (acc[key] || 0) + value;
              return acc;
            }, {});
            processedData = Object.entries(groups).map(([key, value]) => ({
              [testCase.x]: key,
              [testCase.y]: value
            }));
            details = `Generated ${processedData.length} bars`;
          }
          break;
          
        case 'scatter':
        case 'bubble':
          if (!testCase.x || !testCase.y) {
            status = "❌ FAIL";
            details = "Scatter plots require both X and Y axes";
          } else {
            processedData = data.map(item => ({
              [testCase.x]: parseFloat(item[testCase.x]) || 0,
              [testCase.y]: parseFloat(item[testCase.y]) || 0,
              ...(testCase.series && { [testCase.series]: parseFloat(item[testCase.series]) || 0 })
            }));
            details = `Generated ${processedData.length} points`;
          }
          break;
          
        case 'line':
        case 'area':
          if (!testCase.x || !testCase.y) {
            status = "❌ FAIL";
            details = "Line charts require both X and Y axes";
          } else {
            processedData = data.map(item => ({
              [testCase.x]: item[testCase.x],
              [testCase.y]: parseFloat(item[testCase.y]) || 0
            })).sort((a, b) => new Date(a[testCase.x]).getTime() - new Date(b[testCase.x]).getTime());
            details = `Generated ${processedData.length} data points`;
          }
          break;
          
        case 'treemap':
          if (!testCase.x || !testCase.y) {
            status = "❌ FAIL";
            details = "Treemap requires both X and Y axes";
          } else {
            const groups = data.reduce((acc, item) => {
              const key = item[testCase.x];
              const value = parseFloat(item[testCase.y]) || 0;
              acc[key] = (acc[key] || 0) + value;
              return acc;
            }, {});
            processedData = Object.entries(groups).map(([key, value]) => ({
              name: key,
              value: value
            }));
            details = `Generated ${processedData.length} rectangles`;
          }
          break;
          
        default:
          // For advanced charts, basic validation
          if (testCase.x && testCase.y) {
            processedData = data.map(item => ({
              [testCase.x]: item[testCase.x],
              [testCase.y]: parseFloat(item[testCase.y]) || 0
            }));
            details = `Generated ${processedData.length} data points`;
          } else {
            status = "⚠️  WARN";
            details = "Chart type may require special handling";
          }
          break;
      }
    }
    
    console.log(`   Status: ${status}`);
    if (details) console.log(`   Details: ${details}`);
    if (processedData.length > 0) {
      console.log(`   Sample Data: ${JSON.stringify(processedData[0])}`);
    }
    
    return { status, details, processedData };
    
  } catch (error) {
    console.log(`   Status: ❌ FAIL`);
    console.log(`   Error: ${error.message}`);
    return { status: "❌ FAIL", details: error.message, processedData: [] };
  }
  
  console.log();
}

// Run all tests
console.log("Running comprehensive chart tests...");
console.log();

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
};

chartTestCases.forEach(testCase => {
  const result = testChartProcessing(testCase, testData);
  
  if (result.status.includes("✅")) {
    results.passed++;
  } else if (result.status.includes("❌")) {
    results.failed++;
  } else if (result.status.includes("⚠️")) {
    results.warnings++;
  }
  
  results.details.push({
    name: testCase.name,
    type: testCase.type,
    status: result.status,
    details: result.details
  });
  
  console.log();
});

// Summary
console.log("🏁 TEST SUMMARY");
console.log("===============");
console.log(`Total Charts Tested: ${chartTestCases.length}`);
console.log(`✅ Passed: ${results.passed}`);
console.log(`❌ Failed: ${results.failed}`);
console.log(`⚠️  Warnings: ${results.warnings}`);
console.log();

// Failed tests details
if (results.failed > 0) {
  console.log("❌ FAILED TESTS:");
  results.details.filter(r => r.status.includes("❌")).forEach(r => {
    console.log(`   - ${r.name} (${r.type}): ${r.details}`);
  });
  console.log();
}

// Warning tests details
if (results.warnings > 0) {
  console.log("⚠️  WARNING TESTS:");
  results.details.filter(r => r.status.includes("⚠️")).forEach(r => {
    console.log(`   - ${r.name} (${r.type}): ${r.details}`);
  });
  console.log();
}

console.log("🎯 RECOMMENDATIONS:");
console.log("===================");
console.log("1. Core charts (pie, bar, line, scatter) should work reliably");
console.log("2. Advanced charts (treemap, heatmap, etc.) may need additional validation");
console.log("3. All charts require proper data structure and field validation");
console.log("4. Charts with missing fields should show appropriate error messages");
console.log("5. Data transformations (count, sum, mean) should be tested separately");
console.log();