
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
import { PlusCircle, Edit, Trash2, ChevronLeft, ChevronRight, Search, FilterX } from 'lucide-react';
import { AuthContext } from '@/contexts/auth-context';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  slug: z.string().min(2, 'Slug must be at least 2 characters.'),
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL.').optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

interface Category extends CategoryFormValues {
    _id: string;
}

const CategoryCardSkeleton = () => (
    <Card className="flex flex-col">
        <Skeleton className="h-40 w-full rounded-t-lg" />
        <CardHeader className="p-4">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardFooter className="flex justify-end gap-2 p-3 mt-auto">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-10 w-10" />
        </CardFooter>
    </Card>
);

export default function AdminCategoriesPage() {
    const { token } = useContext(AuthContext);
    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [categoriesPerPage, setCategoriesPerPage] = useState(8);
    const [totalCategories, setTotalCategories] = useState(0);
    
    // Search functionality
    const [searchTerm, setSearchTerm] = useState("");
    const [appliedSearchTerm, setAppliedSearchTerm] = useState("");


    const form = useForm<CategoryFormValues>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: '',
            slug: '',
            description: '',
            image_url: 'https://placehold.co/400x300.png',
        },
    });

    const fetchCategories = async (page = 1) => {
        setIsLoading(true);
        try {
            if (!API_BASE_URL) throw new Error("API base URL is not configured.");
            
            // Prepare request body
            const requestBody = {
                query: {},
                page: page,
                per_page: categoriesPerPage
            };
            
            // Add search term to query if it exists
            if (appliedSearchTerm) {
                requestBody.query = { name: { $regex: appliedSearchTerm, $options: "i" } };
            }
            
            const response = await axios.post(`${API_BASE_URL}/categories/search`, requestBody, {
                headers: { }
            });
            const { data, pagination } = response.data; 
            setCategories(Array.isArray(data) ? data : []);
            setCurrentPage(pagination.current_page);
            setTotalPages(pagination.total_pages);
            setTotalCategories(pagination.total || 0);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: `Failed to fetch categories: ${errorMessage}`, variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };
    
    useEffect(() => {
        fetchCategories(currentPage);
    }, [currentPage, categoriesPerPage, appliedSearchTerm, toast]);

    const handleDialogOpen = (category: Category | null = null) => {
        setEditingCategory(category);
        if (category) {
            form.reset(category);
        } else {
            form.reset({
                name: '',
                slug: '',
                description: '',
                image_url: 'https://placehold.co/400x300.png',
            });
        }
        setDialogOpen(true);
    };

    const onSubmit = async (data: CategoryFormValues) => {
        setIsSubmitting(true);
        const isEditing = !!editingCategory;
        const url = isEditing
            ? `${API_BASE_URL}/categories/${editingCategory._id}` 
            : `${API_BASE_URL}/categories`;
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
                description: `Category has been ${isEditing ? 'updated' : 'created'}.`,
            });
            
            setDialogOpen(false);
            setEditingCategory(null);
            
            await fetchCategories(isEditing ? currentPage : 1);

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

    const handleDelete = async (categoryId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/categories/${categoryId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                }
            });

            toast({ title: 'Success!', description: 'Category deleted successfully.' });
            await fetchCategories(currentPage);
        } catch (error: any) {
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.error?.message || error.message
                : error.message;
            toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
        }
    };
    
    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const getPaginationItems = () => {
        if (totalPages <= 5) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }
        const pages = [];
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
                    <h1 className="text-3xl font-bold text-white">Manage Categories</h1>
                    <p className="text-muted-foreground">
                        Showing {isLoading ? '...' : categories.length} of {totalCategories} results
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        setCurrentPage(1);
                        setAppliedSearchTerm(searchTerm);
                    }} className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Search categories..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-[200px] bg-card border-border"
                            aria-label="Search categories"
                        />
                        <Button type="submit" variant="secondary" size="icon" aria-label="Submit search">
                            <Search className="h-4 w-4" />
                        </Button>
                        {appliedSearchTerm && (
                            <Button 
                                type="button" 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                    setSearchTerm("");
                                    setAppliedSearchTerm("");
                                    setCurrentPage(1);
                                }}
                                aria-label="Clear search"
                            >
                                <FilterX className="h-4 w-4" />
                            </Button>
                        )}
                    </form>
                    <div className="flex items-center gap-2">
                            <Label htmlFor="categories-per-page">Show</Label>
                            <Select value={String(categoriesPerPage)} onValueChange={(value) => { setCurrentPage(1); setCategoriesPerPage(Number(value)); }}>
                                <SelectTrigger id="categories-per-page" className="w-[80px]">
                                    <SelectValue placeholder={categoriesPerPage} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="4">4</SelectItem>
                                    <SelectItem value="8">8</SelectItem>
                                    <SelectItem value="12">12</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                             <Button onClick={() => handleDialogOpen(null)}>
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Add New
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[525px]">
                            <DialogHeader>
                                <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
                                <DialogDescription>
                                    {editingCategory ? 'Update the details of the category.' : 'Fill in the details for the new category.'}
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...form}>
                                <div className="max-h-[70vh] overflow-y-auto pr-2">
                                <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 px-4">
                                   <FormField control={form.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                     <FormField control={form.control} name="slug" render={({ field }) => (
                                        <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="description" render={({ field }) => (
                                        <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={form.control} name="image_url" render={({ field }) => (
                                        <FormItem><FormLabel>Image URL</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <DialogFooter className="pr-4">
                                        <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Category'}</Button>
                                    </DialogFooter>
                                </form>
                                </div>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array.from({ length: categoriesPerPage }).map((_, i) => <CategoryCardSkeleton key={i} />)
                ) : categories.length > 0 ? (
                    categories.map((category) => (
                        <Card key={category._id} className="flex flex-col overflow-hidden">
                            <CardHeader className="p-0">
                                <Image
                                    src={category.image_url || 'https://placehold.co/400x300.png'}
                                    alt={category.name}
                                    width={400}
                                    height={300}
                                    className="object-cover w-full h-40"
                                    
                                />
                            </CardHeader>
                            <CardContent className="p-4 flex flex-col flex-grow">
                                <CardTitle className="text-lg text-white leading-tight flex-grow">{category.name}</CardTitle>
                                <CardDescription className="mt-2 text-sm text-muted-foreground">/{category.slug}</CardDescription>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-card/50 p-3 mt-auto">
                                <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(category)}>
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
                                            <AlertDialogDescription>
                                                This action cannot be undone. This will permanently delete the category and potentially affect related products.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(category._id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </CardFooter>
                        </Card>
                    ))
                ) : (
                    <div className="col-span-full text-center py-10">
                        <p>No categories found.</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="mt-8 flex justify-center">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </Button>
                            </PaginationItem>
                            {paginationItems.map((item, index) => (
                                <PaginationItem key={index}>
                                    {typeof item === 'number' ? (
                                        <PaginationLink
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(item);
                                            }}
                                            isActive={currentPage === item}
                                            aria-disabled={isLoading}
                                        >
                                            {item}
                                        </PaginationLink>
                                    ) : (
                                        <PaginationEllipsis />
                                    )}
                                </PaginationItem>
                            ))}
                            <PaginationItem>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages || isLoading}
                                    aria-label="Next page"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </Button>
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}
        </>
    );
}
