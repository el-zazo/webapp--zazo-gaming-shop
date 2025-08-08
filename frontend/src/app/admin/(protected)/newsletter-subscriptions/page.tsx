
'use client';

import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationEllipsis,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { AuthContext } from '@/contexts/auth-context';
import { format } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Subscription {
    _id: string;
    email: string;
    subscribed_at: string;
}

export default function AdminNewsletterSubscriptionsPage() {
    const { token } = useContext(AuthContext);
    const { toast } = useToast();
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [subscriptionsPerPage, setSubscriptionsPerPage] = useState(10);
    const [totalSubscriptions, setTotalSubscriptions] = useState(0);

    const fetchSubscriptions = async (page = 1) => {
        setIsLoading(true);
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            const response = await axios.get(`${API_BASE_URL}/newsletter-subscriptions?page=${page}&per_page=${subscriptionsPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data, pagination } = response.data; 
            setSubscriptions(Array.isArray(data) ? data : []);
            setCurrentPage(pagination.current_page);
            setTotalPages(pagination.total_pages);
            setTotalSubscriptions(pagination.total || 0);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to fetch subscriptions: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(token) fetchSubscriptions(currentPage);
    }, [currentPage, subscriptionsPerPage, token, toast]);
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    const getPaginationItems = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | string)[] = [];
        if (currentPage <= 3) {
            pages.push(1, 2, 3, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...', totalPages - 2, totalPages - 1, totalPages);
        } else {
            pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
        return pages.filter((value, index, self) => self.indexOf(value) === index);
    };

    const paginationItems = getPaginationItems();

    const handleExportCSV = async () => {
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            const response = await axios.get(`${API_BASE_URL}/newsletter-subscriptions?no_pagination=true`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const allSubscriptions = response.data.data;

            let csvContent = "data:text/csv;charset=utf-8,Email,Subscribed At\n";
            allSubscriptions.forEach((sub: Subscription) => {
                csvContent += `${sub.email},${sub.subscribed_at}\n`;
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "newsletter_subscriptions.csv");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast({ title: 'Success', description: 'CSV file exported.' });

        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to export: ${errorMessage}`, variant: 'destructive' });
        }
    };

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-white">Newsletter Subscriptions</h1>
                <Button onClick={handleExportCSV}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            </div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Subscribers</CardTitle>
                            <CardDescription>
                                Showing {isLoading ? '...' : subscriptions.length} of {totalSubscriptions} results
                            </CardDescription>
                        </div>
                         <div className="flex items-center gap-2">
                            <Label htmlFor="subscriptions-per-page">Show</Label>
                            <Select value={String(subscriptionsPerPage)} onValueChange={(value) => { setCurrentPage(1); setSubscriptionsPerPage(Number(value)); }}>
                                <SelectTrigger id="subscriptions-per-page" className="w-[80px]">
                                    <SelectValue placeholder={String(subscriptionsPerPage)} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="10">10</SelectItem>
                                    <SelectItem value="25">25</SelectItem>
                                    <SelectItem value="50">50</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[200px]">Subscribed At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: subscriptionsPerPage }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                                    </TableRow>
                                ))
                            ) : subscriptions.length > 0 ? (
                                subscriptions.map((sub) => (
                                    <TableRow key={sub._id}>
                                        <TableCell className="font-medium text-white">{sub.email}</TableCell>
                                        <TableCell>{format(new Date(sub.subscribed_at), 'PPP p')}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center">No subscriptions found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} aria-label="Previous page"><ChevronLeft className="h-5 w-5" /></Button>
                                </PaginationItem>
                                {paginationItems.map((item, index) => (
                                    <PaginationItem key={index}>
                                        {typeof item === 'number' ? (
                                            <PaginationLink href="#" onClick={(e) => { e.preventDefault(); handlePageChange(item); }} isActive={currentPage === item} aria-disabled={isLoading}>{item}</PaginationLink>
                                        ) : (
                                            <PaginationEllipsis />
                                        )}
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} aria-label="Next page"><ChevronRight className="h-5 w-5" /></Button>
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </CardFooter>
                )}
            </Card>
        </>
    );
}
