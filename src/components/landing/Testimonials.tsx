"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card } from "../ui/card";
import {
  Star,
  ChevronRight,
  ChevronLeft,
  Quote,
  Expand,
  Zap,
  Cpu,
  CircuitBoard,
  Cable,
  Battery,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";

// Combined testimonials data
const testimonials = [
  {
    name: "Rajesh Sharma",
    role: "Factory Manager",
    company: "Sharma Engineering Works",
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
    content:
      "SNSS's electrical components have been the backbone of our manufacturing unit for over a decade. Their MCBs and switch fuses have significantly reduced our downtime and improved safety. The technical support team is always available to assist with any queries.",
    rating: 5,
    industry: "Manufacturing",
    shortText:
      "SNSS's electrical components have been the backbone of our manufacturing unit for over a decade.",
  },
  {
    name: "Priya Patel",
    role: "Electrical Contractor",
    company: "Patel Electricals",
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&crop=face",
    content:
      "The quality and reliability of SNSS products are unmatched. My clients always appreciate when I use their components - it's become a mark of quality work that we stand behind. Their extensive product range ensures we find exactly what we need.",
    rating: 5,
    industry: "Contracting",
    shortText: "The quality and reliability of SNSS products are unmatched.",
  },
  {
    name: "Amit Kumar",
    role: "Project Head",
    company: "Kolkata Infrastructure Ltd.",
    image:
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
    content:
      "We've used SNSS electrical solutions in multiple commercial projects. Their products meet international standards and their technical support is exceptional when we have tight deadlines.",
    rating: 5,
    industry: "Construction",
    shortText:
      "SNSS products meet international standards with exceptional technical support.",
  },
  {
    name: "Sneha Desai",
    role: "Maintenance Engineer",
    company: "Western Textiles",
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop&crop=face",
    content:
      "Since switching to SNSS switchgear, our electrical maintenance costs have dropped by 40%. The durability is remarkable even in harsh industrial environments with high humidity.",
    rating: 4,
    industry: "Textiles",
    shortText: "40% reduction in maintenance costs with SNSS switchgear.",
  },
  {
    name: "Vikram Singh",
    role: "Electrical Consultant",
    company: "Singh & Associates",
    image:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
    content:
      "I recommend SNSS products to all my clients. The BIS certification and 35+ years of experience make them the most trustworthy brand in the electrical components space.",
    rating: 5,
    industry: "Consulting",
    shortText:
      "The most trustworthy brand in electrical components with 35+ years experience.",
  },
  {
    name: "Meera Nair",
    role: "Procurement Manager",
    company: "Nair Industries",
    image:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
    content:
      "Their customer service is as reliable as their products. Quick deliveries, competitive pricing, and always available to provide technical specifications when needed.",
    rating: 5,
    industry: "Industrial",
    shortText:
      "Reliable customer service with quick deliveries and competitive pricing.",
  },
];

// Electrical Circuit Animation Component
const ElectricalCircuitAnimation = ({
  size = 400,
  speed = 40,
  opacity = 0.1,
  className = "",
}) => {
  return (
    <div className={`absolute pointer-events-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 400 400"
        className="text-blue-500/25"
        style={{ opacity }}
      >
        {/* Outer rotating circuit */}
        <motion.circle
          cx="200"
          cy="200"
          r="180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="8,8"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        />

        {/* Inner rotating circuit */}
        <motion.circle
          cx="200"
          cy="200"
          r="120"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="6,6"
          initial={{ rotate: 360 }}
          animate={{ rotate: 0 }}
          transition={{
            duration: speed * 0.7,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Pulsing center dot */}
        <motion.circle
          cx="200"
          cy="200"
          r="4"
          fill="currentColor"
          initial={{ scale: 1, opacity: 0.7 }}
          animate={{ scale: [1, 1.5, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />

        {/* Circuit nodes */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, index) => {
          const rad = (angle * Math.PI) / 180;
          const x = 200 + 180 * Math.cos(rad);
          const y = 200 + 180 * Math.sin(rad);

          return (
            <motion.circle
              key={index}
              cx={x}
              cy={y}
              r="3"
              fill="currentColor"
              initial={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, delay: index * 0.2, repeat: Infinity }}
            />
          );
        })}
      </svg>
    </div>
  );
};

// Flowing Circuit Lines Component
const FlowingCircuitLines = ({
  width = "100%",
  height = "100%",
  className = "",
}) => {
  return (
    <div
      className={`absolute overflow-hidden pointer-events-none ${className}`}
    >
      <svg
        width={width}
        height={height}
        viewBox="0 0 1200 400"
        className="text-blue-400/20"
        preserveAspectRatio="none"
      >
        {/* Main flowing line */}
        <motion.path
          d="M0,200 Q300,100 600,200 T1200,200"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="10,10"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.5 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />

        {/* Secondary flowing line */}
        <motion.path
          d="M0,300 Q400,250 600,300 T1200,300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="8,8"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.4 }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
            delay: 1,
          }}
        />

        {/* Reverse flowing line */}
        <motion.path
          d="M1200,100 Q900,150 600,100 T0,100"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="6,6"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.3 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
};

// Pulsing Electrical Grid Component
const PulsingElectricalGrid = ({ className = "" }) => {
  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg width="100%" height="100%" className="text-blue-500/12">
        {/* Vertical lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.line
            key={`v-${i}`}
            x1={i * 5 + 5}
            y1="0"
            x2={i * 5 + 5}
            y2="100%"
            stroke="currentColor"
            strokeWidth="0.5"
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 4, delay: i * 0.1, repeat: Infinity }}
          />
        ))}

        {/* Horizontal lines */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.line
            key={`h-${i}`}
            x1="0"
            y1={i * 5 + 5}
            x2="100%"
            y2={i * 5 + 5}
            stroke="currentColor"
            strokeWidth="0.5"
            initial={{ opacity: 0.1 }}
            animate={{ opacity: [0.1, 0.25, 0.1] }}
            transition={{ duration: 4, delay: i * 0.1 + 1, repeat: Infinity }}
          />
        ))}
      </svg>
    </div>
  );
};

// Floating Electrical Icons Component
const FloatingElectricalIcons = () => {
  const icons = [
    { Icon: Zap, className: "top-20 left-10 text-blue-400/50", size: 24 },
    { Icon: Cpu, className: "top-40 right-20 text-blue-300/40", size: 20 },
    {
      Icon: CircuitBoard,
      className: "bottom-40 left-20 text-slate-400/50",
      size: 22,
    },
    { Icon: Cable, className: "bottom-20 right-32 text-blue-400/45", size: 18 },
    { Icon: Battery, className: "top-32 left-1/4 text-slate-300/40", size: 16 },
    { Icon: Zap, className: "bottom-32 right-1/4 text-blue-300/50", size: 20 },
  ];

  return (
    <>
      {icons.map(({ Icon, className, size }, index) => (
        <motion.div
          key={index}
          className={`absolute pointer-events-none ${className}`}
          animate={{
            y: [0, -15, 0],
            rotate: [0, 8, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 4 + index * 0.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.3,
          }}
        >
          <Icon size={size} />
        </motion.div>
      ))}
    </>
  );
};

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [expandedTestimonial, setExpandedTestimonial] = useState<number | null>(
    null,
  );
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-play functionality
  useEffect(() => {
    if (isAutoPlaying && !isHovered) {
      autoPlayRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
      }, 5000);
    }

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [isAutoPlaying, isHovered]);

  const nextTestimonial = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1,
    );
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const goToTestimonial = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const toggleExpand = (index: number) => {
    if (expandedTestimonial === index) {
      setExpandedTestimonial(null);
    } else {
      setExpandedTestimonial(index);
    }
  };

  // For larger screens, show multiple testimonials
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const visibleCount = isLargeScreen ? 3 : 1;
  const startIndex = currentIndex;
  const visibleTestimonials = [];

  for (let i = 0; i < visibleCount; i++) {
    const index = (startIndex + i) % testimonials.length;
    visibleTestimonials.push(testimonials[index]);
  }

  return (
    <section
      className="py-16 md:py-20 bg-gradient-to-br from-blue-50 via-white to-blue-100 relative overflow-hidden"
      id="testimonials"
    >
      {/* Electrical Background Animations */}
      <div className="absolute inset-0">
        {/* Circuit Animations */}
        <ElectricalCircuitAnimation
          size={500}
          speed={50}
          opacity={0.08}
          className="top-10 left-10"
        />
        <ElectricalCircuitAnimation
          size={300}
          speed={35}
          opacity={0.06}
          className="bottom-20 right-20"
        />
        <ElectricalCircuitAnimation
          size={200}
          speed={25}
          opacity={0.04}
          className="top-1/2 left-1/4"
        />

        {/* Flowing Lines */}
        <FlowingCircuitLines className="opacity-10" />

        {/* Pulsing Grid */}
        <PulsingElectricalGrid className="opacity-10" />

        {/* Floating Electrical Icons */}
        <FloatingElectricalIcons />
      </div>

      {/* Existing background elements */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiMxMDc5YjkiIHN0cm9rZS13aWR0aD0iMSI+PHBhdGggZD0iTTAgMGg2MHY2MEgweiIvPjwvZz48L3N2Zz4=')] opacity-10"></div>
      <div className="absolute top-0 left-0 w-full h-48 bg-gradient-to-b from-blue-500/10 to-transparent"></div>
      <motion.div
        className="absolute top-1/4 left-1/4 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 8, repeat: Infinity }}
      />
      <motion.div
        className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-300/5 rounded-full blur-3xl"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 10, repeat: Infinity, delay: 1 }}
      />

      <div className="container px-4 mx-auto max-w-7xl relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm uppercase tracking-wider mb-4 border border-blue-200">
            <Zap className="h-3 w-3 fill-blue-500/25 text-blue-500" />
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mt-2 mb-4">
            What Our{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400">
              Clients Say
            </span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            See what industry professionals have to say about working with SNSS.
          </p>
          <motion.div
            className="h-1 w-16 bg-gradient-to-r from-blue-500 to-blue-400 mx-auto mt-4 rounded-full"
            initial={{ width: 0 }}
            whileInView={{ width: 64 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            viewport={{ once: true }}
          />
        </motion.div>

        {/* Featured Testimonials Carousel */}
        <div
          className="relative mb-16"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Navigation Arrows */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-10"
          >
            <button
              className="h-10 w-10 rounded-full bg-white/90 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-lg flex items-center justify-center transition-all"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-10"
          >
            <button
              className="h-10 w-10 rounded-full bg-white/90 border border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white hover:border-blue-600 shadow-lg flex items-center justify-center transition-all"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </motion.div>

          <div className="overflow-hidden py-2 mx-4 md:mx-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                className="flex justify-center gap-6"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
              >
                {visibleTestimonials.map((testimonial, idx) => {
                  const absoluteIndex =
                    (currentIndex + idx) % testimonials.length;
                  const isExpanded = expandedTestimonial === absoluteIndex;
                  const isLongText = testimonial.content.length > 150;

                  return (
                    <motion.div
                      key={`${currentIndex}-${idx}`}
                      className={`flex-shrink-0 ${isLargeScreen ? "w-1/3" : "w-full max-w-2xl"}`}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: idx * 0.1 }}
                    >
                      <Card className="w-full h-full bg-gradient-to-br from-white via-blue-50 to-blue-100 backdrop-blur-sm border border-blue-200 hover:border-blue-400 transition-all duration-500 p-6 relative overflow-hidden group shadow-lg">
                        {/* Background decorative elements */}
                        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-100 rounded-bl-full transition-all duration-500 group-hover:w-24 group-hover:h-24"></div>
                        <div className="absolute bottom-0 left-0 w-12 h-12 bg-blue-50 rounded-tr-full transition-all duration-500 group-hover:w-16 group-hover:h-16"></div>

                        {/* Quote icon */}
                        <div className="absolute top-4 right-4 opacity-15">
                          <Quote className="h-8 w-8 text-blue-400" />
                        </div>

                        <div className="flex flex-col items-center text-center mb-4 relative z-10">
                          <motion.div
                            whileHover={{ rotate: 3, scale: 1.03 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="mb-4"
                          >
                            <Avatar className="h-14 w-14 border border-blue-300 group-hover:border-blue-500 transition-colors duration-500 shadow">
                              <AvatarImage src={testimonial.image} />
                              <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                                {testimonial.name[0]}
                              </AvatarFallback>
                            </Avatar>
                          </motion.div>
                          <div>
                            <h4 className="font-semibold text-gray-900 group-hover:text-gray-800 transition-colors duration-300 text-lg">
                              {testimonial.name}
                            </h4>
                            <p className="text-sm text-blue-600">
                              {testimonial.role}
                            </p>
                            <p className="text-sm text-gray-600 mt-0.5">
                              {testimonial.company}
                            </p>
                            <div className="flex items-center justify-center mt-2">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${i < testimonial.rating ? "fill-yellow-400 text-yellow-400" : "fill-gray-300 text-gray-300"} transition-colors duration-300`}
                                />
                              ))}
                              <span className="text-sm text-gray-500 ml-1">
                                ({testimonial.rating}.0)
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="relative">
                          <p
                            className={`text-gray-700 leading-relaxed text-base md:text-lg italic text-center z-10 transition-all duration-300 ${isExpanded ? "" : "line-clamp-4"}`}
                          >
                            "{testimonial.content}"
                          </p>

                          {isLongText && (
                            <button
                              onClick={() => toggleExpand(absoluteIndex)}
                              className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center justify-center mx-auto transition-colors"
                            >
                              <Expand className="h-3 w-3 mr-1" />
                              {isExpanded ? "Read Less" : "Read More"}
                            </button>
                          )}
                        </div>

                        {/* Industry badge */}
                        <div className="mt-4 flex justify-center">
                          <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded border border-blue-200">
                            {testimonial.industry}
                          </span>
                        </div>

                        {/* Animated highlight on active card */}
                        {idx === 0 && (
                          <motion.div
                            className="absolute inset-0 border-2 border-blue-300 rounded-lg pointer-events-none"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                          />
                        )}
                      </Card>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation dots */}
          <div className="flex justify-center gap-1.5 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 flex items-center justify-center ${
                  index === currentIndex
                    ? "bg-blue-600"
                    : "bg-blue-200 hover:bg-blue-300"
                }`}
                onClick={() => goToTestimonial(index)}
              >
                {index === currentIndex && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-blue-600"
                    layoutId="activeDot"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;