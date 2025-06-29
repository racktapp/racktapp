'use client';
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { type Sport, SPORTS } from '@/lib/constants';

interface SportContextType {
  sport: Sport;
  setSport: (sport: Sport) => void;
}

const SportContext = createContext<SportContextType | undefined>(undefined);

export const SportProvider = ({ children }: { children: ReactNode }) => {
  const [sport, setSportState] = useState<Sport>(SPORTS[0]);

  useEffect(() => {
    const storedSport = localStorage.getItem('selectedSport') as Sport;
    if (storedSport && SPORTS.includes(storedSport)) {
      setSportState(storedSport);
    }
  }, []);

  const setSport = (newSport: Sport) => {
    setSportState(newSport);
    localStorage.setItem('selectedSport', newSport);
  };

  return (
    <SportContext.Provider value={{ sport, setSport }}>
      {children}
    </SportContext.Provider>
  );
};

export const useSport = (): SportContextType => {
  const context = useContext(SportContext);
  if (!context) {
    throw new Error('useSport must be used within a SportProvider');
  }
  return context;
};
