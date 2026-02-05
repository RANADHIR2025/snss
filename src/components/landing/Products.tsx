import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Package,
  Loader2,
  Flame,
  Database,
  Server,
  Cpu,
  HardDrive,
  Zap,
  Cpu as CpuIcon,
  CircuitBoard,
  Battery,
  Power,
  Settings,
  Gauge,
  Lightbulb,
  Cable,
  Wifi,
  Radio,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { ShinyButton } from "@/components/ui/shiny-button";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  image_url: string | null;
  category: string | null;
  specifications: string | null;
  is_trending: boolean;
  is_active: boolean;
}

// Electrical component icons for floating background
const electricalIcons = [
  Zap, CpuIcon, CircuitBoard, Battery, Power, Settings, 
  Gauge, Lightbulb, Cable, Wifi, Radio, Shield, Database,
  Server, HardDrive
];

// Helper function to get appropriate icon based on category
const getCategoryIcon = (category: string | null) => {
  if (!category) return <Server className="w-3 h-3" />;

  const cat = category.toLowerCase();
  if (cat.includes("database") || cat.includes("storage"))
    return <Database className="w-3 h-3" />;
  if (cat.includes("server") || cat.includes("compute"))
    return <Server className="w-3 h-3" />;
  if (cat.includes("cpu") || cat.includes("processor"))
    return <Cpu className="w-3 h-3" />;
  if (cat.includes("drive") || cat.includes("ssd"))
    return <HardDrive className="w-3 h-3" />;
  return <Server className="w-3 h-3" />;
};

