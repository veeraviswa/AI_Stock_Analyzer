"use client";

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StockData } from '@/lib/types';
import { formatCompactNumber, formatDate } from '@/lib/utils';

interface ClosePriceChartProps {
  data: StockData[];
  movingAverages: {
    ma7: boolean;
    ma14: boolean;
    ma30: boolean;
  };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-x-2 gap-y-1">
          <p className="text-sm text-muted-foreground col-span-2">{formatDate(new Date(label))}</p>
          <p className="text-sm font-medium text-foreground">Close:</p>
          <p className="text-sm text-right">{payload[0].value.toFixed(2)}</p>
          {payload.map((p: any) => p.dataKey !== 'Close' && (
            <React.Fragment key={p.dataKey}>
              <p className="text-sm font-medium" style={{color: p.color}}>{p.name}:</p>
              <p className="text-sm text-right" style={{color: p.color}}>{p.value.toFixed(2)}</p>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return null;
};


export function ClosePriceChart({ data, movingAverages }: ClosePriceChartProps) {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Close Price</CardTitle>
        <CardDescription>Stock closing price with moving averages.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
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
              domain={['auto', 'auto']}
              tickFormatter={(value) => `$${formatCompactNumber(value as number)}`}
              stroke="hsl(var(--muted-foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line type="monotone" dataKey="Close" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Close" />
            {movingAverages.ma7 && <Line type="monotone" dataKey="ma7" stroke="hsl(var(--chart-2))" strokeWidth={1.5} dot={false} name="7-Day MA" />}
            {movingAverages.ma14 && <Line type="monotone" dataKey="ma14" stroke="hsl(var(--chart-3))" strokeWidth={1.5} dot={false} name="14-Day MA" />}
            {movingAverages.ma30 && <Line type="monotone" dataKey="ma30" stroke="hsl(var(--chart-4))" strokeWidth={1.5} dot={false} name="30-Day MA" />}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
