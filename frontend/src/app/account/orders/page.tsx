
'use client';

import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  created_at: string;
}

const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'Pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    case 'Processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Shipped': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    case 'Delivered': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};


const OrderSkeleton = () => (
    <Card className="bg-card border-border">
        <CardHeader>
            <div className="flex justify-between items-center">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-6 w-24" />
            </div>
             <div className="flex justify-between items-center mt-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
            </div>
        </CardHeader>
    </Card>
);

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, token, isAuthenticated, loading: authLoading } = useContext(AuthContext);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  useEffect(() => {
      const fetchOrders = async () => {
          if (!user || !token) return;
          setIsLoading(true);
          try {
              if (!API_BASE_URL) throw new Error("API base URL is not configured.");
              const response = await axios.post(`${API_BASE_URL}/orders/search`, 
                  { query: { user_id: user._id }, sort: { created_at: -1 } },
                  { headers: { 'Authorization': `Bearer ${token}` } }
              );
              setOrders(response.data.data || []);
          } catch (error: any) {
              const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message : 'Failed to load orders.';
              toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
          } finally {
              setIsLoading(false);
          }
      };
      
      if (isAuthenticated) {
          fetchOrders();
      }
  }, [user, token, isAuthenticated, toast]);

  if (authLoading || isLoading) {
      return (
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <div className="mb-8">
                  <h1 className="text-3xl font-bold text-white">My Orders</h1>
              </div>
              <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => <OrderSkeleton key={i} />)}
              </div>
          </main>
      );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">My Orders</h1>
      </div>
      
      {orders.length === 0 ? (
          <Card className="text-center py-20 bg-card border-border">
              <ShoppingBag className="mx-auto h-16 w-16 text-muted-foreground" />
              <CardHeader>
                  <CardTitle className="text-2xl text-white">You have no orders yet</CardTitle>
              </CardHeader>
              <CardContent>
                  <p className="text-muted-foreground">Looks like you haven't made any purchases.</p>
                  <Button asChild className="mt-6">
                      <Link href="/shop">Start Shopping</Link>
                  </Button>
              </CardContent>
          </Card>
      ) : (
        <Accordion type="single" collapsible className="w-full space-y-4">
            {orders.map((order, index) => (
                <AccordionItem key={order._id} value={`order-${index}`} className="bg-card border-border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                            <div className="text-left">
                                <p className="font-bold text-lg text-white">Order #{order._id.substring(order._id.length - 8)}</p>
                                <p className="text-sm text-muted-foreground">{format(new Date(order.created_at), 'PPP')}</p>
                            </div>
                             <div className="flex flex-col items-end gap-2">
                                <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                <p className="font-semibold text-white">${order.total_amount.toFixed(2)}</p>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <div className="divide-y divide-border">
                            {order.items.map(item => (
                                <div key={item.product_id} className="py-4 flex justify-between items-center">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-secondary rounded-md flex-shrink-0">
                                            {/* Placeholder for image */}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{item.name}</p>
                                            <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                        </div>
                                    </div>
                                    <p className="text-white">${item.price.toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            ))}
        </Accordion>
      )}
    </main>
  );
}
