import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Loader2, Mail, Lock, User, Phone, ChevronRight, X, Check } from 'lucide-react';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

const signUpSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().min(10, 'Please enter a valid phone number').max(20),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Typewriter animation component
const TypewriterPlaceholder = ({ text, delay = 0, isActive = true }: { text: string; delay?: number; isActive?: boolean }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const typingSpeed = 100;
  const pauseTime = 2000;

  useEffect(() => {
    if (!isActive) {
      setDisplayedText('');
      setCurrentIndex(0);
      setIsDeleting(false);
      return;
    }

    let timer: NodeJS.Timeout;

    const startTyping = () => {
      timer = setTimeout(() => {
        if (!isDeleting && currentIndex < text.length) {
          setDisplayedText(text.substring(0, currentIndex + 1));
          setCurrentIndex(currentIndex + 1);
        } else if (!isDeleting && currentIndex === text.length) {
          setTimeout(() => setIsDeleting(true), pauseTime);
        } else if (isDeleting && currentIndex > 0) {
          setDisplayedText(text.substring(0, currentIndex - 1));
          setCurrentIndex(currentIndex - 1);
        } else if (isDeleting && currentIndex === 0) {
          setIsDeleting(false);
        }
      }, isDeleting ? typingSpeed / 2 : typingSpeed);
    };

    startTyping();

    return () => clearTimeout(timer);
  }, [currentIndex, isDeleting, text, isActive]);

  return (
    <span className="text-muted-foreground">
      {displayedText}
      {isActive && <span className="animate-pulse">|</span>}
    </span>
  );
};

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isSignUp, setIsSignUp] = useState(searchParams.get('mode') === 'signup');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [buttonHover, setButtonHover] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  
  // Track if user has just signed up/registered
  const [hasJustSubmitted, setHasJustSubmitted] = useState(false);

  const { signUp, signIn, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  // Reset placeholder animation when switching modes or after successful submission
  useEffect(() => {
    if (hasJustSubmitted) {
      // Reset form data and placeholder animation after successful signup
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        password: '',
      });
      setHasJustSubmitted(false);
    }
  }, [hasJustSubmitted, isSignUp]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // For signup, check terms agreement
    if (isSignUp && !agreedToTerms) {
      toast({
        title: 'Terms Required',
        description: 'Please agree to the Terms & Conditions to continue.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        const result = signUpSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.fullName, formData.phone);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: 'Account already exists',
              description: 'Please sign in instead or use a different email.',
              variant: 'destructive',
            });
          } else {
            toast({
              title: 'Sign up failed',
              description: error.message,
              variant: 'destructive',
            });
          }
        } else {
          try {
            await supabase.functions.invoke('send-welcome-email', {
              body: {
                user_id: 'new-user',
                email: formData.email,
                full_name: formData.fullName,
              },
            });
          } catch (emailError) {
            console.log('Welcome email skipped');
          }
          
          setHasJustSubmitted(true); // Trigger form reset
          toast({
            title: 'Account created!',
            description: 'Welcome to SNSS. A welcome email has been sent to you.',
          });
        }
      } else {
        const result = signInSchema.safeParse(formData);
        if (!result.success) {
          const fieldErrors: Record<string, string> = {};
          result.error.errors.forEach((err) => {
            if (err.path[0]) {
              fieldErrors[err.path[0] as string] = err.message;
            }
          });
          setErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const { error } = await signIn(formData.email, formData.password);
        if (error) {
          toast({
            title: 'Sign in failed',
            description: 'Invalid email or password. Please try again.',
            variant: 'destructive',
          });
        } else {
          setFormData({
            fullName: '',
            phone: '',
            email: '',
            password: '',
          });
          toast({
            title: 'Welcome back!',
            description: 'You have successfully signed in.',
          });
        }
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    }

    setLoading(false);
  };

  // Placeholder texts for typewriter effect
  const placeholders = {
    fullName: ["John Doe", "Jane Smith", "Alex Johnson"],
    phone: ["+1 (555) 123-4567", "+44 7911 123456", "+91 98765 43210"],
    email: ["mymail@gmail.com", "user@example.com", "hello@snss.com"],
    password: ["Enter your password", "Create a strong password", "Minimum 6 characters"]
  };

  // Get current placeholder based on mode and submission state
  const getPlaceholder = (field: keyof typeof placeholders) => {
    // After submission, show empty placeholder
    if (hasJustSubmitted) {
      return "";
    }
    return placeholders[field][0];
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5" />

        {/* Animated dots background */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
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

        <div className="relative min-h-screen flex items-center justify-center px-4 py-8 md:py-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
          >
            {/* Logo Header */}
            <motion.div 
              className="text-center mb-8 md:mb-10"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              <Link to="/" className="inline-flex flex-col items-center gap-4 mb-6">
                <div className="relative">
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
                </div>
              </Link>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">
                  {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                </h1>
                <p className="text-muted-foreground mt-2 text-sm md:text-base">
                  {isSignUp ? 'Join our community today' : 'Sign in to continue to your dashboard'}
                </p>
              </motion.div>
            </motion.div>

            {/* Form Container */}
            <div className="relative">
              {/* Mode Switch */}
              <div className="flex mb-6 relative bg-muted/30 backdrop-blur-sm rounded-full p-1 max-w-xs mx-auto border border-border/50">
                <motion.div 
                  className="absolute top-1 h-[calc(100%-0.5rem)] w-1/2 bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg"
                  initial={false}
                  animate={{ x: isSignUp ? '100%' : '0%' }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setErrors({});
                    setAgreedToTerms(false); // Reset terms agreement when switching modes
                  }}
                  className={`relative z-10 flex-1 py-3 text-center text-sm font-medium rounded-full transition-all duration-300 ${
                    !isSignUp ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setErrors({});
                  }}
                  className={`relative z-10 flex-1 py-3 text-center text-sm font-medium rounded-full transition-all duration-300 ${
                    isSignUp ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form Card */}
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-xl border border-border/50 p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <AnimatePresence mode="wait">
                    {isSignUp ? (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Full Name Field */}
                        <div className="space-y-2">
                          <Label htmlFor="fullName" className="text-sm font-medium">
                            Full Name
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="fullName"
                              name="fullName"
                              type="text"
                              placeholder=""
                              value={formData.fullName}
                              onChange={handleChange}
                              className={`pl-10 placeholder:text-transparent ${errors.fullName ? 'border-destructive' : 'border-border/70'}`}
                            />
                            {!formData.fullName && !hasJustSubmitted && (
                              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
                                <TypewriterPlaceholder 
                                  text={getPlaceholder('fullName')} 
                                  isActive={!hasJustSubmitted}
                                />
                              </div>
                            )}
                          </div>
                          {errors.fullName && (
                            <p className="text-sm text-destructive">
                              {errors.fullName}
                            </p>
                          )}
                        </div>

                        {/* Phone Field */}
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Phone Number
                          </Label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              placeholder=""
                              value={formData.phone}
                              onChange={handleChange}
                              className={`pl-10 placeholder:text-transparent ${errors.phone ? 'border-destructive' : 'border-border/70'}`}
                            />
                            {!formData.phone && !hasJustSubmitted && (
                              <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
                                <TypewriterPlaceholder 
                                  text={getPlaceholder('phone')} 
                                  isActive={!hasJustSubmitted}
                                />
                              </div>
                            )}
                          </div>
                          {errors.phone && (
                            <p className="text-sm text-destructive">
                              {errors.phone}
                            </p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="signin-fields"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      />
                    )}
                  </AnimatePresence>

                  {/* Email Field - Always visible */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder=""
                        value={formData.email}
                        onChange={handleChange}
                        className={`pl-10 placeholder:text-transparent ${errors.email ? 'border-destructive' : 'border-border/70'}`}
                      />
                      {!formData.email && !hasJustSubmitted && (
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
                          <TypewriterPlaceholder 
                            text={getPlaceholder('email')} 
                            isActive={!hasJustSubmitted}
                          />
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive">
                        {errors.email}
                      </p>
                    )}
                  </div>

                  {/* Password Field - Always visible */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="password" className="text-sm font-medium">
                        Password
                      </Label>
                      {!isSignUp && (
                        <Link 
                          to="/forgot-password" 
                          className="text-xs text-primary hover:underline font-medium"
                        >
                          Forgot Password?
                        </Link>
                      )}
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder=""
                        value={formData.password}
                        onChange={handleChange}
                        className={`pl-10 pr-12 placeholder:text-transparent ${errors.password ? 'border-destructive' : 'border-border/70'}`}
                      />
                      {!formData.password && !hasJustSubmitted && (
                        <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
                          <TypewriterPlaceholder 
                            text={getPlaceholder('password')} 
                            isActive={!hasJustSubmitted}
                          />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive">
                        {errors.password}
                      </p>
                    )}
                    {isSignUp && (
                      <p className="text-xs text-muted-foreground">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>

                  {/* Terms Agreement Checkbox (Only for Sign Up) */}
                  {isSignUp && (
                    <div className="flex items-start space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setAgreedToTerms(!agreedToTerms)}
                        className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          agreedToTerms 
                            ? 'bg-primary border-primary' 
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {agreedToTerms && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </button>
                      <div className="text-sm">
                        <span className="text-muted-foreground">I agree to the </span>
                        <button
                          type="button"
                          onClick={() => setShowTerms(true)}
                          className="text-primary font-medium hover:underline"
                        >
                          Terms & Conditions
                        </button>
                        {!agreedToTerms && errors.terms && (
                          <p className="text-sm text-destructive mt-1">
                            {errors.terms}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Submit Button - Enhanced styling */}
                  <div className="pt-4">
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button 
                        type="submit" 
                        variant="hero" 
                        size="lg" 
                        className="w-full h-12 font-semibold rounded-xl shadow-lg relative overflow-hidden group"
                        disabled={loading}
                        onMouseEnter={() => setButtonHover(true)}
                        onMouseLeave={() => setButtonHover(false)}
                      >
                        {/* Animated gradient background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/90 to-primary/80 group-hover:from-primary/90 group-hover:via-primary group-hover:to-primary/90 transition-all duration-500" />
                        
                        {/* Shine effect */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: buttonHover ? '200%' : '-100%' }}
                          transition={{ duration: 0.8 }}
                        />
                        
                        {/* Button content */}
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {isSignUp ? 'Creating Account...' : 'Signing In...'}
                            </>
                          ) : (
                            <>
                              {isSignUp ? 'Create Account' : 'Sign In'}
                              <motion.div
                                animate={{ x: buttonHover ? 5 : 0 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                <ChevronRight className="w-5 h-5" />
                              </motion.div>
                            </>
                          )}
                        </span>
                      </Button>
                    </motion.div>
                  </div>
                </form>

                {/* Sign Up/Sign In Toggle */}
                <div className="mt-8 pt-6 border-t border-border/30 text-center">
                  <p className="text-sm text-muted-foreground">
                    {isSignUp ? 'Already have an account? ' : 'Don\'t have an account? '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsSignUp(!isSignUp);
                        setErrors({});
                        setAgreedToTerms(false);
                        setFormData({
                          fullName: '',
                          phone: '',
                          email: '',
                          password: '',
                        });
                      }}
                      className="text-primary font-medium hover:underline"
                    >
                      {isSignUp ? 'Sign In' : 'Sign Up now'}
                    </button>
                  </p>
                </div>
              </div>
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

      {/* Terms & Conditions Modal */}
      <Dialog open={showTerms} onOpenChange={setShowTerms}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Terms & Conditions</span>
              <button
                onClick={() => setShowTerms(false)}
                className="rounded-full p-1 hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </DialogTitle>
            <DialogDescription>
              Please read and agree to our terms before creating an account.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">1. Acceptance of Terms</h3>
              <p>By accessing and using SNSS services, you accept and agree to be bound by the terms and provision of this agreement.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">2. User Account</h3>
              <p>You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">3. Privacy Policy</h3>
              <p>Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your personal information.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">4. Service Modifications</h3>
              <p>SNSS reserves the right to modify or discontinue, temporarily or permanently, the service with or without notice.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">5. Limitation of Liability</h3>
              <p>SNSS shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the service.</p>
            </div>
            
            <div className="bg-muted/30 p-4 rounded-lg">
              <h3 className="font-semibold text-foreground mb-2">6. Contact Information</h3>
              <p>For any questions about these Terms, please contact us at support@snss.com.</p>
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowTerms(false);
                setAgreedToTerms(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                setAgreedToTerms(true);
                setShowTerms(false);
              }}
              className="ml-2"
            >
              I Agree
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}