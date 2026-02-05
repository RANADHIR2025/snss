import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AdminVerificationProps {
  onVerified: () => void;
}

export function AdminVerification({ onVerified }: AdminVerificationProps) {
  const { user, showAdminUI } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'checking' | 'verified' | 'not-authorized'>('checking');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    verifyAdminAccess();
  }, [user, showAdminUI]);

  const verifyAdminAccess = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    // Verify from database that user has admin role (server-side is the source of truth)
    if (showAdminUI) {
      setStep('verified');
      toast({
        title: 'Admin Verified',
        description: 'Welcome to the admin panel.',
      });
      onVerified();
    } else {
      setStep('not-authorized');
      toast({
        title: 'Not Authorized',
        description: 'Your account does not have admin privileges.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Verifying admin access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-card border border-border/50 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-2xl font-bold text-foreground">Admin Verification</h1>
            <p className="text-muted-foreground mt-2">
              Access verification required
            </p>
          </div>

          {step === 'verified' && (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-green-600 font-medium">Verification Complete!</p>
              <p className="text-sm text-muted-foreground mt-1">Redirecting to admin panel...</p>
            </div>
          )}

          {step === 'not-authorized' && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                <p className="text-red-600 font-medium">Access Denied</p>
                <p className="text-sm text-muted-foreground mt-1">
                  You don't have admin privileges. Contact an existing admin to request an invitation.
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}