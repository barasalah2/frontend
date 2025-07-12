import { useState, useEffect } from 'react';
import { unifiedStorage } from '@/lib/unified-storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function UnifiedStorageDebugger() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [charts, setCharts] = useState<any[]>([]);
  const [storageSize, setStorageSize] = useState<number>(0);

  const refreshData = () => {
    const convs = unifiedStorage.getConversations();
    setConversations(convs);
    
    if (selectedConversationId) {
      const msgs = unifiedStorage.getMessages(selectedConversationId);
      const chts = unifiedStorage.getCharts(selectedConversationId);
      setMessages(msgs);
      setCharts(chts);
    }

    // Calculate storage size
    const exportedData = unifiedStorage.exportAllData();
    setStorageSize(new Blob([exportedData]).size);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, [selectedConversationId]);

  const handleExportData = () => {
    const data = unifiedStorage.exportAllData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `workpacks-storage-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearStorage = () => {
    if (confirm('Are you sure you want to clear all storage data?')) {
      unifiedStorage.clearAllData();
      refreshData();
    }
  };

  const handleMigration = () => {
    unifiedStorage.migrateFromOldStorage();
    refreshData();
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Storage Debugger</h2>
          <p className="text-sm text-gray-600">
            Storage Size: {(storageSize / 1024).toFixed(2)} KB
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline">
            Refresh
          </Button>
          <Button onClick={handleMigration} variant="outline">
            Migrate Old Storage
          </Button>
          <Button onClick={handleExportData} variant="outline">
            Export Data
          </Button>
          <Button onClick={handleClearStorage} variant="destructive">
            Clear Storage
          </Button>
        </div>
      </div>

      <Tabs defaultValue="conversations" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
        </TabsList>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversations ({conversations.length})</CardTitle>
              <CardDescription>
                All stored conversations with their metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedConversationId === conv.id 
                        ? 'bg-blue-50 border-blue-200' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{conv.title}</h4>
                        <p className="text-sm text-gray-600">
                          ID: {conv.id} • Category: {conv.category}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="secondary">
                          {conv.messages.length} messages
                        </Badge>
                        <Badge variant="secondary">
                          {conv.charts.length} charts
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Created: {new Date(conv.createdAt).toLocaleString()} • 
                      Updated: {new Date(conv.updatedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Messages ({messages.length})
                {selectedConversationId && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    for Conversation {selectedConversationId}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedConversationId 
                  ? "Messages for the selected conversation"
                  : "Select a conversation to view messages"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {messages.map((msg) => (
                  <div key={msg.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={msg.sender === 'user' ? 'default' : 'secondary'}>
                          {msg.sender}
                        </Badge>
                        <Badge variant="outline">
                          {msg.messageType || 'text'}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(msg.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <p className="text-sm mt-2 line-clamp-2">{msg.content}</p>
                    {msg.data && (
                      <div className="text-xs text-gray-500 mt-1">
                        Has data: {Object.keys(msg.data).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="charts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>
                Charts ({charts.length})
                {selectedConversationId && (
                  <span className="text-sm font-normal text-gray-600 ml-2">
                    for Conversation {selectedConversationId}
                  </span>
                )}
              </CardTitle>
              <CardDescription>
                {selectedConversationId 
                  ? "Charts for the selected conversation"
                  : "Select a conversation to view charts"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {charts.map((chart) => (
                  <div key={chart.id} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{chart.title}</h4>
                        <p className="text-sm text-gray-600">
                          ID: {chart.id} • {chart.charts.length} visualizations
                        </p>
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(chart.savedAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Chart types: {chart.charts.map((c: any) => c.type).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}