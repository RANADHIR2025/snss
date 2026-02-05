"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { X } from "lucide-react";

interface ListItem {
  id: number;
  title: string;
  category: string;
  src: string;
  alt: string;
  color: "blue";
  href?: string;
}

interface RollingTextItemProps {
  item: ListItem;
  onItemClick?: () => void;
}

const colorClassMap: Record<ListItem["color"], string> = {
  blue: "text-blue-500",
};

function RollingTextItem({ item, onItemClick }: RollingTextItemProps) {
  return (
    <div 
      className="group relative w-full cursor-pointer border-b border-neutral-200 dark:border-neutral-800 py-4"
      onClick={onItemClick}
    >
      {/* Rolling text for mobile */}
      <div className="relative overflow-hidden h-14">
        <div className="transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)] group-hover:-translate-y-1/2">
          {/* State 1: Normal */}
          <div className="h-14 flex items-center">
            <h2 className="text-4xl font-black text-neutral-900 dark:text-white uppercase tracking-tighter">
              {item.title}
            </h2>
          </div>

          {/* State 2: Hover (Italic + Color) */}
          <div className="h-14 flex items-center">
            <h2
              className={cn(
                "text-4xl font-black uppercase tracking-tighter italic",
                colorClassMap[item.color]
              )}
            >
              {item.title}
            </h2>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileRollingMenu({ 
  isOpen, 
  onClose 
}: { 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const items: ListItem[] = [
    {
      id: 1,
      title: "Discover",
      category: "Research",
      src: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=60",
      alt: "Team discovering insights",
      color: "blue",
    },
    {
      id: 2,
      title: "Design",
      category: "Experience",
      src: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&auto=format&fit=crop&q=60",
      alt: "Design collaboration",
      color: "blue",
    },
    {
      id: 3,
      title: "Develop",
      category: "Engineering",
      src: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=400&auto=format&fit=crop&q=60",
      alt: "Developers coding",
      color: "blue",
    },
    {
      id: 4,
      title: "Deploy",
      category: "Launch",
      src: "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?w=400&auto=format&fit=crop&q=60",
      alt: "Product launch",
      color: "blue",
    },
  ];

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 bg-white dark:bg-neutral-950 transition-transform duration-500 ease-[cubic-bezier(0.76,0,0.24,1)]",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 z-50 p-2 text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
      >
        <X size={28} />
      </button>

      {/* Mobile menu content with rolling animation */}
      <div className="flex flex-col h-full pt-20 pb-10 px-6">
        <div className="mb-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-500">
            Menu
          </h3>
        </div>
        <div className="flex-1">
          {items.map((item) => (
            <RollingTextItem 
              key={item.id} 
              item={item} 
              onItemClick={onClose}
            />
          ))}
        </div>
      </div>
    </div>
  );
}