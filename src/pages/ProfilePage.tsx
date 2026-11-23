import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userService } from '@/services/user-service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { ApiError } from '@/lib/api-client';
import { Loader2, User, Lock } from 'lucide-react';
import type { TwoFactorProfile } from '@/types/api';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [name, setName] = useState(user?.name ?? '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  const [disableTwoFactorDialogOpen, setDisableTwoFactorDialogOpen] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [isEnablingTwoFactor, setIsEnablingTwoFactor] = useState(false);
  const [isDisablingTwoFactor, setIsDisablingTwoFactor] = useState(false);
  const [twoFactor, setTwoFactor] = useState<TwoFactorProfile | null>(null);
  const [isTwoFactorLoading, setIsTwoFactorLoading] = useState(true);

  const twoFactorQrSrc = (() => {
    if (!twoFactor?.twoFactorAppQrContent) return null;
    if (twoFactor.twoFactorAppQrContent.startsWith('data:')) {
      return twoFactor.twoFactorAppQrContent;
    }
    return `data:image/png;base64,${twoFactor.twoFactorAppQrContent}`;
  })();

  const refreshTwoFactor = useCallback(async () => {
    setIsTwoFactorLoading(true);
    try {
      const twoFactorData = await userService.getTwoFactorProfile();
      setTwoFactor(twoFactorData);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to load two-factor authentication settings',
        description: error instanceof ApiError ? error.message : 'An error occurred',
      });
    } finally {
      setIsTwoFactorLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    refreshTwoFactor();
  }, [refreshTwoFactor]);

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      toast({ variant: 'destructive', title: 'Name must be at least 1 character' });
      return;
    }
    if (trimmedName.length > 255) {
      toast({ variant: 'destructive', title: 'Name must be less than 255 characters' });
      return;
    }
    setIsUpdatingName(true);
    try {
      await userService.updateProfile({ name: trimmedName });
      await refreshUser();
      toast({ title: 'Profile updated successfully' });
    } catch (error) {
      toast({ variant: 'destructive', title: 'Failed to update profile', description: error instanceof ApiError ? error.message : 'An error occurred' });
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      toast({ variant: 'destructive', title: 'Enter your current password' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: "Passwords don't match" });
      return;
    }
    if (newPassword.length < 8) {
      toast({ variant: 'destructive', title: "Password must be at least 8 characters" });
      return;
    }
    setIsChangingPassword(true);
    try {
      await userService.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'Password changed successfully' });
    } catch (error) {
      // The only 400 this endpoint returns for a password change is a current
      // password that does not match, and the generic error envelope hides the
      // reason, so name it here rather than showing "Request failed".
      const description = error instanceof ApiError && error.status === 400
        ? 'Your current password is incorrect'
        : error instanceof ApiError ? error.message : 'An error occurred';
      toast({ variant: 'destructive', title: 'Failed to change password', description });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEnableTwoFactor = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = twoFactorCode.trim();
    if (!trimmedCode) {
      toast({ variant: 'destructive', title: 'Please enter your authentication code' });
      return;
    }
    setIsEnablingTwoFactor(true);
    try {
      await userService.enableTwoFactorApp(trimmedCode);
      await refreshTwoFactor();
      setTwoFactorCode('');
      toast({ title: 'Two-factor authentication enabled' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to enable two-factor authentication',
        description: error instanceof ApiError ? error.message : 'An error occurred',
      });
    } finally {
      setIsEnablingTwoFactor(false);
    }
  };

  const handleDisableTwoFactor = async () => {
    setIsDisablingTwoFactor(true);
    try {
      await userService.disableTwoFactorApp();
      await refreshTwoFactor();
      setDisableTwoFactorDialogOpen(false);
      toast({ title: 'Two-factor authentication disabled' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Failed to disable two-factor authentication',
        description: error instanceof ApiError ? error.message : 'An error occurred',
      });
    } finally {
      setIsDisablingTwoFactor(false);
    }
  };

  return (
    <div className="space-y-4 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> Profile Information</CardTitle>
          <CardDescription>Update your account details</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateName} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} minLength={1} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user?.email ?? ''} disabled className="bg-muted" />
            </div>
            <Button type="submit" disabled={isUpdatingName}>
              {isUpdatingName && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Change Password</CardTitle>
          <CardDescription>Update your password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input id="currentPassword" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input id="newPassword" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input id="confirmPassword" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Two-Factor Authentication</CardTitle>
          <CardDescription>A code from an authenticator app at every sign-in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isTwoFactorLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading two-factor settings...
            </div>
          ) : (
            <>
          <div className="text-sm text-muted-foreground">
            Status:{' '}
            <span className="font-medium text-foreground">
              {twoFactor?.twoFactorAppEnabled ? 'On' : 'Off'}
            </span>
          </div>
          {twoFactor?.twoFactorAppEnabled ? (
            <div className="space-y-3">
              {(() => {
                const disableTrigger = (
                  <Button type="button" variant="destructive">
                    Turn off
                  </Button>
                );

                const disableButton = (
                  <Button
                    variant="destructive"
                    onClick={handleDisableTwoFactor}
                    disabled={isDisablingTwoFactor}
                  >
                    {isDisablingTwoFactor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Turn off
                  </Button>
                );

                if (isMobile) {
                  return (
                    <Drawer open={disableTwoFactorDialogOpen} onOpenChange={setDisableTwoFactorDialogOpen}>
                      <DrawerTrigger asChild>
                        {disableTrigger}
                      </DrawerTrigger>
                      <DrawerContent>
                        <DrawerHeader className="text-left">
                          <DrawerTitle>Turn off two-factor authentication?</DrawerTitle>
                          <DrawerDescription>
                            Signing in will need only your password.
                          </DrawerDescription>
                        </DrawerHeader>
                        <DrawerFooter className="pt-2">
                          {disableButton}
                          <DrawerClose asChild>
                            <Button variant="outline">Cancel</Button>
                          </DrawerClose>
                        </DrawerFooter>
                      </DrawerContent>
                    </Drawer>
                  );
                }

                return (
                  <AlertDialog open={disableTwoFactorDialogOpen} onOpenChange={setDisableTwoFactorDialogOpen}>
                    <AlertDialogTrigger asChild>
                      {disableTrigger}
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Turn off two-factor authentication?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Signing in will need only your password.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        {disableButton}
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                To turn it on, scan the QR code with an authenticator app, then enter the 6-digit code it shows.
              </p>
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                {twoFactorQrSrc ? (
                  <img
                    src={twoFactorQrSrc}
                    alt="Two-factor authentication QR code"
                    className="h-40 w-40 rounded-md border border-border bg-background object-contain p-2"
                  />
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                    QR code unavailable
                  </div>
                )}
                {twoFactor?.twoFactorAppSecret && (
                  <div className="space-y-1">
                    <Label className="text-xs uppercase text-muted-foreground">Secret key</Label>
                    <p className="font-mono text-sm break-all">{twoFactor.twoFactorAppSecret}</p>
                  </div>
                )}
              </div>
              <form onSubmit={handleEnableTwoFactor} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="w-full">
                  <Label htmlFor="twoFactorEnableCode">Authentication code</Label>
                  <Input
                    id="twoFactorEnableCode"
                    type="text"
                    inputMode="numeric"
                    placeholder="xxxxxx"
                    value={twoFactorCode}
                    maxLength={6}
                    pattern="\\d{6}"
                    onChange={(e) => {
                      const nextValue = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setTwoFactorCode(nextValue);
                    }}
                  />
                </div>
                <Button type="submit" disabled={isEnablingTwoFactor}>
                  {isEnablingTwoFactor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Turn on
                </Button>
              </form>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
