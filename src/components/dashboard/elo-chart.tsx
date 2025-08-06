'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { EloDataPoint } from '@/lib/types';
import { Line, LineChart, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { format } from 'date-fns';


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
        <CardDescription>
            {data.length > 0 ? "Your ELO rating over time." : "Report matches to see your rank progression."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                    dataKey="date" 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={8}
                    tickFormatter={(value) => format(new Date(value), 'MMM d')}
                />
                <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                domain={['dataMin - 100', 'dataMax + 100']}
                />
                <Tooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        indicator="line" 
                        labelFormatter={(label, payload) => {
                             if (payload && payload.length > 0) {
                                return format(new Date(payload[0].payload.date), 'PPP');
                            }
                            return label;
                        }}
                    />}
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
        ) : (
            <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
                No ELO history data available yet.
            </div>
        )}
      </CardContent>
    </Card>
  );
}
