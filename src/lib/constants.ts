

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
export const STOCK_AVATARS = [
  { url: '/avatars/01.png' },
  { url: '/avatars/02.png' },
  { url: '/avatars/03.png' },
  { url: '/avatars/04.png' },
  { url: '/avatars/05.png' },
  { url: '/avatars/06.png' },
  { url: '/avatars/07.png' },
  { url: '/avatars/08.png' },
  { url: '/avatars/09.png' },
  { url: '/avatars/10.png' },
  { url: '/avatars/11.png' },
  { url: '/avatars/12.png' },
];
