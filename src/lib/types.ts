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
