
'use client';

import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
} from "@/components/ui/alert-dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { AuthContext } from '@/contexts/auth-context';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const quoteSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  quote: z.string().min(10, 'Quote must be at least 10 characters.'),
  rating: z.coerce.number().int().min(1).max(5),
  avatar_url: z.string().url('Must be a valid URL.').optional(),
  display_order: z.coerce.number().int().min(0),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

interface Quote extends QuoteFormValues {
    _id: string;
}

const QuoteCardSkeleton = () => (
    <Card className="flex flex-col">
        <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
            <Skeleton className="h-20 w-20 rounded-full" />
            <Skeleton className="h-6 w-32 mt-4" />
            <div className="flex justify-center mt-2">
                <Skeleton className="h-5 w-28" />
            </div>
            <div className="mt-4 space-y-2 flex-grow">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
            </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2 p-3 mt-auto">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
        </CardFooter>
    </Card>
);

export default function AdminQuotesPage() {
    const { token } = useContext(AuthContext);
    const { toast } = useToast();
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [quotesPerPage, setQuotesPerPage] = useState(6);
    const [totalQuotes, setTotalQuotes] = useState(0);

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            name: '',
            quote: '',
            rating: 5,
            avatar_url: 'https://placehold.co/100x100.png',
            display_order: 0,
        },
    });

    const fetchQuotes = async (page = 1) => {
        setIsLoading(true);
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            const response = await axios.get(`${API_BASE_URL}/quotes?page=${page}&per_page=${quotesPerPage}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data, pagination } = response.data; 
            setQuotes(Array.isArray(data) ? data : []);
            setCurrentPage(pagination.current_page);
            setTotalPages(pagination.total_pages);
            setTotalQuotes(pagination.total || 0);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to fetch quotes: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(token) fetchQuotes(currentPage);
    }, [currentPage, quotesPerPage, token, toast]);

    const handleDialogOpen = (quote: Quote | null = null) => {
        setEditingQuote(quote);
        if (quote) {
            form.reset(quote);
        } else {
            form.reset({
                name: '',
                quote: '',
                rating: 5,
                avatar_url: 'https://placehold.co/100x100.png',
                display_order: 0,
            });
        }
        setDialogOpen(true);
    };

    const onSubmit = async (data: QuoteFormValues) => {
        setIsSubmitting(true);
        const isEditing = !!editingQuote;
        const url = isEditing ? `${API_BASE_URL}/quotes/${editingQuote._id}` : `${API_BASE_URL}/quotes`;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({
                method,
                url,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                data,
            });
            toast({ title: 'Success!', description: `Quote has been ${isEditing ? 'updated' : 'created'}.` });
            setDialogOpen(false);
            setEditingQuote(null);
            await fetchQuotes(isEditing ? currentPage : 1);
        } catch (error: any) {
             const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: errorMessage || 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (quoteId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/quotes/${quoteId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            toast({ title: 'Success!', description: 'Quote deleted successfully.' });
            await fetchQuotes(currentPage);
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
                    <h1 className="text-3xl font-bold text-white">Manage Quotes (Testimonials)</h1>
                    <p className="text-muted-foreground">
                        Showing {isLoading ? '...' : quotes.length} of {totalQuotes} results
                    </p>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="quotes-per-page">Show</Label>
                        <Select value={String(quotesPerPage)} onValueChange={(value) => { setCurrentPage(1); setQuotesPerPage(Number(value)); }}>
                            <SelectTrigger id="quotes-per-page" className="w-[80px]">
                                <SelectValue placeholder={String(quotesPerPage)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="6">6</SelectItem>
                                <SelectItem value="9">9</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                             <Button onClick={() => handleDialogOpen(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New Quote
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>{editingQuote ? 'Edit Quote' : 'Add New Quote'}</DialogTitle>
                                <DialogDescription>
                                    {editingQuote ? 'Update the details of the quote.' : 'Fill in the details for the new quote.'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <div className="max-h-[70vh] overflow-y-auto pr-2">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 px-4">
                                    <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="quote" render={({ field }) => (
                                        <FormItem><FormLabel>Quote</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="rating" render={({ field }) => (
                                        <FormItem><FormLabel>Rating</FormLabel><FormControl><Input type="number" min="1" max="5" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="display_order" render={({ field }) => (
                                        <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="avatar_url" render={({ field }) => (
                                        <FormItem><FormLabel>Avatar URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <DialogFooter className="pr-4">
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Quote'}</Button>
                                    </DialogFooter>
                                </form>
                                </div>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {isLoading ? (
                    Array.from({ length: quotesPerPage }).map((_, i) => <QuoteCardSkeleton key={i} />)
                ) : quotes.length > 0 ? (
                    quotes.map((quote) => (
                        <Card key={quote._id} className="flex flex-col">
                            <CardContent className="p-6 flex flex-col items-center text-center flex-grow">
                                <Image src={quote.avatar_url || 'https://placehold.co/100x100.png'} alt={quote.name} width={80} height={80} className="rounded-full border-2 border-primary"  />
                                <h3 className="mt-4 text-xl font-semibold text-white">{quote.name}</h3>
                                <div className="mt-2 flex justify-center">
                                    {Array.from({length: quote.rating}).map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />)}
                                    {Array.from({length: 5 - quote.rating}).map((_, i) => <Star key={i} className="h-5 w-5 text-gray-600 fill-gray-600" />)}
                                </div>
                                <blockquote className="mt-4 text-base italic text-muted-foreground flex-grow">
                                    "{quote.quote}"
                                </blockquote>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-card/50 p-3 mt-auto">
                                <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(quote)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                            <AlertDialogDescription>This will permanently delete the quote.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(quote._id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p>No quotes found.</p>
                    </div>
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

    
