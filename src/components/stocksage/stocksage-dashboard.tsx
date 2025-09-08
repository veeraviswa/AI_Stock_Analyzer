"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp, BarChart, SlidersHorizontal, BrainCircuit, LineChart as LineChartIcon, PanelLeft, Bot, MessageSquare, Calendar as CalendarIcon, UploadCloud, X, Palette
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
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

import type { StockData, Stock } from '@/lib/types';
import { formatDate, formatNumber, cn } from '@/lib/utils';
import { FileUploader } from './file-uploader';
import { MetricCard } from './metric-card';
import { ClosePriceChart } from './close-price-chart';
import { CandlestickChart } from './candlestick-chart';
import { VolumeChart } from './volume-chart';
import { Chatbot } from './chatbot';

const CHART_COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
];

export function StockSageDashboard() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStockIds, setSelectedStockIds] = useState<Set<string>>(new Set());
  const [primaryStockId, setPrimaryStockId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isAiProcessing, setIsAiProcessing] = useState<Record<string, boolean>>({});
  const [isChatOpen, setIsChatOpen] = useState(true);
  
  const [date, setDate] = React.useState<DateRange | undefined>();

  const [movingAverages, setMovingAverages] = useState({ ma7: true, ma14: false, ma30: false });
  const [showPrediction, setShowPrediction] = useState(true);

  const { toast } = useToast();
  
  const parseCSV = useCallback((text: string): StockData[] => {
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
  }, [toast]);

  const handleFileUpload = (content: string, name: string) => {
    const newStockId = `stock_${Date.now()}`;
    const parsedData = parseCSV(content);

    if (parsedData.length > 0) {
        const newStock: Stock = {
            id: newStockId,
            name: name.replace('.csv', ''),
            data: parsedData,
            filteredData: parsedData,
            rawCsv: content,
            metrics: { trend: 'N/A', volatility: 'N/A', volume: 'N/A' },
            prediction: null,
            recommendation: null,
            color: CHART_COLORS[stocks.length % CHART_COLORS.length]
        };
        setStocks(prev => [...prev, newStock]);
        setSelectedStockIds(prev => new Set(prev).add(newStockId));

        if (!primaryStockId) {
            setPrimaryStockId(newStockId);
        }

        const fullDateRange = stocks.reduce((acc, stock) => {
            if (!stock.data.length) return acc;
            const from = acc.from ? (stock.data[0].Date < acc.from ? stock.data[0].Date : acc.from) : stock.data[0].Date;
            const to = acc.to ? (stock.data[stock.data.length - 1].Date > acc.to ? stock.data[stock.data.length-1].Date : acc.to) : stock.data[stock.data.length - 1].Date;
            return { from, to };
        }, {from: newStock.data[0].Date, to: newStock.data[newStock.data.length - 1].Date} as DateRange);

        setDate(fullDateRange);

        toast({ title: 'Success', description: `Loaded ${name}` });
    }
    setIsLoading(false);
  };

  const removeStock = (stockId: string) => {
    setStocks(prev => prev.filter(s => s.id !== stockId));
    setSelectedStockIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(stockId);
        return newSet;
    });
    if (primaryStockId === stockId) {
        setPrimaryStockId(stocks.find(s => s.id !== stockId)?.id || null);
    }
  };

  const toggleStockSelection = (stockId: string) => {
    setSelectedStockIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(stockId)) {
            newSet.delete(stockId);
        } else {
            newSet.add(stockId);
        }
        return newSet;
    });
  };

  const calculateMetrics = useCallback((data: StockData[]) => {
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
  }, []);

  useEffect(() => {
    setStocks(prevStocks => prevStocks.map(stock => {
      const start = date?.from || stock.data[0]?.Date;
      const end = date?.to || stock.data[stock.data.length - 1]?.Date;
      if (!start || !end) return stock;
      const filtered = stock.data.filter(d => d.Date >= start && d.Date <= end);
      return { ...stock, filteredData: filtered };
    }));
  }, [date, stocks.length]);

  useEffect(() => {
    stocks.forEach(stock => {
        if(stock.filteredData.length < 1 || stock.metrics.trend !== 'N/A') return;

        const processedData = calculateMetrics(stock.filteredData);

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
        
        const newMetrics = {
            trend,
            volatility: `${volatilityLabel} (${(volatilityValue * 100).toFixed(2)}%)`,
            volume: processedData.length > 0 ? processedData[processedData.length-1].Volume.toLocaleString() : 'N/A'
        };

        const runAiFlows = async () => {
            setIsAiProcessing(prev => ({...prev, [stock.id]: true}));
            try {
                const pred = await predictNextDayPrice({ historicalData: stock.rawCsv });
                const rec = await getStockRecommendation({
                    trend: trend,
                    volatility: volatilityLabel,
                    volume: 'Stable', // Placeholder
                    prediction: pred.predictedPrice > processedData[processedData.length-1].Close ? 'Up' : 'Down',
                });
                
                setStocks(prev => prev.map(s => s.id === stock.id ? {...s, filteredData: processedData, metrics: newMetrics, prediction: pred, recommendation: rec} : s));

            } catch (error) {
                toast({ variant: 'destructive', title: `AI Error for ${stock.name}`, description: 'Failed to get AI insights.' });
            } finally {
                setIsAiProcessing(prev => ({...prev, [stock.id]: false}));
            }
        };

        if(processedData.length > 0) {
            runAiFlows();
        }
    });
  }, [stocks, calculateMetrics, toast]);

  const primaryStock = useMemo(() => stocks.find(s => s.id === primaryStockId), [stocks, primaryStockId]);

  const stockDataSummary = useMemo(() => {
    if (!primaryStock) return "No primary stock selected.";
    const latestData = primaryStock.filteredData[primaryStock.filteredData.length - 1];
    if (!latestData) return `${primaryStock.name} has no data in the selected range.`;
    
    return `
      Primary Stock: ${primaryStock.name}.
      Date Range: ${formatDate(primaryStock.filteredData[0].Date)} to ${formatDate(latestData.Date)}.
      Latest Close Price: ${latestData.Close.toFixed(2)}.
      Overall Trend: ${primaryStock.metrics.trend}.
      Volatility: ${primaryStock.metrics.volatility}.
      Next-Day Price Prediction: ${primaryStock.prediction ? `${primaryStock.prediction.predictedPrice.toFixed(2)} (${primaryStock.prediction.analysis})` : 'Not available'}.
      AI Recommendation: ${primaryStock.recommendation ? `${primaryStock.recommendation.recommendation} (${primaryStock.recommendation.reasoning})` : 'Not available'}.
    `;
  }, [primaryStock]);
  
  const displayedStocks = useMemo(() => stocks.filter(s => selectedStockIds.has(s.id)), [stocks, selectedStockIds]);
  const isAnyAiProcessing = useMemo(() => Object.values(isAiProcessing).some(v => v), [isAiProcessing]);

  const allDates = useMemo(() => {
    const all = stocks.flatMap(s => s.data.map(d => d.Date));
    if (all.length === 0) return { min: undefined, max: undefined };
    return {
        min: new Date(Math.min(...all.map(d => d.getTime()))),
        max: new Date(Math.max(...all.map(d => d.getTime())))
    };
  }, [stocks]);


  const SidebarContent = () => (
    <div className="flex h-full max-h-screen flex-col gap-2">
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <a href="/" className="flex items-center gap-2 font-semibold">
          <Palette className="h-6 w-6 text-primary" />
          <span className="">StockSage</span>
        </a>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <div className="px-4 lg:px-6">
            <h3 className="mb-2 font-semibold">Manage Stocks</h3>
            <div className='space-y-2'>
                {stocks.map(stock => (
                    <div key={stock.id} className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50">
                        <Checkbox 
                            id={`select-${stock.id}`} 
                            checked={selectedStockIds.has(stock.id)}
                            onCheckedChange={() => toggleStockSelection(stock.id)}
                            style={{color: stock.color}}
                        />
                        <button className={`flex-1 text-left truncate ${primaryStockId === stock.id ? 'font-bold' : ''}`} onClick={() => setPrimaryStockId(stock.id)}>
                            {stock.name}
                        </button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeStock(stock.id)}><X className="h-4 w-4" /></Button>
                    </div>
                ))}
            </div>
             <div className="mt-2">
                <FileUploader onFileUpload={handleFileUpload} setLoading={setIsLoading} buttonOnly />
             </div>
        </div>
        <Separator className="my-4" />
        <div className="px-4 lg:px-6">
            <h3 className="mb-2 font-semibold">Data Settings</h3>
            <div className="grid gap-2">
                <Label htmlFor="date-range">Date range</Label>
                <Popover>
                    <PopoverTrigger asChild>
                    <Button
                        id="date-range"
                        variant={"outline"}
                        className={cn(
                        "justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                        )}
                        disabled={stocks.length === 0}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (
                        date.to ? (
                            <>
                            {format(date.from, "LLL dd, y")} -{" "}
                            {format(date.to, "LLL dd, y")}
                            </>
                        ) : (
                            format(date.from, "LLL dd, y")
                        )
                        ) : (
                        <span>Pick a date range</span>
                        )}
                    </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={date?.from}
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={2}
                        disabled={(day) => allDates.min ? (day < allDates.min || day > allDates.max) : true}
                    />
                    </PopoverContent>
                </Popover>
            </div>
        </div>
        <Separator className="my-4" />
        <div className="px-4 lg:px-6">
            <h3 className="mb-2 font-semibold">Chart Settings</h3>
            <div className="space-y-2">
                <Label>Moving Averages</Label>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma7" checked={movingAverages.ma7} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma7: !!c}))} disabled={stocks.length === 0} />
                    <Label htmlFor="ma7" className="font-normal">7-Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma14" checked={movingAverages.ma14} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma14: !!c}))} disabled={stocks.length === 0} />
                    <Label htmlFor="ma14" className="font-normal">14-Day</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <Checkbox id="ma30" checked={movingAverages.ma30} onCheckedChange={(c) => setMovingAverages(p => ({...p, ma30: !!c}))} disabled={stocks.length === 0} />
                    <Label htmlFor="ma30" className="font-normal">30-Day</Label>
                </div>
            </div>
            <div className="flex items-center justify-between mt-4">
                <Label htmlFor="show-prediction">Show Prediction</Label>
                <Switch id="show-prediction" checked={showPrediction} onCheckedChange={setShowPrediction} disabled={stocks.length === 0} />
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
        <header className="flex h-14 items-center gap-4 border-b bg-background px-4">
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle sidebar</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0 md:hidden">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
            <a href="/" className="flex items-center gap-2 font-semibold text-lg md:hidden">
                <Palette className="h-6 w-6 text-primary" />
                <span className="">StockSage</span>
            </a>
            <div className="flex-1" />
            <Button variant="outline" size="icon" onClick={() => setIsChatOpen(!isChatOpen)} disabled={stocks.length === 0}>
                <MessageSquare className="h-5 w-5" />
                <span className="sr-only">Toggle Chat</span>
            </Button>
        </header>
        <div className="flex flex-1 overflow-hidden">
            <main className="flex-1 overflow-auto p-4 md:gap-8 md:p-6 bg-muted/40">
            {stocks.length > 0 && primaryStock ? (
                <div className="grid gap-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard title="Trend" value={primaryStock.metrics.trend} icon={TrendingUp} isLoading={isAiProcessing[primaryStock.id]} />
                        <MetricCard title="Volatility" value={primaryStock.metrics.volatility.split(' ')[0]} description={primaryStock.metrics.volatility.split(' ').slice(1).join(' ')} icon={SlidersHorizontal} isLoading={isAiProcessing[primaryStock.id]} />
                        <MetricCard title="Volume" value={formatNumber(parseFloat(primaryStock.metrics.volume.replace(/,/g, '')))} icon={BarChart} isLoading={isAiProcessing[primaryStock.id]} />
                        <MetricCard title="Prediction" value={primaryStock.prediction ? `$${primaryStock.prediction.predictedPrice.toFixed(2)}` : 'N/A'} description={primaryStock.prediction?.analysis} icon={LineChartIcon} isLoading={isAiProcessing[primaryStock.id]}/>
                        <MetricCard title="Recommendation" value={primaryStock.recommendation?.recommendation || 'N/A'} description={primaryStock.recommendation?.reasoning} icon={BrainCircuit} isLoading={isAiProcessing[primaryStock.id]} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <ClosePriceChart stocks={displayedStocks} movingAverages={movingAverages} />
                        <CandlestickChart data={primaryStock.filteredData} prediction={showPrediction ? primaryStock.prediction?.predictedPrice : undefined} stockName={primaryStock.name} />
                        <VolumeChart data={primaryStock.filteredData} stockName={primaryStock.name}/>
                    </div>
                </div>
            ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-full">
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
            {isChatOpen && stocks.length > 0 && (
                <aside className="w-full max-w-sm border-l bg-background">
                    <Chatbot stockDataSummary={stockDataSummary} isDataLoaded={stocks.length > 0} />
                </aside>
            )}
        </div>
      </div>
    </div>
  );
}
