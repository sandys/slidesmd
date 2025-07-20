"use client";

import { themes } from "@/lib/themes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
      <Label htmlFor="theme-selector">Theme:</Label>
      <Select value={selectedTheme} onValueChange={onThemeChange}>
        <SelectTrigger id="theme-selector" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => {
            const themeName = theme.replace('.css', '').replace(/-/g, ' ');
            return (
              <SelectItem key={theme} value={theme}>
                {themeName.charAt(0).toUpperCase() + themeName.slice(1)}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