// Animated border component for each product card
const AnimatedBorder = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-10">
      {/* Top border animation */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-0.5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "200%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          style={{ width: "50%" }}
        />
      </motion.div>

      {/* Right border animation */}
      <motion.div
        className="absolute top-0 right-0 bottom-0 w-0.5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <motion.div
          className="w-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"
          initial={{ y: "-100%" }}
          animate={{ y: "200%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          style={{ height: "50%" }}
        />
      </motion.div>

      {/* Bottom border animation */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <motion.div
          className="h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent"
          initial={{ x: "200%" }}
          animate={{ x: "-100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          style={{ width: "50%" }}
        />
      </motion.div>

      {/* Left border animation */}
      <motion.div
        className="absolute top-0 left-0 bottom-0 w-0.5 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <motion.div
          className="w-full bg-gradient-to-b from-transparent via-blue-500 to-transparent"
          initial={{ y: "200%" }}
          animate={{ y: "-100%" }}
          transition={{
            repeat: Infinity,
            duration: 1.5,
            ease: "linear",
          }}
          style={{ height: "50%" }}
        />
      </motion.div>
    </div>
  );
};

// Neon glow effect for product card background
const NeonGlow = ({ isHovered }: { isHovered: boolean }) => {
  return (
    <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none z-0">
      {/* Base glow layer */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 0.8 : 0.3 }}
        transition={{ duration: 0.3 }}
      />

      {/* Animated neon rings */}
      <motion.div
        className="absolute inset-0 border-2 border-transparent rounded-lg"
        animate={{
          boxShadow: isHovered
            ? [
                "0 0 10px rgba(59, 130, 246, 0.5)",
                "0 0 20px rgba(59, 130, 246, 0.7)",
                "0 0 10px rgba(59, 130, 246, 0.5)",
              ]
            : "0 0 5px rgba(59, 130, 246, 0.2)",
        }}
        transition={{
          boxShadow: {
            repeat: isHovered ? Infinity : 0,
            duration: 2,
            ease: "easeInOut",
          },
        }}
      />

      {/* Moving neon particles */}
      {isHovered && (
        <>
          <motion.div
            className="absolute top-0 left-1/4 w-1 h-1 bg-blue-400 rounded-full blur-sm"
            animate={{
              y: [0, 50, 0],
              x: [0, 10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 3,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-0 right-1/4 w-1 h-1 bg-purple-400 rounded-full blur-sm"
            animate={{
              y: [0, -50, 0],
              x: [0, -10, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              repeat: Infinity,
              duration: 2.5,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          <motion.div
            className="absolute top-1/2 left-0 w-1 h-1 bg-cyan-400 rounded-full blur-sm"
            animate={{
              x: [0, 100, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              repeat: Infinity,
              duration: 4,
              ease: "linear",
            }}
          />
        </>
      )}

      {/* Pulsing neon glow */}
      <motion.div
        className="absolute inset-0 rounded-lg"
        animate={{
          boxShadow: isHovered
            ? [
                "inset 0 0 20px rgba(59, 130, 246, 0.1)",
                "inset 0 0 30px rgba(59, 130, 246, 0.3)",
                "inset 0 0 20px rgba(59, 130, 246, 0.1)",
              ]
            : "inset 0 0 10px rgba(59, 130, 246, 0.05)",
        }}
        transition={{
          boxShadow: {
            repeat: isHovered ? Infinity : 0,
            duration: 1.5,
            ease: "easeInOut",
          },
        }}
      />
    </div>
  );
};

// Grid pattern component for larger devices only
const GridPatternCorners = () => {
  return (
    <>
      {/* Top Left Grid Corner */}
      <div className="hidden lg:block absolute top-8 left-8 w-24 h-24 opacity-5 pointer-events-none">
        <div className="absolute inset-0 border border-blue-400/20 rounded-lg">
          {/* Horizontal lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-blue-400/30" />
          {/* Vertical lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-blue-400/30" />
          {/* Diagonal line */}
          <div className="absolute top-0 left-0 w-full h-full">
            <div className="absolute top-0 left-0 w-full h-px bg-blue-400/20 transform rotate-45 origin-top-left" />
          </div>
        </div>
      </div>

      {/* Top Right Grid Corner */}
      <div className="hidden lg:block absolute top-8 right-8 w-24 h-24 opacity-5 pointer-events-none">
        <div className="absolute inset-0 border border-blue-400/20 rounded-lg">
          {/* Horizontal lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-blue-400/30" />
          {/* Vertical lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-blue-400/30" />
          {/* Diagonal line */}
          <div className="absolute top-0 right-0 w-full h-full">
            <div className="absolute top-0 right-0 w-full h-px bg-blue-400/20 transform -rotate-45 origin-top-right" />
          </div>
        </div>
      </div>

      {/* Bottom Left Grid Corner */}
      <div className="hidden lg:block absolute bottom-8 left-8 w-24 h-24 opacity-5 pointer-events-none">
        <div className="absolute inset-0 border border-blue-400/20 rounded-lg">
          {/* Horizontal lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-blue-400/30" />
          {/* Vertical lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-blue-400/30" />
          {/* Diagonal line */}
          <div className="absolute bottom-0 left-0 w-full h-full">
            <div className="absolute bottom-0 left-0 w-full h-px bg-blue-400/20 transform -rotate-45 origin-bottom-left" />
          </div>
        </div>
      </div>

      {/* Bottom Right Grid Corner */}
      <div className="hidden lg:block absolute bottom-8 right-8 w-24 h-24 opacity-5 pointer-events-none">
        <div className="absolute inset-0 border border-blue-400/20 rounded-lg">
          {/* Horizontal lines */}
          <div className="absolute top-1/4 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-blue-400/30" />
          <div className="absolute top-3/4 left-0 right-0 h-px bg-blue-400/30" />
          {/* Vertical lines */}
          <div className="absolute left-1/4 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-blue-400/30" />
          <div className="absolute left-3/4 top-0 bottom-0 w-px bg-blue-400/30" />
          {/* Diagonal line */}
          <div className="absolute bottom-0 right-0 w-full h-full">
            <div className="absolute bottom-0 right-0 w-full h-px bg-blue-400/20 transform rotate-45 origin-bottom-right" />
          </div>
        </div>
      </div>
    </>
  );
};

// Floating background icons component
const FloatingIconsBackground = () => {
  const positions = [
    // Top positions
    { top: "10%", left: "5%", delay: 0, size: "w-6 h-6" },
    { top: "15%", left: "85%", delay: 0.2, size: "w-5 h-5" },
    { top: "25%", left: "15%", delay: 0.4, size: "w-7 h-7" },
    
    // Middle positions
    { top: "40%", left: "90%", delay: 0.6, size: "w-6 h-6" },
    { top: "55%", left: "8%", delay: 0.8, size: "w-5 h-5" },
    { top: "65%", left: "75%", delay: 1.0, size: "w-7 h-7" },
    
    // Bottom positions
    { top: "80%", left: "20%", delay: 1.2, size: "w-6 h-6" },
    { top: "85%", left: "80%", delay: 1.4, size: "w-5 h-5" },
    { top: "90%", left: "50%", delay: 1.6, size: "w-7 h-7" },
    
    // Additional positions for better coverage
    { top: "30%", left: "70%", delay: 0.3, size: "w-6 h-6" },
    { top: "45%", left: "25%", delay: 0.5, size: "w-5 h-5" },
    { top: "70%", left: "40%", delay: 0.7, size: "w-7 h-7" },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {positions.map((pos, index) => {
        const IconComponent = electricalIcons[index % electricalIcons.length];
        return (
          <motion.div
            key={index}
            className={`absolute ${pos.size} text-blue-300/20 dark:text-blue-400/10`}
            style={{
              top: pos.top,
              left: pos.left,
            }}
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0, -5, 0],
            }}
            transition={{
              y: {
                repeat: Infinity,
                duration: 3 + index * 0.5,
                ease: "easeInOut",
              },
              rotate: {
                repeat: Infinity,
                duration: 4 + index * 0.5,
                ease: "easeInOut",
              },
              delay: pos.delay,
            }}
          >
            <IconComponent className="w-full h-full" />
          </motion.div>
        );
      })}
      
      {/* Subtle gradient overlays - hidden on mobile */}
      <div className="hidden sm:block absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-blue-50/10 to-transparent" />
      <div className="hidden sm:block absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-blue-50/10 to-transparent" />
    </div>
  );
};

export function Products() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();

    const channel = supabase
      .channel("products-home-changes")
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
  }, []);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .eq("is_trending", true)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProducts(data as Product[]);
    }
    setLoading(false);
  };

  // Create multiple duplicates for seamless infinite scroll
  // Using 4 sets to ensure smooth continuous animation
  const duplicatedProducts = [...products, ...products, ...products, ...products];

  return (
    <section id="products" className="section-padding bg-white overflow-hidden relative">
      {/* Background with floating electrical icons */}
      <FloatingIconsBackground />
      
      {/* Grid pattern corners for larger devices */}
      <GridPatternCorners />
      
      {/* Subtle circuit pattern overlay - hidden on mobile */}
      <div className="hidden sm:block absolute inset-0 opacity-[0.02] pointer-events-none">
        <div 
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.2) 1px, transparent 0)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      </div>

      <div className="container-width relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-8 relative z-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3 sm:py-1 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-600 font-medium text-xs sm:text-sm uppercase tracking-wider mb-3 border border-blue-200 backdrop-blur-sm">
            <Flame className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            Trending Now
          </div>
          <h2 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 relative">
            Our{" "}
            <span className="text-gradient bg-gradient-to-r from-blue-600 to-indigo-600">
              Top Products
            </span>
            {/* Animated electrical spark effect - hidden on mobile */}
            <motion.div
              className="hidden sm:block absolute -top-2 -right-2"
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                repeat: Infinity,
                duration: 2,
                ease: "easeInOut"
              }}
            >
              <Zap className="w-4 h-4 text-blue-500" />
            </motion.div>
          </h2>
          <p className="text-gray-600 text-sm sm:text-base relative z-10">
            Discover our most popular solutions trusted by thousands of
            businesses worldwide.
          </p>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-8 sm:py-12 relative z-20">
            <div className="relative">
              <Loader2 className="w-6 h-6 sm:w-6 sm:h-6 animate-spin text-blue-600" />
              <div className="absolute inset-0 animate-ping rounded-full bg-blue-600/20"></div>
              {/* Floating icons around loader - hidden on mobile */}
              <motion.div
                className="hidden sm:block absolute -top-4 -left-4"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              >
                <CircuitBoard className="w-4 h-4 text-blue-400/30" />
              </motion.div>
              <motion.div
                className="hidden sm:block absolute -top-4 -right-4"
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              >
                <CpuIcon className="w-4 h-4 text-blue-400/30" />
              </motion.div>
            </div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 sm:py-12 relative z-20">
            <div className="relative inline-block mb-3">
              <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 relative z-10" />
              <motion.div
                className="absolute -inset-4 bg-blue-100/30 rounded-full blur-xl"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              />
            </div>
            <h3 className="font-display text-lg sm:text-lg font-semibold text-gray-900 mb-1.5">
              No Trending Products
            </h3>
            <p className="text-gray-600 mb-3">Check out all our products</p>
            {user ? (
              <Link to="/products">
                <ShinyButton className="px-6 py-3 text-sm flex-1 min-w-[160px] max-w-[200px]">
                  <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                    Browse All Products
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </ShinyButton>
              </Link>
            ) : (
              <ShinyButton 
                className="px-6 py-3 text-sm flex-1 min-w-[160px] max-w-[200px]"
                onClick={() => navigate("/auth")}
              >
                <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                  Sign In to Browse
                  <ArrowRight className="w-4 h-4" />
                </span>
              </ShinyButton>
            )}
          </div>
        ) : (
          <div className="space-y-6 sm:space-y-8 relative z-20">
            {/* Horizontal Infinite Scroll Container */}
            <div className="relative">
              <div
                className="overflow-hidden py-4"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                <motion.div
                  ref={sliderRef}
                  className="flex gap-4"
                  animate={{
                    x: [0, -50 * products.length * 2], // Multiply by 2 to account for the duplicate sets
                  }}
                  transition={{
                    x: {
                      repeat: Infinity,
                      repeatType: "loop",
                      duration: isHovering ? 80 : 60, // Longer duration for smoother continuous motion
                      ease: "linear",
                    },
                  }}
                  style={{ width: "max-content" }}
                >
                  {duplicatedProducts.map((product, index) => (
                    <motion.div
                      key={`${product.id}-${index}`}
                      className="group relative flex-shrink-0 w-32 sm:w-36 md:w-40"
                      onMouseEnter={() => setHoveredProduct(product.id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      {/* Animated Border around the entire card - only on hover */}
                      <AnimatedBorder
                        isHovered={hoveredProduct === product.id}
                      />

                      {/* Neon glow effect for background - only on hover */}
                      <NeonGlow isHovered={hoveredProduct === product.id} />

                      {/* Subtle electrical effect on hover */}
                      {hoveredProduct === product.id && (
                        <motion.div
                          className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none z-0"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent" />
                          <motion.div
                            className="absolute top-2 right-2"
                            animate={{ 
                              scale: [1, 1.5, 1],
                              rotate: [0, 180, 360]
                            }}
                            transition={{ 
                              repeat: Infinity, 
                              duration: 2,
                              ease: "linear" 
                            }}
                          >
                            <Zap className="w-3 h-3 text-blue-500/30" />
                          </motion.div>
                        </motion.div>
                      )}

                      {/* Main Card */}
                      <div className="relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer z-5 group-hover:shadow-lg group-hover:shadow-blue-500/10 transition-all duration-300 backdrop-blur-sm bg-white/95 sm:border-0">
                        {/* Product Image */}
                        <div className="relative aspect-square w-full overflow-hidden bg-gradient-to-br from-gray-50 to-blue-50">
                          {product.image_url ? (
                            <motion.img
                              src={product.image_url}
                              alt={product.name}
                              className="w-full h-full object-cover"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.2 }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center">
                              <div className="relative">
                                <Package className="w-8 h-8 text-gray-300 mb-1 relative z-10" />
                                <motion.div
                                  className="absolute inset-0 bg-blue-200/20 rounded-full blur-sm"
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                />
                              </div>
                              <span className="text-xs text-gray-400">
                                No Image
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-3 pt-2">
                          <div className="relative">
                            <h3 className="font-bold text-gray-900 text-sm line-clamp-1 pb-1">
                              {product.name}
                            </h3>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
                
                {/* Gradient overlays for smooth edges - hidden on mobile */}
                <div className="hidden sm:block absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent pointer-events-none z-30" />
                <div className="hidden sm:block absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent pointer-events-none z-30" />
              </div>
            </div>

            {/* Call to Action */}
            <motion.div
              className="text-center pt-4"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {user ? (
                <Link to="/products">
                  <ShinyButton className="px-6 py-3 text-sm flex-1 min-w-[160px] max-w-[200px] sm:max-w-none">
                    <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                      View All Products
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </ShinyButton>
                </Link>
              ) : (
                <motion.div
                  className="max-w-md mx-auto rounded-xl p-6 border border-gray-200 bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm relative overflow-hidden"
                  whileHover={{ scale: 1.01 }}
                  transition={{ duration: 0.15 }}
                >
                  {/* Animated background effect - hidden on mobile */}
                  <div className="hidden sm:block absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-indigo-500/5 animate-gradient-x" />
                  
                  <div className="flex items-center justify-center gap-1.5 mb-3 relative z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse delay-100" />
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse delay-200" />
                  </div>
                  <p className="text-gray-800 text-sm mb-3 relative z-10">
                    To explore all products and send quote requests, please sign
                    in or register.
                  </p>
                  <ShinyButton 
                    className="px-6 py-3 text-sm flex-1 min-w-[160px] max-w-[200px] relative z-10"
                    onClick={() => navigate("/auth")}
                  >
                    <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                      Get Started
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </ShinyButton>
                  
                  {/* Floating electrical icons around the CTA - hidden on mobile */}
                  <motion.div
                    className="hidden sm:block absolute -top-2 -left-2"
                    animate={{ 
                      y: [0, -5, 0],
                      rotate: [0, 10, 0, -10, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 3,
                      ease: "easeInOut" 
                    }}
                  >
                    <CpuIcon className="w-4 h-4 text-blue-400/20" />
                  </motion.div>
                  <motion.div
                    className="hidden sm:block absolute -bottom-2 -right-2"
                    animate={{ 
                      y: [0, 5, 0],
                      rotate: [0, -10, 0, 10, 0]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 4,
                      ease: "easeInOut",
                      delay: 0.5 
                    }}
                  >
                    <CircuitBoard className="w-4 h-4 text-indigo-400/20" />
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </section>
  );
}