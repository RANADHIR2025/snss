import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Package,
  X,
  SlidersHorizontal,
  Flame,
  ShoppingCart,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
  Clock,
  Hash,
  Sparkles,
  RotateCcw,
  Zap,
  Award,
  CheckCircle,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuth } from "@/hooks/useAuth";
import { useQuoteCart } from "@/hooks/useQuoteCart";
import { useToast } from "@/hooks/use-toast";
import { QuoteCartSheet } from "@/components/products/QuoteCartSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  category_id: string | null;
  specifications: string | null;
  is_trending: boolean;
  is_active: boolean;
  created_at: string;
}

interface CategorySection {
  name: string;
  products: Product[];
}

interface SearchSuggestion {
  id: string;
  name: string;
  category: string | null;
  type: "product" | "category" | "trending";
}

// Search placeholder messages
const SEARCH_PLACEHOLDERS = [
  "Search for electrical components...",
  "Looking for fuses or switches?",
  "Find industrial products...",
  "Search by category or name...",
  "Type to discover products...",
  "Browse trending items...",
];

export default function ProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const {
    addItem,
    isInCart,
    removeItem,
    totalItems,
    items: cartItems,
  } = useQuoteCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState("newest");
  const [showTrendingOnly, setShowTrendingOnly] = useState(false);
  const [categorySections, setCategorySections] = useState<CategorySection[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);
  const [searchSuggestions, setSearchSuggestions] = useState<
    SearchSuggestion[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [placeholderCharIndex, setPlaceholderCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const placeholderIntervalRef = useRef<NodeJS.Timeout>();

  // Debug cart state
  useEffect(() => {
    console.log("Cart state:", {
      totalItems,
      items: cartItems,
      localStorage: localStorage.getItem("quote_cart_items"),
    });
  }, [cartItems, totalItems]);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = localStorage.getItem("recent_searches");
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  // Animated placeholder text
  useEffect(() => {
    const currentPlaceholder = SEARCH_PLACEHOLDERS[currentPlaceholderIndex];

    if (!isDeleting && placeholderCharIndex < currentPlaceholder.length) {
      // Typing
      placeholderIntervalRef.current = setTimeout(() => {
        setPlaceholderCharIndex((prev) => prev + 1);
      }, 50);
    } else if (
      !isDeleting &&
      placeholderCharIndex === currentPlaceholder.length
    ) {
      // Pause at full text
      placeholderIntervalRef.current = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && placeholderCharIndex > 0) {
      // Deleting
      placeholderIntervalRef.current = setTimeout(() => {
        setPlaceholderCharIndex((prev) => prev - 1);
      }, 30);
    } else if (isDeleting && placeholderCharIndex === 0) {
      // Move to next placeholder
      setIsDeleting(false);
      setCurrentPlaceholderIndex(
        (prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length,
      );
    }

    return () => {
      if (placeholderIntervalRef.current) {
        clearTimeout(placeholderIntervalRef.current);
      }
    };
  }, [placeholderCharIndex, currentPlaceholderIndex, isDeleting]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (user) {
      fetchProducts();
    }

    const channel = supabase
      .channel("products-page-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => {
          fetchProducts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(
          `
          *,
          categories:category_id (
            name
          )
        `,
        )
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;

      if (productsData) {
        const transformedProducts = productsData.map((item) => ({
          ...item,
          category: item.categories?.name || item.category || "Uncategorized",
          category_id: item.category_id,
        })) as Product[];

        setProducts(transformedProducts);

        const uniqueCategories = [
          ...new Set(
            transformedProducts.map((p) => p.category).filter(Boolean),
          ),
        ];
        setCategories(uniqueCategories as string[]);

        const groupedProducts: CategorySection[] = [];

        uniqueCategories.forEach((category) => {
          const categoryProducts = transformedProducts.filter(
            (p) => p.category === category,
          );
          if (categoryProducts.length > 0) {
            groupedProducts.push({
              name: category as string,
              products: categoryProducts,
            });
          }
        });

        groupedProducts.sort((a, b) => a.name.localeCompare(b.name));
        setCategorySections(groupedProducts);

        const prices = transformedProducts
          .map((p) => p.price)
          .filter(Boolean) as number[];
        if (prices.length > 0) {
          const max = Math.ceil(Math.max(...prices) / 100) * 100;
          setMaxPrice(max);
          setPriceRange([0, max]);
        }
      }
    } catch (error) {
      console.error("Error in fetchProducts:", error);
      setError("Failed to load products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Generate search suggestions
  const generateSearchSuggestions = useCallback(
    (query: string) => {
      if (!query.trim()) {
        const trendingProducts = products
          .filter((p) => p.is_trending)
          .slice(0, 3)
          .map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            type: "trending" as const,
          }));

        const categorySuggestions = categories.slice(0, 3).map((cat) => ({
          id: `cat-${cat}`,
          name: cat,
          category: cat,
          type: "category" as const,
        }));

        setSearchSuggestions([...trendingProducts, ...categorySuggestions]);
        return;
      }

      const queryLower = query.toLowerCase();
      const productMatches = products
        .filter(
          (p) =>
            p.name.toLowerCase().includes(queryLower) ||
            p.description?.toLowerCase().includes(queryLower),
        )
        .slice(0, 5)
        .map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          type: "product" as const,
        }));

      const categoryMatches = categories
        .filter((cat) => cat.toLowerCase().includes(queryLower))
        .slice(0, 3)
        .map((cat) => ({
          id: `cat-${cat}`,
          name: cat,
          category: cat,
          type: "category" as const,
        }));

      setSearchSuggestions([...productMatches, ...categoryMatches]);
    },
    [products, categories],
  );

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    generateSearchSuggestions(value);
    if (value.trim() && !showSuggestions) {
      setShowSuggestions(true);
    }
  };

  // Handle search submission
  const handleSearch = (query?: string) => {
    const searchTerm = query || searchQuery;
    if (searchTerm.trim()) {
      saveRecentSearch(searchTerm);
      setSearchQuery(searchTerm);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === "category") {
      setSelectedCategories([suggestion.name]);
      setSearchQuery("");
    } else {
      setSearchQuery(suggestion.name);
      saveRecentSearch(suggestion.name);
    }
    setShowSuggestions(false);
  };

  // Save recent searches to localStorage
  const saveRecentSearch = (search: string) => {
    if (!search.trim()) return;

    const updatedSearches = [
      search,
      ...recentSearches.filter((s) => s.toLowerCase() !== search.toLowerCase()),
    ].slice(0, 5); // Keep only 5 most recent searches

    setRecentSearches(updatedSearches);
    localStorage.setItem("recent_searches", JSON.stringify(updatedSearches));
  };

  // Safe add to quote function
  const handleAddToQuote = (product: Product) => {
    try {
      console.log("Adding product to quote:", product.name);

      if (isInCart(product.id)) {
        removeItem(product.id);
        toast({
          title: "Removed from Quote",
          description: `${product.name} has been removed from your quote.`,
        });
      } else {
        // Don't store base64 images in cart
        const itemToAdd = {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          // Only store non-base64 URLs
          image_url:
            product.image_url && !product.image_url.startsWith("data:image")
              ? product.image_url
              : null,
          category: product.category,
          specifications: product.specifications,
        };

        addItem(itemToAdd);

        toast({
          title: "Added to Quote",
          description: `${product.name} has been added to your quote cart.`,
        });
      }
    } catch (error) {
      console.error("Error in handleAddToQuote:", error);
      toast({
        title: "Error",
        description: "Failed to update quote cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter products by all criteria
  const getFilteredProducts = useCallback(() => {
    return products
      .filter((product) => {
        const matchesSearch =
          searchQuery === "" ||
          product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase());

        const matchesCategory =
          selectedCategories.length === 0 ||
          (product.category && selectedCategories.includes(product.category));

        const matchesPrice =
          product.price === null ||
          (product.price >= priceRange[0] && product.price <= priceRange[1]);

        const matchesTrending = !showTrendingOnly || product.is_trending;

        return (
          matchesSearch && matchesCategory && matchesPrice && matchesTrending
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price-low":
            return (a.price || 0) - (b.price || 0);
          case "price-high":
            return (b.price || 0) - (a.price || 0);
          case "name":
            return a.name.localeCompare(b.name);
          case "trending":
            return (b.is_trending ? 1 : 0) - (a.is_trending ? 1 : 0);
          case "newest":
          default:
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
        }
      });
  }, [
    products,
    searchQuery,
    selectedCategories,
    priceRange,
    showTrendingOnly,
    sortBy,
  ]);

  // Get filtered category sections - FIXED VERSION
  const getFilteredCategorySections = useCallback(() => {
    const filteredProducts = getFilteredProducts();

    // If no filters are applied, return the original grouped categories
    if (
      !searchQuery &&
      selectedCategories.length === 0 &&
      priceRange[0] === 0 &&
      priceRange[1] === maxPrice &&
      !showTrendingOnly &&
      sortBy === "newest"
    ) {
      return categorySections;
    }

    // Group filtered products by category
    const categoriesMap = new Map<string, Product[]>();

    filteredProducts.forEach((product) => {
      const categoryName = product.category || "Uncategorized";
      if (!categoriesMap.has(categoryName)) {
        categoriesMap.set(categoryName, []);
      }
      categoriesMap.get(categoryName)?.push(product);
    });

    // Convert to sections array
    const sections: CategorySection[] = [];
    categoriesMap.forEach((products, categoryName) => {
      if (products.length > 0) {
        sections.push({
          name: categoryName,
          products: products,
        });
      }
    });

    // Sort sections alphabetically
    sections.sort((a, b) => a.name.localeCompare(b.name));

    return sections;
  }, [
    getFilteredProducts,
    categorySections,
    searchQuery,
    selectedCategories,
    priceRange,
    maxPrice,
    showTrendingOnly,
    sortBy,
  ]);

  const formatPrice = (price: number | null) => {
    if (price === null) return null;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(price);
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategories([]);
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
    setShowTrendingOnly(false);
  };

  const hasActiveFilters =
    searchQuery ||
    selectedCategories.length > 0 ||
    priceRange[0] > 0 ||
    priceRange[1] < maxPrice ||
    showTrendingOnly;

  const scrollSectionLeft = (categoryName: string) => {
    const section = document.getElementById(`section-${categoryName}`);
    if (section) {
      section.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollSectionRight = (categoryName: string) => {
    const section = document.getElementById(`section-${categoryName}`);
    if (section) {
      section.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const filteredSections = getFilteredCategorySections();
  const totalFilteredProducts = getFilteredProducts().length;

  // Count active filters for badge
  const activeFilterCount =
    (showTrendingOnly ? 1 : 0) +
    selectedCategories.length +
    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  // Clear localStorage if it's corrupted (debug function)
  const clearCorruptedCart = () => {
    localStorage.removeItem("quote_cart_items");
    window.location.reload();
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recent_searches");
  };

  // Error display
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-hero">
        <PageHeader />
        <main className="container-width section-padding pt-24">
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">
              Something went wrong
            </h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={fetchProducts}>Try Again</Button>
              <Button variant="outline" onClick={clearCorruptedCart}>
                Clear Cart Data
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-hero relative">
      <PageHeader />
      
      {/* Cart Icon for Desktop - Top right corner */}
      <div className="fixed top-6 right-20 z-50 hidden sm:block">
        <QuoteCartSheet>
          <Button variant="outline" className="relative">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Button>
        </QuoteCartSheet>
      </div>

      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden pt-28 pb-16">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Grid Box Pattern behind header */}
          <div 
            className="absolute inset-x-0 top-0 h-[500px] pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(to right, rgba(59, 130, 246, 0.3) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(59, 130, 246, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: "40px 40px",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 80% at 50% 20%, #000 30%, transparent 70%)",
              maskImage:
                "radial-gradient(ellipse 80% 80% at 50% 20%, #000 30%, transparent 70%)",
              opacity: "0.4"
            }}
          />
          
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
        </div>

        <div className="container-width section-padding relative z-10">
          <div className="max-w-4xl mx-auto text-center relative">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-8 relative z-20">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-accent-foreground">Premium Product Catalog</span>
            </div>

            {/* Main Heading with Animation */}
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 relative z-20">
              Explore Our{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-300 to-blue-400 bg-[length:200%_100%] animate-gradient">
                Product Range
              </span>
            </h1>
            
            {/* Description */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed font-light">
              Discover our comprehensive collection of premium electrical components. 
              Use advanced search and filtering to find exactly what you need for your project.
            </p>

            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-8 max-w-2xl mx-auto"
            >
              {[
                { value: `${products.length}+`, label: "Products", icon: Package },
                { value: `${categories.length}+`, label: "Categories", icon: Sparkles },
                { value: "35+", label: "Years Exp", icon: Award },
                { value: "99%", label: "Quality", icon: CheckCircle }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={index}
                    whileHover={{ scale: 1.05, y: -2 }}
                    className="text-center p-4 bg-card/50 backdrop-blur-sm rounded-xl border border-border/40"
                  >
                    <div className="flex justify-center mb-2">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center"
          >
            <motion.div
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1 h-3 bg-primary rounded-full mt-2"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Products Section */}
      <section className="relative py-8 md:py-16 bg-gradient-to-b from-background to-transparent">
        <div className="container-width px-4 mx-auto relative z-10">
          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
            <div ref={searchRef} className="relative flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                <Input
                  placeholder={SEARCH_PLACEHOLDERS[
                    currentPlaceholderIndex
                  ].substring(0, placeholderCharIndex)}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-9 sm:pl-10 text-sm sm:text-base h-10 sm:h-11 pr-10 bg-white border shadow-sm"
                />

                {/* Animated cursor */}
                {!searchQuery && (
                  <div className="absolute inset-y-0 left-9 sm:left-10 flex items-center pointer-events-none">
                    <div
                      className="w-[2px] h-5 bg-primary animate-pulse"
                      style={{
                        left: `${Math.min(placeholderCharIndex * 8, 200)}px`,
                        transition: "left 0.1s ease",
                      }}
                    />
                  </div>
                )}

                {/* Clear button */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Swiggy-style Search Suggestions Dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                  {/* Search header */}
                  <div className="p-3 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold text-foreground">
                          Quick Search
                        </span>
                      </div>
                      {searchQuery && (
                        <span className="text-xs text-muted-foreground">
                          {searchSuggestions.length} results
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  {!searchQuery && recentSearches.length > 0 && (
                    <div className="p-3 border-b">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium text-foreground">
                            Recent Searches
                          </span>
                        </div>
                        <button
                          onClick={clearRecentSearches}
                          className="text-xs text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded-md"
                        >
                          Clear all
                        </button>
                      </div>
                      <div className="space-y-1">
                        {recentSearches.map((search, index) => (
                          <button
                            key={index}
                            onClick={() => handleSearch(search)}
                            className="w-full text-left p-2 rounded hover:bg-accent flex items-center gap-2 transition-colors"
                          >
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{search}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Trending/Popular Suggestions */}
                  {!searchQuery && searchSuggestions.length > 0 && (
                    <div className="p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-foreground">
                          Popular Suggestions
                        </span>
                      </div>
                      <div className="space-y-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.id}-${index}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left p-2 rounded hover:bg-accent flex items-center gap-2 transition-colors"
                          >
                            {suggestion.type === "trending" ? (
                              <Flame className="w-4 h-4 text-orange-500" />
                            ) : suggestion.type === "category" ? (
                              <Hash className="w-4 h-4 text-primary" />
                            ) : (
                              <Search className="w-4 h-4 text-muted-foreground" />
                            )}
                            <span className="text-sm">{suggestion.name}</span>
                            {suggestion.category &&
                              suggestion.type !== "category" && (
                                <span className="ml-auto text-xs text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
                                  {suggestion.category}
                                </span>
                              )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Search Results */}
                  {searchQuery && searchSuggestions.length > 0 && (
                    <div className="p-3">
                      <div className="mb-2">
                        <span className="text-sm font-medium text-foreground">
                          Results for "{searchQuery}"
                        </span>
                      </div>
                      <div className="space-y-1">
                        {searchSuggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.id}-${index}`}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left p-2 rounded hover:bg-accent flex items-center gap-2 transition-colors"
                          >
                            {suggestion.type === "category" ? (
                              <Hash className="w-4 h-4 text-primary" />
                            ) : (
                              <Search className="w-4 h-4 text-muted-foreground" />
                            )}
                            <div className="flex-1 text-left">
                              <span className="text-sm font-medium">
                                {suggestion.name}
                              </span>
                              {suggestion.category &&
                                suggestion.type !== "category" && (
                                  <p className="text-xs text-muted-foreground mt-0.5">
                                    in {suggestion.category}
                                  </p>
                                )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No Results */}
                  {searchQuery && searchSuggestions.length === 0 && (
                    <div className="p-6 text-center">
                      <Search className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground mb-1">
                        No results found
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Try different keywords or browse categories
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[130px] sm:w-40 h-10 sm:h-11 bg-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="trending">Trending First</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              {/* Desktop Filter Dialog */}
              <div className="hidden sm:block">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 h-11 relative bg-white">
                      <SlidersHorizontal className="w-4 h-4" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Filter Products</DialogTitle>
                      <DialogDescription>
                        Narrow down products by category and price
                      </DialogDescription>
                    </DialogHeader>

                    <div className="mt-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
                      {/* Trending Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="trending"
                          checked={showTrendingOnly}
                          onCheckedChange={(checked) =>
                            setShowTrendingOnly(!!checked)
                          }
                          className="h-5 w-5"
                        />
                        <Label
                          htmlFor="trending"
                          className="flex items-center gap-1 cursor-pointer text-sm sm:text-base"
                        >
                          <Flame className="w-4 h-4 text-orange-500" />
                          Trending Only
                        </Label>
                      </div>

                      {/* Categories */}
                      {categories.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <Button
                                key={category}
                                variant={
                                  selectedCategories.includes(category)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => toggleCategory(category)}
                                className="capitalize"
                              >
                                {category}
                                {selectedCategories.includes(category) && (
                                  <X className="w-3 h-3 ml-1" />
                                )}
                              </Button>
                            ))}
                        </div>
                        </div>
                      )}

                      {/* Price Range */}
                      <div>
                        <h3 className="font-semibold text-foreground mb-3 text-sm sm:text-base">
                          Price Range
                        </h3>
                        <div className="px-2">
                          <Slider
                            value={priceRange}
                            onValueChange={(value) =>
                              setPriceRange(value as [number, number])
                            }
                            max={maxPrice}
                            step={10}
                            className="mb-4"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>₹{priceRange[0]}</span>
                            <span>₹{priceRange[1]}</span>
                          </div>
                        </div>
                      </div>

                      {/* Clear Filters */}
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full h-10 sm:h-11"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Mobile Filter Popup */}
              <div className="sm:hidden">
                <Drawer>
                  <DrawerTrigger asChild>
                    <Button variant="outline" className="gap-2 h-10 relative bg-white">
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      Filters
                      {activeFilterCount > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                          {activeFilterCount}
                        </Badge>
                      )}
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Filter Products</DrawerTitle>
                      <DrawerDescription>
                        Narrow down products by category and price
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="px-4 pb-4 space-y-6 max-h-[60vh] overflow-y-auto">
                      {/* Trending Filter */}
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="trending-mobile"
                          checked={showTrendingOnly}
                          onCheckedChange={(checked) =>
                            setShowTrendingOnly(!!checked)
                          }
                          className="h-5 w-5"
                        />
                        <Label
                          htmlFor="trending-mobile"
                          className="flex items-center gap-1 cursor-pointer"
                        >
                          <Flame className="w-4 h-4 text-orange-500" />
                          Trending Only
                        </Label>
                      </div>

                      {/* Categories */}
                      {categories.length > 0 && (
                        <div>
                          <h3 className="font-semibold text-foreground mb-3">
                            Categories
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {categories.map((category) => (
                              <Button
                                key={category}
                                variant={
                                  selectedCategories.includes(category)
                                    ? "default"
                                    : "outline"
                                }
                                size="sm"
                                onClick={() => toggleCategory(category)}
                                className="capitalize"
                              >
                                {category}
                                {selectedCategories.includes(category) && (
                                  <X className="w-3 h-3 ml-1" />
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Price Range */}
                      <div>
                        <h3 className="font-semibold text-foreground mb-3">
                          Price Range
                        </h3>
                        <div className="px-2">
                          <Slider
                            value={priceRange}
                            onValueChange={(value) =>
                              setPriceRange(value as [number, number])
                            }
                            max={maxPrice}
                            step={10}
                            className="mb-4"
                          />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>₹{priceRange[0]}</span>
                            <span>₹{priceRange[1]}</span>
                          </div>
                      </div>
                      </div>

                      {/* Clear Filters */}
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          onClick={clearFilters}
                          className="w-full h-10"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Clear All Filters
                        </Button>
                      )}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
            </div>
          </div>

          {/* Mobile Cart Button - Floating button at bottom right */}
          <div className="sm:hidden fixed bottom-6 right-6 z-50">
            <QuoteCartSheet>
              <Button variant="default" size="icon" className="rounded-full shadow-lg w-14 h-14">
                <div className="relative">
                  <ShoppingCart className="w-6 h-6" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 bg-white text-blue-600 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-blue-600">
                      {totalItems}
                    </span>
                  )}
                </div>
              </Button>
            </QuoteCartSheet>
          </div>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-6">
              <span className="text-xs text-muted-foreground mr-1">
                Active filters:
              </span>
              {showTrendingOnly && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  <Flame className="w-3 h-3" /> Trending
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => setShowTrendingOnly(false)}
                  />
                </Badge>
              )}
              {selectedCategories.map((cat) => (
                <Badge
                  key={cat}
                  variant="secondary"
                  className="gap-1 capitalize px-2 py-1"
                >
                  {cat}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => toggleCategory(cat)}
                  />
                </Badge>
              ))}
              {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
                <Badge variant="secondary" className="gap-1 px-2 py-1">
                  ₹{priceRange[0]} - ₹{priceRange[1]}
                  <X
                    className="w-3 h-3 ml-1 cursor-pointer"
                    onClick={() => setPriceRange([0, maxPrice])}
                  />
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-6 text-xs text-muted-foreground hover:text-foreground"
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="space-y-12">
              {[...Array(3)].map((_, i) => (
                <div key={i}>
                  <div className="h-6 sm:h-8 bg-muted rounded w-1/3 sm:w-1/4 mb-6 animate-pulse"></div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[...Array(5)].map((_, j) => (
                      <div
                        key={j}
                        className="rounded-lg bg-white border overflow-hidden animate-pulse shadow-sm"
                      >
                        <div className="aspect-square bg-muted" />
                        <div className="p-3 space-y-2">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-3 bg-muted rounded w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : filteredSections.length === 0 ? (
            <div className="text-center py-12 sm:py-20">
              <Package className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-display text-lg sm:text-xl font-semibold text-foreground mb-2">
                No Products Found
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                Try adjusting your filters or search query
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-12">
              {filteredSections.map((section) => (
                <div key={section.name} className="relative">
                  {/* Category Header - SMALLER Rectangular Box */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-3 py-2 rounded-lg border border-primary/20">
                        <div className="flex items-center gap-2">
                          {/* REDUCED font size and spacing */}
                          <h2 className="font-display text-lg sm:text-xl font-bold text-foreground capitalize">
                            {section.name}
                          </h2>
                          <span className="text-xs font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            {section.products.length}
                          </span>
                        </div>
                      </div>
                    </div>

                    {section.products.length > 4 && (
                      <div className="flex gap-2 justify-end mb-4">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 bg-white"
                          onClick={() => scrollSectionLeft(section.name)}
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 bg-white"
                          onClick={() => scrollSectionRight(section.name)}
                        >
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Horizontal Scrolling Products */}
                  <div className="relative">
                    <div
                      id={`section-${section.name}`}
                      className="flex overflow-x-auto scrollbar-hide gap-4 pb-4 -mx-4 px-4"
                    >
                      {section.products.map((product) => {
                        const inCart = isInCart(product.id);
                        return (
                          <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            whileHover={{ y: -5 }}
                            className="flex-shrink-0 w-44 sm:w-48 md:w-56 rounded-xl bg-white border overflow-hidden hover:shadow-lg transition-all duration-300 shadow-sm"
                          >
                            {/* Product Image - White Background with REDUCED padding */}
                            <div className="aspect-square w-full overflow-hidden bg-white flex items-center justify-center p-2">
                              <div className="w-full h-full rounded-lg overflow-hidden bg-white border">
                                {product.image_url ? (
                                  <img
                                    src={product.image_url}
                                    alt={product.name}
                                    className="w-full h-full object-contain rounded-lg"
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center rounded-lg bg-gray-50">
                                    <Package className="w-12 h-12 text-gray-300" />
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Product Details with REDUCED padding */}
                            <div className="p-3">
                              <h3 className="font-semibold text-foreground mb-2 line-clamp-1 text-base">
                                {product.name}
                              </h3>

                              {/* Description and Trending Badge */}
                              <div className="mb-2">
                                {product.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed mb-1">
                                    {product.description}
                                  </p>
                                )}

                                {/* Trending text after description */}
                                {product.is_trending && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Flame className="w-3 h-3 text-orange-500" />
                                    <span className="text-orange-600 font-medium">
                                      Trending
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Price and Cart Button */}
                              <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                  {formatPrice(product.price) ? (
                                    <p className="text-lg font-bold text-primary truncate">
                                      {formatPrice(product.price)}
                                    </p>
                                  ) : (
                                    <p className="text-sm font-medium text-muted-foreground">
                                      Price on request
                                    </p>
                                  )}
                                </div>

                                {/* Cart Icon Only */}
                                <motion.button
                                  onClick={() => handleAddToQuote(product)}
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.95 }}
                                  className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ml-2 ${
                                    inCart
                                      ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                      : "bg-primary/10 text-primary hover:bg-primary/20"
                                  }`}
                                  title={
                                    inCart ? "Remove from Quote" : "Add to Quote"
                                  }
                                >
                                  <ShoppingCart
                                    className={`w-4 h-4 ${inCart ? "text-green-600" : ""}`}
                                  />
                                </motion.button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
        
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}