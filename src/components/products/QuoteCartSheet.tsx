import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useQuoteCart } from '@/hooks/useQuoteCart';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ShoppingCart, Package, Trash2, Minus, Plus, Send, Loader2, ImageOff, X, ChevronDown, ChevronUp } from 'lucide-react';
import { validateCart, validateProductQuote } from '@/lib/validationSchemas';

interface ProductImageCache {
  [productId: string]: string | null;
}

interface ExpandedItems {
  [key: string]: boolean;
}

export function QuoteCartSheet() {
  const { user } = useAuth();
  const { items, removeItem, updateQuantity, updateCustomSpecs, clearCart, totalItems } = useQuoteCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [imageCache, setImageCache] = useState<ProductImageCache>({});
  const [isMobile, setIsMobile] = useState(false);
  const [expandedItems, setExpandedItems] = useState<ExpandedItems>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [animateProgress, setAnimateProgress] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number>();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch images for products that don't have them
  useEffect(() => {
    const fetchMissingImages = async () => {
      const itemsNeedingImages = items.filter(item => 
        !item.image_url && !imageCache[item.id]
      );

      if (itemsNeedingImages.length === 0) return;

      try {
        const productIds = itemsNeedingImages.map(item => item.id);
        const { data: productsData, error } = await supabase
          .from('products')
          .select('id, image_url')
          .in('id', productIds);

        if (error) throw error;

        const newCache = { ...imageCache };
        productsData?.forEach(product => {
          newCache[product.id] = product.image_url;
        });

        setImageCache(newCache);
      } catch (error) {
        console.error('Error fetching product images:', error);
      }
    };

    if (open && items.length > 0) {
      fetchMissingImages();
    }
  }, [items, open, imageCache]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Start progress animation when animateProgress becomes true
  useEffect(() => {
    if (animateProgress && !submitting) {
      const startTime = Date.now();
      const duration = 3000; // 3 seconds for 0-100%
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const newProgress = Math.min((elapsed / duration) * 100, 100);
        
        setProgress(Math.round(newProgress));
        
        if (newProgress < 100) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          // Animation complete, submit the quote
          handleSubmitQuote();
        }
      };
      
      animationRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [animateProgress, submitting]);

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  // Start animation
  const handleStartAnimation = () => {
    if (submitting || animateProgress) return;
    
    setAnimateProgress(true);
    setProgress(0);
  };

  // Cancel animation
  const handleCancelAnimation = () => {
    setAnimateProgress(false);
    setProgress(0);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Handle submit quote
  const handleSubmitQuote = async () => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to submit a quote request.',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    if (items.length === 0) {
      toast({
        title: 'Cart Empty',
        description: 'Please add at least one product to your quote.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setAnimateProgress(false);

    const productNames = items.map((item) => `${item.name} (x${item.quantity})`).join(', ');
    const productDetails = items
      .map(
        (item) =>
          `• ${item.name}\n  Quantity: ${item.quantity}${item.customSpecs ? `\n  Specifications: ${item.customSpecs}` : ''}`
      )
      .join('\n\n');

    const combinedMessage = `Multi-Product Quote Request:\n\n${productDetails}${message ? `\n\nAdditional Notes:\n${message}` : ''}`;

    const quotePromises = items.map((item) =>
      supabase.from('quote_requests').insert({
        user_id: user.id,
        subject: `Quote Request: ${item.name}`,
        message: combinedMessage,
        product_id: item.id,
        quantity: item.quantity,
        product_specifications: item.customSpecs || item.specifications || null,
      }).select('id').single()
    );

    try {
      const results = await Promise.all(quotePromises);
      const hasError = results.some((result) => result.error);

      if (hasError) {
        toast({
          title: 'Error',
          description: 'Some quote requests failed. Please try again.',
          variant: 'destructive',
        });
      } else {
        try {
          const firstQuote = results[0]?.data;
          if (firstQuote) {
            await supabase.functions.invoke('send-quote-confirmation', {
              body: { quote_request_id: firstQuote.id },
            });
          }
        } catch (emailError) {
          console.log('Email notification skipped');
        }

        toast({
          title: 'Quote Request Sent!',
          description: `Successfully submitted quote request for ${items.length} product(s).`,
        });
        clearCart();
        setImageCache({});
        setMessage('');
        setOpen(false);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit quote request. Please try again.',
        variant: 'destructive',
      });
    }

    setSubmitting(false);
  };

  // Get image URL for a product
  const getProductImage = (itemId: string, storedImageUrl: string | null) => {
    // First check cache, then stored URL
    return imageCache[itemId] || storedImageUrl;
  };

  // Toggle item expansion with smooth animation
  const toggleItemExpansion = (itemId: string) => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    
    // Reset animation lock after animation completes
    setTimeout(() => setIsAnimating(false), 300);
  };

  if (!user) return null;

  // Mobile Cart Content with improved design
  const MobileCartContent = () => (
    <>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add products to request a combined quote
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 px-4 py-3">
            <div className="space-y-3">
              {items.map((item) => {
                const imageUrl = getProductImage(item.id, item.image_url);
                const isExpanded = expandedItems[item.id];
                
                return (
                  <div
                    key={item.id}
                    className="rounded-xl bg-card border border-border overflow-hidden transition-all duration-300"
                  >
                    {/* Item Header - Clickable */}
                    <button
                      onClick={() => toggleItemExpansion(item.id)}
                      className="w-full p-3 flex items-center justify-between hover:bg-accent/50 transition-colors active:bg-accent"
                      disabled={isAnimating}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {imageUrl ? (
                          <div className="w-14 h-14 rounded-lg bg-white border flex items-center justify-center overflow-hidden flex-shrink-0">
                            <img
                              src={imageUrl}
                              alt={item.name}
                              className="w-full h-full object-contain p-1"
                            />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                            <Package className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 text-left">
                          <h4 className="font-semibold text-foreground truncate text-sm">{item.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            {formatPrice(item.price) && (
                              <p className="text-sm font-medium text-primary">
                                {formatPrice(item.price)}
                              </p>
                            )}
                            <span className="text-xs text-muted-foreground">•</span>
                            <span className="text-xs text-muted-foreground">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform duration-300" />
                        )}
                      </div>
                    </button>

                    {/* Collapsible Content with smooth animation */}
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      }`}
                    >
                      <div className="px-3 pb-3 space-y-3">
                        <div className="pt-2 border-t border-border">
                          {/* Quantity Controls */}
                          <div className="flex items-center justify-between mb-3">
                            <Label className="text-sm font-medium">Quantity</Label>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, item.quantity - 1);
                                }}
                              >
                                <Minus className="w-3 h-3" />
                              </Button>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1));
                                }}
                                className="w-12 h-7 text-center text-xs px-1"
                                onClick={(e) => e.stopPropagation()}
                              />
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-7 w-7"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(item.id, item.quantity + 1);
                                }}
                              >
                                <Plus className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>

                          {/* Custom Specifications */}
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Custom Specifications</Label>
                            <Textarea
                              placeholder="Add specifications (optional)"
                              value={item.customSpecs || ''}
                              onChange={(e) => {
                                e.stopPropagation();
                                updateCustomSpecs(item.id, e.target.value);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              rows={2}
                              className="text-xs min-h-[60px] resize-none"
                            />
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full mt-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeItem(item.id);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Remove Item
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Additional Message */}
            {items.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border transition-all duration-300">
                <Label className="text-sm font-medium mb-2 block">Additional Notes (Optional)</Label>
                <Textarea
                  placeholder="Any additional notes for the admin..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="text-sm min-h-[80px] resize-none"
                />
              </div>
            )}
          </ScrollArea>

          {/* Animated Progress Button (Mobile only) */}
          {isMobile && items.length > 0 && (
            <div className="px-4 pt-4 border-t border-border bg-card sticky bottom-0">
              <div className="mb-3 text-center">
                <p className="text-sm font-medium text-foreground mb-1">
                  {animateProgress ? "Sending your quote..." : "Send quote request"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {items.length} item{items.length > 1 ? 's' : ''} • Final confirmation
                </p>
              </div>

              {/* Animated Progress Button Container */}
              <div className="relative">
                {animateProgress ? (
                  // Animation in progress
                  <div className="relative h-14 bg-primary/10 rounded-full overflow-hidden border border-primary/20">
                    {/* Progress bar background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10" />
                    
                    {/* Animated progress fill */}
                    <div 
                      className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 transition-all duration-150 ease-out"
                      style={{ 
                        transform: `translateX(-${100 - progress}%)`,
                        opacity: 0.8 + (progress / 100) * 0.2
                      }}
                    />
                    
                    {/* Percentage display */}
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span className="text-lg font-bold text-white">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                ) : submitting ? (
                  // Submitting state
                  <div className="relative h-14 bg-primary rounded-full overflow-hidden border border-primary">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="flex items-center gap-2">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                        <span className="text-sm font-semibold text-white">
                          Sending Quote...
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Initial state - Send button
                  <button
                    onClick={handleStartAnimation}
                    className="w-full h-14 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center transition-colors relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative z-10 flex items-center gap-2">
                      <Send className="w-5 h-5 text-white" />
                      <span className="text-sm font-semibold text-white">
                        Send Quote Request
                      </span>
                    </div>
                  </button>
                )}
                
                {/* Cancel button during animation */}
                {animateProgress && !submitting && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-3 text-muted-foreground hover:text-foreground"
                    onClick={handleCancelAnimation}
                  >
                    Cancel
                  </Button>
                )}
                
                {/* Cart actions when not animating/submitting */}
                {!animateProgress && !submitting && (
                  <div className="flex items-center justify-between mt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearCart}
                      disabled={submitting}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Clear All
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setOpen(false)}
                      disabled={submitting}
                      className="text-xs"
                    >
                      Continue Shopping
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Desktop/Tablet Submit Button */}
          {!isMobile && items.length > 0 && (
            <div className="px-4 pt-4 border-t border-border bg-card sticky bottom-0">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {items.length} item{items.length > 1 ? 's' : ''}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearCart}
                  disabled={submitting}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
                >
                  Clear Cart
                </Button>
              </div>

              <div className="space-y-2">
                <Button
                  variant="hero"
                  className="w-full"
                  onClick={handleSubmitQuote}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending Quote...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Quote Request ({items.length} items)
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );

  // Desktop Cart Content (original design)
  const DesktopCartContent = () => (
    <>
      {items.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
          <h3 className="font-semibold text-foreground mb-2">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Add products to request a combined quote
          </p>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Browse Products
          </Button>
        </div>
      ) : (
        <>
          <ScrollArea className="flex-1 -mx-6 px-6 py-4">
            <div className="space-y-4">
              {items.map((item) => {
                const imageUrl = getProductImage(item.id, item.image_url);
                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-card p-4 space-y-3"
                  >
                    <div className="flex gap-3">
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.name}
                          className="w-16 h-16 rounded-lg object-cover bg-muted"
                          onError={(e) => {
                            // If image fails to load, show placeholder
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            target.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`w-16 h-16 rounded-lg bg-muted flex items-center justify-center ${imageUrl ? 'hidden' : ''}`}>
                        <ImageOff className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{item.name}</h4>
                        {item.category && (
                          <span className="text-xs text-muted-foreground capitalize">
                            {item.category}
                          </span>
                        )}
                        {formatPrice(item.price) && (
                          <p className="text-sm font-medium text-primary mt-1">
                            {formatPrice(item.price)}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-3">
                      <Label className="text-sm text-muted-foreground">Qty:</Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            updateQuantity(item.id, Math.max(1, parseInt(e.target.value) || 1))
                          }
                          className="w-16 h-8 text-center text-sm"
                        />
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Custom Specifications */}
                    <div>
                      <Textarea
                        placeholder="Add custom specifications (optional)"
                        value={item.customSpecs || ''}
                        onChange={(e) => updateCustomSpecs(item.id, e.target.value)}
                        rows={2}
                        className="text-sm"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t border-border pt-4 space-y-4">
            {/* Additional Message */}
            <div className="space-y-2">
              <Label htmlFor="quote-message">Additional Notes (Optional)</Label>
              <Textarea
                id="quote-message"
                placeholder="Any additional notes for the admin..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="hero"
                className="w-full"
                onClick={handleSubmitQuote}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending Quote...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Send Quote Request ({items.length} items)
                  </>
                )}
              </Button>
              <Button variant="ghost" onClick={clearCart} disabled={submitting}>
                Clear Cart
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );

  // Trigger button component
  const TriggerButton = (
    <Button variant="outline" size="icon" className="relative" data-quote-cart-trigger>
      <ShoppingCart className="w-5 h-5" />
      {totalItems > 0 && (
        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
          {totalItems}
        </span>
      )}
    </Button>
  );

  // Render mobile drawer on mobile, sheet on desktop
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          {TriggerButton}
        </DrawerTrigger>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left px-4 py-3 border-b sticky top-0 bg-card z-10">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-primary" />
                  Quote Cart ({items.length} items)
                </DrawerTitle>
                <DrawerDescription>
                  Review products and send quote request
                </DrawerDescription>
              </div>
              <DrawerClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={() => {
                    handleCancelAnimation();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </DrawerClose>
            </div>
          </DrawerHeader>
          <div className="flex-1 overflow-auto">
            <MobileCartContent />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop version
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {TriggerButton}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            Quote Cart ({items.length} items)
          </SheetTitle>
          <SheetDescription>
            Review your selected products and submit a combined quote request
          </SheetDescription>
        </SheetHeader>
        <DesktopCartContent />
      </SheetContent>
    </Sheet>
  );
}