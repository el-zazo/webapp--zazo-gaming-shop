
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  total_amount: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  shipping_address: {
      name: string;
      address: string;
      city: string;
      state: string;
      zip_code: string;
      country: string;
  }
  created_at: string;
  updated_at: string;
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

export default function ManageOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { token } = useContext(AuthContext);
    const { toast } = useToast();

    // Filters and Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(10);
    const [totalOrders, setTotalOrders] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [appliedSearchTerm, setAppliedSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    
    useEffect(() => {
        const fetchOrders = async () => {
            if (!token) return;
            setIsLoading(true);
            try {
                if (!API_BASE_URL) throw new Error("API base URL is not configured.");
                
                const queryConditions: any[] = [];
                if (appliedSearchTerm) {
                    queryConditions.push({ 'shipping_address.name': { $regex: appliedSearchTerm, $options: 'i' } });
                }
                if (statusFilter !== 'all') {
                    queryConditions.push({ status: statusFilter });
                }

                const response = await axios.post(`${API_BASE_URL}/orders/search`, {
                    query: queryConditions.length > 0 ? { $and: queryConditions } : {},
                    page: currentPage,
                    per_page: ordersPerPage,
                    sort: { created_at: -1 }
                }, { headers: { 'Authorization': `Bearer ${token}` } });
                
                setOrders(response.data.data || []);
                setTotalPages(response.data.pagination.total_pages);
                setTotalOrders(response.data.pagination.total);

            } catch (error: any) {
                const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message : 'Failed to load orders.';
                toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
            } finally {
                setIsLoading(false);
            }
        };
        fetchOrders();
    }, [token, currentPage, ordersPerPage, appliedSearchTerm, statusFilter, toast]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setCurrentPage(1);
        setAppliedSearchTerm(searchTerm);
    };
    
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await axios.put(`${API_BASE_URL}/orders/${orderId}`, { status: newStatus }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setOrders(orders.map(o => o._id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
            toast({ title: 'Success', description: `Order status updated to ${newStatus}.` });
        } catch (error: any) {
             const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message : 'Failed to update status.';
             toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
    }

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };
    
    const getPaginationItems = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | string)[] = [];
        if (currentPage <= 3) pages.push(1, 2, 3, '...', totalPages);
        else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        return pages.filter((value, index, self) => self.indexOf(value) === index);
    };

    const paginationItems = getPaginationItems();

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Manage Orders</h1>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>All Orders</CardTitle>
                    <CardDescription>
                         Showing {isLoading ? '...' : orders.length} of {totalOrders} results
                    </CardDescription>
                     <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <form onSubmit={handleSearchSubmit} className="flex-grow">
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Search by customer name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10"
                                />
                            </div>
                        </form>
                        <Select value={statusFilter} onValueChange={(value) => { setCurrentPage(1); setStatusFilter(value); }}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Statuses</SelectItem>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Processing">Processing</SelectItem>
                                <SelectItem value="Shipped">Shipped</SelectItem>
                                <SelectItem value="Delivered">Delivered</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full space-y-4">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => <OrderSkeleton key={i} />)
                        ) : orders.length > 0 ? (
                            orders.map((order, index) => (
                                <AccordionItem key={order._id} value={`order-${index}`} className="bg-background border border-border rounded-lg px-4">
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex justify-between items-center w-full">
                                            <div className="text-left">
                                                <p className="font-bold text-lg text-white">Order #{order._id.substring(order._id.length - 8)}</p>
                                                <p className="text-sm text-muted-foreground">
                                                    {format(new Date(order.created_at), 'PPP')} by {order.shipping_address.name}
                                                </p>
                                            </div>
                                            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
                                                <Badge variant="outline" className={getStatusColor(order.status)}>{order.status}</Badge>
                                                <p className="font-semibold text-white">${order.total_amount.toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="border-t border-border pt-4">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="md:col-span-2">
                                                    <h4 className="font-semibold text-white mb-2">Items</h4>
                                                    <div className="divide-y divide-border">
                                                        {order.items.map(item => (
                                                            <div key={item.product_id} className="py-2 flex justify-between items-center">
                                                                <div>
                                                                    <p className="font-semibold text-white">{item.name}</p>
                                                                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                                                                </div>
                                                                <p className="text-white">${item.price.toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white mb-2">Shipping Address</h4>
                                                    <div className="text-sm text-muted-foreground">
                                                        <p>{order.shipping_address.name}</p>
                                                        <p>{order.shipping_address.address}</p>
                                                        <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.zip_code}</p>
                                                        <p>{order.shipping_address.country}</p>
                                                    </div>
                                                    <h4 className="font-semibold text-white mt-4 mb-2">Update Status</h4>
                                                     <Select value={order.status} onValueChange={(newStatus) => handleStatusChange(order._id, newStatus)}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Update status" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="Pending">Pending</SelectItem>
                                                            <SelectItem value="Processing">Processing</SelectItem>
                                                            <SelectItem value="Shipped">Shipped</SelectItem>
                                                            <SelectItem value="Delivered">Delivered</SelectItem>
                                                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                           <div className="text-center py-10 text-muted-foreground">
                                <p>No orders found with the current filters.</p>
                           </div>
                        )}
                    </Accordion>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center pt-4">
                         <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <Button
                                        variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1 || isLoading} aria-label="Previous page">
                                        <ChevronLeft className="h-5 w-5" />
                                    </Button>
                                </PaginationItem>
                                {paginationItems.map((item, index) => (
                                    <PaginationItem key={index}>
                                        {typeof item === 'number' ? (
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(item); }} isActive={currentPage === item} aria-disabled={isLoading}>
                                                {item}
                                            </PaginationLink>
                                        ) : (
                                            <PaginationEllipsis />
                                        )}
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <Button
                                        variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages || isLoading} aria-label="Next page">
                                        <ChevronRight className="h-5 w-5" />
                                    </Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>
        </>
    );
}
