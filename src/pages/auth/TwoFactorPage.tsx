import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';
import { Shield, Loader2 } from 'lucide-react';

type TwoFactorState = {
  email: string;
  password: string;
  redirectTo?: string;
};

export default function TwoFactorPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const { toast } = useToast();

  const state = location.state as TwoFactorState | null;
  const hasCredentials = !!state?.email && !!state?.password;

  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const maskedEmail = useMemo(() => {
    if (!state?.email) return '';
    const [name, domain] = state.email.split('@');
    if (!domain) return state.email;
    const safeName = name.length > 2 ? `${name.slice(0, 2)}***` : `${name}***`;
    return `${safeName}@${domain}`;
  }, [state?.email]);

  useEffect(() => {
    if (!hasCredentials) {
      toast({
        variant: 'destructive',
        title: 'Session expired',
        description: 'Please sign in again to continue.',
      });
      navigate('/auth/login', {
        replace: true,
        state: state?.redirectTo ? { redirectTo: state.redirectTo } : undefined,
      });
    }
  }, [hasCredentials, navigate, state?.redirectTo, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError(null);

    if (!/^\d{6}$/.test(code)) {
      setCodeError('Enter the 6-digit code from your authenticator app');
      return;
    }

    if (!state) {
      return;
    }

    setIsLoading(true);
    try {
      await login(state.email, state.password, code);
      navigate(state.redirectTo || '/dashboard', { replace: true });
    } catch (error) {
      if (error instanceof ApiError && error.error === 'two_factor_invalid') {
        setCodeError('Invalid two-factor code');
        return;
      }

      if (error instanceof ApiError && error.error === 'two_factor_required') {
        setCodeError('Two-factor code required');
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

  const handleChange = (value: string) => {
    const normalized = value.replace(/\D/g, '').slice(0, 6);
    setCode(normalized);
    if (codeError) {
      setCodeError(null);
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
            <CardTitle className="text-2xl font-bold">Two-factor verification</CardTitle>
            <CardDescription className="mt-2">
              Enter the 6-digit code for {maskedEmail || 'your account'}
            </CardDescription>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="twoFactorCode">Two-factor code</Label>
              <Input
                id="twoFactorCode"
                type="text"
                inputMode="numeric"
                placeholder="xxxxxx"
                value={code}
                onChange={(e) => handleChange(e.target.value)}
                disabled={isLoading}
              />
              {codeError && (
                <p className="text-sm text-destructive">{codeError}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </Button>
            <p className="text-sm text-muted-foreground text-center">
              Wrong account?{' '}
              <Link to="/auth/login" className="text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
