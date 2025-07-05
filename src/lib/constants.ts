
export const SPORTS = ['Tennis', 'Padel', 'Badminton', 'Table Tennis'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_ICONS: Record<Sport, string> = {
  'Tennis': '/tennis_icon.png',
  'Padel': '/padel_icon.png',
  'Badminton': '/badminton_icon.png',
  'Table Tennis': '/tabletennis_icon.png',
};
