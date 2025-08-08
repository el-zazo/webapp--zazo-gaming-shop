"use client";

import { useState, useEffect, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AuthContext } from "@/contexts/auth-context";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Star, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { cn } from "@/lib/utils";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const renderStars = (rating: number) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <div className="flex items-center" aria-label={`Rating: ${rating} out of 5 stars`}>
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && <Star key="half" className="h-4 w-4 fill-yellow-400 text-yellow-400" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-4 w-4 fill-gray-600 text-gray-600" />
      ))}
    </div>
  );
};

const ProductCardSkeleton = () => (
  <div className="flex flex-col space-y-3">
    <Skeleton className="h-[250px] w-full rounded-xl" />
    <div className="space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  </div>
);

export default function FavoritesPage() {
  const { user, loading: authLoading, isAuthenticated, toggleFavorite, isFavorite } = useContext(AuthContext);
  const router = useRouter();
  const { toast } = useToast();

  const [favoriteProducts, setFavoriteProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(8);
  const [totalProducts, setTotalProducts] = useState(0);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const categoriesMap = useMemo(() => {
    return allCategories.reduce((acc, category) => {
      acc[category._id] = category.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allCategories]);

  useEffect(() => {
    const fetchFavoriteProducts = async () => {
      if (!isAuthenticated || !user || !API_BASE_URL) return;

      setIsLoading(true);
      try {
        // Fetch categories once
        if (allCategories.length === 0) {
          const categoriesResponse = await axios.get(`${API_BASE_URL}/categories?no_pagination=true`);
          setAllCategories(categoriesResponse.data.data || []);
        }

        // 1. Fetch paginated favorite records
        const favsResponse = await axios.post(
          `${API_BASE_URL}/favorites/search`,
          {
            query: { user_id: user._id },
            page: currentPage,
            per_page: productsPerPage,
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          }
        );

        const { data: favoriteRecords, pagination } = favsResponse.data;
        setTotalPages(pagination.total_pages);
        setTotalProducts(pagination.total);

        if (!favoriteRecords || favoriteRecords.length === 0) {
          setFavoriteProducts([]);
          setIsLoading(false);
          return;
        }

        // 2. Extract product IDs from the favorite records
        const productIds = favoriteRecords.map((fav: any) => fav.product_id);

        // 3. Fetch product details for those IDs without pagination
        const productsResponse = await axios.post(`${API_BASE_URL}/products/search`, {
          query: { _id: { $in: productIds } },
          no_pagination: true,
        });

        setFavoriteProducts(productsResponse.data.data || []);
      } catch (error: any) {
        toast({ title: "Error", description: "Failed to load favorite products.", variant: "destructive" });
        setFavoriteProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && isAuthenticated) {
      fetchFavoriteProducts();
    }
  }, [isAuthenticated, authLoading, user, currentPage, productsPerPage, toast, allCategories.length]);

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(productId);
      // Refetch current page data to reflect the change
      const favsResponse = await axios.post(
        `${API_BASE_URL}/favorites/search`,
        {
          query: { user_id: user?._id },
          page: currentPage,
          per_page: productsPerPage,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      const { data: favoriteRecords, pagination } = favsResponse.data;
      setTotalPages(pagination.total_pages);
      setTotalProducts(pagination.total);

      if (favoriteRecords.length > 0) {
        const productIds = favoriteRecords.map((fav: any) => fav.product_id);
        const productsResponse = await axios.post(`${API_BASE_URL}/products/search`, {
          query: { _id: { $in: productIds } },
          no_pagination: true,
        });
        setFavoriteProducts(productsResponse.data.data || []);
      } else {
        // If the last item on a page is removed, we might need to go to the previous page
        if (currentPage > 1 && totalProducts > 1) {
          // totalProducts is from before the delete
          setCurrentPage(currentPage - 1);
        } else {
          setFavoriteProducts([]);
        }
      }

      toast({ title: "Removed from Favorites" });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
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
      pages.push(1, 2, 3, "...", totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages.filter((value, index, self) => self.indexOf(value) === index);
  };
  const paginationItems = getPaginationItems();

  const showEmptyState = !isLoading && totalProducts === 0;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white tracking-tight">My Favorites</h1>
        <p className="mt-4 text-lg text-muted-foreground">Your curated collection of top gear.</p>
      </div>

      {showEmptyState ? (
        <div className="text-center py-20 bg-card rounded-lg border-border">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold text-white">No Favorites Yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Click the heart icon on products to save them here.</p>
          <Button asChild className="mt-6">
            <Link href="/shop">Find Products</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <p className="text-muted-foreground">
              Showing {isLoading ? "..." : favoriteProducts.length} of {totalProducts} results
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 min-h-[500px]">
            {isLoading
              ? Array.from({ length: productsPerPage }).map((_, i) => <ProductCardSkeleton key={i} />)
              : favoriteProducts.map((product) => {
                  const productIsFavorite = isFavorite(product._id);
                  const categoryName = categoriesMap[product.category_id] || "";
                  return (
                    <Card
                      key={product.name}
                      className="bg-card text-card-foreground border-border overflow-hidden flex flex-col transition-transform duration-300 ease-in-out hover:scale-105 hover:border-primary/50"
                    >
                      <CardHeader className="p-0 relative">
                        <Link href={`/products/${product.slug}`} passHref>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 rounded-full text-white hover:text-red-500 transition-colors",
                              productIsFavorite && "text-red-500"
                            )}
                            aria-label="Remove from favorites"
                            onClick={(e) => handleToggleFavorite(e, product._id)}
                          >
                            <Heart className={cn("h-5 w-5", productIsFavorite && "fill-current")} />
                          </Button>
                          <div className="aspect-square">
                            <Image src={product.images[0]} alt={product.name} width={600} height={600} className="object-cover w-full h-full" />
                          </div>
                        </Link>
                      </CardHeader>
                      <CardContent className="p-4 flex-grow">
                        {categoryName && (
                          <Link href={`/shop?category=${encodeURIComponent(categoryName)}`} className="text-sm text-muted-foreground hover:text-primary">
                            {categoryName}
                          </Link>
                        )}
                        <h3 className="text-lg font-semibold text-white mt-1">
                          <Link href={`/products/${product.slug}`} passHref className="hover:text-primary">
                            {product.name}
                          </Link>
                        </h3>
                        <div className="mt-2 flex items-center gap-2">
                          {renderStars(product.rating)}
                          <span className="text-xs text-muted-foreground">({product.rating})</span>
                        </div>
                        <div className="mt-3 flex items-baseline">
                          <p className="text-2xl font-bold text-primary">${product.price}</p>
                          {product.original_price && <p className="ml-2 text-base text-gray-500 line-through">${product.original_price}</p>}
                        </div>
                      </CardContent>
                      <CardFooter className="p-4 pt-0">
                        <Button className="w-full bg-primary text-primary-foreground font-semibold rounded-md transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5">
                          Add to Cart
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
          </div>
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
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
      )}
    </main>
  );
}
