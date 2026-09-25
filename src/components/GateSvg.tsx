import React from 'react';
import { ComponentType } from '../engine/types';

interface GateSvgProps {
  type: ComponentType;
  width: number;
  height: number;
  active?: boolean;
}

export const GateSvg: React.FC<GateSvgProps> = ({ type, width, height, active }) => {
  const strokeColor = active ? '#22c55e' : 'currentColor';
  const fillColor = 'none';

  switch (type) {
    case 'AND':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <path
            d="M 10,5 L 30,5 A 15,15 0 0,1 30,35 L 10,35 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'OR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <path
            d="M 10,5 Q 22,20 10,35 Q 35,35 48,20 Q 35,5 10,5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'NOT':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <polygon
            points="12,6 40,20 12,34"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="44" cy="20" r="3.5" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'NAND':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <path
            d="M 8,5 L 26,5 A 15,15 0 0,1 26,35 L 8,35 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="45" cy="20" r="3.5" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'NOR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <path
            d="M 8,5 Q 20,20 8,35 Q 31,35 43,20 Q 31,5 8,5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="47" cy="20" r="3.5" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'XOR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          {/* Offset back curve */}
          <path
            d="M 7,5 Q 19,20 7,35"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 13,5 Q 24,20 13,35 Q 36,35 49,20 Q 36,5 13,5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'XNOR':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <path
            d="M 6,5 Q 18,20 6,35"
            fill="none"
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 12,5 Q 23,20 12,35 Q 34,35 45,20 Q 34,5 12,5 Z"
            fill={fillColor}
            stroke={strokeColor}
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <circle cx="49" cy="20" r="3.5" fill="none" stroke={strokeColor} strokeWidth="2.5" />
        </svg>
      );

    case 'D_FLIPFLOP':
      return (
        <svg viewBox="0 0 60 40" className="w-full h-full text-neutral-700 dark:text-neutral-200">
          <rect x="5" y="4" width="50" height="32" rx="4" fill="none" stroke={strokeColor} strokeWidth="2" />
          {/* Clock triangle marker */}
          <polyline points="5,24 13,28 5,32" fill="none" stroke={strokeColor} strokeWidth="1.5" />
        </svg>
      );

    default:
      return null;
  }
};
