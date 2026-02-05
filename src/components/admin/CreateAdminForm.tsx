import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Eye, EyeOff, Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface CreateAdminFormProps {
  onSuccess: () => void;
}

export function CreateAdminForm({ onSuccess }: CreateAdminFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password || !fullName.trim()) {
      toast({ 
        title: 'Validation Error', 
        description: 'Email, password, and full name are required',
        variant: 'destructive' 
      });
      return;
    }

    if (password.length < 6) {
      toast({ 
        title: 'Validation Error', 
        description: 'Password must be at least 6 characters',
        variant: 'destructive' 
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({ 
        title: 'Validation Error', 
        description: 'Passwords do not match',
        variant: 'destructive' 
      });
      return;
    }

    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({ 
          title: 'Error', 
          description: 'Please sign in again',
          variant: 'destructive' 
        });
        setLoading(false);
        return;
      }

      // SIMPLE METHOD: Create invitation only
      // User will become admin when they sign up with this email
      const { error: inviteError } = await supabase
        .from('admin_invitations')
        .insert({
          email: email.trim().toLowerCase(),
          invited_by: user.id,
        });

      if (inviteError) {
        if (inviteError.code === '23505') { // Unique violation - already invited
          // Check if user already exists and make them admin
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('email', email.trim().toLowerCase())
            .maybeSingle();

          if (existingProfile) {
            // Make existing user admin
            const { error: roleError } = await supabase
              .from('user_roles')
              .upsert({
                user_id: existingProfile.user_id,
                role: 'admin',
              }, { onConflict: 'user_id' });

            if (roleError) throw roleError;

            // Mark invitation as used
            await supabase
              .from('admin_invitations')
              .update({ used_at: new Date().toISOString() })
              .eq('email', email.trim().toLowerCase());

            toast({ 
              title: 'Success', 
              description: 'Existing user upgraded to admin successfully.'
            });
            resetForm();
            onSuccess();
          } else {
            toast({ 
              title: 'Already Invited', 
              description: 'This email has already been invited as admin.'
            });
          }
        } else {
          throw inviteError;
        }
      } else {
        toast({ 
          title: 'Admin Invited', 
          description: `${email} has been invited as admin. They need to sign up with this email.`
        });
        resetForm();
        onSuccess();
      }

    } catch (error: any) {
      console.error('Error creating admin:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create admin invitation',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Invite New Admin
        </CardTitle>
        <CardDescription>
          Invite a user as admin. They will become admin when they sign up with the invited email.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password (For Reference)</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Tell user to use this password"
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 1234567890"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full sm:w-auto">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating Invitation...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite as Admin
              </>
            )}
          </Button>
          
        </form>
      </CardContent>
    </Card>
  );
}