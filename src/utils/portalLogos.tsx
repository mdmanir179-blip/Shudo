import React from 'react';
import { Store } from 'lucide-react';

interface PortalLogoProps {
  name: string;
  logoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const PortalLogo: React.FC<PortalLogoProps> = ({
  name,
  logoUrl,
  size = 'md',
  className = ''
}) => {
  // Size dimensions
  const sizeClasses = {
    sm: 'w-5 h-5 rounded-md text-[10px]',
    md: 'w-7 h-7 rounded-lg text-xs',
    lg: 'w-10 h-10 rounded-xl text-sm'
  }[size];

  const lowerName = (name || '').toLowerCase();

  // If user provided a custom image URL
  if (logoUrl && logoUrl.trim()) {
    return (
      <img
        src={logoUrl.trim()}
        alt={name}
        className={`${sizeClasses} object-contain shrink-0 bg-white p-0.5 border border-slate-200/80 shadow-2xs ${className}`}
        onError={(e) => {
          // fallback if image link is broken
          (e.target as HTMLElement).style.display = 'none';
        }}
      />
    );
  }

  // 1. Flipkart Logo
  if (lowerName.includes('flipkart')) {
    return (
      <div
        className={`${sizeClasses} bg-[#2874F0] flex items-center justify-center shrink-0 shadow-2xs border border-blue-600 ${className}`}
        title="Flipkart"
      >
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%] fill-current text-white">
          {/* Flipkart shopping bag with yellow handle and F */}
          <path
            d="M25 35 L75 35 L68 85 L32 85 Z"
            fill="#FFE11B"
          />
          <path
            d="M38 35 C38 22 62 22 62 35"
            stroke="#FFE11B"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
          />
          <text
            x="50"
            y="72"
            fill="#2874F0"
            fontSize="38"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
            fontStyle="italic"
          >
            f
          </text>
        </svg>
      </div>
    );
  }

  // 2. Amazon Logo
  if (lowerName.includes('amazon')) {
    return (
      <div
        className={`${sizeClasses} bg-[#131921] flex items-center justify-center shrink-0 shadow-2xs border border-slate-800 ${className}`}
        title="Amazon"
      >
        <svg viewBox="0 0 100 100" className="w-[82%] h-[82%]">
          <text
            x="50"
            y="54"
            fill="#FFFFFF"
            fontSize="46"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            a
          </text>
          {/* Amazon Orange Smile Arrow */}
          <path
            d="M22 65 Q50 82 78 63"
            fill="none"
            stroke="#FF9900"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M74 58 L82 64 L76 72 Z"
            fill="#FF9900"
          />
        </svg>
      </div>
    );
  }

  // 3. Meesho Logo
  if (lowerName.includes('meesho')) {
    return (
      <div
        className={`${sizeClasses} bg-[#8B1E5D] flex items-center justify-center shrink-0 shadow-2xs border border-[#70164A] ${className}`}
        title="Meesho"
      >
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <rect width="100" height="100" rx="20" fill="#8B1E5D" />
          <text
            x="50"
            y="70"
            fill="#FFFFFF"
            fontSize="52"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            m
          </text>
        </svg>
      </div>
    );
  }

  // 4. Swiggy Logo
  if (lowerName.includes('swiggy')) {
    return (
      <div
        className={`${sizeClasses} bg-[#FC8019] flex items-center justify-center shrink-0 shadow-2xs border border-orange-600 ${className}`}
        title="Swiggy"
      >
        <svg viewBox="0 0 100 100" className="w-[80%] h-[80%]">
          <path
            d="M50 15 C32 15 24 28 24 45 C24 64 50 85 50 85 C50 85 76 64 76 45 C76 28 68 15 50 15 Z"
            fill="#FFFFFF"
          />
          <path
            d="M44 32 C48 30 55 30 58 35 C62 40 54 44 48 48 C42 52 40 56 46 62 C50 66 58 64 62 60"
            fill="none"
            stroke="#FC8019"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  }

  // 5. Blinkit Logo
  if (lowerName.includes('blinkit')) {
    return (
      <div
        className={`${sizeClasses} bg-[#F8CB46] flex items-center justify-center shrink-0 shadow-2xs border border-amber-400 ${className}`}
        title="Blinkit"
      >
        <svg viewBox="0 0 100 100" className="w-[82%] h-[82%]">
          <rect width="100" height="100" rx="20" fill="#F8CB46" />
          <text
            x="50"
            y="70"
            fill="#0C831F"
            fontSize="54"
            fontWeight="900"
            fontFamily="sans-serif"
            textAnchor="middle"
          >
            b
          </text>
        </svg>
      </div>
    );
  }

  // Default fallback custom logo
  return (
    <div
      className={`${sizeClasses} bg-slate-900 text-white flex items-center justify-center font-bold uppercase shrink-0 shadow-2xs ${className}`}
      title={name}
    >
      {(name || 'P')[0]}
    </div>
  );
};
