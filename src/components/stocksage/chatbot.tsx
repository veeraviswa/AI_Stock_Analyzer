"use client"

import { useState } from "react";
import { CornerDownLeft, Loader, Bot } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { stockDataChatbot } from "@/ai/flows/stock-data-chatbot";

interface ChatbotProps {
  stockDataSummary?: string;
  isDataLoaded: boolean;
}

interface Message {
  id: number;
  type: 'user' | 'bot';
  text: string;
}

export function Chatbot({ stockDataSummary, isDataLoaded }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || !isDataLoaded) return;

    const userMessage: Message = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const response = await stockDataChatbot({
            question: input,
            stockDataSummary: stockDataSummary || 'No data available.'
        });

        const botMessage: Message = { id: Date.now() + 1, type: 'bot', text: response.answer };
        setMessages(prev => [...prev, botMessage]);

    } catch (error) {
        const errorMessage: Message = { id: Date.now() + 1, type: 'bot', text: 'Sorry, I encountered an error. Please try again.' };
        setMessages(prev => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="col-span-1 lg:col-span-2 row-span-2 flex flex-col">
      <CardHeader>
        <CardTitle>StockSage Chat</CardTitle>
        <CardDescription>Ask questions about the loaded stock data.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <ScrollArea className="flex-grow h-64 pr-4 -mr-4 mb-4">
            <div className="space-y-4">
                {messages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                        <div className="text-center text-muted-foreground">
                            <Bot className="h-10 w-10 mx-auto mb-2" />
                            <p>Upload a CSV to start chatting.</p>
                        </div>
                    </div>
                )}
                {messages.map((message) => (
                    <div key={message.id} className={`flex items-start gap-3 ${message.type === 'user' ? 'justify-end' : ''}`}>
                         {message.type === 'bot' && (
                            <Avatar className="h-8 w-8">
                                <AvatarImage src="/placeholder-user.jpg" alt="StockSage" data-ai-hint="logo"/>
                                <AvatarFallback>SS</AvatarFallback>
                            </Avatar>
                         )}
                        <div className={`rounded-lg px-3 py-2 max-w-[80%] ${message.type === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                            <p className="text-sm">{message.text}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src="/placeholder-user.jpg" alt="StockSage" data-ai-hint="logo"/>
                            <AvatarFallback>SS</AvatarFallback>
                        </Avatar>
                        <div className="rounded-lg px-3 py-2 bg-muted flex items-center">
                            <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
                        </div>
                    </div>
                )}
            </div>
        </ScrollArea>
        <form onSubmit={handleSendMessage} className="relative mt-auto">
          <Input
            placeholder={isDataLoaded ? "Ask about trends, predictions..." : "Please upload a CSV first"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading || !isDataLoaded}
            className="pr-12"
          />
          <Button type="submit" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || !input.trim() || !isDataLoaded}>
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
