import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, User, Lock, Copy, Check, Trash2 } from 'lucide-react';
import type { TwoFactorProfile } from '@/types/api';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  
  const [name, setName] = useState(user?.name ?? '');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
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

  const handleCopyPostbox = async () => {
    if (user?.sharedAggregatePostboxAddress) {
      await navigator.clipboard.writeText('mailto:'+user.sharedAggregatePostboxAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

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

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== user?.email) {
      toast({ variant: 'destructive', title: 'Email does not match your account email' });
      return;
    }
    
    setIsDeleting(true);
    try {
      await userService.deleteAccount(deleteConfirmEmail);
      await logout();
      navigate('/auth/login', { replace: true });
      toast({ title: 'Account deleted successfully' });
    } catch (error) {
      toast({ 
        variant: 'destructive', 
        title: 'Failed to delete account', 
        description: error instanceof ApiError ? error.message : 'An error occurred' 
      });
    } finally {
      setIsDeleting(false);
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
            <div className="space-y-2">
              <Label htmlFor="postbox">DMARCo Reporting URI for Aggregate</Label>
              <div className="relative">
                <Input id="postbox" value={`mailto:${user?.sharedAggregatePostboxAddress ?? ''}`} disabled className="bg-muted font-mono text-xs pr-10" />
                <Button type="button" variant="ghost" size="icon" onClick={handleCopyPostbox} className="absolute right-0 top-0 h-full">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
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
          <CardDescription>Secure your account</CardDescription>
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
            Current method:{' '}
            <span className="font-medium text-foreground">
              {twoFactor?.twoFactorMethod === 'app' ? 'App' : 'Email'}
            </span>
          </div>
          {twoFactor?.twoFactorAppEnabled ? (
            <div className="space-y-3">
              {(() => {
                const disableTrigger = (
                  <Button type="button" variant="destructive">
                    Switch back to email
                  </Button>
                );

                const disableButton = (
                  <Button
                    variant="destructive"
                    onClick={handleDisableTwoFactor}
                    disabled={isDisablingTwoFactor}
                  >
                    {isDisablingTwoFactor && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Switch back
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
                          <DrawerTitle>Disable app method?</DrawerTitle>
                          <DrawerDescription>
                            This will reset to the default email method.
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
                        <AlertDialogTitle>Disable app method?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will reset to the default email method.
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
                Scan the QR code with your authenticator app, then enter the 6-digit code to switch to App method.
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
                  Switch to App Method
                </Button>
              </form>
            </div>
          )}
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This action cannot be undone. All your data, including domains and reports, will be permanently deleted.
          </p>
          {(() => {
            const deleteTrigger = (
              <Button variant="destructive">Delete Account</Button>
            );

            const deleteFormContent = (
              <div className="space-y-2 py-4">
                <Label htmlFor="confirmEmail">Type your email to confirm: <span className="font-mono text-foreground break-all">{user?.email}</span></Label>
                <Input 
                  id="confirmEmail" 
                  type="email"
                  placeholder="Enter your email"
                  value={deleteConfirmEmail} 
                  onChange={(e) => setDeleteConfirmEmail(e.target.value)} 
                />
              </div>
            );

            const deleteButton = (
              <Button 
                variant="destructive" 
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmEmail !== user?.email}
              >
                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete Account
              </Button>
            );

            const handleOpenChange = (open: boolean) => {
              setDeleteDialogOpen(open);
              if (!open) setDeleteConfirmEmail('');
            };

            if (isMobile) {
              return (
                <Drawer open={deleteDialogOpen} onOpenChange={handleOpenChange}>
                  <DrawerTrigger asChild>
                    {deleteTrigger}
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                      <DrawerDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4">
                      {deleteFormContent}
                    </div>
                    <DrawerFooter className="pt-2">
                      {deleteButton}
                      <DrawerClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              );
            }

            return (
              <AlertDialog open={deleteDialogOpen} onOpenChange={handleOpenChange}>
                <AlertDialogTrigger asChild>
                  {deleteTrigger}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {deleteFormContent}
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    {deleteButton}
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
}
