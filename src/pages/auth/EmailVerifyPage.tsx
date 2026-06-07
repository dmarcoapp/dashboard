import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authService } from '@/services/auth-service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ApiError } from '@/lib/api-client';
import { Shield, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function EmailVerifyPage() {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const email = searchParams.get('email');
  const token = searchParams.get('token');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!email || !token) {
        setStatus('error');
        setErrorMessage('Invalid verification link. Missing email or token.');
        return;
      }

      try {
        await authService.verifyEmail({ email, token });
        setStatus('success');
        toast({
          title: 'Email verified!',
          description: 'Your email has been successfully verified.',
        });
      } catch (error) {
        setStatus('error');
        setErrorMessage(
          error instanceof ApiError 
            ? error.message 
            : 'Failed to verify email. The link may have expired.'
        );
      }
    };

    verifyEmail();
  }, [email, token, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border/50">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Email Verification</CardTitle>
            <CardDescription className="mt-2">
              Verifying your email address
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent className="text-center">
          {status === 'loading' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="text-muted-foreground">Verifying your email...</p>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <CheckCircle className="h-12 w-12 text-success" />
              <div>
                <p className="font-medium">Email verified successfully!</p>
                <p className="text-muted-foreground text-sm mt-1">
                  You can now sign in to your account.
                </p>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex flex-col items-center gap-4 py-8">
              <XCircle className="h-12 w-12 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Verification failed</p>
                <p className="text-muted-foreground text-sm mt-1">{errorMessage}</p>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-center">
          <Button asChild>
            <Link to="/auth/login">Go to Sign In</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
