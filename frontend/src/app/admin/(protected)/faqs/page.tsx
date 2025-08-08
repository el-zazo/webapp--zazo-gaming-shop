
'use client';

import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import axios from 'axios';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import { AuthContext } from '@/contexts/auth-context';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const faqSchema = z.object({
  question: z.string().min(5, 'Question must be at least 5 characters.'),
  answer: z.string().min(10, 'Answer must be at least 10 characters.'),
  category: z.string().min(1, 'Category is required.'),
  display_order: z.coerce.number().int().min(0, 'Display order must be a positive integer.'),
});

type FaqFormValues = z.infer<typeof faqSchema>;

interface Faq extends FaqFormValues {
    _id: string;
}

const FaqSkeleton = () => (
    <div className="border-b border-border py-4">
        <div className="flex justify-between items-center">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-5 w-5" />
        </div>
    </div>
);

export default function AdminFaqsPage() {
    const { token } = useContext(AuthContext);
    const { toast } = useToast();
    const [faqs, setFaqs] = useState<Faq[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingFaq, setEditingFaq] = useState<Faq | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [faqsPerPage, setFaqsPerPage] = useState(10);
    const [totalFaqs, setTotalFaqs] = useState(0);

    const form = useForm<FaqFormValues>({
        resolver: zodResolver(faqSchema),
        defaultValues: {
            question: '',
            answer: '',
            category: 'General',
            display_order: 0,
        },
    });

    const fetchFaqs = async (page = 1) => {
        setIsLoading(true);
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            const response = await axios.get(`${API_BASE_URL}/faqs?page=${page}&per_page=${faqsPerPage}&sort[display_order]=1`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const { data, pagination } = response.data; 
            setFaqs(Array.isArray(data) ? data : []);
            setCurrentPage(pagination.current_page);
            setTotalPages(pagination.total_pages);
            setTotalFaqs(pagination.total || 0);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to fetch FAQs: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        if(token) fetchFaqs(currentPage);
    }, [currentPage, faqsPerPage, token, toast]);

    const handleDialogOpen = (faq: Faq | null = null) => {
        setEditingFaq(faq);
        if (faq) {
            form.reset(faq);
        } else {
            form.reset({
                question: '',
                answer: '',
                category: 'General',
                display_order: 0,
            });
        }
        setDialogOpen(true);
    };

    const onSubmit = async (data: FaqFormValues) => {
        setIsSubmitting(true);
        const isEditing = !!editingFaq;
        const url = isEditing
            ? `${API_BASE_URL}/faqs/${editingFaq._id}` 
            : `${API_BASE_URL}/faqs`;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios({
                method,
                url,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                data,
            });
            
            toast({
                title: 'Success!',
                description: `FAQ has been ${isEditing ? 'updated' : 'created'}.`,
            });
            
            setDialogOpen(false);
            setEditingFaq(null);
            await fetchFaqs(isEditing ? currentPage : 1);
        } catch (error: any) {
             const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({
                title: 'Error',
                description: errorMessage || 'An unexpected error occurred.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (faqId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/faqs/${faqId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            toast({ title: 'Success!', description: 'FAQ deleted successfully.' });
            await fetchFaqs(currentPage);
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
                    <h1 className="text-3xl font-bold text-white">Manage FAQs</h1>
                    <p className="text-muted-foreground">
                        Showing {isLoading ? '...' : faqs.length} of {totalFaqs} results
                    </p>
                </div>
                 <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="faqs-per-page">Show</Label>
                        <Select value={String(faqsPerPage)} onValueChange={(value) => { setCurrentPage(1); setFaqsPerPage(Number(value)); }}>
                            <SelectTrigger id="faqs-per-page" className="w-[80px]">
                                <SelectValue placeholder={String(faqsPerPage)} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                             <Button onClick={() => handleDialogOpen(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New FAQ
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
                                <DialogDescription>
                                    {editingFaq ? 'Update the details of the FAQ.' : 'Fill in the details for the new FAQ.'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <div className="max-h-[70vh] overflow-y-auto pr-2">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 px-4">
                                    <FormField control={form.control} name="question" render={({ field }) => (
                                        <FormItem><FormLabel>Question</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="answer" render={({ field }) => (
                                        <FormItem><FormLabel>Answer</FormLabel><FormControl><Textarea className="min-h-[150px]" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="category" render={({ field }) => (
                                        <FormItem><FormLabel>Category</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="display_order" render={({ field }) => (
                                        <FormItem><FormLabel>Display Order</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <DialogFooter className="pr-4">
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save FAQ'}</Button>
                                    </DialogFooter>
                                </form>
                                </div>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            
            <Card>
                <CardContent className="p-0">
                    <Accordion type="single" collapsible className="w-full">
                        {isLoading ? (
                            Array.from({ length: faqsPerPage }).map((_, i) => <FaqSkeleton key={i} />)
                        ) : faqs.length > 0 ? (
                            faqs.map((faq, index) => (
                                <AccordionItem value={`item-${index + 1}`} key={faq._id} className="px-6">
                                    <AccordionTrigger className="text-lg text-left text-white hover:text-primary hover:no-underline">
                                        <div className="flex-grow text-left">{faq.question}</div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="pb-4 pt-2 space-y-4">
                                            <p className="text-base text-muted-foreground">{faq.answer}</p>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <Badge variant="secondary" className="mr-2">Category: {faq.category}</Badge>
                                                    <Badge variant="outline">Order: {faq.display_order}</Badge>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(faq)}>
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
                                                                <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={() => handleDelete(faq._id)}>Delete</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </div>
                                            </div>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                             <div className="text-center py-20">
                                <HelpCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                                <h3 className="mt-4 text-lg font-semibold text-white">No FAQs found</h3>
                                <p className="mt-1 text-sm text-muted-foreground">Get started by adding a new FAQ.</p>
                            </div>
                        )}
                    </Accordion>
                </CardContent>
                {totalPages > 1 && (
                    <CardFooter className="flex justify-center pt-6">
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

    
