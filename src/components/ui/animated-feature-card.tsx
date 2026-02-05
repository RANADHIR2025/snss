// components/ui/animated-feature-card.tsx

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Flame, ShoppingCart, Check } from "lucide-react";

// Define the props for the component
interface AnimatedFeatureCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** The numerical index to display, e.g., "001" */
  index?: string;
  /** The tag or category label */
  tag?: string;
  /** The main title or description */
  title?: React.ReactNode;
  /** The URL for the central image */
  imageSrc?: string;
  /** The color variant which determines the gradient and tag color */
  color?: "orange" | "purple" | "blue" | "gray";
  /** Optional button component to render */
  button?: React.ReactNode;
  /** Optional price display */
  price?: React.ReactNode;
  /** Whether the product is trending */
  isTrending?: boolean;
  /** Whether the product is in cart */
  isInCart?: boolean;
  /** On click handler for add to cart button */
  onAddToCart?: () => void;
  /** Description text */
  description?: string;
  /** Background color for the card */
  backgroundColor?: string;
  /** Show full card with all details */
  showFullCard?: boolean;
}

// Define HSL color values for each variant to work with shadcn's theming
const colorVariants = {
  orange: {
    '--feature-color': 'hsl(35, 91%, 55%)',
    '--feature-color-light': 'hsl(41, 100%, 85%)',
    '--feature-color-dark': 'hsl(24, 98%, 98%)',
    '--feature-bg': 'hsl(24, 100%, 98%)',
  },
  purple: {
    '--feature-color': 'hsl(262, 85%, 60%)',
    '--feature-color-light': 'hsl(261, 100%, 87%)',
    '--feature-color-dark': 'hsl(264, 100%, 98%)',
    '--feature-bg': 'hsl(264, 100%, 98%)',
  },
  blue: {
    '--feature-color': 'hsl(211, 100%, 60%)',
    '--feature-color-light': 'hsl(210, 100%, 83%)',
    '--feature-color-dark': 'hsl(216, 100%, 98%)',
    '--feature-bg': 'hsl(216, 100%, 98%)',
  },
  gray: {
    '--feature-color': 'hsl(215, 25%, 27%)',
    '--feature-color-light': 'hsl(215, 19%, 35%)',
    '--feature-color-dark': 'hsl(210, 20%, 98%)',
    '--feature-bg': 'hsl(210, 20%, 98%)',
  },
};

const getRandomColor = () => {
  const colors: ("orange" | "purple" | "blue" | "gray")[] = ["orange", "purple", "blue", "gray"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const AnimatedFeatureCard = React.forwardRef<
  HTMLDivElement,
  AnimatedFeatureCardProps
>(({ 
  className, 
  index, 
  tag, 
  title, 
  imageSrc, 
  color = "gray", 
  button, 
  price,
  isTrending = false,
  isInCart = false,
  onAddToCart,
  description,
  backgroundColor,
  showFullCard = false,
  ...props 
}, ref) => {
  const cardColor = color || getRandomColor();
  const cardStyle = {
    ...colorVariants[cardColor],
    backgroundColor: backgroundColor || 'var(--feature-bg)',
  } as React.CSSProperties;

  // Animation variants
  const cardVariants = {
    initial: { y: 0, scale: 1 },
    hover: { 
      y: -10, 
      scale: 1.02,
      boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
    },
  };

  const imageVariants = {
    initial: { scale: 1, y: 0 },
    hover: { scale: 1.3, y: -20 },
  };

  return (
    <motion.div
      ref={ref}
      style={cardStyle}
      className={cn(
        "relative flex h-[380px] w-full max-w-sm flex-col justify-end overflow-hidden rounded-2xl border border-border/50 p-6 shadow-sm",
        className
      )}
      whileHover="hover"
      initial="initial"
      variants={cardVariants}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      {...props}
    >
      {/* Background Gradient */}
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{
          background: `radial-gradient(circle at 50% 30%, var(--feature-color-light) 0%, transparent 70%)`
        }}
      />
      
      {/* Index Number - Only show in full card mode */}
      {showFullCard && index && (
        <div className="absolute top-6 left-6 font-mono text-lg font-bold text-muted-foreground">
          {index}
        </div>
      )}

      {/* Trending Badge */}
      {isTrending && (
        <div className="absolute top-3 right-3 z-10">
          <motion.span 
            className="px-2.5 py-1 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center gap-1"
            whileHover={{ scale: 1.1 }}
          >
            <Flame className="w-3 h-3" />
            Trending
          </motion.span>
        </div>
      )}

      {/* Category Badge */}
      {tag && !showFullCard && (
        <div className="absolute top-3 left-3 z-10">
          <motion.span 
            className="px-2.5 py-1 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium text-foreground capitalize"
            whileHover={{ scale: 1.05 }}
          >
            {tag}
          </motion.span>
        </div>
      )}

      {/* Main Image */}
      <motion.div 
        className="absolute inset-0 z-10 flex items-center justify-center p-8"
        variants={imageVariants}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={typeof title === 'string' ? title : 'Product image'}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
            <div className="text-4xl">📦</div>
          </div>
        )}
      </motion.div>
      
      {/* Content */}
      <div className="relative z-20 rounded-lg border bg-background/90 p-4 backdrop-blur-sm dark:bg-background/70">
        {showFullCard && tag && (
          <span
            className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold"
            style={{ 
              backgroundColor: 'var(--feature-color-dark)', 
              color: 'var(--feature-color)' 
            }}
          >
            {tag}
          </span>
        )}
        
        <h3 className="font-display text-xl font-semibold text-foreground mb-2 line-clamp-1">
          {title}
        </h3>
        
        {description && (
          <p className="text-sm text-muted-foreground leading-relaxed mb-3 line-clamp-2">
            {description}
          </p>
        )}
        
        <div className="flex items-center justify-between mt-4">
          {price && (
            <span className="text-lg font-bold text-primary">
              {price}
            </span>
          )}
          
          {onAddToCart && (
            <motion.button
              onClick={onAddToCart}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
                isInCart 
                  ? "bg-secondary text-secondary-foreground hover:bg-secondary/90" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isInCart ? (
                <>
                  <Check className="w-4 h-4" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Quote
                </>
              )}
            </motion.button>
          )}
          
          {button}
        </div>
      </div>
    </motion.div>
  );
});

AnimatedFeatureCard.displayName = "AnimatedFeatureCard";

export { AnimatedFeatureCard };