

export const SPORTS = ['Tennis', 'Padel', 'Badminton', 'Table Tennis', 'Pickleball'] as const;
export type Sport = (typeof SPORTS)[number];

export const SPORT_ICONS: Record<Sport, string> = {
  'Tennis': '/tennis_icon.png',
  'Padel': '/padel_icon.png',
  'Badminton': '/badminton_icon.png',
  'Table Tennis': '/tabletennis_icon.png',
  'Pickleball': '/pickleball_icon.png',
};

// IMPORTANT: These paths must correspond to actual files in the /public/avatars folder.
// This generates a list from 01.png to 22.png, excluding 06.png and 16.png.
const excludedAvatarNumbers = [6, 16];
export const STOCK_AVATARS = Array.from({ length: 22 }, (_, i) => i + 1)
  .filter(num => !excludedAvatarNumbers.includes(num))
  .map(num => ({
    url: `/avatars/${String(num).padStart(2, '0')}.png`,
  }));
