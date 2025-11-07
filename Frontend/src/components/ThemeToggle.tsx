import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import React from 'react';

// Minimal toggle: pill with moving thumb and a simple icon inside the track
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const title = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={title}
      title={title}
      onClick={toggleTheme}
      className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-300 dark:bg-gray-700 transition-colors duration-200 focus:outline-none active:outline-none active:ring-0 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
    >
      {/* Thumb with small icon inside to indicate mode */}
      <span
        className={[
          'inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow transition-transform duration-200',
          isDark ? 'translate-x-6' : 'translate-x-1'
        ].join(' ')}
      >
        {isDark ? (
          <Moon className="h-3 w-3 text-gray-700" />
        ) : (
          <Sun className="h-3 w-3 text-amber-500" />
        )}
      </span>
    </button>
  );
}
