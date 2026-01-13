'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { List, ListItem } from '@/components/ui/list';
import { storageService } from '@/lib/services/storage';
import { puterCloudService } from '@/lib/services/cloudSync';
import { toast } from '@/hooks/use-toast';

export function FileBrowser() {
  const [docs, setDocs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [providerFiles, setProviderFiles] = useState<{ [k: string]: any[] }>({});

  useEffect(() => {
    (async () => {
      await storageService.initialize();
      const list = await storageService.getDocuments();
      setDocs(list || []);
    })();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const content = await file.text();
    const doc = {
      id: 'doc_' + Date.now(),
      name: file.name,
      kind: file.name.toLowerCase().includes('cover') ? 'cover' : 'resume',
      content,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: 'uploaded',
    };
    await storageService.saveDocument(doc);
    setDocs((d) => [doc, ...d]);
    toast({ title: 'Uploaded', description: file.name });
  };

  const handleImportProvider = async (provider: string) => {
    try {
      const res = await fetch(`/api/v1/files/${provider}/list`);
      const data = await res.json();
      setProviderFiles((p) => ({ ...p, [provider]: data.files }));
    } catch (error) {
      toast({ title: 'Provider Error', description: 'Failed to list files' });
    }
  };

  const handleSaveProviderFile = async (provider: string, file: any) => {
    const doc = {
      id: `${provider}_${file.id}_${Date.now()}`,
      name: file.name,
      kind: file.kind || 'other',
      content: { url: `mock://${provider}/${file.path}` },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      source: provider,
      path: file.path,
    };
    await storageService.saveDocument(doc);
    setDocs((d) => [doc, ...d]);
    toast({ title: 'Saved', description: file.name });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search documents"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="cursor-pointer">
          <input type="file" className="hidden" onChange={handleUpload} />
          <Button>Upload</Button>
        </label>
        <Button variant="outline" onClick={() => handleImportProvider('google')}>
          Import Google Drive
        </Button>
        <Button variant="outline" onClick={() => handleImportProvider('dropbox')}>
          Import Dropbox
        </Button>
        <Button variant="outline" onClick={() => handleImportProvider('onedrive')}>
          Import OneDrive
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <List>
              {docs
                .filter((d) => d.name.toLowerCase().includes(query.toLowerCase()))
                .map((d) => (
                  <ListItem key={d.id} className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{d.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {d.kind} • {d.source}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        onClick={() =>
                          navigator.clipboard.writeText(JSON.stringify(d.content || {}))
                        }
                      >
                        Copy
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={async () => {
                          await storageService.deleteDocument(d.id);
                          setDocs(docs.filter((x) => x.id !== d.id));
                          toast({ title: 'Deleted' });
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </ListItem>
                ))}
            </List>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cloud Import</CardTitle>
          </CardHeader>
          <CardContent>
            {['google', 'dropbox', 'onedrive'].map((p) => (
              <div key={p} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-medium capitalize">{p}</div>
                  <Button onClick={() => handleImportProvider(p)}>List Files</Button>
                </div>
                {(providerFiles[p] || []).map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <div className="font-medium">{f.name}</div>
                      <div className="text-xs text-muted-foreground">{f.modifiedAt}</div>
                    </div>
                    <div>
                      <Button variant="outline" onClick={() => handleSaveProviderFile(p, f)}>
                        Save
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
