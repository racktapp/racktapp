export type RallyGameInput = any;

export type RallyGameOutput = {
  serveOptions?: {
    name: string;
    description: string;
    risk: 'low' | 'medium' | 'high';
    reward: 'low' | 'medium' | 'high';
  }[];
  returnOptions?: { name: string; description: string }[];
  pointWinner?: 'server' | 'returner';
  narrative?: string;
};

export async function playRallyPoint(
  _input: RallyGameInput,
): Promise<RallyGameOutput> {
  return {
    serveOptions: [
      {
        name: 'Placeholder Serve',
        description: 'Static serve option.',
        risk: 'low',
        reward: 'low',
      },
    ],
    pointWinner: 'server',
    narrative: 'Rally simulation unavailable in static build.',
  };
}
