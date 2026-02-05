"use client";

import { 
  Mail, 
  Phone, 
  MapPin, 
  Facebook, 
  Twitter, 
  Linkedin, 
  Instagram, 
  Github,
  ArrowRight,
  Navigation,
  Clock,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const footerLinks = [
  { id: 1, name: 'Home', href: '/' },
  { id: 2, name: 'About Us', href: '#about' },
  { id: 3, name: 'Partners', href: '#partners' },
  { id: 4, name: 'Contact Us', href: '#footer' },
];

const socialLinks = [
  { icon: Facebook, href: '#', label: 'Facebook' },
  { icon: Twitter, href: '#', label: 'Twitter' },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },

];

// Button Component
const Button = ({ children, variant = "default", size = "default", className = "", asChild = false, ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variants = {
    default: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-blue-200 bg-transparent hover:bg-blue-50 hover:text-blue-600",
    ghost: "hover:bg-blue-50 hover:text-blue-600",
  };
  
  const sizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };
  
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
  
  if (asChild) {
    return <span className={classes} {...props}>{children}</span>;
  }
  
  return <button className={classes} {...props}>{children}</button>;
};

// Corner decoration component
function CreateCorners({ children }: { children: React.ReactNode }) {
  const positions = [
    "top-0 -left-3",
    "top-0 -right-3",
    "bottom-0 -left-3",
    "bottom-0 -right-3",
  ];

  return (
    <div className="absolute z-10 inset-0 pointer-events-none">
      {positions.map((pos, index) => (
        <section key={index} className={`absolute ${pos}`}>
          {children}
        </section>
      ))}
    </div>
  );
}

