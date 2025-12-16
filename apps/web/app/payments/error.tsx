/**
 * Payment Hub Error Boundary
 * 
 * @improvement Enhanced error boundary with actionable recovery (Next.js 16)
 * @benefit Better error UX with specific error messages and retry options
 */

'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

// Map known error codes to user-friendly messages
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  CONCURRENCY_CONFLICT: {
    title: 'Payment Modified',
    description: 'This payment was modified by another user. Please refresh and try again.',
  },
  SOD_VIOLATION: {
    title: 'Authorization Error',
    description: 'You cannot approve a payment you created (Segregation of Duties policy).',
  },
  PERIOD_CLOSED: {
    title: 'Period Closed',
    description: 'The fiscal period for this payment is closed. Contact your administrator.',
  },
  NOT_FOUND: {
    title: 'Payment Not Found',
    description: 'The requested payment could not be found or may have been deleted.',
  },
  INVALID_STATE: {
    title: 'Invalid Operation',
    description: 'This action cannot be performed on a payment in its current status.',
  },
};

export default function PaymentError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service
    console.error('[Payment Hub Error]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  // Try to extract error code from message
  const errorCode = Object.keys(ERROR_MESSAGES).find((code) =>
    error.message.includes(code) || error.name === code
  );

  const errorInfo = errorCode
    ? ERROR_MESSAGES[errorCode]
    : {
      title: 'Payment Hub Error',
      description: error.message || 'An unexpected error occurred while loading the payment hub.',
    };

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-xl">{errorInfo.title}</CardTitle>
          <CardDescription>{errorInfo.description}</CardDescription>
        </CardHeader>

        <CardContent>
          {error.digest && (
            <Alert variant="outline" className="mb-4">
              <Bug className="h-4 w-4" />
              <AlertTitle>Error Reference</AlertTitle>
              <AlertDescription className="font-mono text-xs">
                {error.digest}
              </AlertDescription>
            </Alert>
          )}

          {process.env.NODE_ENV === 'development' && error.stack && (
            <details className="mt-4">
              <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 max-h-40 overflow-auto rounded bg-muted p-3 text-xs">
                {error.stack}
              </pre>
            </details>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button onClick={reset} className="w-full" variant="default">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => (window.location.href = '/')}
            className="w-full"
            variant="outline"
          >
            <Home className="mr-2 h-4 w-4" />
            Go to Dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
