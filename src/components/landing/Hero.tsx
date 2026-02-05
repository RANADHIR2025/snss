import { useEffect, useMemo, useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  ShoppingBag,
  FileText,
  Package,
  Award,
  Truck,
  CheckCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ShinyButton } from "../ui/shiny-button";

export function Hero() {
  const navigate = useNavigate();
  const [titleNumber, setTitleNumber] = useState(0);
  const [statValues, setStatValues] = useState([0, 0, 0, 0]);
  const statRefs = useRef([0, 0, 0, 0]);

  const titles = useMemo(
    () => [
      "Premium Electrical",
      "Industrial-Grade",
      "High-Performance",
      "Certified",
      "Reliable",
    ],
    [],
  );

  const stats = [
    {
      value: 1000,
      label: "Components in Stock",
      icon: Package,
      suffix: "+",
      animationType: "box",
    },
    {
      value: 98,
      label: "Customer Satisfaction",
      icon: Award,
      suffix: "%",
      animationType: "pulse",
    },
    {
      value: 24,
      label: "Hour Delivery",
      icon: Truck,
      suffix: "/7",
      animationType: "move",
    },
    {
      value: 1000,
      label: "Quality Tested",
      icon: CheckCircle,
      suffix: "+",
      animationType: "check",
    },
  ];

  // Animate stats counting up
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;

    const intervals = stats.map((stat, index) => {
      const stepValue = stat.value / steps;
      let currentStep = 0;

      return setInterval(() => {
        if (currentStep < steps) {
          statRefs.current[index] = Math.round(stepValue * currentStep);
          setStatValues([...statRefs.current]);
          currentStep++;
        }
      }, stepDuration);
    });

    return () => intervals.forEach((interval) => clearInterval(interval));
  }, []);

  // Word cycling animation
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-hero pt-20"
    >
      {/* Background Elements */}
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
            opacity: "0.4",
          }}
        />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div
          className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/5 rounded-full blur-3xl animate-float"
          style={{ animationDelay: "1s" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full" />
      </div>

      <div className="container-width section-padding relative z-10">
        <div className="max-w-4xl mx-auto text-center relative">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 border border-primary/20 mb-8 relative z-20">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-accent-foreground">
              Your Trusted Electrical Component Partner
            </span>
          </div>

          {/* Main Heading with Animation */}
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 relative z-20">
            Powering Industries with{" "}
            <span className="relative flex w-full justify-center overflow-hidden md:pb-4 md:pt-1">
              &nbsp;
              {titles.map((title, index) => (
                <motion.span
                  key={index}
                  className="absolute font-semibold text-gradient"
                  initial={{ opacity: 0, y: "-100" }}
                  transition={{ type: "spring", stiffness: 50 }}
                  animate={
                    titleNumber === index
                      ? {
                          y: 0,
                          opacity: 1,
                        }
                      : {
                          y: titleNumber > index ? -150 : 150,
                          opacity: 0,
                        }
                  }
                >
                  {title}
                </motion.span>
              ))}
            </span>{" "}
            Components
          </h1>

          {/* Tagline */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 relative z-20">
            We provide top-quality electrical components for various projects,
            from industrial automation to smart home systems, and are trusted by
            engineers and manufacturers globally.
          </p>

          {/* CTA Buttons - Responsive sizing for mobile */}
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4 relative z-20">
            {/* Simple Browse Products Button with hover effect */}
            <button
              onClick={() => navigate("/products")}
              className="group px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base flex items-center justify-center gap-2 bg-primary text-white font-medium rounded-full transition-all duration-300 shadow-lg hover:shadow-xl border border-primary/20 min-w-[160px] max-w-[200px] sm:max-w-none relative overflow-hidden hover:bg-primary/90"
            >
              {/* Hover background effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />

              {/* Button content */}
              <span className="flex items-center gap-2 whitespace-nowrap relative z-10">
                Browse Products
                <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>

              {/* Subtle hover indicator */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white/80 group-hover:w-16 transition-all duration-300" />
            </button>

            {/* Animated Request Quote Button */}
            <ShinyButton
              onClick={() => navigate("/dashboard")}
              className="px-6 sm:px-8 py-3 sm:py-4 text-sm sm:text-base flex-1 sm:flex-none min-w-[160px] max-w-[200px] sm:max-w-none"
            >
              <span className="flex items-center justify-center gap-2 whitespace-nowrap">
                Request Quote
                <FileText className="w-4 h-4 flex-shrink-0" />
              </span>
            </ShinyButton>
          </div>

          {/* Stats - Clean Modern Boxes - Reduced size on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mt-12 md:mt-16 relative z-20">
            {stats.map((stat, index) => {
              const Icon = stat.icon;

              return (
                <motion.div
                  key={stat.label}
                  className={cn(
                    "relative bg-card/50 backdrop-blur-sm rounded-lg p-3 md:p-6 text-center",
                    "border border-border/40 hover:border-primary/30",
                    "hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300",
                    "group hover:bg-card/70 cursor-pointer",
                  )}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  onClick={() => {
                    // Navigate based on stat
                    // if (stat.label === 'Components in Stock') {
                    //   navigate('/products');
                    // } else if (stat.label === 'Customer Satisfaction') {
                    //   navigate('/testimonials');
                    // } else if (stat.label === 'Hour Delivery') {
                    //   navigate('/shipping');
                    // } else if (stat.label === 'Quality Tested') {
                    //   navigate('/quality');
                    // }
                  }}
                >
                  {/* Gradient background effect on hover */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Icon Container - Centered for mobile */}
                  <div className="relative z-10 flex justify-center items-center mb-2 md:mb-4 mx-auto">
                    <div
                      className={cn(
                        "p-1.5 md:p-3 rounded-lg transition-all duration-300 relative overflow-hidden",
                        "bg-gradient-to-br from-primary/10 to-primary/5",
                        "group-hover:from-primary/20 group-hover:to-primary/10",
                        "border border-primary/10 group-hover:border-primary/20",
                        "group-hover:scale-110",
                        "flex justify-center items-center",
                      )}
                    >
                      {/* Grid pattern inside the icon box */}
                      <div
                        className="absolute inset-0 opacity-0 group-hover:opacity-30 transition-opacity duration-300"
                        style={{
                          backgroundImage: `
                            linear-gradient(to right, rgba(59, 130, 246, 0.5) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(59, 130, 246, 0.5) 1px, transparent 1px)
                          `,
                          backgroundSize: "12px 12px",
                        }}
                      />

                      {/* Package animation - Box opening/closing */}
                      {stat.animationType === "box" && (
                        <div className="relative w-6 h-6 md:w-8 md:h-8 flex justify-center items-center">
                          {/* Simple box with subtle pulse */}
                          <motion.div
                            animate={{
                              scale: [1, 1.05, 1],
                              rotateY: [0, 10, 0],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                            className="relative flex justify-center items-center"
                          >
                            <Package
                              className={cn(
                                "w-4 h-4 md:w-6 md:h-6",
                                "text-primary group-hover:text-primary/90",
                              )}
                            />

                            {/* Simple glow effect */}
                            <motion.div
                              className="absolute inset-0 rounded-lg bg-primary/10 -z-10"
                              animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.1, 0.2, 0.1],
                              }}
                              transition={{
                                duration: 3,
                                repeat: Infinity,
                                repeatType: "reverse",
                                ease: "easeInOut",
                              }}
                            />
                          </motion.div>

                          {/* Simple dots representing components */}
                          <motion.div
                            className="absolute top-0 right-0 w-1 h-1 bg-primary/60 rounded-full"
                            animate={{
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.3,
                            }}
                          />
                          <motion.div
                            className="absolute bottom-0 left-0 w-1 h-1 bg-primary/40 rounded-full"
                            animate={{
                              scale: [0.8, 1.2, 0.8],
                              opacity: [0.3, 0.7, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.6,
                            }}
                          />
                        </div>
                      )}

                      {/* Award animation - Continuous pulsing with shine */}
                      {stat.animationType === "pulse" && (
                        <div className="relative flex justify-center items-center">
                          <Award
                            className={cn(
                              "w-4 h-4 md:w-6 md:h-6 transition-all duration-300 relative z-10",
                              "text-primary group-hover:text-primary/90",
                            )}
                          />

                          {/* Continuous pulsing glow */}
                          <motion.div
                            className="absolute inset-0 rounded-full bg-primary/10 z-0"
                            animate={{
                              scale: [1, 1.2, 1],
                              opacity: [0.1, 0.3, 0.1],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                          />

                          {/* Shine effect on the award */}
                          <motion.div
                            className="absolute top-0 left-1/2 w-1 h-2 bg-white/50 blur-sm"
                            animate={{
                              y: [0, 8, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: "easeInOut",
                            }}
                          />
                        </div>
                      )}

                      {/* Truck animation - Continuous movement */}
                      {stat.animationType === "move" && (
                        <div className="relative w-6 h-4 md:w-8 md:h-6 flex justify-center items-center">
                          <motion.div
                            animate={{
                              x: [0, 4, 0],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "linear",
                            }}
                            className="flex justify-center items-center"
                          >
                            <Truck
                              className={cn(
                                "w-4 h-4 md:w-6 md:h-6 transition-all duration-300",
                                "text-primary group-hover:text-primary/90",
                              )}
                            />
                          </motion.div>

                          {/* Road lines moving */}
                          <motion.div
                            className="absolute bottom-0 left-0 right-0 h-[1px] overflow-hidden"
                            animate={{
                              backgroundPosition: ["0% center", "100% center"],
                            }}
                            transition={{
                              duration: 0.75,
                              repeat: Infinity,
                              ease: "linear",
                            }}
                            style={{
                              backgroundImage:
                                "linear-gradient(to right, transparent 50%, rgba(59, 130, 246, 0.4) 50%)",
                              backgroundSize: "8px 100%",
                            }}
                          />
                        </div>
                      )}

                      {/* Check animation - Drawing/Undrawing checkmark */}
                      {stat.animationType === "check" && (
                        <div className="relative w-6 h-6 md:w-8 md:h-8 flex justify-center items-center">
                          {/* Outer circle */}
                          <motion.div
                            className="absolute inset-0 rounded-full border-2 border-primary/30"
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.3, 0.6, 0.3],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              repeatType: "reverse",
                              ease: "easeInOut",
                            }}
                          />

                          {/* Animated checkmark */}
                          <svg
                            className="w-6 h-6 md:w-8 md:h-8"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <motion.path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                              stroke="rgb(59, 130, 246)"
                              initial={{ pathLength: 0 }}
                              animate={{
                                pathLength: [0, 1, 0],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                              }}
                            />
                          </svg>

                          {/* Inner circle pulse */}
                          <motion.div
                            className="absolute inset-2 rounded-full bg-primary/10"
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0, 0.2, 0],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              delay: 0.5,
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Animated Number - Smaller text on mobile */}
                  <div className="relative z-10 font-display text-xl md:text-3xl lg:text-4xl font-bold mb-1 md:mb-2">
                    <span className="text-gradient group-hover:text-primary transition-colors duration-300">
                      {statRefs.current[index]}
                    </span>
                    <span className="text-primary/80 group-hover:text-primary transition-colors duration-300">
                      {stat.suffix}
                    </span>
                  </div>

                  {/* Label - Smaller text on mobile - Arrow removed */}
                  <div className="relative z-10 text-xs md:text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors duration-300">
                    {stat.label}
                  </div>

                  {/* Subtle bottom border effect */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 md:w-16 h-0.5 bg-primary/0 group-hover:bg-primary/60 group-hover:w-20 transition-all duration-300" />

                  {/* Clickable overlay hint */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-primary/20 rounded-lg" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}