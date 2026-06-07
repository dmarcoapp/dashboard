import { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';
import { appConfig } from '@/lib/app-config';
import { Shield, Mail, Lock, Loader2 } from 'lucide-react';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [hasLoginFailed, setHasLoginFailed] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const authState = location.state as
    | { from?: { pathname?: string; search?: string; hash?: string }; redirectTo?: string }
    | null;
  const redirectTo = authState?.redirectTo
    ?? (authState?.from
      ? `${authState.from.pathname ?? ''}${authState.from.search ?? ''}${authState.from.hash ?? ''}`
      : '/dashboard');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const fieldErrors: { email?: string; password?: string } = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as 'email' | 'password'] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password);
      navigate(redirectTo || '/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.error === 'two_factor_required') {
        setHasLoginFailed(false);
        navigate('/auth/two-factor', {
          state: { email, password, redirectTo },
          replace: true,
        });
        return;
      }

      setHasLoginFailed(true);
      const message = error instanceof ApiError ? error.message : 'An error occurred during login';
      toast({
        variant: 'destructive',
        title: 'Login failed',
        description: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setErrors({ email: 'Please enter your email address first' });
      return;
    }

    const emailValidation = loginSchema.shape.email.safeParse(email);
    if (!emailValidation.success) {
      setErrors({ email: emailValidation.error.errors[0].message });
      return;
    }

    setIsResending(true);
    try {
      await authService.resendVerification(email);
      toast({
        title: 'Verification email sent',
        description: 'Please check your inbox for the verification link.',
      });
    } catch (error) {
      const message = error instanceof ApiError 
        ? error.message 
        : 'Failed to resend verification email';
      toast({
        variant: 'destructive',
        title: 'Error',
        description: message,
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="mt-2">
              Sign in to your DMARCo account
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link 
                  to="/auth/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>

          </CardContent>
          
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>
            
            {!appConfig.disableRegistration && (
              <p className="text-sm text-muted-foreground text-center">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            )}
            
            {hasLoginFailed && (
              <p className="text-sm text-muted-foreground text-center">
                Didn't receive verification email?{' '}
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={isResending}
                  className="text-primary hover:underline disabled:opacity-50"
                >
                  {isResending ? 'Sending...' : 'Resend'}
                </button>
              </p>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
