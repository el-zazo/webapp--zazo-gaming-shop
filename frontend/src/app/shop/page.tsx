"use client";

import { useState, useEffect, useTransition, Suspense, useMemo, useContext } from "react";
import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Heart, Star, ChevronLeft, ChevronRight, FilterX, ChevronDown, Search, Loader2 } from "lucide-react";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationEllipsis } from "@/components/ui/pagination";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import { AuthContext } from "@/contexts/auth-context";
import { CartContext } from "@/contexts/cart-context";
import { cn } from "@/lib/utils";

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

const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => {
  const [isOpen, setIsOpen] = useState(true);
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between py-2">
          <h3 className="text-lg font-medium text-white">{title}</h3>
          <ChevronDown className={`h-5 w-5 text-white transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="pt-2 pb-4">{children}</div>
      </CollapsibleContent>
    </Collapsible>
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

function ShopPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated, isFavorite, toggleFavorite } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  const [products, setProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);

  const initialCategoryName = searchParams.get("category");
  const initialSearch = searchParams.get("search");

  const [searchTerm, setSearchTerm] = useState(initialSearch || "");
  const [appliedSearchTerm, setAppliedSearchTerm] = useState(initialSearch || "");
  const [priceRange, setPriceRange] = useState<[number, number | null]>([0, null]);
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(8);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("popularity");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const fetchCategories = async () => {
      setIsCategoriesLoading(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");
        const categoriesResponse = await axios.get(`${API_BASE_URL}/categories?no_pagination=true`);
        const fetchedCategories = categoriesResponse.data.data || [];
        setAllCategories(fetchedCategories);

        if (initialCategoryName) {
          const initialCategory = fetchedCategories.find((c: any) => c.name === initialCategoryName);
          if (initialCategory) {
            setSelectedCategoryIds([initialCategory._id]);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error Fetching Categories",
          description: error.message || "Could not load categories from the server.",
          variant: "destructive",
        });
      } finally {
        setIsCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [toast, initialCategoryName]);

  // Update appliedSearchTerm when URL search parameter changes
  useEffect(() => {
    if (initialSearch) {
      setSearchTerm(initialSearch);
      setAppliedSearchTerm(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    const fetchProducts = () => {
      startTransition(async () => {
        setIsProductsLoading(true);
        try {
          if (!API_BASE_URL) throw new Error("API base URL is not configured.");

          const queryConditions: any[] = [];

          if (appliedSearchTerm) {
            queryConditions.push({ name: { $regex: appliedSearchTerm, $options: "i" } });
          }

          const [minPrice, maxPrice] = priceRange;
          const priceQuery: any = {};
          if (minPrice > 0) {
            priceQuery.$gte = minPrice;
          }
          if (maxPrice !== null) {
            priceQuery.$lte = maxPrice;
          }
          if (Object.keys(priceQuery).length > 0) {
            queryConditions.push({ price: priceQuery });
          }

          if (selectedCategoryIds.length > 0) {
            queryConditions.push({ category_id: { $in: selectedCategoryIds } });
          }

          if (onSaleOnly) {
            queryConditions.push({ original_price: { $exists: true, $ne: null } });
          }

          if (minRating > 0) {
            queryConditions.push({ rating: { $gte: minRating } });
          }

          let sortOptions: any = {};
          switch (sortBy) {
            case "price-asc":
              sortOptions = { price: 1 };
              break;
            case "price-desc":
              sortOptions = { price: -1 };
              break;
            case "rating":
              sortOptions = { rating: -1 };
              break;
            case "popularity":
              sortOptions = { rating: -1 };
              break;
          }

          const response = await axios.post(`${API_BASE_URL}/products/search`, {
            query: queryConditions.length > 0 ? { $and: queryConditions } : {},
            page: currentPage,
            per_page: productsPerPage,
            sort: sortOptions,
          });

          const responseData = response.data;
          setProducts(responseData.data || []);
          setTotalProducts(responseData.pagination.total || 0);
        } catch (error: any) {
          toast({
            title: "Error Fetching Products",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        } finally {
          setIsProductsLoading(false);
        }
      });
    };

    fetchProducts();
  }, [appliedSearchTerm, priceRange, selectedCategoryIds, onSaleOnly, minRating, sortBy, currentPage, productsPerPage, toast]);

  const categoriesMap = useMemo(() => {
    return allCategories.reduce((acc, category) => {
      acc[category._id] = category;
      return acc;
    }, {} as Record<string, { _id: string; name: string }>);
  }, [allCategories]);

  const totalPages = useMemo(() => Math.ceil(totalProducts / productsPerPage), [totalProducts, productsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setAppliedSearchTerm(searchTerm);
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

  const updateFiltersAndResetPage = (updateFunction: () => void) => {
    setCurrentPage(1);
    updateFunction();
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? 0 : Number(e.target.value);
    updateFiltersAndResetPage(() => setPriceRange([value, priceRange[1]]));
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === "" ? null : Number(e.target.value);
    updateFiltersAndResetPage(() => setPriceRange([priceRange[0], value]));
  };

  const handleCategoryChange = (categoryId: string) => {
    updateFiltersAndResetPage(() => setSelectedCategoryIds((prev) => (prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId])));
  };

  const handleRatingChange = (rating: string) => {
    updateFiltersAndResetPage(() => setMinRating(Number(rating)));
  };

  const handleSortChange = (value: string) => {
    updateFiltersAndResetPage(() => setSortBy(value));
  };

  const handleProductsPerPageChange = (value: string) => {
    updateFiltersAndResetPage(() => setProductsPerPage(Number(value)));
  };

  const handleOnSaleChange = (checked: boolean) => {
    updateFiltersAndResetPage(() => setOnSaleOnly(checked));
  };

  const clearFilters = () => {
    setCurrentPage(1);
    setSearchTerm("");
    setAppliedSearchTerm("");
    setPriceRange([0, null]);
    setSelectedCategoryIds([]);
    setOnSaleOnly(false);
    setMinRating(0);
    setSortBy("popularity");
    setProductsPerPage(8);
    const newUrl = window.location.pathname;
    window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, "", newUrl);
  };

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast({ title: "Please log in to add favorites.", variant: "destructive" });
      router.push("/login");
      return;
    }

    try {
      await toggleFavorite(productId);
      const isNowFavorite = !isFavorite(productId);
      toast({
        title: isNowFavorite ? "Added to Favorites" : "Removed from Favorites",
      });
    } catch (error) {
      toast({ title: "Something went wrong", variant: "destructive" });
    }
  };

  const handleAddToCart = async (product: any, quantity: number) => {
    setAddingToCartId(product._id);
    try {
      await addToCart(product, quantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add item to cart.",
        variant: "destructive",
      });
    } finally {
      setAddingToCartId(null);
    }
  };

  const hasActiveFilters = appliedSearchTerm || selectedCategoryIds.length > 0 || onSaleOnly || minRating > 0 || priceRange[0] !== 0 || priceRange[1] !== null;
  const isLoading = isPending || isProductsLoading;

  return (
    <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white tracking-tight">Shop All Products</h1>
        <p className="mt-4 text-lg text-muted-foreground">Find the best gear to level up your gameplay.</p>
      </div>
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-1/4 lg:w-1/5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-white">Filters</h2>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground hover:text-white">
                <FilterX className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
          <div className="divide-y divide-border">
            <FilterSection title="Search">
              <form onSubmit={handleSearchSubmit} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-card border-border"
                  aria-label="Search products"
                />
                <Button type="submit" variant="secondary" size="icon" aria-label="Submit search">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </FilterSection>
            <FilterSection title="Category">
              {isCategoriesLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ) : (
                <div className="space-y-2">
                  {allCategories.map((category) => (
                    <div key={category._id} className="flex items-center">
                      <Checkbox id={category.slug} checked={selectedCategoryIds.includes(category._id)} onCheckedChange={() => handleCategoryChange(category._id)} />
                      <Label htmlFor={category.slug} className="ml-2 text-muted-foreground hover:text-white cursor-pointer">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </FilterSection>
            <FilterSection title="Price Range">
              <div className="flex items-center gap-2">
                <Input type="number" placeholder="Min" value={priceRange[0]} onChange={handleMinPriceChange} className="w-full bg-card border-border" aria-label="Minimum price" />
                <span className="text-muted-foreground">-</span>
                <Input type="number" placeholder="Max" value={priceRange[1] ?? ""} onChange={handleMaxPriceChange} className="w-full bg-card border-border" aria-label="Maximum price" />
              </div>
            </FilterSection>
            <FilterSection title="Deals">
              <div className="flex items-center space-x-2">
                <Switch id="on-sale" checked={onSaleOnly} onCheckedChange={handleOnSaleChange} />
                <Label htmlFor="on-sale" className="text-muted-foreground hover:text-white cursor-pointer">
                  On Sale
                </Label>
              </div>
            </FilterSection>
            <FilterSection title="Rating">
              <RadioGroup value={String(minRating)} onValueChange={handleRatingChange}>
                {[4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center">
                    <RadioGroupItem value={String(rating)} id={`rating-${rating}`} />
                    <Label htmlFor={`rating-${rating}`} className="ml-2 text-muted-foreground hover:text-white cursor-pointer flex items-center">
                      {renderStars(rating)}
                      <span className="ml-2">& up</span>
                    </Label>
                  </div>
                ))}
                <div key={0} className="flex items-center">
                  <RadioGroupItem value="0" id="rating-any" />
                  <Label htmlFor="rating-any" className="ml-2 text-muted-foreground hover:text-white cursor-pointer">
                    Any
                  </Label>
                </div>
              </RadioGroup>
            </FilterSection>
          </div>
        </aside>

        <div className="w-full md:w-3/4 lg:w-4/5">
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <p className="text-muted-foreground">
              Showing {isLoading ? "..." : products.length} of {totalProducts} results
            </p>
            <div className="flex items-center gap-4">
              <Select value={String(productsPerPage)} onValueChange={handleProductsPerPageChange}>
                <SelectTrigger className="w-[120px] bg-card border-border">
                  <SelectValue placeholder="Show" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8">Show 8</SelectItem>
                  <SelectItem value="16">Show 16</SelectItem>
                  <SelectItem value="24">Show 24</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-[180px] bg-card border-border">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="rating">Average Rating</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 min-h-[500px]">
            {isLoading ? (
              Array.from({ length: productsPerPage }).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : products.length > 0 ? (
              products.map((product) => {
                const onSale = product.original_price && product.original_price > product.price;
                const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/600x600.png";
                const category = categoriesMap[product.category_id];
                const productIsFavorite = isFavorite(product._id);

                return (
                  <Card
                    key={product.name}
                    className="bg-card text-card-foreground border-border overflow-hidden flex flex-col transition-transform duration-300 ease-in-out hover:scale-105 hover:border-primary/50"
                  >
                    <CardHeader className="p-0 relative">
                      <Link href={`/products/${product.slug}`} passHref>
                        {onSale && (
                          <Badge variant="destructive" className="absolute top-4 left-4 rounded-md bg-[#FF3A5E] text-white z-10">
                            SALE
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn("absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 rounded-full text-white hover:text-red-500 transition-colors", productIsFavorite && "text-red-500")}
                          aria-label="Add to favorites"
                          onClick={(e) => handleToggleFavorite(e, product._id)}
                        >
                          <Heart className={cn("h-5 w-5", productIsFavorite && "fill-current")} />
                        </Button>
                        <div className="aspect-square">
                          <Image src={imageUrl} alt={product.name} width={600} height={600} className="object-cover w-full h-full" />
                        </div>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow">
                      {category && (
                        <Link href={`/shop?category=${category.name}`} passHref className="text-sm text-muted-foreground hover:text-primary">
                          {category.name}
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
                      <div className="mt-2">
                        <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"} className="text-xs">
                          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
                        </Badge>
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Button
                        className="w-full bg-primary text-primary-foreground font-semibold rounded-md transition-all duration-200 hover:brightness-110 hover:-translate-y-0.5"
                        onClick={() => handleAddToCart(product, 1)}
                        disabled={addingToCartId === product._id || !product.stock_quantity || product.stock_quantity <= 0}
                        title={!product.stock_quantity || product.stock_quantity <= 0 ? "Out of stock" : ""}
                      >
                        {addingToCartId === product._id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {(!product.stock_quantity || product.stock_quantity <= 0) ? "Out of Stock" : "Add to Cart"}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })
            ) : (
              <div className="col-span-full text-center py-10">
                <p className="text-lg text-muted-foreground">No products found matching your criteria.</p>
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
        </div>
      </div>
    </main>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ShopPageContent />
    </Suspense>
  );
}
