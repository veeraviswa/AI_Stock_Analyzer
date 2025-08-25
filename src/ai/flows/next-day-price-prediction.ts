'use server';
/**
 * @fileOverview Predicts the next day's closing stock price based on historical data.
 *
 * - predictNextDayPrice - A function that handles the prediction process.
 * - PredictNextDayPriceInput - The input type for the predictNextDayPrice function.
 * - PredictNextDayPriceOutput - The return type for the predictNextDayPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PredictNextDayPriceInputSchema = z.object({
  historicalData: z.string().describe('Historical stock data in CSV format with columns: Date, Open, High, Low, Close, Volume.'),
});
export type PredictNextDayPriceInput = z.infer<typeof PredictNextDayPriceInputSchema>;

const PredictNextDayPriceOutputSchema = z.object({
  predictedPrice: z.number().describe('The predicted closing price for the next day.'),
  analysis: z.string().describe('A brief analysis of the factors influencing the prediction.'),
});
export type PredictNextDayPriceOutput = z.infer<typeof PredictNextDayPriceOutputSchema>;

export async function predictNextDayPrice(input: PredictNextDayPriceInput): Promise<PredictNextDayPriceOutput> {
  return predictNextDayPriceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'nextDayPricePredictionPrompt',
  input: {schema: PredictNextDayPriceInputSchema},
  output: {schema: PredictNextDayPriceOutputSchema},
  prompt: `You are an AI stock market analyst. Analyze the historical stock data provided and predict the next day's closing price.

Historical Data (CSV):
{{historicalData}}

Provide a predicted closing price and a brief analysis of the factors influencing your prediction. Consider trends, volume, and volatility.

Ensure the predictedPrice is a number.`,
});

const predictNextDayPriceFlow = ai.defineFlow(
  {
    name: 'predictNextDayPriceFlow',
    inputSchema: PredictNextDayPriceInputSchema,
    outputSchema: PredictNextDayPriceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
