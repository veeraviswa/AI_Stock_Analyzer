"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StockData } from '@/lib/types';
import { formatCompactNumber, formatDate } from '@/lib/utils';

interface VolumeChartProps {
  data: StockData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm text-muted-foreground">{formatDate(new Date(label))}</p>
          <p className="text-sm text-foreground">Volume: {formatCompactNumber(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

export function VolumeChart({ data }: VolumeChartProps) {

  const dataWithSpike = data.map(d => ({
    ...d,
    isSpike: d.volumeMA20 && d.Volume > d.volumeMA20 * 2
  }));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Trend</CardTitle>
        <CardDescription>Daily trading volume with significant spikes highlighted.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={dataWithSpike}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="Date"
              tickFormatter={(date) => formatDate(date, { month: 'short', day: 'numeric' })}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              tickFormatter={(value) => formatCompactNumber(value as number)}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--primary), 0.1)'}} />
            <Bar dataKey="Volume">
                {dataWithSpike.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.isSpike ? 'hsl(var(--primary))' : 'hsl(var(--primary), 0.3)'} />
                ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
