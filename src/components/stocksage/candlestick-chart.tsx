"use client";

import React from 'react';
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { StockData } from '@/lib/types';
import { formatCompactNumber, formatDate } from '@/lib/utils';

interface CandlestickChartProps {
  data: StockData[];
  prediction?: number;
  stockName: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p className="text-sm text-muted-foreground col-span-2">{formatDate(new Date(label))}</p>
            <p className="text-sm text-foreground">Open:</p><p className="text-sm text-right">{data.Open.toFixed(2)}</p>
            <p className="text-sm text-foreground">High:</p><p className="text-sm text-right">{data.High.toFixed(2)}</p>
            <p className="text-sm text-foreground">Low:</p><p className="text-sm text-right">{data.Low.toFixed(2)}</p>
            <p className="text-sm text-foreground">Close:</p><p className="text-sm text-right">{data.Close.toFixed(2)}</p>
          </div>
        </div>
      );
    }
    return null;
  };

const Candlestick = (props: any) => {
    const { x, y, width, height, Low, High, Open, Close } = props;
    const isUp = Close >= Open;
    const color = isUp ? 'hsl(var(--primary))' : 'hsl(var(--destructive))';
    const bodyHeight = Math.max(1, Math.abs(height));
    
    return (
      <g>
        <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y - (Math.abs(height) / (Close - Open) * (High-Close))} stroke={color} />
        <line x1={x + width / 2} y1={y + bodyHeight} x2={x + width / 2} y2={y + bodyHeight + (Math.abs(height) / (Close-Open) * (Open-Low))} stroke={color} />
        <rect x={x} y={y} width={width} height={bodyHeight} fill={color} />
      </g>
    );
  };
  

export function CandlestickChart({ data, prediction, stockName }: CandlestickChartProps) {
    const chartData = data.map(d => ({
        ...d,
        body: [d.Open, d.Close]
    }));

  return (
    <Card className='lg:col-span-2'>
      <CardHeader>
        <CardTitle>Candlestick Chart: {stockName}</CardTitle>
        <CardDescription>Daily Open, High, Low, and Close prices for the primary stock.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
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
                    domain={['dataMin - 5', 'dataMax + 5']}
                    tickFormatter={(value) => `$${formatCompactNumber(value as number)}`}
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    width={80}
                />
                <Tooltip content={<CustomTooltip />} cursor={{fill: 'hsla(var(--primary), 0.1)'}} />
                
                {prediction && (
                    <ReferenceLine 
                        y={prediction} 
                        label={{ value: `Prediction: ${prediction.toFixed(2)}`, position: 'right', fill: 'hsl(var(--primary))' }}
                        stroke="hsl(var(--primary))" 
                        strokeDasharray="3 3" 
                    />
                )}
                
                <Bar dataKey="body" shape={<Candlestick />}>
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.Close > entry.Open ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
