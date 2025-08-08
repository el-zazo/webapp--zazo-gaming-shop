"use client";

import { useContext, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, ShoppingCart, Loader2, ArrowLeft } from "lucide-react";
import { CartContext } from "@/contexts/cart-context";
import { useToast } from "@/hooks/use-toast";
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
import { AuthContext } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, loading: isCartLoading } = useContext(CartContext);
  const { isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleUpdateQuantity = async (productId: string, newQuantity: number) => {
    setUpdatingItemId(productId);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item quantity.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (productId: string) => {
    setUpdatingItemId(productId);
    try {
      await removeFromCart(productId);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

  const handleCheckout = () => {
    if (isAuthenticated) {
      router.push("/checkout");
    } else {
      toast({
        title: "Please Log In",
        description: "You need to be logged in to proceed to checkout.",
        variant: "destructive",
      });
      router.push("/login");
    }
  };

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <h1 className="text-3xl font-bold text-white mb-8">Your Shopping Cart</h1>
      {isCartLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : cartItems.length === 0 ? (
        <Card className="text-center py-20 bg-card border-border">
          <ShoppingCart className="mx-auto h-16 w-16 text-muted-foreground" />
          <CardHeader>
            <CardTitle className="text-2xl text-white">Your cart is empty</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Looks like you haven't added anything to your cart yet.</p>
            <Button asChild className="mt-6">
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="text-white">
                  Cart ({cartCount} {cartCount === 1 ? "item" : "items"})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" asChild>
                    <Link href="/shop">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Continue Shopping
                    </Link>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline">Clear Cart</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>This action will permanently remove all items from your cart.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearCart}>Clear Cart</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product._id} className="flex items-center p-4">
                      <Image src={product.images[0]} alt={product.name} width={100} height={100} className="rounded-md object-cover" />
                      <div className="ml-4 flex-grow">
                        <h3 className="font-semibold text-white">
                          <Link href={`/products/${product.slug}`}>{product.name}</Link>
                        </h3>
                        <p className="text-muted-foreground">${product.price.toFixed(2)}</p>
                        {product.stock_quantity !== undefined && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {product.stock_quantity > 0 
                              ? `${product.stock_quantity} available` 
                              : "Out of stock"}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-border rounded-md bg-background">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-r-none" 
                            onClick={() => handleUpdateQuantity(product._id, quantity - 1)}
                            disabled={updatingItemId === product._id || quantity <= 1}
                          >
                            <span className="text-lg font-bold">-</span>
                          </Button>
                          <span className="w-10 text-center">{quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-l-none" 
                            onClick={() => handleUpdateQuantity(product._id, quantity + 1)}
                            disabled={updatingItemId === product._id || (product.stock_quantity !== undefined && quantity >= product.stock_quantity)}
                            title={product.stock_quantity !== undefined && quantity >= product.stock_quantity ? `Maximum stock available: ${product.stock_quantity}` : ""}
                          >
                            <span className="text-lg font-bold">+</span>
                          </Button>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(product._id)} aria-label="Remove item" disabled={updatingItemId === product._id}>
                          {updatingItemId === product._id ? <Loader2 className="h-5 w-5 animate-spin" /> : <Trash2 className="h-5 w-5 text-destructive" />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold text-white">
                  <span>Total</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button size="lg" className="w-full" onClick={handleCheckout}>
                  Proceed to Checkout
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </main>
  );
}
