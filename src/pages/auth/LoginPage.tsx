import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';
import { Shield, Mail, Lock, Loader2, Terminal } from 'lucide-react';
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
  const [accountExists, setAccountExists] = useState<boolean | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const authState = location.state as
    | { from?: { pathname?: string; search?: string; hash?: string }; redirectTo?: string }
    | null;
  const redirectTo = authState?.redirectTo
    ?? (authState?.from
      ? `${authState.from.pathname ?? ''}${authState.from.search ?? ''}${authState.from.hash ?? ''}`
      : '/dashboard');

  // Accounts are created on the server, so on a fresh install there is nobody
  // to sign in as. Say so instead of letting every attempt fail. A backend too
  // old to answer just leaves the form as it is.
  useEffect(() => {
    let cancelled = false;
    authService
      .getStatus()
      .then((status) => {
        if (!cancelled) setAccountExists(status.accountExists);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

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
        navigate('/auth/two-factor', {
          state: { email, password, redirectTo },
          replace: true,
        });
        return;
      }

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">
              {accountExists === false ? 'Welcome to DMARCo' : 'Welcome back'}
            </CardTitle>
            <CardDescription className="mt-2">
              Sign in to your DMARCo account
            </CardDescription>
          </div>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {accountExists === false && (
              <div role="status" className="rounded-lg border border-border bg-muted/40 p-4 space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-primary" />
                  No account yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Create yours on the server, in the directory DMARCo is installed in:
                </p>
                <code className="block rounded bg-muted px-2 py-1.5 text-xs font-mono break-words">
                  docker compose exec php bin/console app:user:create
                </code>
              </div>
            )}

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
              <Label htmlFor="password">Password</Label>
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
            
            <p className="text-sm text-muted-foreground text-center">
              Forgot your password? Set a new one on the server with{' '}
              <code className="text-xs font-mono whitespace-nowrap">bin/console app:user:reset-password</code>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
