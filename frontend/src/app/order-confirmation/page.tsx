
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export default function OrderConfirmationPage() {
  return (
    <main className="flex-grow flex items-center justify-center py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Card className="max-w-md mx-auto bg-card border-border">
            <CardHeader className="items-center">
                <div className="bg-green-500/10 p-4 rounded-full">
                    <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <CardTitle className="text-2xl font-bold text-white mt-4">Thank You For Your Order!</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">
                    Your order has been placed successfully. A confirmation email has been sent to you.
                </p>
                <Button asChild className="mt-8">
                    <Link href="/shop">Continue Shopping</Link>
                </Button>
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
