"use client";

import { useState, useEffect, useContext } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, Loader2 } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";
import { AuthContext } from "@/contexts/auth-context";
import { CartContext } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
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

const ProductCardSkeleton = () => (
  <Card className="bg-card border-border overflow-hidden flex flex-col">
    <Skeleton className="h-60 w-full" />
    <CardContent className="p-4 flex-grow flex flex-col space-y-3">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-5 w-1/3" />
    </CardContent>
    <CardFooter className="p-4 pt-0">
      <Skeleton className="h-10 w-full" />
    </CardFooter>
  </Card>
);

export default function FeaturedDealsSection() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, isFavorite, toggleFavorite } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const { toast } = useToast();
  const router = useRouter();
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  useEffect(() => {
    const fetchDeals = async () => {
      setLoading(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");
        const response = await axios.post(`${API_BASE_URL}/products/search`, {
          query: { original_price: { $exists: true, $ne: null } },
          per_page: 3,
        });
        setProducts(response.data.data);
      } catch (error) {
        // console.error("Failed to fetch featured deals", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

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

  return (
    <section id="deals" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-white mb-8">Featured Deals</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <ProductCardSkeleton key={i} />)
          ) : products.length > 0 ? (
            products.map((product) => {
              const onSale = product.original_price && product.original_price > product.price;
              const imageUrl = product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/600x600.png";
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
                  <CardContent className="p-4 flex-grow flex flex-col">
                    <CardTitle className="text-xl font-semibold text-white">
                      <Link href={`/products/${product.slug}`} className="hover:text-primary transition-colors">
                        {product.name}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-2 flex-grow min-h-[40px]">{product.description}</CardDescription>
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
                      {!product.stock_quantity || product.stock_quantity <= 0 ? "Out of Stock" : "Add to Cart"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center text-muted-foreground">
              <p>No featured deals available at the moment. Check back soon!</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
