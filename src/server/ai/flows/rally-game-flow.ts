
'use client';

import type { RallyGameInput, RallyGameOutput, ServeChoice, ReturnChoice } from '@/lib/types';

export async function playRallyPoint(input: RallyGameInput): Promise<RallyGameOutput> {
  if (!input.serveChoice) {
    const options: ServeChoice[] = [
      { name: 'Flat Serve', description: 'Fast and direct', risk: 'medium', reward: 'medium' },
      { name: 'Slice Serve', description: 'Curving away', risk: 'low', reward: 'low' },
      { name: 'Kick Serve', description: 'High bouncing', risk: 'high', reward: 'high' },
    ];
    return { serveOptions: options };
  }

  if (!input.returnChoice) {
    const options: ReturnChoice[] = [
      { name: 'Block Return', description: 'Neutral' },
      { name: 'Chip Return', description: 'Low slice' },
      { name: 'Aggressive Return', description: 'Take early' },
    ];
    return { returnOptions: options };
  }

  return {
    pointWinner: 'server',
    narrative: 'Point result unavailable in static build.',
  };
}

