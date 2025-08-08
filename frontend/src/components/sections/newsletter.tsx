
'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export default function NewsletterSection() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: 'Email is required',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");
      await axios.post(`${API_BASE_URL}/newsletter-subscriptions`, { email });
      toast({
        title: 'Subscribed!',
        description: 'Thanks for joining our mailing list.',
      });
      setEmail('');
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || (axios.isAxiosError(error) ? 'An unknown API error occurred.' : error.message);

      if (errorMessage.includes('Duplicate key error')) {
        toast({
          title: "You're already subscribed!",
          description: "This email is already on our mailing list. Thanks for being a fan!",
        });
        setEmail('');
      } else {
        toast({
          title: 'Subscription failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="bg-card/50 py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white">
            Stay in the Loop
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Get exclusive deals and updates on the latest gaming gear.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col sm:flex-row w-full max-w-md mx-auto">
            <label htmlFor="email-address" className="sr-only">
              Email address
            </label>
            <Input
              type="email"
              id="email-address"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={isSubmitting}
              className="flex-auto min-w-0 appearance-none rounded-t-md sm:rounded-tr-none sm:rounded-l-md border-border bg-background px-4 py-3 text-foreground placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary text-base"
              placeholder="Enter your email"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-b-md sm:rounded-bl-none sm:rounded-r-md bg-primary text-primary-foreground font-semibold px-6 text-base border-0 hover:brightness-110"
            >
              {isSubmitting ? 'Subscribing...' : 'Subscribe'}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
}
