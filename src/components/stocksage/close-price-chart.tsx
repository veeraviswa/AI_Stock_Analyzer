"use client";

import React from 'react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Stock } from '@/lib/types';
import { formatCompactNumber, formatDate } from '@/lib/utils';

interface ClosePriceChartProps {
  stocks: Stock[];
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
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          <p className="text-sm text-muted-foreground col-span-2 mb-1">{formatDate(new Date(label))}</p>
          {payload.map((p: any) => (
            <React.Fragment key={p.dataKey}>
              <p className="text-sm font-medium flex items-center" style={{color: p.stroke}}>
                <span className="w-2 h-2 rounded-full mr-2" style={{backgroundColor: p.stroke}}></span>
                {p.name}:
              </p>
              <p className="text-sm text-right font-mono">{`$${p.value.toFixed(2)}`}</p>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  }
  return null;
};


export function ClosePriceChart({ stocks, movingAverages }: ClosePriceChartProps) {
    // Combine data for charting
    const combinedData = new Map();
    stocks.forEach(stock => {
        stock.filteredData.forEach(d => {
            const dateStr = d.Date.toISOString().split('T')[0];
            if (!combinedData.has(dateStr)) {
                combinedData.set(dateStr, { Date: d.Date });
            }
            const entry = combinedData.get(dateStr);
            entry[`${stock.name}_Close`] = d.Close;
            if(movingAverages.ma7) entry[`${stock.name}_ma7`] = d.ma7;
            if(movingAverages.ma14) entry[`${stock.name}_ma14`] = d.ma14;
            if(movingAverages.ma30) entry[`${stock.name}_ma30`] = d.ma30;
        });
    });

    const chartData = Array.from(combinedData.values()).sort((a,b) => a.Date - b.Date);

  return (
    <Card className="col-span-1 lg:col-span-3">
      <CardHeader>
        <CardTitle>Close Price Comparison</CardTitle>
        <CardDescription>Stock closing prices with optional moving averages.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
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
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {stocks.map(stock => (
                <Line key={stock.id} type="monotone" dataKey={`${stock.name}_Close`} stroke={stock.color} strokeWidth={2} dot={false} name={stock.name} />
            ))}
             {movingAverages.ma7 && stocks.map(stock => (
                <Line key={`${stock.id}-ma7`} type="monotone" dataKey={`${stock.name}_ma7`} stroke={stock.color} strokeWidth={1} dot={false} name={`${stock.name} 7-Day MA`} strokeDasharray="3 3"/>
            ))}
            {movingAverages.ma14 && stocks.map(stock => (
                <Line key={`${stock.id}-ma14`} type="monotone" dataKey={`${stock.name}_ma14`} stroke={stock.color} strokeWidth={1} dot={false} name={`${stock.name} 14-Day MA`} strokeDasharray="5 5"/>
            ))}
            {movingAverages.ma30 && stocks.map(stock => (
                <Line key={`${stock.id}-ma30`} type="monotone" dataKey={`${stock.name}_ma30`} stroke={stock.color} strokeWidth={1} dot={false} name={`${stock.name} 30-Day MA`} strokeDasharray="7 7"/>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
