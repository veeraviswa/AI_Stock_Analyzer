export interface StockData {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
  ma7?: number | null;
  ma14?: number | null;
  ma30?: number | null;
  volumeMA20?: number | null;
  ohlc?: [number, number, number, number];
  errorY?: [number, number];
}

export interface Stock {
  id: string;
  name: string;
  data: StockData[];
  filteredData: StockData[];
  rawCsv: string;
  metrics: { trend: string; volatility: string; volume: string };
  prediction: { predictedPrice: number; analysis: string } | null;
  recommendation: { recommendation: string; reasoning: string } | null;
  color: string;
}
