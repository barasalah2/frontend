import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function LocalStorageViewer() {
  const [savedCharts, setSavedCharts] = useState<any[]>([]);

  const refreshCharts = () => {
    try {
      const charts = JSON.parse(localStorage.getItem('savedCharts') || '[]');
      setSavedCharts(charts);
      console.log('LocalStorageViewer - charts loaded:', charts);
    } catch (error) {
      console.error('Error loading charts:', error);
      setSavedCharts([]);
    }
  };

  useEffect(() => {
    refreshCharts();
  }, []);

  const clearCharts = () => {
    localStorage.removeItem('savedCharts');
    setSavedCharts([]);
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          LocalStorage Debug Viewer
          <div className="space-x-2">
            <Button onClick={refreshCharts} size="sm" variant="outline">
              Refresh
            </Button>
            <Button onClick={clearCharts} size="sm" variant="destructive">
              Clear All
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">
          Charts in localStorage: {savedCharts.length}
        </p>
        <div className="space-y-2">
          {savedCharts.map((chart, index) => (
            <div key={index} className="p-2 bg-gray-100 rounded text-xs">
              <div><strong>ID:</strong> {chart.id}</div>
              <div><strong>Conversation:</strong> {chart.conversationId}</div>
              <div><strong>Title:</strong> {chart.title}</div>
              <div><strong>Charts:</strong> {chart.charts?.length || 0}</div>
              <div><strong>Saved:</strong> {chart.savedAt}</div>
            </div>
          ))}
        </div>
        <pre className="mt-4 p-2 bg-gray-50 rounded text-xs overflow-auto max-h-40">
          {JSON.stringify(savedCharts, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
}