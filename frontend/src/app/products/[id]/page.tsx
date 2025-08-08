"use client";

import { useState, useEffect, useContext, Suspense } from "react";
import { notFound, useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Star, Shield, Truck, Reply, Heart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";
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
        <Star key={`full-${i}`} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ))}
      {halfStar && <Star key="half" className="h-5 w-5 fill-yellow-400 text-yellow-400" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-5 w-5 fill-gray-600 text-gray-600" />
      ))}
    </div>
  );
};

const ProductPageLoader = () => (
  <main className="flex-grow py-16 sm:py-20 lg:py-24">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <Skeleton className="w-full aspect-square rounded-lg" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/4" />
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  </main>
);

function ProductPageContent() {
  const params = useParams();
  const slug = params.id as string;
  const router = useRouter();
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isAuthenticated, isFavorite, toggleFavorite } = useContext(AuthContext);
  const { addToCart } = useContext(CartContext);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!slug) return;
      setLoading(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");

        const response = await axios.post(`${API_BASE_URL}/products/search`, {
          query: { slug: slug },
        });

        const { data } = response.data;

        if (data && data.length > 0) {
          const currentProduct = data[0];
          setProduct(currentProduct);

          if (currentProduct.category_id) {
            const relatedResponse = await axios.get(`${API_BASE_URL}/products?category_id=${currentProduct.category_id}&per_page=4`);
            const allRelated = relatedResponse.data.data;
            const filteredRelated = allRelated.filter((p: any) => p._id !== currentProduct._id).slice(0, 3);
            setRelatedProducts(filteredRelated);
          }
        } else {
          setProduct(null);
        }
      } catch (error: any) {
        // console.error("Failed to fetch product:", error);
        toast({
          title: "Error fetching product",
          description: error.message || "An unexpected error occurred.",
          variant: "destructive",
        });
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, toast]);

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

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await addToCart(product, 1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not add item to cart.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
    }
  };

  const onSale = product?.original_price && product.original_price > product.price;

  if (loading) {
    return <ProductPageLoader />;
  }

  if (!product) {
    return (
      <main className="flex-grow py-16 sm:py-20 lg:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-white">Product Not Found</h1>
          <p className="text-muted-foreground mt-4">Sorry, we couldn't find the product you're looking for.</p>
          <Button asChild className="mt-6">
            <Link href="/shop">Go to Shop</Link>
          </Button>
        </div>
      </main>
    );
  }

  const productIsFavorite = isFavorite(product._id);

  return (
    <main className="flex-grow py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-16">
          <div>
            <Card className="overflow-hidden border-border bg-card">
              <div className="relative aspect-square">
                <Image
                  src={product.images && product.images.length > 0 ? product.images[0] : "https://placehold.co/600x600.png"}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  style={{ objectFit: "cover" }}
                />
                {onSale && (
                  <Badge variant="destructive" className="absolute top-4 left-4 rounded-md bg-[#FF3A5E] text-white z-10">
                    SALE
                  </Badge>
                )}
              </div>
            </Card>
          </div>
          <div className="flex flex-col">
            <h1 className="text-3xl lg:text-4xl font-bold text-white">{product.name}</h1>

            <div className="mt-4 flex items-center gap-4">
              {renderStars(product.rating)}
              <span className="text-sm text-muted-foreground">{product.rating} / 5.0</span>
            </div>

            <div className="mt-4 flex items-baseline gap-4">
              <p className="text-3xl font-bold text-primary">${product.price}</p>
              {product.original_price && <p className="text-xl text-gray-500 line-through">${product.original_price}</p>}
            </div>

            <div className="mt-4">
              <Badge variant={product.stock_quantity > 0 ? "secondary" : "destructive"} className="text-sm">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of Stock"}
              </Badge>
            </div>

            <p className="mt-6 text-muted-foreground leading-relaxed">{product.description}</p>

            <Separator className="my-8" />

            <div className="mt-auto space-y-4">
              <div className="flex gap-2">
                <Button
                  size="lg"
                  className="w-full text-lg py-6"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !product.stock_quantity || product.stock_quantity <= 0}
                  title={!product.stock_quantity || product.stock_quantity <= 0 ? "Out of stock" : ""}
                >
                  {isAddingToCart && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isAddingToCart ? "Adding..." : !product.stock_quantity || product.stock_quantity <= 0 ? "Out of Stock" : "Add to Cart"}
                </Button>
                <Button size="lg" variant="outline" className="px-4" onClick={(e) => handleToggleFavorite(e, product._id)}>
                  <Heart className={cn("h-6 w-6", productIsFavorite && "fill-red-500 text-red-500")} />
                </Button>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="p-2 rounded-md bg-card border border-border">
                  <Truck className="h-6 w-6 mx-auto text-primary" />
                  <span className="text-xs text-muted-foreground mt-1 block">Fast Shipping</span>
                </div>
                <div className="p-2 rounded-md bg-card border border-border">
                  <Shield className="h-6 w-6 mx-auto text-primary" />
                  <span className="text-xs text-muted-foreground mt-1 block">2-Year Warranty</span>
                </div>
                <div className="p-2 rounded-md bg-card border border-border">
                  <Reply className="h-6 w-6 mx-auto text-primary" />
                  <span className="text-xs text-muted-foreground mt-1 block">Easy Returns</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="mt-16 sm:mt-20 lg:mt-24 pt-16 sm:pt-20 lg:pt-24 border-t border-border">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Related Products</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((p) => {
                const relatedIsFavorite = isFavorite(p._id);
                return (
                  <Card
                    key={p._id}
                    className="bg-card text-card-foreground border-border overflow-hidden flex flex-col transition-transform duration-300 ease-in-out hover:scale-105 hover:border-primary/50"
                  >
                    <CardHeader className="p-0 relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn("absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/75 rounded-full text-white hover:text-red-500 transition-colors", relatedIsFavorite && "text-red-500")}
                        aria-label="Add to favorites"
                        onClick={(e) => handleToggleFavorite(e, p._id)}
                      >
                        <Heart className={cn("h-5 w-5", relatedIsFavorite && "fill-current")} />
                      </Button>
                      <Link href={`/products/${p.slug}`} passHref>
                        <div className="aspect-square relative">
                          <Image src={p.images[0]} alt={p.name} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                        </div>
                      </Link>
                    </CardHeader>
                    <CardContent className="p-4 flex-grow flex flex-col">
                      <h3 className="text-lg font-semibold text-white">
                        <Link href={`/products/${p.slug}`} passHref>
                          {p.name}
                        </Link>
                      </h3>
                      <div className="mt-auto pt-4 flex items-center justify-between">
                        <p className="text-xl font-bold text-primary">${p.price}</p>
                        <Button variant="outline" asChild>
                          <Link href={`/products/${p.slug}`}>View</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

export default function ProductPage() {
  return (
    <Suspense fallback={<ProductPageLoader />}>
      <ProductPageContent />
    </Suspense>
  );
}
