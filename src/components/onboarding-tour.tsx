
'use client';

import { useState, useEffect } from 'react';
import Joyride, { Step, CallBackProps, STATUS } from 'react-joyride';
import { useTheme } from 'next-themes';
import { useIsMobile } from '@/hooks/use-mobile';

const DESKTOP_STEPS: Step[] = [
  {
    target: '#tour-step-report-match',
    content: 'Welcome to Rackt! Start by reporting a match result to update your stats and RacktRank.',
    placement: 'bottom',
    disableBeacon: true,
  },
  {
    target: '#tour-step-challenges',
    content: 'Find opponents by accepting or posting challenges. This is the heart of the competition!',
    placement: 'right',
  },
   {
    target: '#tour-step-ai-coach',
    content: 'Use our AI-powered tools to analyze your swing or get match predictions.',
    placement: 'right',
  },
  {
    target: '#tour-step-profile-menu',
    content: 'Click here to change your sport, switch themes, edit your profile, or log out.',
    placement: 'top',
  },
];

const MOBILE_STEPS: Step[] = [
    {
      target: '#tour-step-report-match',
      content: 'Welcome to Rackt! Start by reporting a match result to update your stats and RacktRank.',
      placement: 'bottom',
      disableBeacon: true,
    },
    {
      target: '#tour-step-sport-selector',
      content: 'You can switch between different sports here. Your stats and leaderboards are specific to each sport.',
      placement: 'bottom',
    },
];

export const OnboardingTour = () => {
  const [run, setRun] = useState(false);
  const { theme } = useTheme();
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
        const tourCompleted = localStorage.getItem('onboardingTourCompleted');
        if (!tourCompleted) {
          setTimeout(() => {
            setRun(true);
          }, 1500);
        }
    } catch (error) {
        // localStorage is not available (e.g. in server-side rendering or private browsing)
        console.error("Could not access localStorage for onboarding tour.", error);
    }
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      try {
        localStorage.setItem('onboardingTourCompleted', 'true');
      } catch (error) {
         console.error("Could not save tour completion status to localStorage.", error);
      }
      setRun(false);
    }
  };
  
  // Don't render anything until we know if we're on mobile or not
  if (isMobile === undefined) {
    return null;
  }

  return (
    <Joyride
      run={run}
      steps={isMobile ? MOBILE_STEPS : DESKTOP_STEPS}
      callback={handleJoyrideCallback}
      continuous
      showProgress
      showSkipButton
      styles={{
        options: {
          arrowColor: theme === 'dark' ? '#27272A' : '#FFFFFF',
          backgroundColor: theme === 'dark' ? '#27272A' : '#FFFFFF',
          primaryColor: '#2563EB',
          textColor: theme === 'dark' ? '#F4F4F5' : '#18181B',
          zIndex: 1001, // Ensure it's above the mobile nav sheet (z-50)
        },
        buttonClose: {
          display: 'none',
        },
        // Ensure tooltip is above mobile navigation
        spotlight: {
           zIndex: 1001,
        }
      }}
    />
  );
};
