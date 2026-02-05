import { useAboutBanners } from "@/hooks/useAboutBanners";
import { AboutBannerCarousel } from "./AboutBannerCarousel";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  ChevronLeft, 
  ChevronRight,
  Zap,
  Cpu,
  CircuitBoard,
  Power
} from "lucide-react";

export function About() {
  const { banners, loading: bannerLoading } = useAboutBanners();
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovering, setIsHovering] = useState(false);

  // Counter animation values for Years of Excellence card
  const [yearValue, setYearValue] = useState(0);
  const yearRef = useRef(0);

  const typingWords = ["Yesterday", "Today", "Future"];

  // Counter animation for Years of Excellence
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = 9.8 / steps;
    let currentStep = 0;
    
    const interval = setInterval(() => {
      if (currentStep < steps) {
        yearRef.current = Math.round(stepValue * currentStep * 10) / 10;
        setYearValue(yearRef.current);
        currentStep++;
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (isHovering || banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners.length, isHovering]);

  useEffect(() => {
    const currentTextIndex = currentIndex % typingWords.length;
    const fullText = typingWords[currentTextIndex];

    let timer: NodeJS.Timeout;

    if (!isDeleting && currentText.length < fullText.length) {
      // Typing forward
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length + 1));
      }, 100);
    } else if (isDeleting && currentText.length > 0) {
      // Deleting
      timer = setTimeout(() => {
        setCurrentText(fullText.substring(0, currentText.length - 1));
      }, 50);
    } else if (!isDeleting && currentText.length === fullText.length) {
      // Pause before deleting
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 1500);
    } else if (isDeleting && currentText.length === 0) {
      // Move to next text
      setIsDeleting(false);
      setCurrentIndex((prev) => (prev + 1) % typingWords.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentIndex, typingWords]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  return (
    <section id="about" className="section-padding bg-background relative overflow-hidden">
      {/* Diagonal Grid Pattern Background - Only for header section */}
      <div 
        className="absolute inset-x-0 top-0 h-[400px] pointer-events-none z-0"
        style={{
          backgroundImage: "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          WebkitMaskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)",
          maskImage: "radial-gradient(ellipse 80% 80% at 50% 0%, #000 50%, transparent 90%)",
          opacity: "0.3"
        }}
      />
      
      <div className="container-width relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 relative">
          {/* Badge similar to Hero section */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-6 relative z-20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">About Us</span>
          </div>
          
          <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
            Connecting Innovation
            <br />
            <span className="text-gradient relative inline-block min-w-[180px] mt-4">
              From {currentText} !  
              <motion.span
                animate={{ opacity: [0, 1, 0] }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 0.8,
                  repeatDelay: 0.2
                }}
                className="inline-block w-[2px] h-8 md:h-10 bg-primary ml-1 align-middle"
              />
            </span>
          </h2>
        </div>

        {/* Updated Layout with matching heights */}
        <div className="mt-8 md:mt-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="grid md:grid-cols-2 gap-8 md:gap-12" // Changed from lg:grid-cols-2 to md:grid-cols-2
          >
            {/* Banner Container - Matches 4 boxes height */}
            <div className="md:order-1 order-2"> {/* Changed from lg:order-1 to md:order-1 */}
              <div className="relative animate-fade-in">
                <div
                  className="relative z-10 overflow-hidden rounded-3xl shadow-2xl group"
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >
                  {bannerLoading ? (
                    <Skeleton className="w-full h-[350px] md:h-[450px] rounded-3xl" /> 
                  ) : banners.length > 0 ? (
                    <>
                      {/* Slider Container */}
                      <div
                        className="flex transition-transform duration-700 ease-out"
                        style={{
                          transform: `translateX(-${currentSlide * 100}%)`,
                        }}
                      >
                        {banners.map((banner, index) => (
                          <div key={index} className="w-full flex-shrink-0 relative">
                            <img
                              src={banner.image_url}
                              alt={`About Banner ${index + 1}`}
                              className="w-full h-[350px] md:h-[450px] object-cover transform group-hover:scale-105 transition-transform duration-1000" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          </div>
                        ))}
                      </div>

                      {/* Navigation Buttons */}
                      <button
                        onClick={prevSlide}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-lg border border-white/20"
                        aria-label="Previous slide"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextSlide}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white rounded-full p-3 transition-all duration-300 z-20 opacity-0 group-hover:opacity-100 hover:scale-110 hover:shadow-lg border border-white/20"
                        aria-label="Next slide"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* Slide Indicators */}
                      <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-3 z-20">
                        {banners.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`relative transition-all duration-500 ${
                              index === currentSlide
                                ? "w-8 scale-110"
                                : "w-2 hover:w-4 hover:scale-110"
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          >
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                index === currentSlide
                                  ? "bg-white shadow-lg shadow-white/50"
                                  : "bg-white/60 hover:bg-white/80"
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Slide Counter */}
                      <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-sm text-white text-sm px-3 py-1 rounded-full z-20 border border-white/20">
                        <span className="font-medium">{currentSlide + 1}</span>
                        <span className="mx-1 opacity-60">/</span>
                        <span className="opacity-60">{banners.length}</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-20">
                        <div
                          className="h-full bg-white transition-all duration-4000 ease-linear"
                          style={{
                            width: isHovering ? "0%" : "100%",
                            transition: isHovering ? "none" : "width 4s linear",
                          }}
                          key={currentSlide}
                        />
                      </div>
                    </>
                  ) : (
                    /* Empty State */
                    <div className="w-full h-[350px] md:h-[450px] bg-gradient-to-br from-primary/5 via-card/20 to-primary/5 rounded-3xl flex items-center justify-center overflow-hidden">
                      {/* Floating central element */}
                      <motion.div 
                        className="relative z-10 text-center"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-card/60 to-card/40 backdrop-blur-sm border border-white/10 shadow-lg">
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-12 h-12 rounded-full border-2 border-primary/30 flex items-center justify-center"
                          >
                            <Zap className="w-6 h-6 text-primary" />
                          </motion.div>
                          <div className="text-left">
                            <div className="font-display text-2xl font-bold text-foreground">
                              Coming Soon
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Amazing content is on its way
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 4 Boxes Grid Container - Matches banner height */}
            <div className="md:order-2 order-1"> {/* Changed from lg:order-2 to md:order-2 */}
              <div className="grid grid-cols-2 gap-4 md:gap-6 h-full min-h-[350px] md:min-h-[450px]"> {/* Added min-height */}
                {/* Years of Excellence Card - Full height */}
                <motion.div 
                  className={cn(
                    "relative bg-card/70 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center h-full",
                    "border border-border/60",
                    "shadow-sm",
                    "transition-all duration-300 hover:translate-y-[-4px]",
                    "group cursor-pointer overflow-hidden",
                    "shiny-border-card"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  {/* Electrical icon in corner */}
                  <div className="absolute top-4 right-4 text-primary/20">
                    <Zap size={20} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-sm md:text-base font-bold mb-3">
                        <span className="inline-block text-foreground">
                          Years of Excellence
                        </span>
                      </div>
                      
                      {/* Animated Number */}
                      <div className="relative z-10 font-display text-2xl md:text-3xl lg:text-4xl font-bold mb-3">
                        <span className="text-gradient">
                          {yearValue.toFixed(1)}
                        </span>
                        <span className="text-primary/80">+</span>
                      </div>
                      
                      {/* Description */}
                      <div className="relative z-10 text-xs md:text-sm text-muted-foreground leading-relaxed">
                        Dedicated to Innovation and excellence since 2014
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="mt-4 pt-4">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-50" />
                    </div>
                  </div>
                </motion.div>

                {/* Mission Card - Full height */}
                <motion.div 
                  className={cn(
                    "relative bg-card/70 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center h-full",
                    "border border-border/60",
                    "shadow-sm",
                    "transition-all duration-300 hover:translate-y-[-4px]",
                    "group cursor-pointer overflow-hidden",
                    "shiny-border-card"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Electrical icon in corner */}
                  <div className="absolute top-4 right-4 text-primary/20">
                    <Cpu size={20} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-sm md:text-base font-bold mb-3">
                        <span className="inline-block text-foreground">
                          Our Mission
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div className="relative z-10 text-xs md:text-sm text-muted-foreground leading-relaxed flex-grow">
                        To empower businesses with innovative solutions that drive growth and success in the digital age.
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="mt-4 pt-4">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-50" />
                    </div>
                  </div>
                </motion.div>

                {/* Vision Card - Full height */}
                <motion.div 
                  className={cn(
                    "relative bg-card/70 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center h-full",
                    "border border-border/60",
                    "shadow-sm",
                    "transition-all duration-300 hover:translate-y-[-4px]",
                    "group cursor-pointer overflow-hidden",
                    "shiny-border-card"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Electrical icon in corner */}
                  <div className="absolute top-4 right-4 text-primary/20">
                    <CircuitBoard size={20} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-sm md:text-base font-bold mb-3">
                        <span className="inline-block text-foreground">
                          Our Vision
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div className="relative z-10 text-xs md:text-sm text-muted-foreground flex-grow">
                        To be the global leader in transforming how businesses operate and connect with their customers.
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="mt-4 pt-4">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-50" />
                    </div>
                  </div>
                </motion.div>

                {/* Values Card - Full height */}
                <motion.div 
                  className={cn(
                    "relative bg-card/70 backdrop-blur-sm rounded-xl p-4 md:p-6 text-center h-full",
                    "border border-border/60",
                    "shadow-sm",
                    "transition-all duration-300 hover:translate-y-[-4px]",
                    "group cursor-pointer overflow-hidden",
                    "shiny-border-card"
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {/* Electrical icon in corner */}
                  <div className="absolute top-4 right-4 text-primary/20">
                    <Power size={20} />
                  </div>
                  
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="text-sm md:text-base font-bold mb-3">
                        <span className="inline-block text-foreground">
                          Our Values
                        </span>
                      </div>
                      
                      {/* Description */}
                      <div className="relative z-10 text-xs md:text-sm text-muted-foreground flex-grow">
                        Integrity, Innovation, and customer-centricity are at the core of everything we do.
                      </div>
                    </div>
                    
                    {/* Bottom accent line */}
                    <div className="mt-4 pt-4">
                      <div className="h-0.5 w-8 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto opacity-50" />
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Updated CSS animations for ShinyButton-style border */}
      <style jsx global>{`
        @property --gradient-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-angle-offset {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        @property --gradient-percent {
          syntax: "<percentage>";
          initial-value: 5%;
          inherits: false;
        }

        @property --gradient-shine {
          syntax: "<color>";
          initial-value: white;
          inherits: false;
        }

        .shiny-border-card {
          --shiny-cta-bg: hsl(var(--card));
          --shiny-cta-bg-subtle: hsl(var(--border));
          --shiny-cta-fg: hsl(var(--foreground));
          --shiny-cta-highlight: hsl(var(--primary));
          --shiny-cta-highlight-subtle: hsl(var(--primary) / 0.4);
          --animation: gradient-angle linear infinite;
          --duration: 3s;
          --shadow-size: 2px;
          --transition: 800ms cubic-bezier(0.25, 1, 0.5, 1);
          
          isolation: isolate;
          position: relative;
          overflow: hidden;
          cursor: pointer;
          outline-offset: 4px;
          font-family: inherit;
          border: 1px solid transparent;
          border-radius: 0.75rem;
          color: var(--shiny-cta-fg);
          background: linear-gradient(var(--shiny-cta-bg), var(--shiny-cta-bg)) padding-box,
            conic-gradient(
              from calc(var(--gradient-angle) - var(--gradient-angle-offset)),
              transparent,
              var(--shiny-cta-highlight) var(--gradient-percent),
              var(--gradient-shine) calc(var(--gradient-percent) * 2),
              var(--shiny-cta-highlight) calc(var(--gradient-percent) * 3),
              transparent calc(var(--gradient-percent) * 4)
            ) border-box;
          box-shadow: 
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 4px 12px rgba(59, 130, 246, 0.05);
          transition: var(--transition);
          transition-property: --gradient-angle-offset, --gradient-percent, --gradient-shine, box-shadow, transform;
        }

        .shiny-border-card:hover {
          transform: translateY(-4px);
          --gradient-percent: 20%;
          --gradient-angle-offset: 95deg;
          --gradient-shine: var(--shiny-cta-highlight-subtle);
          box-shadow: 
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 8px 24px rgba(59, 130, 246, 0.15);
        }

        .shiny-border-card::before,
        .shiny-border-card::after,
        .shiny-border-card span::before {
          content: "";
          pointer-events: none;
          position: absolute;
          inset-inline-start: 50%;
          inset-block-start: 50%;
          translate: -50% -50%;
          z-index: -1;
        }

        .shiny-border-card:active {
          transform: translateY(-2px);
          box-shadow: 
            inset 0 0 0 1px var(--shiny-cta-bg-subtle),
            0 2px 6px rgba(59, 130, 246, 0.1);
        }

        /* Dots pattern */
        .shiny-border-card::before {
          --size: calc(100% - var(--shadow-size) * 3);
          --position: 2px;
          --space: calc(var(--position) * 2);
          width: var(--size);
          height: var(--size);
          background: radial-gradient(
            circle at var(--position) var(--position),
            hsl(var(--primary)) calc(var(--position) / 4),
            transparent 0
          ) padding-box;
          background-size: var(--space) var(--space);
          background-repeat: space;
          mask-image: conic-gradient(
            from calc(var(--gradient-angle) + 45deg),
            black,
            transparent 10% 90%,
            black
          );
          border-radius: inherit;
          opacity: 0.1;
          z-index: -1;
        }

        /* Inner shimmer */
        .shiny-border-card::after {
          --animation: shimmer linear infinite;
          width: 100%;
          aspect-ratio: 1;
          background: linear-gradient(
            -50deg,
            transparent,
            var(--shiny-cta-highlight),
            transparent
          );
          mask-image: radial-gradient(circle at bottom, transparent 40%, black);
          opacity: 0.1;
        }

        /* Animate */
        .shiny-border-card,
        .shiny-border-card::before,
        .shiny-border-card::after {
          animation: var(--animation) var(--duration),
            var(--animation) calc(var(--duration) / 0.4) reverse paused;
          animation-composition: add;
        }

        .shiny-border-card:hover,
        .shiny-border-card:hover::before,
        .shiny-border-card:hover::after {
          animation-play-state: running;
        }

        @keyframes gradient-angle {
          to {
            --gradient-angle: 360deg;
          }
        }

        @keyframes shimmer {
          to {
            rotate: 360deg;
          }
        }

        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(20px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.7s ease-out forwards;
        }
      `}</style>
    </section>
  );
}