import React from 'react';
import { useTheme } from '../ThemeContext';

interface VoidLogoProps {
  size?: number;
  showText?: boolean;
  textSize?: string;
  animated?: boolean;
  className?: string;
}

export const VoidLogo: React.FC<VoidLogoProps> = ({ 
  size = 28, 
  showText = false, 
  textSize = 'text-2xl',
  animated = false,
  className = '' 
}) => {
  const { accentColor } = useTheme();
  const color = accentColor || '#00ff9d';
  
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className={animated ? 'void-logo-pulse' : ''}
      >
        <defs>
          <filter id={`glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor={color} floodOpacity="0.6" result="color" />
            <feComposite in="color" in2="blur" operator="in" result="shadow" />
            <feMerge>
              <feMergeNode in="shadow" />
              <feMergeNode in="shadow" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        <g filter={`url(#glow-${size})`}>
          <path 
            d="M50 8 L92 50 L50 92 L8 50 Z" 
            stroke={color} 
            strokeWidth="3" 
            fill="none"
            strokeLinejoin="miter"
          />
          
          <path 
            d="M50 22 L78 50 L50 78 L22 50 Z" 
            stroke={color} 
            strokeWidth="1.5" 
            fill="none"
            opacity="0.5"
            strokeLinejoin="miter"
          />
          
          <circle 
            cx="50" 
            cy="50" 
            r="12" 
            fill="#050505"
            stroke={color}
            strokeWidth="1.5"
            opacity="0.8"
          />
          
          <circle 
            cx="50" 
            cy="50" 
            r="4" 
            fill={color}
            opacity="0.3"
          />

          <line x1="50" y1="8" x2="50" y2="22" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="92" y1="50" x2="78" y2="50" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="50" y1="92" x2="50" y2="78" stroke={color} strokeWidth="1" opacity="0.3" />
          <line x1="8" y1="50" x2="22" y2="50" stroke={color} strokeWidth="1" opacity="0.3" />
        </g>
      </svg>
      
      {showText && (
        <span 
          className={`${textSize} font-bold tracking-[0.2em] uppercase neon-text`}
          style={{ color }}
        >
          VOID
        </span>
      )}
    </div>
  );
};

export default VoidLogo;
