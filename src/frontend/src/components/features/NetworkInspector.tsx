'use client';

import { useState } from 'react';
import { Upload, FileJson, Search, Filter, ArrowRightLeft, Code, Database, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface HarEntry {
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    headers: { name: string; value: string }[];
    postData?: {
      mimeType: string;
      text: string;
    };
  };
  response: {
    status: number;
    statusText: string;
    headers: { name: string; value: string }[];
    content: {
      mimeType: string;
      size: number;
      text?: string;
    };
  };
}

export function NetworkInspector() {
  const { toast } = useToast();
  const [entries, setEntries] = useState<HarEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<HarEntry | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'xhr' | 'doc' | 'css' | 'img'>('all');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (json.log && json.log.entries) {
          setEntries(json.log.entries);
          toast({
            title: "HAR File Loaded",
            description: `Successfully analyzed ${json.log.entries.length} network requests.`,
          });
        } else {
          throw new Error("Invalid HAR format");
        }
      } catch (error) {
        toast({
          title: "Parse Error",
          description: "Could not parse the HAR file. Ensure it's valid JSON.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  const getMethodColor = (method: string) => {
    switch (method.toUpperCase()) {
      case 'GET': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      case 'POST': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'PUT': return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300';
      case 'DELETE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 300 && status < 400) return 'text-blue-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = entry.request.url.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' 
      ? true 
      : filterType === 'xhr' 
        ? ['json', 'xml'].some(t => entry.response.content.mimeType.includes(t))
        : entry.response.content.mimeType.includes(filterType);
    return matchesSearch && matchesType;
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
      {/* Sidebar: Request List */}
      <Card className="lg:col-span-1 flex flex-col h-full border-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Traffic Log
          </CardTitle>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Filter URLs..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant={filterType === 'all' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setFilterType('all')}
                className="text-xs h-7"
              >
                All
              </Button>
              <Button 
                variant={filterType === 'xhr' ? "secondary" : "ghost"} 
                size="sm" 
                onClick={() => setFilterType('xhr')}
                className="text-xs h-7"
              >
                XHR/API
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-0 overflow-hidden">
          {entries.length === 0 ? (
            <div 
              className={`h-full flex flex-col items-center justify-center p-6 border-2 border-dashed m-4 rounded-lg transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files[0];
                if (file) processFile(file);
              }}
            >
              <FileJson className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-center font-medium mb-2">Drop HAR file here</p>
              <p className="text-center text-xs text-muted-foreground mb-4">
                Export from DevTools → Network → "Save all as HAR"
              </p>
              <div className="relative">
                <Button variant="outline" size="sm">Select File</Button>
                <input 
                  type="file" 
                  accept=".har,.json" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="flex flex-col divide-y">
                {filteredEntries.map((entry, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedEntry(entry)}
                    className={`flex items-start gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${selectedEntry === entry ? 'bg-muted' : ''}`}
                  >
                    <Badge variant="outline" className={`mt-0.5 rounded-sm px-1.5 py-0 text-[10px] font-bold uppercase ${getMethodColor(entry.request.method)}`}>
                      {entry.request.method}
                    </Badge>
                    <div className="flex-1 min-w-0 grid gap-1">
                      <div className="font-mono text-xs truncate" title={entry.request.url}>
                        {entry.request.url.split('/').pop() || '/'}
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span className={getStatusColor(entry.response.status)}>
                          {entry.response.status} {entry.response.statusText}
                        </span>
                        <span>{Math.round(entry.response.content.size / 1024)}kb</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Main Content: Request Details */}
      <Card className="lg:col-span-2 h-full flex flex-col border-2">
        {selectedEntry ? (
          <>
            <CardHeader className="border-b pb-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge className={getMethodColor(selectedEntry.request.method)}>
                      {selectedEntry.request.method}
                    </Badge>
                    <span className={`font-mono font-bold ${getStatusColor(selectedEntry.response.status)}`}>
                      {selectedEntry.response.status}
                    </span>
                  </div>
                  <CardTitle className="text-base font-mono break-all">
                    {selectedEntry.request.url}
                  </CardTitle>
                </div>
                <Badge variant="outline">
                  {new Date(selectedEntry.startedDateTime).toLocaleTimeString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <Tabs defaultValue="response" className="h-full flex flex-col">
                <div className="border-b px-4">
                  <TabsList className="h-10 bg-transparent p-0">
                    <TabsTrigger value="response" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-4">
                      Response
                    </TabsTrigger>
                    <TabsTrigger value="payload" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-4">
                      Payload
                    </TabsTrigger>
                    <TabsTrigger value="headers" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-10 px-4">
                      Headers
                    </TabsTrigger>
                  </TabsList>
                </div>

                <div className="flex-1 overflow-hidden bg-muted/20">
                  <ScrollArea className="h-full">
                    <TabsContent value="response" className="p-4 m-0">
                      {selectedEntry.response.content.text ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {tryFormatJson(selectedEntry.response.content.text)}
                        </pre>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <Database className="h-8 w-8 mb-2 opacity-20" />
                          <p>No response content available</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="payload" className="p-4 m-0">
                      {selectedEntry.request.postData ? (
                        <pre className="text-xs font-mono whitespace-pre-wrap break-all">
                          {tryFormatJson(selectedEntry.request.postData.text)}
                        </pre>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                          <Code className="h-8 w-8 mb-2 opacity-20" />
                          <p>No payload data</p>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="headers" className="p-4 m-0">
                      <div className="grid gap-6">
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Request Headers</h4>
                          <div className="grid gap-1">
                            {selectedEntry.request.headers.map((h, i) => (
                              <div key={i} className="grid grid-cols-[1fr_2fr] gap-2 text-xs font-mono border-b border-border/50 py-1 last:border-0">
                                <span className="font-semibold text-muted-foreground">{h.name}:</span>
                                <span className="break-all">{h.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2 text-sm">Response Headers</h4>
                          <div className="grid gap-1">
                            {selectedEntry.response.headers.map((h, i) => (
                              <div key={i} className="grid grid-cols-[1fr_2fr] gap-2 text-xs font-mono border-b border-border/50 py-1 last:border-0">
                                <span className="font-semibold text-muted-foreground">{h.name}:</span>
                                <span className="break-all">{h.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </ScrollArea>
                </div>
              </Tabs>
            </CardContent>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8">
            <Globe className="h-16 w-16 mb-4 opacity-10" />
            <h3 className="text-lg font-semibold mb-1">Select a Request</h3>
            <p className="text-sm max-w-xs text-center">
              Click on a request from the list to view its headers, payload, and response details.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

function tryFormatJson(text: string) {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}
