"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CandlestickChart } from 'lucide-react';

export function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // No actual authentication, just redirect
    router.push('/dashboard');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
                <CandlestickChart className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold">StockSage</h1>
            </div>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>Enter your information to create an account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
            <CardContent className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input 
                        id="password" 
                        type="password" 
                        required 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-4">
                <Button type="submit" className="w-full">Sign Up</Button>
                <div className="text-sm">
                    Already have an account?{' '}
                    <Link href="/" className="underline">
                        Log in
                    </Link>
                </div>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
