import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

export interface QuoteCartItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  specifications: string | null;
  quantity: number;
  customSpecs?: string;
}

// Interface for what we actually store in localStorage (without heavy data)
interface StoredCartItem {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  specifications: string | null;
  quantity: number;
  customSpecs?: string;
  // We DON'T store image_url in localStorage
}

interface QuoteCartContextType {
  items: QuoteCartItem[];
  addItem: (product: Omit<QuoteCartItem, 'quantity' | 'customSpecs'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateCustomSpecs: (productId: string, specs: string) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
  totalItems: number;
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'quote_cart_items';

export function QuoteCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>(() => {
    // Load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        try {
          const storedItems: StoredCartItem[] = JSON.parse(saved);
          // Convert stored items back to full items (image_url will be null, to be fetched from DB)
          return storedItems.map(item => ({
            ...item,
            image_url: null // We'll fetch this from the database when needed
          }));
        } catch {
          console.error('Failed to parse cart data from localStorage');
          return [];
        }
      }
    }
    return [];
  });

  // Persist to localStorage whenever items change (WITHOUT image_url)
  useEffect(() => {
    try {
      // Create a lightweight version without image_url for storage
      const itemsToStore: StoredCartItem[] = items.map(item => ({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        specifications: item.specifications,
        quantity: item.quantity,
        customSpecs: item.customSpecs || ''
      }));
      
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(itemsToStore));
      console.log('Saved cart to localStorage, size:', 
        JSON.stringify(itemsToStore).length, 'bytes');
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error);
      
      // If localStorage is full, try to clear some space
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('LocalStorage full, attempting to clear old data...');
        
        // Clear the cart as last resort
        localStorage.removeItem(CART_STORAGE_KEY);
        
        // You could also clear other non-essential localStorage items
        const keysToKeep = ['supabase.auth.token', 'user-session']; // Keep auth tokens
        Object.keys(localStorage).forEach(key => {
          if (!keysToKeep.includes(key)) {
            localStorage.removeItem(key);
          }
        });
      }
    }
  }, [items]);

  const addItem = (product: Omit<QuoteCartItem, 'quantity' | 'customSpecs'>) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        // Increment quantity if already in cart
        return prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      // Add new item with quantity 1
      return [...prev, { 
        ...product, 
        quantity: 1, 
        customSpecs: '',
        // Only store image_url if it's not a huge base64 string
        image_url: product.image_url && !product.image_url.startsWith('data:image') 
          ? product.image_url 
          : null
      }];
    });
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const updateCustomSpecs = (productId: string, specs: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === productId ? { ...item, customSpecs: specs } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const isInCart = (productId: string) => {
    return items.some((item) => item.id === productId);
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        updateCustomSpecs,
        clearCart,
        isInCart,
        totalItems,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  );
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext);
  if (context === undefined) {
    throw new Error('useQuoteCart must be used within a QuoteCartProvider');
  }
  return context;
}