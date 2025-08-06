'use client';

import { useTheme } from 'next-themes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Sun, Moon, Laptop } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5 dark:hidden" /><Moon className="h-5 w-5 hidden dark:inline-block" /> Theme</CardTitle>
        <CardDescription>Select your preferred color scheme.</CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-2 gap-4">
          <div>
            <RadioGroupItem value="light" id="light" className="peer sr-only" />
            <Label
              htmlFor="light"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Sun className="mb-3 h-6 w-6" />
              Light
            </Label>
          </div>
          <div>
            <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
            <Label
              htmlFor="dark"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
            >
              <Moon className="mb-3 h-6 w-6" />
              Dark
            </Label>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
