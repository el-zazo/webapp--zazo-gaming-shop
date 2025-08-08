"use client";

import { useState, useEffect, useContext } from "react";
import { useForm } from "react-hook-form";
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
import { PlusCircle, Edit, Trash2, Cpu, Wrench, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import Image from "next/image";
import { AuthContext } from "@/contexts/auth-context";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const guideSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  image_url: z.string().url("Must be a valid URL."),
  card_image_url: z.string().url("Must be a valid URL.").optional(),
  category: z.string().min(1, "Category is required."),
  author_id: z.string(),
});

type GuideFormValues = z.infer<typeof guideSchema>;

interface Guide extends Omit<GuideFormValues, "author_id"> {
  _id: string;
}

const GuideCardSkeleton = () => (
  <Card className="flex flex-col">
    <Skeleton className="h-48 w-full rounded-t-lg" />
    <CardHeader className="p-4">
      <Skeleton className="h-4 w-1/4 mb-2" />
      <Skeleton className="h-6 w-3/4" />
    </CardHeader>
    <CardContent className="flex-grow space-y-2 p-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </CardContent>
    <CardFooter className="flex justify-end gap-2 p-3">
      <Skeleton className="h-10 w-10" />
      <Skeleton className="h-10 w-10" />
    </CardFooter>
  </Card>
);

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case "building":
      return <Wrench className="h-4 w-4" />;
    case "components":
      return <Cpu className="h-4 w-4" />;
    case "performance":
    default:
      return <BookOpen className="h-4 w-4" />;
  }
};

export default function AdminGuidesPage() {
  const { token, user } = useContext(AuthContext);
  const { toast } = useToast();
  const [guides, setGuides] = useState<Guide[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGuide, setEditingGuide] = useState<Guide | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [guidesPerPage, setGuidesPerPage] = useState(6);
  const [totalGuides, setTotalGuides] = useState(0);

  const form = useForm<GuideFormValues>({
    resolver: zodResolver(guideSchema),
    defaultValues: {
      title: "",
      slug: "",
      content: "",
      description: "",
      image_url: "https://placehold.co/1200x600.png",
      card_image_url: "https://placehold.co/600x400.png",
      category: "",
      author_id: user?._id || "",
    },
  });

  useEffect(() => {
    if (user?._id) {
      form.setValue("author_id", user._id);
    }
  }, [user, form]);

  const fetchGuides = async (page = 1) => {
    setIsLoading(true);
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");
      const response = await axios.post(`${API_BASE_URL}/guides/search`, {
        page: page,
        per_page: guidesPerPage,
      });
      const { data, pagination } = response.data;
      setGuides(Array.isArray(data) ? data : []);
      setCurrentPage(pagination.current_page);
      setTotalPages(pagination.total_pages);
      setTotalGuides(pagination.total || 0);
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || error.message : error.message;
      toast({ title: "Error", description: `Failed to fetch guides: ${errorMessage}`, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuides(currentPage);
  }, [currentPage, guidesPerPage, toast]);

  const handleDialogOpen = (guide: Guide | null = null) => {
    setEditingGuide(guide);
    if (guide) {
      form.reset({
        ...guide,
        author_id: user?._id || "",
      });
    } else {
      form.reset({
        title: "",
        slug: "",
        content: "",
        description: "",
        image_url: "https://placehold.co/1200x600.png",
        card_image_url: "https://placehold.co/600x400.png",
        category: "",
        author_id: user?._id || "",
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: GuideFormValues) => {
    setIsSubmitting(true);
    const isEditing = !!editingGuide;
    const url = isEditing ? `${API_BASE_URL}/guides/${editingGuide._id}` : `${API_BASE_URL}/guides`;
    const method = isEditing ? "put" : "post";

    try {
      await axios({
        method,
        url,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        data,
      });

      toast({
        title: "Success!",
        description: `Guide has been ${isEditing ? "updated" : "created"}.`,
      });

      setDialogOpen(false);
      setEditingGuide(null);

      if (isEditing) {
        await fetchGuides(currentPage);
      } else {
        if (currentPage !== 1) {
          setCurrentPage(1);
        } else {
          await fetchGuides(1);
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

  const handleDelete = async (guideId: string) => {
    try {
      await axios.delete(`${API_BASE_URL}/guides/${guideId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({ title: "Success!", description: "Guide deleted successfully." });
      await fetchGuides(currentPage);
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
          <h1 className="text-3xl font-bold text-white">Manage Guides</h1>
          <p className="text-muted-foreground">
            Showing {isLoading ? "..." : guides.length} of {totalGuides} results
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="guides-per-page">Show</Label>
            <Select
              value={String(guidesPerPage)}
              onValueChange={(value) => {
                setCurrentPage(1);
                setGuidesPerPage(Number(value));
              }}
            >
              <SelectTrigger id="guides-per-page" className="w-[80px]">
                <SelectValue placeholder={guidesPerPage} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6</SelectItem>
                <SelectItem value="12">12</SelectItem>
                <SelectItem value="18">18</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleDialogOpen(null)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{editingGuide ? "Edit Guide" : "Add New Guide"}</DialogTitle>
                <DialogDescription>{editingGuide ? "Update the details of the guide." : "Fill in the details for the new guide."}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                  <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 px-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
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
                          <FormLabel>Short Description (for card)</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Content (Markdown supported)</FormLabel>
                          <FormControl>
                            <Textarea className="min-h-[200px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
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
                              <SelectItem value="Building">Building</SelectItem>
                              <SelectItem value="Components">Components</SelectItem>
                              <SelectItem value="Performance">Performance</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Header Image URL</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="card_image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Image URL (Optional)</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <DialogFooter className="pr-4">
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save Guide"}
                      </Button>
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
          Array.from({ length: guidesPerPage }).map((_, i) => <GuideCardSkeleton key={i} />)
        ) : guides.length > 0 ? (
          guides.map((guide) => (
            <Card key={guide._id} className="flex flex-col overflow-hidden">
              <CardHeader className="p-0">
                <Image src={guide.card_image_url || guide.image_url || "https://placehold.co/600x400.png"} alt={guide.title} width={600} height={400} className="object-cover w-full h-48" />
              </CardHeader>
              <CardContent className="p-4 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  {getCategoryIcon(guide.category)}
                  <span>{guide.category}</span>
                </div>
                <CardTitle className="text-lg text-white leading-tight flex-grow">{guide.title}</CardTitle>
                <CardDescription className="mt-2 text-sm text-muted-foreground min-h-[60px]">{guide.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 bg-card/50 p-3">
                <Button variant="ghost" size="icon" onClick={() => handleDialogOpen(guide)}>
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
                      <AlertDialogDescription>This action cannot be undone. This will permanently delete the guide.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete(guide._id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p>No guides found.</p>
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
