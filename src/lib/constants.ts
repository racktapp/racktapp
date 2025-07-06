

export const SPORTS = ['Tennis', 'Padel', 'Badminton', 'Table Tennis', 'Pickleball'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_ICONS: Record<Sport, string> = {
  'Tennis': '/tennis_icon.png',
  'Padel': '/padel_icon.png',
  'Badminton': '/badminton_icon.png',
  'Table Tennis': '/tabletennis_icon.png',
  'Pickleball': '/pickleball_icon.png',
};

// --- Avatar Customization Constants ---
export const SKIN_COLORS = ['#f2d5b1', '#d1a377', '#ad7d52', '#8d5524', '#613915'];
export const HAIR_COLORS = ['#090806', '#4a312a', '#b88b49', '#f2d16d', '#d94f28', '#e2e2e2'];
export const HAIR_STYLES = ['short', 'long', 'bun', 'bald'];
