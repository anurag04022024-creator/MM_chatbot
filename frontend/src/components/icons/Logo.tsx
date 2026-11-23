import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

/**
 * Original neutral starburst / quad logo placeholder.
 * Does not use any Anthropic trademarked brand assets.
 */
export const Logo: React.FC<LogoProps> = ({ className = '', size = 22 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="NOVA Logo"
      role="img"
    >
      <path
        d="M12 2C12.4 7.2 16.8 11.6 22 12C16.8 12.4 12.4 16.8 12 22C11.6 16.8 7.2 12.4 2 12C7.2 11.6 11.6 7.2 12 2Z"
        fill="currentColor"
      />
    </svg>
  );
};
