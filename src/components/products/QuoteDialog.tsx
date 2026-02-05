import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Send, Package, Loader2, Minus, Plus } from 'lucide-react';
import { validateProductQuote } from '@/lib/validationSchemas';

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  specifications: string | null;
  category: string | null;
}

interface QuoteDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuoteDialog({ product, open, onOpenChange }: QuoteDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [customSpecs, setCustomSpecs] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit a quote request.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (!product) return;

    // Validate inputs
    const validation = validateProductQuote({
      product_id: product.id,
      quantity: quantity,
      product_specifications: customSpecs || product.specifications || null,
      message: message,
    });

    if (!validation.success) {
      const firstError = validation.error.errors[0];
      toast({
        title: 'Validation Error',
        description: firstError?.message || 'Please check your inputs',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);

    const { data: insertData, error } = await supabase.from('quote_requests').insert({
      user_id: user.id,
      subject: `Quote Request: ${product.name}`,
      message: message || `Interested in ${product.name}`,
      product_id: product.id,
      quantity: validation.data.quantity,
      product_specifications: validation.data.product_specifications,
    }).select('id').single();

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quote request. Please try again.',
        variant: 'destructive',
      });
    } else {
      // Send confirmation email
      try {
        if (insertData) {
          await supabase.functions.invoke('send-quote-confirmation', {
            body: { quote_request_id: insertData.id },
          });
        }
      } catch (emailError) {
        console.log('Email notification skipped');
      }

      toast({
        title: 'Quote Request Sent!',
        description: 'Our team will review your request and get back to you soon.',
      });
      onOpenChange(false);
      setQuantity(1);
      setCustomSpecs('');
      setMessage('');
    }

    setSubmitting(false);
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Request Quote
          </DialogTitle>
          <DialogDescription>
            Submit a quote request for {product.name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Product Info */}
          <div className="p-4 rounded-lg bg-muted/50 border border-border">
            <h4 className="font-semibold text-foreground mb-1">{product.name}</h4>
            {product.description && (
              <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
            )}
            {product.category && (
              <span className="inline-block px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs capitalize">
                {product.category}
              </span>
            )}
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <Label>Quantity</Label>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-24 text-center"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Specifications */}
          <div className="space-y-2">
            <Label htmlFor="specs">Specifications / Requirements</Label>
            <Textarea
              id="specs"
              placeholder={product.specifications || "Enter any specific requirements or customizations..."}
              value={customSpecs}
              onChange={(e) => setCustomSpecs(e.target.value)}
              rows={3}
            />
            {product.specifications && (
              <p className="text-xs text-muted-foreground">
                Default specs: {product.specifications}
              </p>
            )}
          </div>

          {/* Additional Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Additional Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Any additional notes or questions..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
            />
          </div>

          <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Sending Quote...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Quote Request
              </>
            )}
          </Button>

          {!user && (
            <p className="text-sm text-center text-muted-foreground">
              You'll need to{' '}
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="text-primary underline"
              >
                login
              </button>{' '}
              to submit a quote request.
            </p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
