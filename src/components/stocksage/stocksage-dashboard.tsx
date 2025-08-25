"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, BarChart, Wallet, BrainCircuit, LineChart as LineChartIcon, SlidersHorizontal, CandlestickChart as CandlestickChartIcon, PanelLeft, Bot
} from 'lucide-react';

import { predictNextDayPrice } from '@/ai/flows/next-day-price-prediction';
import { getStockRecommendation } from '@/ai/flows/ai-stock-recommendation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

import type { StockData } from '@/lib/types';
import { formatDate, formatNumber } from '@/lib/utils';
import { FileUploader } from './file-uploader';
import { MetricCard } from './metric-card';
import { ClosePriceChart } from './close-price-chart';
import { CandlestickChart } from './candlestick-chart';
import { VolumeChart } from './volume-chart';
import { Chatbot } from './chatbot';

export function StockSageDashboard() {
  const [rawCsv, setRawCsv] = useState<string | null>(null);
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [fileName, setFileName] = useState<string>('your_data.csv');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  const [metrics, setMetrics] = useState({ trend: 'N/A', volatility: 'N/A', volume: 'N/A' });
  const [prediction, setPrediction] = useState<{ predictedPrice: number; analysis: string } | null>(null);
  const [recommendation, setRecommendation] = useState<{ recommendation: string; reasoning: string } | null>(null);

  const [movingAverages, setMovingAverages] = useState({ ma7: true, ma14: true, ma30: false });
  const [showPrediction, setShowPrediction] = useState(true);

  const { toast } = useToast();

  const handleFileUpload = (content: string, name: string) => {
    setRawCsv(content);
    setFileName(name);
    setStockData([]);
    setMetrics({ trend: 'N/A', volatility: 'N/A', volume: 'N/A' });
    setPrediction(null);
    setRecommendation(null);
    toast({ title: 'Success', description: `Loaded ${name}` });
  };

  useEffect(() => {
    if (!rawCsv) return;

    const parseCSV = (text: string): StockData[] => {
      try {
        const lines = text.trim().split(/\r\n|\n/);
        if (lines.length < 2) return [];
        const headers = lines[0].split(',').map(h => h.trim());
        
        return lines.slice(1).map(line => {
          const values = line.split(',');
          const entry: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (header === 'Date') {
              entry[header] = new Date(value);
            } else if (['Open', 'High', 'Low', 'Close', 'Volume'].includes(header)) {
              entry[header] = parseFloat(value);
            }
          });
          return entry as StockData;
        }).filter(d => d.Date && !isNaN(d.Date.getTime())).sort((a,b) => a.Date.getTime() - b.Date.getTime());
      } catch (error) {
        toast({ variant: 'destructive', title: 'Parsing Error', description: 'Could not parse CSV file.' });
        return [];
      }
    };
    
    const parsedData = parseCSV(rawCsv);
    if (parsedData.length > 0) {
      setStockData(parsedData);
    }
    setIsLoading(false);
  }, [rawCsv, toast]);

  useEffect(() => {
    if (stockData.length < 1) return;

    const calculateMetrics = (data: StockData[]): StockData[] => {
        const dataWithMAs = [...data];
        
        // Moving Averages
        const periods = [7, 14, 30];
        for (let i = 0; i < dataWithMAs.length; i++) {
          for (const period of periods) {
            if (i >= period - 1) {
              const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.Close, 0);
              dataWithMAs[i][`ma${period}`] = sum / period;
            }
          }
        }

        // Volume MA for spike detection
        const volumeMAPeriod = 20;
        for (let i = 0; i < dataWithMAs.length; i++) {
          if (i >= volumeMAPeriod - 1) {
            const sum = data.slice(i - volumeMAPeriod + 1, i + 1).reduce((acc, val) => acc + val.Volume, 0);
            dataWithMAs[i].volumeMA20 = sum / volumeMAPeriod;
          }
        }

        return dataWithMAs;
    };
    
    const processedData = calculateMetrics(stockData);

    const trend = processedData.length > 1 && processedData[processedData.length-1].Close > processedData[0].Close ? 'Uptrend' : 'Downtrend';
    
    const returns = [];
    for (let i = 1; i < processedData.length; i++) {
      returns.push((processedData[i].Close - processedData[i-1].Close) / processedData[i-1].Close);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(returns.map(r => Math.pow(r - meanReturn, 2)).reduce((a, b) => a + b, 0) / returns.length);
    const volatilityValue = stdDev * Math.sqrt(252); // Annualized
    let volatilityLabel = 'Low';
    if (volatilityValue > 0.3) volatilityLabel = 'High';
    else if (volatilityValue > 0.15) volatilityLabel = 'Medium';
    
    setMetrics({
        trend,
        volatility: `${volatilityLabel} (${(volatilityValue * 100).toFixed(2)}%)`,
        volume: processedData.length > 0 ? processedData[processedData.length-1].Volume.toLocaleString() : 'N/A'
    });

    setStockData(processedData);

    const runAiFlows = async () => {
        if (!rawCsv) return;
        setIsAiProcessing(true);
        try {
            const pred = await predictNextDayPrice({ historicalData: rawCsv });
            setPrediction(pred);

            const rec = await getStockRecommendation({
                trend: trend,
                volatility: volatilityLabel,
                volume: 'Stable', // Placeholder
                prediction: pred.predictedPrice > processedData[processedData.length-1].Close ? 'Up' : 'Down',
            });
            setRecommendation(rec);

        } catch (error) {
            toast({ variant: 'destructive', title: 'AI Error', description: 'Failed to get AI insights.' });
        } finally {
            setIsAiProcessing(false);
        }
    };
    runAiFlows();
  }, [stockData.length, rawCsv, toast]);


  const stockDataSummary = useMemo(() => {
    if (!stockData.length) return "No stock data is loaded.";
    const latestData = stockData[stockData.length - 1];
    return `
      Data for: ${fileName}.
      Date Range: ${formatDate(stockData[0].Date)} to ${formatDate(latestData.Date)}.
      Latest Close Price: ${latestData.Close.toFixed(2)}.
      Overall Trend: ${metrics.trend}.
      Volatility: ${metrics.volatility}.
      Next-Day Price Prediction: ${prediction ? `${prediction.predictedPrice.toFixed(2)} (${prediction.analysis})` : 'Not available'}.
      AI Recommendation: ${recommendation ? `${recommendation.recommendation} (${recommendation.reasoning})` : 'Not available'}.
    `;
  }, [stockData, fileName, metrics, prediction, recommendation]);
  
  const SidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <CandlestickChartIcon className="h-6 w-6 text-primary" />
          <span className="">StockSage</span>
        </a>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <div className="px-4 lg:px-6">
            <h3 className="mb-2 font-semibold">Upload Data</h3>
            <FileUploader onFileUpload={handleFileUpload} setLoading={setIsLoading} />
        </div>
        <Separator className="my-4" />
        <div className="px-4 lg:px-6">
            <h3 className="mb-2 font-semibold">Chart Settings</h3>
            <div className="space-y-2">
                <Label>Moving Averages</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma7" checked={movingAverages.ma7} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma7: !!c}))} />
                    <Label htmlFor="ma7" className="font-normal">7-Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma14" checked={movingAverages.ma14} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma14: !!c}))}/>
                    <Label htmlFor="ma14" className="font-normal">14-Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma30" checked={movingAverages.ma30} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma30: !!c}))}/>
                    <Label htmlFor="ma30" className="font-normal">30-Day</Label>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4">
                <Label htmlFor="show-prediction">Show Prediction</Label>
                <Switch id="show-prediction" checked={showPrediction} onCheckedChange={setShowPrediction} />
            </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-background md:block">
        <SidebarContent />
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
            <a href="/" className="flex items-center gap-2 font-semibold text-lg">
                <CandlestickChartIcon className="h-6 w-6 text-primary" />
                <span className="">StockSage</span>
            </a>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6 bg-muted/40">
        {stockData.length > 0 ? (
            <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <MetricCard title="Trend" value={metrics.trend} icon={TrendingUp} isLoading={isAiProcessing} />
                    <MetricCard title="Volatility" value={metrics.volatility.split(' ')[0]} description={metrics.volatility.split(' ').slice(1).join(' ')} icon={SlidersHorizontal} isLoading={isAiProcessing} />
                    <MetricCard title="Volume" value={formatNumber(parseFloat(metrics.volume.replace(/,/g, '')))} icon={BarChart} isLoading={isAiProcessing} />
                    <MetricCard title="Prediction" value={prediction ? `$${prediction.predictedPrice.toFixed(2)}` : 'N/A'} description={prediction?.analysis} icon={LineChartIcon} isLoading={isAiProcessing}/>
                    <MetricCard title="Recommendation" value={recommendation?.recommendation || 'N/A'} description={recommendation?.reasoning} icon={BrainCircuit} isLoading={isAiProcessing} />
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <div className="lg:col-span-3">
                        <ClosePriceChart data={stockData} movingAverages={movingAverages} />
                    </div>
                    <div className="lg:col-span-2">
                        <CandlestickChart data={stockData} prediction={showPrediction ? prediction?.predictedPrice : undefined} />
                    </div>
                    <div className="lg:col-span-1">
                        <VolumeChart data={stockData} />
                    </div>
                    <Chatbot stockDataSummary={stockDataSummary} isDataLoaded={stockData.length > 0} />
                </div>
            </>
        ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-2 text-center">
              <Bot className="h-16 w-16 text-muted-foreground" />
              <h3 className="text-2xl font-bold tracking-tight">
                Welcome to StockSage
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Upload a CSV file of your stock data to begin your analysis. The AI will help you with predictions, recommendations, and insights.
              </p>
              <div className="w-full max-w-sm mt-4">
                <FileUploader onFileUpload={handleFileUpload} setLoading={setIsLoading} />
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
