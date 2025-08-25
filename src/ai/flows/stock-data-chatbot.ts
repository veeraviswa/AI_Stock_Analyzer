'use server';

/**
 * @fileOverview Implements a chatbot that answers questions about stock data.
 *
 * - stockDataChatbot - A function that handles the chatbot interaction.
 * - StockDataChatbotInput - The input type for the stockDataChatbot function.
 * - StockDataChatbotOutput - The return type for the stockDataChatbot function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const StockDataChatbotInputSchema = z.object({
  question: z.string().describe('The user\u2019s question about the stock data.'),
  stockDataSummary: z
    .string() // Consider using a more structured format if possible
    .describe(
      'A summary of the stock data, including trends, volume, price predictions, and recommendations.'
    ),
});
export type StockDataChatbotInput = z.infer<typeof StockDataChatbotInputSchema>;

const StockDataChatbotOutputSchema = z.object({
  answer: z.string().describe('The chatbot\u2019s answer to the user\u2019s question.'),
});
export type StockDataChatbotOutput = z.infer<typeof StockDataChatbotOutputSchema>;

export async function stockDataChatbot(input: StockDataChatbotInput): Promise<StockDataChatbotOutput> {
  return stockDataChatbotFlow(input);
}

const prompt = ai.definePrompt({
  name: 'stockDataChatbotPrompt',
  input: {schema: StockDataChatbotInputSchema},
  output: {schema: StockDataChatbotOutputSchema},
  prompt: `You are a chatbot assistant helping users understand stock data.

  You have access to a summary of the stock data, including trends, volume, price predictions, and recommendations.
  Use this information to answer the user's question as accurately and informatively as possible.
  If the question cannot be answered using the provided stock data summary, respond politely that you are unable to answer the question.

  Stock Data Summary:
  {{stockDataSummary}}

  Question: {{question}}`,
});

const stockDataChatbotFlow = ai.defineFlow(
  {
    name: 'stockDataChatbotFlow',
    inputSchema: StockDataChatbotInputSchema,
    outputSchema: StockDataChatbotOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
