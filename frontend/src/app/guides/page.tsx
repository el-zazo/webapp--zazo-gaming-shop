"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Cpu, Wrench, Search, ChevronLeft, ChevronRight, FilterX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Guide {
  _id: string;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  card_image_url?: string;
  category: string;
}

const GuideCardSkeleton = () => (
  <Card className="bg-card border-border flex flex-col overflow-hidden">
    <Skeleton className="w-full h-48" />
    <CardContent className="p-6 flex flex-col flex-grow">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-6 w-full mb-2" />
      <Skeleton className="h-4 w-full mb-1" />
      <Skeleton className="h-4 w-3/4 mb-4" />
      <div className="mt-auto">
        <Skeleton className="h-10 w-28" />
      </div>
    </CardContent>
  </Card>
);

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case "building":
      return <Wrench className="h-5 w-5 mr-2" />;
    case "components":
      return <Cpu className="h-5 w-5 mr-2" />;
    case "performance":
    default:
      return <BookOpen className="h-5 w-5 mr-2" />;
  }
};

const guideCategories = ["Building", "Components", "Performance"];

function GuidesPageContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";

  const [guides, setGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [guidesPerPage, setGuidesPerPage] = useState(6);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearch);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    const fetchGuides = async () => {
      setLoading(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");

        const queryConditions: any[] = [];

        if (appliedSearchTerm) {
          queryConditions.push({ title: { $regex: appliedSearchTerm, $options: "i" } });
        }

        if (selectedCategories.length > 0) {
          queryConditions.push({ category: { $in: selectedCategories } });
        }

        const response = await axios.post(`${API_BASE_URL}/guides/search`, {
          query: queryConditions.length > 0 ? { $and: queryConditions } : {},
          page: currentPage,
          per_page: guidesPerPage,
        });

        setGuides(response.data.data || []);
        setTotalPages(response.data.pagination.total_pages || 1);
      } catch (error: any) {
        // console.error("Failed to fetch guides", error);
        toast({ title: "Error", description: `Failed to fetch guides: ${error.message}`, variant: "destructive" });
        setGuides([]);
      } finally {
        setLoading(false);
      }
    };
    fetchGuides();
  }, [appliedSearchTerm, currentPage, guidesPerPage, toast, selectedCategories]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearchTerm(searchTerm);
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleCategoryToggle = (category: string) => {
    setCurrentPage(1);
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchTerm("");
    setAppliedSearchTerm("");
    setSelectedCategories([]);
  };

  const hasActiveFilters = appliedSearchTerm || selectedCategories.length > 0;

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
      <section className="bg-card/50 py-20 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Gaming Guides</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Your ultimate resource for PC building, optimization, and gaming knowledge.</p>
          <form onSubmit={handleSearchSubmit} className="mt-8 flex w-full max-w-xl mx-auto">
            <label htmlFor="search-guides" className="sr-only">
              Search guides
            </label>
            <div className="relative w-full">
              <Input
                type="search"
                id="search-guides"
                placeholder="Search guides..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-background border-border rounded-r-none h-12 pl-4 pr-12"
              />
              <Button type="submit" size="icon" className="absolute right-0 top-0 h-full w-12 rounded-l-none" aria-label="Submit search">
                <Search className="h-5 w-5" />
              </Button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            {guideCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategories.includes(category) ? "secondary" : "outline"}
                onClick={() => handleCategoryToggle(category)}
                className={cn("transition-colors", selectedCategories.includes(category) && "border-primary")}
              >
                {category}
              </Button>
            ))}
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-muted-foreground hover:text-white">
                <FilterX className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 min-h-[500px]">
            {loading ? (
              Array.from({ length: guidesPerPage }).map((_, i) => <GuideCardSkeleton key={i} />)
            ) : guides.length > 0 ? (
              guides.map((guide) => (
                <Card key={guide._id} className="bg-card border-border flex flex-col overflow-hidden hover:border-primary transition-colors duration-300">
                  <CardHeader className="p-0">
                    <Link href={`/guides/${guide.slug}`} className="block">
                      <Image src={guide.card_image_url || guide.image_url || "https://placehold.co/600x400.png"} alt={guide.title} width={600} height={400} className="object-cover w-full h-48" />
                    </Link>
                  </CardHeader>
                  <CardContent className="p-6 flex flex-col flex-grow">
                    <div className="flex items-center text-sm text-muted-foreground mb-2">
                      {getCategoryIcon(guide.category)}
                      <span>{guide.category}</span>
                    </div>
                    <CardTitle className="text-xl font-semibold text-white flex-grow">
                      <Link href={`/guides/${guide.slug}`} className="hover:text-primary transition-colors">
                        {guide.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="mt-2 text-muted-foreground min-h-[60px]">{guide.description}</CardDescription>
                    <div className="mt-auto pt-4">
                      <Link href={`/guides/${guide.slug}`} passHref>
                        <Button variant="outline">Read More</Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-muted-foreground text-lg">No guides found matching your criteria.</p>
              </div>
            )}
          </div>
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1 || loading}>
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
                          aria-disabled={loading}
                        >
                          {item}
                        </PaginationLink>
                      ) : (
                        <PaginationEllipsis />
                      )}
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <Button variant="ghost" size="icon" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || loading}>
                      <ChevronRight className="h-5 w-5" />
                    </Button>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

export default function GuidesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GuidesPageContent />
    </Suspense>
  );
}
