"use client";

import * as React from 'react';
import { AvatarConfig } from '@/lib/types';
import { cn } from '@/lib/utils';

const hairStyleSvgs: Record<string, React.ReactNode> = {
  short: (
    <path
      d="M 20 40 C 20 15, 80 15, 80 40"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  long: (
    <path
      d="M 20 40 C 20 15, 80 15, 80 40 V 70 C 80 85, 20 85, 20 70 Z"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bun: (
    <>
      <path
        d="M 25 40 C 25 20, 75 20, 75 40"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="50" cy="18" r="8" />
    </>
  ),
  bald: null,
};

export function CustomAvatar({
  config,
  className,
}: {
  config: AvatarConfig;
  className?: string;
}) {
  return (
    <div className={cn('w-full h-full rounded-full', className)}>
      <svg
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full"
      >
        <g>
          {/* Head */}
          <circle cx="50" cy="50" r="40" fill={config.skinColor} />

          {/* Hair */}
          <g
            fill={config.hairColor}
            stroke={config.hairColor}
            className="transition-all"
          >
            {hairStyleSvgs[config.hairStyle]}
          </g>

          {/* Eyes */}
          <g fill="black">
            <circle cx="38" cy="48" r="3.5" />
            <circle cx="62" cy="48" r="3.5" />
          </g>

          {/* Mouth */}
          <path
            d="M 40 65 C 45 70, 55 70, 60 65"
            stroke="black"
            fill="none"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
      </svg>
    </div>
  );
}
