import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Use Supabase Auth's built-in reset password
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setEmailSent(true);
      toast({
        title: 'Email sent successfully',
        description: 'Check your inbox for password reset instructions. If you don\'t see it, check your spam folder.',
      });

    } catch (err: any) {
      console.error('Reset request error:', err);
      
      // Still show success to prevent email enumeration attacks
      setEmailSent(true);
      toast({
        title: 'Email sent',
        description: 'If an account exists with this email, you will receive password reset instructions.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Background elements similar to auth page */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />
      
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10"
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      <div className="relative min-h-screen flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Logo Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex flex-col items-center gap-4 mb-6">
              <motion.div
                animate={{ 
                  rotate: [0, 5, 0, -5, 0],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <img 
                  src="/finallogo.png" 
                  alt="SNSS Logo" 
                  className="w-16 h-16 md:w-20 md:h-20 object-contain drop-shadow-lg"
                />
              </motion.div>
            </Link>
            
            <div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                Reset Your Password
              </h1>
              <p className="text-muted-foreground mt-2 text-sm md:text-base">
                Enter your email to receive reset instructions
              </p>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
            {emailSent ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-4"
              >
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">
                  Check Your Email
                </h2>
                <p className="text-muted-foreground">
                  We've sent password reset instructions to <span className="font-medium text-foreground">{email}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  The link will expire in 1 hour. If you don't see the email, check your spam folder.
                </p>
                
                <div className="pt-4 space-y-3">
                  <Button
                    onClick={() => {
                      setEmailSent(false);
                      setEmail('');
                    }}
                    variant="outline"
                    className="w-full"
                  >
                    Send to a different email
                  </Button>
                  <Button
                    onClick={() => navigate('/auth')}
                    variant="ghost"
                    className="w-full"
                  >
                    Back to Sign In
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        disabled={loading}
                      />
                    </div>
                    {error && (
                      <p className="text-sm text-destructive">
                        {error}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      variant="hero" 
                      size="lg" 
                      className="w-full h-12 font-semibold rounded-xl shadow-lg"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Sending instructions...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </Button>
                  </div>
                </form>

                <div className="mt-6 pt-4 border-t border-border/30 text-center">
                  <Link
                    to="/auth"
                    className="inline-flex items-center text-sm text-primary font-medium hover:underline"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Sign In
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* Footer Note */}
          <div className="mt-8 text-center">
            <p className="text-xs text-muted-foreground">
              © 2026 SNSS. All rights reserved.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}