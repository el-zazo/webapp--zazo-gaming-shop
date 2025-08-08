
'use client';

import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { Trash2, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';
import { AuthContext } from '@/contexts/auth-context';
import { formatDistanceToNow } from 'date-fns';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface ContactMessage {
    _id: string;
    name: string;
    email: string;
    message: string;
    created_at: string;
}

const MessageSkeleton = () => (
    <Card>
        <CardHeader className="flex flex-row justify-between items-start">
            <div className="space-y-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3" />
        </CardContent>
        <CardFooter className="flex justify-end">
             <Skeleton className="h-10 w-10" />
        </CardFooter>
    </Card>
)

export default function AdminContactMessagesPage() {
    const { token } = useContext(AuthContext);
    const { toast } = useToast();
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [messagesPerPage, setMessagesPerPage] = useState(5);
    const [totalMessages, setTotalMessages] = useState(0);

    const fetchMessages = async (page = 1) => {
        setIsLoading(true);
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            const response = await axios.get(`${API_BASE_URL}/contact-messages?page=${page}&per_page=${messagesPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data, pagination } = response.data; 
            setMessages(Array.isArray(data) ? data : []);
            setCurrentPage(pagination.current_page);
            setTotalPages(pagination.total_pages);
            setTotalMessages(pagination.total || 0);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to fetch messages: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(token) fetchMessages(currentPage);
    }, [currentPage, messagesPerPage, token, toast]);

    const handleDelete = async (messageId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/contact-messages/${messageId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast({ title: 'Success!', description: 'Message deleted successfully.' });
            await fetchMessages(currentPage);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
    };
    
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

    return (
        <>
            <div className="flex justify-between items-center mb-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold text-white">Contact Messages</h1>
                    <p className="text-muted-foreground">
                        Showing {isLoading ? '...' : messages.length} of {totalMessages} results
                    </p>
                </div>
                 <div className="flex items-center gap-2">
                    <Label htmlFor="messages-per-page">Show</Label>
                    <Select value={String(messagesPerPage)} onValueChange={(value) => { setCurrentPage(1); setMessagesPerPage(Number(value)); }}>
                        <SelectTrigger id="messages-per-page" className="w-[80px]">
                            <SelectValue placeholder={String(messagesPerPage)} />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                 {isLoading ? (
                    Array.from({ length: messagesPerPage }).map((_, i) => <MessageSkeleton key={i} />)
                ) : messages.length > 0 ? (
                    messages.map((msg) => (
                        <Card key={msg._id}>
                            <CardHeader className="flex flex-row justify-between items-start">
                                <div>
                                    <CardTitle className="text-lg">{msg.name}</CardTitle>
                                    <CardDescription>{msg.email}</CardDescription>
                                </div>
                                <span className="text-sm text-muted-foreground">{formatDistanceToNow(new Date(msg.created_at))} ago</span>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">{msg.message}</p>
                            </CardContent>
                            <CardFooter className="flex justify-end">
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This action will permanently delete the message.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(msg._id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <Card className="py-20 text-center">
                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                        <h3 className="mt-4 text-lg font-semibold text-white">No messages found</h3>
                        <p className="mt-1 text-sm text-muted-foreground">Your inbox is currently empty.</p>
                    </Card>
                )}
            </div>
           
            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
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
                </div>
            )}
        </>
    );

    