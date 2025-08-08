"use client";

import { useState, useEffect, useMemo, useContext } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Edit, Trash2, XCircle, Camera, ChevronLeft, ChevronRight, Search, FilterX } from "lucide-react";
import Image from "next/image";
import { AuthContext } from "@/contexts/auth-context";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const productSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  price: z.coerce.number().min(0, "Price must be a positive number."),
  original_price: z.coerce.number().min(0, "Original price must be a positive number.").optional().nullable(),
  images: z.array(z.object({ value: z.string().url("Must be a valid URL.") })).min(1, "At least one image is required."),
  rating: z.coerce.number().min(0).max(5).optional().default(0),
  stock_quantity: z.coerce.number().min(0, "Stock must be a positive number."),
  category_id: z.string().min(1, "Category is required."),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface Category {
  _id: string;
  name: string;
}

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price?: number | null;
  images: string[];
  rating?: number;
  stock_quantity: number;
  category_id: string;
}

const ProductCardSkeleton = () => (
  <Card className="flex flex-col">
    <Skeleton className="h-48 w-full rounded-t-lg" />
    <CardHeader className="p-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </CardHeader>
    <CardContent className="flex-grow space-y-2 p-4">
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-1/3" />
    </CardContent>
    <CardFooter className="flex justify-end gap-2 p-3">
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-10" />
    </CardFooter>
  </Card>
);

