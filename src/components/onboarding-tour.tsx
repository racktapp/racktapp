
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Swords, Bot, User, LayoutDashboard } from 'lucide-react';

const TOUR_COMPLETED_KEY = 'onboardingTourCompleted';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Your Dashboard',
    description: 'This is your home base. Report matches, see your stats, and access all key features from here.',
  },
  {
    icon: Swords,
    title: 'Challenges',
    description: 'Find opponents by accepting open challenges or sending direct challenges to your friends.',
  },
  {
    icon: Bot,
    title: 'AI-Powered Tools',
    description: 'Use the AI Coach to analyze your swing and the Match Predictor to get insights on upcoming games.',
  },
  {
    icon: User,
    title: 'Profile & Settings',
    description: 'Manage your profile, switch sports, and change your theme from the user menu.',
  },
];

export const OnboardingTour = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // We need a delay to ensure the rest of the app has mounted.
    const timer = setTimeout(() => {
      try {
        const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
        if (!tourCompleted) {
          setIsOpen(true);
        }
      } catch (error) {
        console.error("Could not access localStorage for onboarding tour.", error);
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleComplete = () => {
    try {
      localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error("Could not save tour completion status to localStorage.", error);
    }
    setIsOpen(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">Welcome to Rackt!</DialogTitle>
          <DialogDescription className="text-center">
            Here are a few key features to get you started.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-4">
              <div className="bg-primary/10 p-2 rounded-full mt-1">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{feature.title}</p>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button onClick={handleComplete} className="w-full">
            <CheckCircle className="mr-2 h-4 w-4" />
            Got it, let's go!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
