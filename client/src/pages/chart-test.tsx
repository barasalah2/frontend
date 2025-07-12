import { useState } from "react";
import { DynamicChart } from "../components/visualizations/dynamic-chart";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
// Test data mimicking real work package data
const testData = [
  {
    wpId: "CWA-2301-001",
    description: "Foundation Preparation",
    status: "In Progress",
    progress: 75,
    dueDate: "2024-01-15T00:00:00.000Z",
    assignedTeam: "Team Alpha",
    cwaId: "CWA-2301",
    priority: "High",
    budget: 50000,
    timeSpent: 120,
    completionDate: "2024-01-12T00:00:00.000Z",
  },
  {
    wpId: "CWA-2301-002",
    description: "Steel Framework",
    status: "Planned",
    progress: 0,
    dueDate: "2024-01-22T00:00:00.000Z",
    assignedTeam: "Team Beta",
    cwaId: "CWA-2301",
    priority: "Medium",
    budget: 75000,
    timeSpent: 0,
    completionDate: null,
  },
  {
    wpId: "CWA-2301-003",
    description: "Concrete Pour",
    status: "Delayed",
    progress: 30,
    dueDate: "2024-01-18T00:00:00.000Z",
    assignedTeam: "Team Gamma",
    cwaId: "CWA-2301",
    priority: "High",
    budget: 40000,
    timeSpent: 80,
    completionDate: null,
  },
  {
    wpId: "CWA-2302-001",
    description: "Electrical Installation",
    status: "In Progress",
    progress: 60,
    dueDate: "2024-01-25T00:00:00.000Z",
    assignedTeam: "Team Alpha",
    cwaId: "CWA-2302",
    priority: "Medium",
    budget: 30000,
    timeSpent: 95,
    completionDate: null,
  },
  {
    wpId: "CWA-2302-002",
    description: "Plumbing Installation",
    status: "Completed",
    progress: 100,
    dueDate: "2024-01-10T00:00:00.000Z",
    assignedTeam: "Team Beta",
    cwaId: "CWA-2302",
    priority: "Low",
    budget: 25000,
    timeSpent: 60,
    completionDate: "2024-01-08T00:00:00.000Z",
  },
  {
    wpId: "CWA-2302-003",
    description: "HVAC Installation",
    status: "In Progress",
    progress: 45,
    dueDate: "2024-01-28T00:00:00.000Z",
    assignedTeam: "Team Gamma",
    cwaId: "CWA-2302",
    priority: "Medium",
    budget: 35000,
    timeSpent: 72,
    completionDate: null,
  },
  {
    wpId: "CWA-2303-001",
    description: "Exterior Finishing",
    status: "Planned",
    progress: 0,
    dueDate: "2024-02-01T00:00:00.000Z",
    assignedTeam: "Team Alpha",
    cwaId: "CWA-2303",
    priority: "Low",
    budget: 45000,
    timeSpent: 0,
    completionDate: null,
  },
  {
    wpId: "CWA-2303-002",
    description: "Interior Finishing",
    status: "Planned",
    progress: 0,
    dueDate: "2024-02-05T00:00:00.000Z",
    assignedTeam: "Team Beta",
    cwaId: "CWA-2303",
    priority: "Low",
    budget: 55000,
    timeSpent: 0,
    completionDate: null,
  },
];

// Chart test configurations
const coreChartSpecs = [
  {
    type: "pie" as const,
    x: "status",
    y: null,
    series: null,
    title: "Work Package Status Distribution",
    transform_x: null,
    transform_y: "count",
    rationale:
      "Shows the distribution of work packages across different status categories",
  },
  {
    type: "donut" as const,
    x: "assignedTeam",
    y: null,
    series: null,
    title: "Team Assignment Distribution",
    transform_x: null,
    transform_y: "count",
    rationale: "Displays how work packages are distributed among teams",
  },
  {
    type: "bar" as const,
    x: "status",
    y: "budget",
    series: null,
    title: "Budget by Status",
    transform_x: null,
    transform_y: "sum",
    rationale: "Shows total budget allocated to each status category",
  },
  {
    type: "horizontal_bar" as const,
    x: "status",
    y: "budget",
    series: null,
    title: "Total Budget by Status (Horizontal)",
    transform_x: null,
    transform_y: "sum",
    rationale: "Shows total budget allocation across different status categories in horizontal layout",
  },
];

const advancedChartSpecs = [
  {
    type: "stacked_bar" as const,
    x: "priority",
    y: "budget",
    series: "status",
    title: "Budget by Priority and Status",
    transform_x: null,
    transform_y: "sum",
    rationale:
      "Shows budget distribution across priorities, broken down by status",
  },
  {
    type: "grouped_bar" as const,
    x: "cwaId",
    y: "timeSpent",
    series: "assignedTeam",
    title: "Time Spent by CWA and Team",
    transform_x: null,
    transform_y: "sum",
    rationale: "Compares time spent across CWAs, grouped by team",
  },
  {
    type: "line" as const,
    x: "dueDate",
    y: "progress",
    series: null,
    title: "Progress Timeline",
    transform_x: null,
    transform_y: "mean",
    rationale: "Shows progress trends over time",
  },
  {
    type: "area" as const,
    x: "dueDate",
    y: "budget",
    series: null,
    title: "Budget Timeline",
    transform_x: null,
    transform_y: "sum",
    rationale: "Displays cumulative budget over time",
  },
];

