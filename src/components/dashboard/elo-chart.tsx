'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { EloDataPoint } from '@/lib/types';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const chartConfig = {
  elo: {
    label: "RacktRank",
    color: "hsl(var(--primary))",
  },
};

interface EloChartProps {
  data: EloDataPoint[];
}

export function EloChart({ data }: EloChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>RacktRank Progression</CardTitle>
        <CardDescription>Your ELO rating over the last 7 months.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[250px] w-full">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              domain={['dataMin - 100', 'dataMax + 100']}
            />
            <Tooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Line
              dataKey="elo"
              type="monotone"
              stroke="var(--color-elo)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
