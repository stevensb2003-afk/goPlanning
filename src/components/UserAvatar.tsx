"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: string;
  className?: string;
  title?: string;
}

export default function UserAvatar({ 
  src, 
  name, 
  size = 'md', 
  rounded = 'rounded-full', 
  className = '',
  title
}: UserAvatarProps) {
  const [error, setError] = useState(false);
  
  // Reset error state if src changes
  useEffect(() => {
    setError(false);
  }, [src]);

  const initials = (name || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  const sizeClasses = {
    sm: "w-8 h-8 text-[10px]",
    md: "w-10 h-10 text-xs",
    lg: "w-12 h-12 text-sm",
    xl: "w-16 h-16 text-xl",
  };

  const hasImage = src && src !== "" && src !== "null" && src !== "undefined" && !error;

  return (
    <div 
      className={cn(
        "bg-slate-800 border border-white/10 flex items-center justify-center font-bold text-slate-400 overflow-hidden shrink-0 transition-all",
        rounded,
        sizeClasses[size as keyof typeof sizeClasses] || "",
        className
      )}
    >
      {hasImage ? (
        <img 
          src={src!} 
          alt={name || "User"} 
          className="w-full h-full object-cover"
          onError={() => setError(true)}
        />
      ) : (
        <span className="select-none tracking-tighter">{initials}</span>
      )}
    </div>
  );
}