export function Footer() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const scrollToSection = (href: string) => {
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="w-full bg-gradient-to-b from-blue-50 via-white to-blue-100 text-gray-800 pt-16 pb-8 mt-24 border-t border-blue-200 relative overflow-hidden">
      {/* Blue-white gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-100 z-0" />
      
      {/* Grid Box Pattern from Hero section */}
      <div className="absolute inset-0 overflow-hidden">
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
      </div>
      
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIiBzdHJva2U9IiM2MGFmZjAiIHN0cm9rZS13aWR0aD0iMC4yIj48cGF0aCBkPSJNIDAgMCBMIDYwIDYwIE0gNjAgMCBMIDAgNjAiLz48L2c+PC9zdmc+')] opacity-10"></div>
      
      {/* Corner decorations */}
      <CreateCorners>
        <Plus className="font-[200] text-blue-400/30" size={16} />
      </CreateCorners>

      {/* Main Content */}
      <div className="relative z-10">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 relative">
            
            {/* Company Info */}
            <div className="space-y-1 relative z-10">
              <div className="flex flex-col">
                <div className="flex flex-col items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src="/finallogo.png"
                        alt="SNSS Electrical Solutions"
                        className="h-12 w-auto object-contain"
                      />
                    </div>
                    <div>
                      <h2 className="font-bold text-2xl text-gray-900">SNSS</h2>
                      <span className="text-xs leading-tight text-blue-600 font-medium tracking-wide uppercase">
                        ELECTRICAL SOLUTIONS
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed max-w-xs border-l-2 border-blue-300 pl-4 py-1 mt-3">
                Empowering industries with innovative electrical solutions and services with excellence and reliability.
              </p>
              <div className="flex space-x-4 mt-4">
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/50 border-blue-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 group transform hover:-translate-y-1 shadow-md hover:shadow-blue-500/20 relative overflow-hidden"
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <a
                    href="https://maps.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-full flex items-center justify-center relative z-10"
                  >
                    <Navigation className="w-4 h-4 text-blue-500 group-hover:text-white" />
                  </a>
                  
                  {/* Subtle hover indicator */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white/80 group-hover:w-16 transition-all duration-300" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/50 border-blue-200 hover:bg-green-600 hover:border-green-600 hover:text-white transition-all duration-300 group transform hover:-translate-y-1 shadow-md hover:shadow-green-500/20 relative overflow-hidden"
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <a href="tel:03340077671" className="w-full h-full flex items-center justify-center relative z-10">
                    <Phone className="w-4 h-4 text-blue-500 group-hover:text-white" />
                  </a>
                  
                  {/* Subtle hover indicator */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white/80 group-hover:w-16 transition-all duration-300" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="bg-white/50 border-blue-200 hover:bg-blue-600 hover:border-blue-600 hover:text-white transition-all duration-300 group transform hover:-translate-y-1 shadow-md hover:shadow-blue-500/20 relative overflow-hidden"
                >
                  {/* Hover background effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <a href="mailto:snss.anil@gmail.com" className="w-full h-full flex items-center justify-center relative z-10">
                    <Mail className="w-4 h-4 text-blue-500 group-hover:text-white" />
                  </a>
                  
                  {/* Subtle hover indicator */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-white/80 group-hover:w-16 transition-all duration-300" />
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-7 relative z-10">
              <h4 className="font-semibold text-lg text-gray-900 relative pb-2 after:absolute after:left-0 after:bottom-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-blue-300 after:rounded-full">
                Quick Links
              </h4>
              <ul className="space-y-4">
                {footerLinks.map((item) => (
                  <li key={item.id}>
                    <button
                      onClick={() => item.href === '/' ? window.location.href = '/' : scrollToSection(item.href)}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-all duration-300 flex items-center group hover:pl-2 w-full text-left"
                    >
                      <ArrowRight className="w-3 h-3 mr-3 opacity-0 group-hover:opacity-100 transition-all duration-300 text-blue-500 transform group-hover:translate-x-0 -translate-x-2" />
                      {item.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info with Border Animation */}
            <div className="space-y-7 relative z-10">
              <h4 className="font-semibold text-lg text-gray-900 relative pb-2 after:absolute after:left-0 after:bottom-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-blue-300 after:rounded-full">
                Contact Info
              </h4>
              <div className="space-y-5">
                <div className="flex items-start space-x-4 group relative overflow-hidden">
                  {/* Hover background effect - Like Hero section */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-100/30 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="p-2 rounded-md bg-white/50 group-hover:bg-blue-50 transition-all duration-300 flex-shrink-0 border border-blue-200 group-hover:border-blue-300 shadow-sm relative z-10">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors group-hover:pl-1 duration-300 relative z-10">
                    13, India Exchange Pl Rd, Murgighata, B.B.D. Bagh, Kolkata, West Bengal 700001
                  </p>
                  
                  {/* Clickable overlay hint - Like Hero section stats */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-300/30 rounded-lg" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group relative overflow-hidden">
                  {/* Hover background effect - Like Hero section */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-100/30 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="p-2 rounded-md bg-white/50 group-hover:bg-blue-50 transition-all duration-300 flex-shrink-0 border border-blue-200 group-hover:border-blue-300 shadow-sm relative z-10">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors group-hover:pl-1 duration-300 relative z-10">
                    03340077671
                  </p>
                  
                  {/* Clickable overlay hint - Like Hero section stats */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-300/30 rounded-lg" />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 group relative overflow-hidden">
                  {/* Hover background effect - Like Hero section */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-100/30 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  
                  <div className="p-2 rounded-md bg-white/50 group-hover:bg-blue-50 transition-all duration-300 flex-shrink-0 border border-blue-200 group-hover:border-blue-300 shadow-sm relative z-10">
                    <Mail className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors group-hover:pl-1 duration-300 relative z-10">
                    snss.anil@gmail.com
                  </p>
                  
                  {/* Clickable overlay hint - Like Hero section stats */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 border-2 border-blue-300/30 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours with Border Animation */}
            <div className="space-y-7 relative z-10">
              <h4 className="font-semibold text-lg text-gray-900 relative pb-2 after:absolute after:left-0 after:bottom-0 after:w-12 after:h-0.5 after:bg-gradient-to-r after:from-blue-500 after:to-blue-300 after:rounded-full">
                Business Hours
              </h4>
              <div className="space-y-4 bg-white/50 p-5 rounded-lg border border-blue-200 shadow-sm relative overflow-hidden group hover:border-blue-300 transition-all duration-300 hover:bg-white/70 cursor-pointer">
                {/* Hover background effect - Like Hero section */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 via-blue-100/30 to-blue-50/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                
                {/* Gradient background effect on hover - Like Hero section stats */}
                <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="flex justify-between items-center text-sm py-2 border-b border-blue-200 group-hover:border-blue-300 transition-colors duration-300 relative z-10">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-2 text-blue-600" />
                    Monday - Friday:
                  </span>
                  <span className="text-gray-900 font-medium">
                    9:00 AM - 6:00 PM
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 border-b border-blue-200 group-hover:border-blue-300 transition-colors duration-300 relative z-10">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-2 text-blue-600" />
                    Saturday:
                  </span>
                  <span className="text-gray-900 font-medium">
                    10:00 AM - 4:00 PM
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm py-2 relative z-10">
                  <span className="text-gray-600 flex items-center">
                    <Clock className="w-3 h-3 mr-2 text-blue-600" />
                    Sunday:
                  </span>
                  <span className="text-red-500 font-medium">Closed</span>
                </div>
              
              </div>
            </div>
          </div>

          {/* Bottom Section with Social Links with Border Animation */}
          <div className="mt-12 pt-8 border-t border-blue-200 relative">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
              <p className="text-sm text-gray-500">
                © {new Date().getFullYear()} SNSS Electrical Solutions. All rights reserved.
              </p>
              <div className="flex space-x-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="relative w-9 h-9 rounded-full bg-white border border-blue-200 flex items-center justify-center hover:bg-blue-600 hover:border-blue-600 transition-all duration-300 hover:scale-110 shadow-sm group overflow-hidden"
                    >
                      {/* Hover background effect - Like Hero section */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      
                      {/* Icon */}
                      <Icon className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors relative z-10" />
                      
                      {/* Clickable overlay hint */}
                      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                        <div className="absolute inset-0 border-2 border-white/30 rounded-full" />
                      </div>
                    </a>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}