import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, CalendarDays, ShieldAlert } from 'lucide-react';
import { notificationsService } from '@/services/notifications-service';
import type { NotificationsApi } from '@/types/api';
import { ApiError } from '@/lib/api-client';
import { useToast } from '@/hooks/use-toast';
import { NotificationsPageSkeleton } from '@/components/skeletons';

type NotificationSettingKey = keyof NotificationsApi;
const SAVE_DEBOUNCE_MS = 500;

const areSettingsEqual = (a: NotificationsApi | null, b: NotificationsApi | null): boolean => {
  if (!a || !b) return false;
  return (
    a.unusualNewLoginNotificationEnabled === b.unusualNewLoginNotificationEnabled &&
    a.weeklyOverviewNotificationEnabled === b.weeklyOverviewNotificationEnabled
  );
};

export default function NotificationsPage() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<NotificationsApi | null>(null);
  const [syncedSettings, setSyncedSettings] = useState<NotificationsApi | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPendingChanges = useMemo(
    () => !areSettingsEqual(settings, syncedSettings),
    [settings, syncedSettings],
  );

  useEffect(() => {
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        const response = await notificationsService.getSettings();
        setSettings(response);
        setSyncedSettings(response);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Failed to load notification settings',
          description: error instanceof ApiError ? error.message : 'An error occurred',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [toast]);

  useEffect(() => {
    if (!settings || !syncedSettings || !hasPendingChanges) {
      return;
    }

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const updated = await notificationsService.updateSettings(settings);
        setSettings(updated);
        setSyncedSettings(updated);
        toast({ title: 'Notification settings updated' });
      } catch (error) {
        setSettings(syncedSettings);
        toast({
          variant: 'destructive',
          title: 'Failed to update notification settings',
          description: error instanceof ApiError ? error.message : 'An error occurred',
        });
      } finally {
        setIsSaving(false);
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [hasPendingChanges, settings, syncedSettings, toast]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleToggle = (key: NotificationSettingKey, checked: boolean) => {
    if (!settings) return;
    setSettings((current) => (current ? { ...current, [key]: checked } : current));
  };

  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Notifications</h1>
        <p className="text-muted-foreground">Manage how we notify you</p>
      </div>

      {isLoading ? (
        <NotificationsPageSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 shrink-0" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Enable or disable specific account notifications</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {!settings ? (
              <p className="text-sm text-muted-foreground">
                Notification settings could not be loaded right now.
              </p>
            ) : (
              <>
                <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="unusual-login-notification" className="flex items-center gap-2 text-base">
                      <ShieldAlert className="h-4 w-4 shrink-0" />
                      Unusual new login
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when an unusual login is detected.
                    </p>
                  </div>
                  <Switch
                    id="unusual-login-notification"
                    checked={settings.unusualNewLoginNotificationEnabled}
                    onCheckedChange={(checked) => handleToggle('unusualNewLoginNotificationEnabled', checked)}
                    disabled={isSaving}
                    aria-label="Toggle unusual new login notification"
                  />
                </div>

                <div className="flex items-start justify-between gap-4 rounded-lg border border-border p-4">
                  <div className="space-y-1">
                    <Label htmlFor="weekly-overview-notification" className="flex items-center gap-2 text-base">
                      <CalendarDays className="h-4 w-4 shrink-0" />
                      Weekly overview
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Get a weekly overview about your DMARC reports.
                    </p>
                  </div>
                  <Switch
                    id="weekly-overview-notification"
                    checked={settings.weeklyOverviewNotificationEnabled}
                    onCheckedChange={(checked) => handleToggle('weeklyOverviewNotificationEnabled', checked)}
                    disabled={isSaving}
                    aria-label="Toggle weekly overview notification"
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