export default function AdminProductsPage() {
  const { token } = useContext(AuthContext);
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(8);
  const [totalProducts, setTotalProducts] = useState(0);

  // Search functionality
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState("");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      original_price: undefined,
      images: [{ value: "https://placehold.co/600x600.png" }],
      rating: 0,
      stock_quantity: 0,
      category_id: "",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "images",
  });

  const fetchProducts = async (page = 1) => {
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");

      // Prepare request body
      const requestBody = {
        query: {},
        page: page,
        per_page: productsPerPage,
      };

      // Add search term to query if it exists
      if (appliedSearchTerm) {
        requestBody.query = { name: { $regex: appliedSearchTerm, $options: "i" } };
      }

      const response = await axios.post(`${API_BASE_URL}/products/search`, requestBody, {
        headers: {},
      });
      const { data, pagination } = response.data;
      setProducts(Array.isArray(data) ? data : []);
      setCurrentPage(pagination.current_page);
      setTotalPages(pagination.total_pages);
      setTotalProducts(pagination.total || 0);
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({ title: "Error", description: `Failed to fetch products: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");

      // Prepare request body for all categories (no pagination)
      const requestBody = {
        query: {},
        no_pagination: true,
      };

      const response = await axios.post(`${API_BASE_URL}/categories/search`, requestBody, {
        headers: {},
      });
      const { data } = response.data;
      setCategories(Array.isArray(data) ? data : []);
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({ title: "Error", description: `Failed to fetch categories: ${errorMessage}`, variant: "destructive" });
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchCategories(); // Fetch all categories for the form
    fetchProducts(currentPage);
  }, [currentPage, productsPerPage, appliedSearchTerm, toast]);

  const categoriesMap = useMemo(() => {
    return categories.reduce((acc, category) => {
      acc[category._id] = category.name;
      return acc;
    }, {} as Record<string, string>);
  }, [categories]);

  const handleDialogOpen = (product: Product | null = null) => {
    setEditingProduct(product);
    if (product) {
      form.reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        original_price: product.original_price,
        images: product.images && product.images.length > 0 ? product.images.map((img) => ({ value: img })) : [{ value: "" }],
        rating: product.rating,
        stock_quantity: product.stock_quantity,
        category_id: product.category_id,
      });
    } else {
      form.reset({
        name: "",
        slug: "",
        description: "",
        price: 0,
        original_price: undefined,
        images: [{ value: "https://placehold.co/600x600.png" }],
        rating: 0,
        stock_quantity: 0,
        category_id: "",
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingProduct;
    const url = isEditing ? `${API_BASE_URL}/products/${editingProduct._id}` : `${API_BASE_URL}/products`;
    const method = isEditing ? "put" : "post";

    const payload = {
      ...data,
      images: data.images.map((img) => img.value),
    };

    try {
      await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data: payload,
      });

      toast({
        title: "Success!",
        description: `Product has been ${isEditing ? "updated" : "created"}.`,
      });

      setDialogOpen(false);
      setEditingProduct(null);

      if (isEditing) {
        await fetchProducts(currentPage);
      } else {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          await fetchProducts(1);
        }
      }
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({
        title: "Error",
        description: errorMessage || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/products/${productId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({ title: "Success!", description: "Product deleted successfully." });
      await fetchProducts(currentPage);
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setIsLoading(true);
    }
  };

  const getPaginationItems = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages.filter((value, index, self) => self.indexOf(value) === index);
  };

  const paginationItems = getPaginationItems();

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-white">Manage Products</h1>
          <p className="text-muted-foreground">
            Showing {isLoading ? "..." : products.length} of {totalProducts} results
          </p>
        </div>
        <div className="flex items-center gap-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setCurrentPage(1);
              setAppliedSearchTerm(searchTerm);
            }}
            className="flex gap-2"
          >
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-[200px] bg-card border-border"
              aria-label="Search products"
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
            <Label htmlFor="products-per-page">Show</Label>
            <Select
              value={String(productsPerPage)}
              onValueChange={(value) => {
                setCurrentPage(1);
                setProductsPerPage(Number(value));
              }}
            >
              <SelectTrigger id="products-per-page" className="w-[80px]">
                <SelectValue placeholder={productsPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="8">8</SelectItem>
                <SelectItem value="16">16</SelectItem>
                <SelectItem value="24">24</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogOpen(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Product
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                <DialogDescription>{editingProduct ? "Update the details of the product." : "Fill in the details for the new product."}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 px-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="original_price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price (Optional)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" {...field} value={field.value ?? ""} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <FormLabel>Images</FormLabel>
                      <div className="space-y-2 mt-2">
                        {fields.map((field, index) => (
                          <FormField
                            key={field.id}
                            control={form.control}
                            name={`images.${index}.value`}
                            render={({ field }) => (
                              <FormItem>
                                <div className="flex items-center gap-2">
                                  <FormControl>
                                    <Input {...field} placeholder={`Image URL ${index + 1}`} />
                                  </FormControl>
                                  {fields.length > 1 && (
                                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                      <XCircle className="h-4 w-4 text-destructive" />
                                    </Button>
                                  )}
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ value: "" })}>
                        Add Image URL
                      </Button>
                      <FormMessage>{form.formState.errors.images?.root?.message}</FormMessage>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="stock_quantity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Stock Quantity</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((cat) => (
                                  <SelectItem key={cat._id} value={cat._id}>
                                    {cat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter className="pr-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Product"}
                      </Button>
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
          Array.from({ length: productsPerPage }).map((_, i) => <ProductCardSkeleton key={i} />)
        ) : products.length > 0 ? (
          products.map((product) => (
            <Card key={product._id} className="flex flex-col overflow-hidden">
              <div className="relative aspect-square">
                <Badge variant="secondary" className="absolute top-2 right-2 z-10 flex items-center gap-1">
                  <Camera className="h-3 w-3" />
                  {product.images?.length || 0}
                </Badge>
                <Image src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/100x100.png"} alt={product.name} fill className="object-cover" />
              </div>
              <CardHeader className="p-4">
                <CardTitle className="text-lg text-white leading-tight">{product.name}</CardTitle>
                <CardDescription>{categoriesMap[product.category_id] || "N/A"}</CardDescription>
                <CardDescription className="text-xs truncate">/{product.slug}</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow p-4 pt-0">
                <div className="flex items-baseline gap-2">
                  <p className="text-xl font-bold text-primary">${product.price.toFixed(2)}</p>
                  {product.original_price && <p className="text-sm text-muted-foreground line-through">${product.original_price.toFixed(2)}</p>}
                </div>
                <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"} className="mt-2">
                  {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
                </Badge>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-card/50 p-3">
                <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(product)}>
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
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the product.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(product._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p>No products found.</p>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || isLoading} aria-label="Previous page">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
              </PaginationItem>
              {paginationItems.map((item, index) => (
                <PaginationItem key={index}>
                  {typeof item === "number" ? (
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
                <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || isLoading} aria-label="Next page">
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
