export type RallyGameInput = any;

export type RallyGameOutput = {
  serveOptions?: { name: string; description: string; risk?: string; reward?: string }[];
  returnOptions?: { name: string; description: string }[];
  pointWinner?: 'server' | 'returner';
  narrative?: string;
};

export async function playRallyPoint(_input: RallyGameInput): Promise<RallyGameOutput> {
  return {
    pointWinner: 'server',
    narrative: 'Rally simulation unavailable in static build.',
  };
}