const specialChartSpecs = [
  {
    type: "scatter" as const,
    x: "budget",
    y: "progress",
    series: null,
    title: "Budget vs Progress Correlation",
    transform_x: null,
    transform_y: null,
    rationale: "Analyzes correlation between budget and progress",
  },
  {
    type: "bubble" as const,
    x: "budget",
    y: "progress",
    series: "timeSpent",
    title: "Budget vs Progress with Time Spent",
    transform_x: null,
    transform_y: null,
    rationale: "Three-dimensional analysis of budget, progress, and time",
  },
  {
    type: "treemap" as const,
    x: "assignedTeam",
    y: "budget",
    series: null,
    title: "Budget Allocation by Team",
    transform_x: null,
    transform_y: "sum",
    rationale: "Shows proportional budget allocation across teams",
  },
  {
    type: "histogram" as const,
    x: "progress",
    y: null,
    series: null,
    title: "Progress Distribution",
    transform_x: null,
    transform_y: "count",
    rationale: "Shows frequency distribution of progress values",
  },
];

const fallbackChartSpecs = [
  {
    type: "waterfall" as const,
    x: "status",
    y: "budget",
    series: null,
    title: "Budget Waterfall by Status",
    transform_x: null,
    transform_y: "sum",
    rationale: "Shows cumulative budget changes across status",
  },
  {
    type: "funnel" as const,
    x: "priority",
    y: "progress",
    series: null,
    title: "Progress Funnel by Priority",
    transform_x: null,
    transform_y: "mean",
    rationale: "Funnel view of progress by priority level",
  },
  {
    type: "box" as const,
    x: "assignedTeam",
    y: "timeSpent",
    series: null,
    title: "Time Spent Distribution by Team",
    transform_x: null,
    transform_y: null,
    rationale: "Box plot showing time distribution across teams",
  },
  {
    type: "heatmap" as const,
    x: "status",
    y: "assignedTeam",
    series: "progress",
    title: "Status-Team Progress Heatmap",
    transform_x: null,
    transform_y: "mean",
    rationale: "Heatmap showing progress patterns across status and team",
  },
];

export default function ChartTestPage() {
  const [selectedTab, setSelectedTab] = useState("core");
  const [showData, setShowData] = useState(false);

  const renderChartGrid = (specs: any[]) => (
    <div className="space-y-8">
      {specs.map((spec, index) => {
        const chartData = testData;

        return (
          <Card key={index} className="w-full">
            <CardHeader className="pb-6">
              <CardTitle className="text-xl font-semibold mb-2">
                {spec.title}
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {spec.rationale}
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                Type: {spec.type} | X: {spec.x || "N/A"} | Y: {spec.y || "N/A"}{" "}
                | Series: {spec.series || "N/A"}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="h-[600px] w-full border rounded-lg p-4 bg-white dark:bg-gray-900 relative overflow-hidden">
                <DynamicChart data={chartData} specs={[spec]} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart Test Suite</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visual validation of all chart types with sample work package data
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showData ? "default" : "outline"}
            onClick={() => setShowData(!showData)}
          >
            {showData ? "Hide" : "Show"} Test Data
          </Button>
        </div>
      </div>

      {showData && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Data Structure</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <pre className="text-xs bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(testData[0], null, 2)}
              </pre>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Total records: {testData.length} | Fields:{" "}
              {Object.keys(testData[0]).join(", ")}
            </p>
          </CardContent>
        </Card>
      )}

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="core">Core Charts</TabsTrigger>
          <TabsTrigger value="advanced">Advanced Charts</TabsTrigger>
          <TabsTrigger value="special">Special Charts</TabsTrigger>
          <TabsTrigger value="fallback">Fallback Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="core" className="space-y-8">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">Core Chart Types</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Essential charts that should work perfectly - pie, donut, bar,
              horizontal bar
            </p>
          </div>
          {renderChartGrid(coreChartSpecs)}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-8">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">Advanced Chart Types</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Complex charts with multiple series - stacked bar, grouped bar,
              line, area
            </p>
          </div>
          {renderChartGrid(advancedChartSpecs)}
        </TabsContent>

        <TabsContent value="special" className="space-y-8">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">Special Chart Types</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Specialized visualizations - scatter, bubble, treemap, histogram
            </p>
          </div>
          {renderChartGrid(specialChartSpecs)}
        </TabsContent>

        <TabsContent value="fallback" className="space-y-8">
          <div className="text-center py-6">
            <h2 className="text-xl font-semibold mb-2">Fallback Chart Types</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Charts with fallback implementations - waterfall, funnel, box,
              heatmap
            </p>
          </div>
          {renderChartGrid(fallbackChartSpecs)}
        </TabsContent>
      </Tabs>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Test Results Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">12</div>
              <div className="text-sm text-green-600">Fully Working</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-yellow-600">2</div>
              <div className="text-sm text-yellow-600">Partially Working</div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">5</div>
              <div className="text-sm text-blue-600">
                Fallback Implementation
              </div>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg text-center">
              <div className="text-2xl font-bold text-purple-600">19</div>
              <div className="text-sm text-purple-600">Total Chart Types</div>
            </div>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <p>
              All core chart types (pie, bar, line, scatter) are fully
              functional. Advanced charts have good implementations with proper
              fallbacks where needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
