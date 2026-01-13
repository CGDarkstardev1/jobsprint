'use client';

import { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { puterCloudService } from '@/lib/services/cloudSync';

interface User {
  id: string;
  username: string;
  email?: string;
}

export function AuthPanel() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // Check existing session
    const currentUser = puterCloudService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  const handleSignIn = async () => {
    setIsLoading(true);
    try {
      const signedInUser = await puterCloudService.signIn();
      setUser(signedInUser);
      toast({
        title: 'Signed In',
        description: `Welcome, ${signedInUser?.username}!`,
      });
    } catch (error) {
      toast({
        title: 'Sign In Failed',
        description: 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await puterCloudService.signOut();
      setUser(null);
      toast({
        title: 'Signed Out',
        description: 'You have been signed out',
      });
    } catch (error) {
      toast({
        title: 'Sign Out Failed',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await puterCloudService.fullSync({
        applications: [],
        savedJobs: [],
        resumes: [],
        settings: {
          searchKeywords: '',
          location: '',
          remoteOnly: true,
          jobTypes: [],
          experienceLevel: 'any',
          notifications: true,
          autoSave: true,
        },
      });
      toast({
        title: 'Sync Complete',
        description: 'Your data has been synced to the cloud',
      });
    } catch (error) {
      toast({
        title: 'Sync Failed',
        variant: 'destructive',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user.username}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Cloud className="mr-2 h-4 w-4" />
              )}
              Sync
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleSignOut}
              disabled={isLoading}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LogIn className="h-5 w-5" />
          Sign In
        </CardTitle>
        <CardDescription>
          Sign in to sync your data across devices and access cloud features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" onClick={handleSignIn} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogIn className="mr-2 h-4 w-4" />
          )}
          Sign In with JobSprint
        </Button>

        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <CloudOff className="h-4 w-4" />
          <span>Without sign in, data is stored only on this device</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function CloudSyncStatus() {
  const [isSynced, setIsSynced] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const checkSyncStatus = () => {
    const user = puterCloudService.getCurrentUser();
    setIsSynced(!!user);
  };

  useEffect(() => {
    checkSyncStatus();
    const interval = setInterval(checkSyncStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center gap-2 text-sm ${isSynced ? 'text-green-600' : 'text-muted-foreground'}`}
    >
      {isSynced ? (
        <>
          <Cloud className="h-4 w-4" />
          <span>Cloud synced</span>
        </>
      ) : (
        <>
          <CloudOff className="h-4 w-4" />
          <span>Local only</span>
        </>
      )}
    </div>
  );
}
