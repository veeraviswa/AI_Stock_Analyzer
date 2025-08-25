'use server';

/**
 * @fileOverview An AI agent that provides stock recommendations (Buy, Hold, Sell).
 *
 * - getStockRecommendation - A function that returns a stock recommendation based on input data.
 * - StockRecommendationInput - The input type for the getStockRecommendation function.
 * - StockRecommendationOutput - The return type for the getStockRecommendation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StockRecommendationInputSchema = z.object({
  trend: z.string().describe('The overall trend of the stock (e.g., Uptrend, Downtrend, Sideways).'),
  volatility: z.string().describe('The volatility of the stock (e.g., High, Medium, Low).'),
  volume: z.string().describe('The recent volume data of the stock (e.g., Increasing, Decreasing, Stable).'),
  prediction: z.string().describe('The next day price prediction (e.g., Up, Down, Stable).'),
});
export type StockRecommendationInput = z.infer<typeof StockRecommendationInputSchema>;

const StockRecommendationOutputSchema = z.object({
  recommendation: z
    .enum(['Buy', 'Hold', 'Sell'])
    .describe('The recommendation to Buy, Hold, or Sell the stock.'),
  reasoning: z
    .string()
    .describe('The detailed reasoning behind the recommendation.'),
});
export type StockRecommendationOutput = z.infer<typeof StockRecommendationOutputSchema>;

export async function getStockRecommendation(input: StockRecommendationInput): Promise<StockRecommendationOutput> {
  return stockRecommendationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stockRecommendationPrompt',
  input: {schema: StockRecommendationInputSchema},
  output: {schema: StockRecommendationOutputSchema},
  prompt: `Based on the following stock data, provide a recommendation (Buy, Hold, or Sell) and explain your reasoning.

Trend: {{trend}}
Volatility: {{volatility}}
Volume: {{volume}}
Next Day Prediction: {{prediction}}

Recommendation:`,
});

const stockRecommendationFlow = ai.defineFlow(
  {
    name: 'stockRecommendationFlow',
    inputSchema: StockRecommendationInputSchema,
    outputSchema: StockRecommendationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
