"use client";

import { themes } from "@/lib/themes";

interface ThemeSelectorProps {
  selectedTheme: string;
  onThemeChange: (theme: string) => void;
}

export function ThemeSelector({
  selectedTheme,
  onThemeChange,
}: ThemeSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="theme-selector">Theme:</label>
      <select
        id="theme-selector"
        value={selectedTheme}
        onChange={(e) => onThemeChange(e.target.value)}
        className="p-2 border rounded-md bg-white text-black"
      >
        {themes.map((theme) => {
          const themeName = theme.replace('.css', '').replace(/-/g, ' ');
          return (
            <option key={theme} value={theme}>
              {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
            </option>
          );
        })}
      </select>
    </div>
  );
}
