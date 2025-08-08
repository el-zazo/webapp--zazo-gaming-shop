"use client";

import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

import { AuthContext } from "@/contexts/auth-context";
import { CartContext } from "@/contexts/cart-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CreditCard, Home, Info, Lock, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const shippingSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  address: z.string().min(5, "Address is required"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  zip_code: z.string().min(3, "ZIP code is required"),
  country: z.string().min(2, "Country is required"),
});

type ShippingFormValues = z.infer<typeof shippingSchema>;

const CheckoutLoader = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2">
      <div className="space-y-8">
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    </div>
    <div className="lg:col-span-1">
      <Skeleton className="h-96 w-full rounded-lg" />
    </div>
  </div>
);

export default function CheckoutPage() {
  const { user, token, loading: authLoading, isAuthenticated } = useContext(AuthContext);
  const { cartItems, cartTotal, loading: cartLoading, clearCart } = useContext(CartContext);
  const router = useRouter();
  const { toast } = useToast();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const form = useForm<ShippingFormValues>({
    resolver: zodResolver(shippingSchema),
    defaultValues: {
      name: user?.username || "",
      address: "",
      city: "",
      state: "",
      zip_code: "",
      country: "",
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({ title: "Authentication required", description: "Please log in to proceed to checkout.", variant: "destructive" });
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router, toast]);

  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && !orderPlaced) {
      toast({ title: "Your cart is empty", description: "Add some items to your cart before checking out.", variant: "destructive" });
      router.push("/shop");
    }
  }, [cartLoading, cartItems, router, toast, orderPlaced]);

  useEffect(() => {
    if (user) {
      form.setValue("name", user.username);
    }
  }, [user, form]);

  const isLoading = authLoading || cartLoading;

  // Helper function to check product stock availability
  const checkStockAvailability = async (productId: string, requestedQuantity: number): Promise<{ available: boolean; availableQuantity: number; productName: string }> => {
    try {
      // Fetch the latest product data to get current stock
      const response = await axios.post(`${API_BASE_URL}/products/search`, {
        query: { _id: productId },
        no_pagination: true,
      });

      if (response.data.data && response.data.data.length > 0) {
        const product = response.data.data[0];
        const availableStock = product.stock_quantity || 0;

        return {
          available: availableStock >= requestedQuantity,
          availableQuantity: availableStock,
          productName: product.name,
        };
      }
      return { available: false, availableQuantity: 0, productName: "Unknown Product" };
    } catch (error) {
      // console.error("Failed to check product stock:", error);
      return { available: false, availableQuantity: 0, productName: "Unknown Product" };
    }
  };

  const handlePlaceOrder = async (data: ShippingFormValues) => {
    setIsPlacingOrder(true);
    if (!user || !token) {
      toast({ title: "Error", description: "You must be logged in to place an order.", variant: "destructive" });
      setIsPlacingOrder(false);
      return;
    }

    // Final stock check before placing the order
    let stockValid = true;
    const stockErrors: string[] = [];

    // Check each item's stock availability
    for (const item of cartItems) {
      const { available, availableQuantity, productName } = await checkStockAvailability(item.product._id, item.quantity);

      if (!available) {
        stockValid = false;
        stockErrors.push(`Only ${availableQuantity} units of ${productName} are available (you requested ${item.quantity}).`);
      }
    }

    // If any stock issues were found, show error and stop order placement
    if (!stockValid) {
      toast({
        title: "Stock Changed",
        description: `Some items in your cart are no longer available in the requested quantity: ${stockErrors.join(" ")}`,
        variant: "destructive",
      });
      setIsPlacingOrder(false);
      return;
    }

    const orderPayload = {
      user_id: user._id,
      items: cartItems.map((item) => ({
        product_id: item.product._id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
      })),
      total_amount: cartTotal,
      shipping_address: data,
      payment_details: {
        method: "Credit Card",
      },
    };

    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");

      // Create the order
      const orderResponse = await axios.post(`${API_BASE_URL}/orders`, orderPayload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Update stock quantities for each product
      // console.log("Starting stock updates for all items");

      try {
        const updateStockPromises = cartItems.map(async (item) => {
          try {
            // console.log(`Checking current stock for product ${item.product._id}`);
            // Get the current stock quantity from the server
            const { availableQuantity } = await checkStockAvailability(item.product._id, 0);
            // console.log(`Current stock for ${item.product.name}: ${availableQuantity}, will reduce by ${item.quantity}`);

            // Update the stock quantity by setting the new value
            const newQuantity = availableQuantity - item.quantity;

            // Ensure we don't set negative stock
            const finalQuantity = Math.max(0, newQuantity);
            // console.log(`Updating stock for ${item.product.name} to ${finalQuantity}`);
            // console.log(`API endpoint: ${API_BASE_URL}/products/${item.product._id}`);
            // console.log(`Request payload:`, { quantity: finalQuantity });

            try {
              const updateResponse = await axios.put(
                `${API_BASE_URL}/products/${item.product._id}`,
                {
                  stock_quantity: finalQuantity, // Use stock_quantity field instead of quantity
                },
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              // console.log(`Stock update response for ${item.product.name}:`, updateResponse.data);
              return updateResponse;
            } catch (updateError) {
              // console.error(`Error in stock update API call for ${item.product.name}:`, updateError);
              // console.error(`Response status:`, updateError.response?.status);
              // console.error(`Response data:`, updateError.response?.data);

              // Check if it's a 404 error (endpoint not found)
              if (updateError.response?.status === 404) {
                // console.log(`Trying alternative endpoint format for ${item.product.name}`);
                // Try alternative endpoint format
                const altResponse = await axios.put(
                  `${API_BASE_URL}/products/${item.product._id}/update-stock`,
                  {
                    stock_quantity: finalQuantity,
                  },
                  {
                    headers: { Authorization: `Bearer ${token}` },
                  }
                );
                // console.log(`Alternative endpoint stock update response:`, altResponse.data);
                return altResponse;
              }

              throw updateError; // Re-throw to be caught by the outer catch
            }
          } catch (error) {
            // console.error(`Error updating stock for product ${item.product._id}:`, error);
            throw error; // Re-throw to be caught by Promise.all
          }
        });

        // Wait for all stock updates to complete
        // console.log("Waiting for all stock updates to complete");
        try {
          await Promise.all(updateStockPromises);
          // console.log("All stock updates completed successfully");
        } catch (error) {
          // console.error("Error during stock updates:", error);
          throw error; // Re-throw to be caught by the main try-catch
        }
      } catch (stockUpdateError) {
        // console.error("Fatal error during stock updates:", stockUpdateError);
        toast({
          title: "Stock Update Error",
          description: "There was an error updating product stock quantities. Please contact support.",
          variant: "destructive",
        });
        // Continue with order confirmation even if stock updates fail
        // This ensures the order is still placed even if stock updates fail
        // console.log("Continuing with order confirmation despite stock update errors");
      }

      setOrderPlaced(true);
      await clearCart();

      toast({
        title: "Order Placed!",
        description: "Thank you for your purchase.",
      });

      router.push("/order-confirmation");
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || "Could not place order. Please check your details." : error.message;
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-8">
          <Skeleton className="h-8 w-40" />
        </div>
        <CheckoutLoader />
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/cart">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Cart
          </Link>
        </Button>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handlePlaceOrder)} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Home className="h-6 w-6" /> Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="123 Gaming Lane" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Megapolis" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State / Province</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="California" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="zip_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ZIP / Postal Code</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="90210" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="country"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="United States" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <CreditCard className="h-6 w-6" /> Payment Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <FormLabel htmlFor="card-number">Card Number</FormLabel>
                    <Input id="card-number" placeholder="**** **** **** 1234" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <FormLabel htmlFor="expiry">Expiry Date</FormLabel>
                      <Input id="expiry" placeholder="MM / YY" />
                    </div>
                    <div>
                      <FormLabel htmlFor="cvc">CVC</FormLabel>
                      <Input id="cvc" placeholder="123" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="bg-card border-border sticky top-24">
              <CardHeader>
                <CardTitle className="text-white">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cartItems.map(({ product, quantity }) => (
                    <div key={product._id} className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Image src={product.images[0]} alt={product.name} width={64} height={64} className="rounded-md object-cover" />
                        <div>
                          <p className="font-semibold text-white">{product.name}</p>
                          <p className="text-sm text-muted-foreground">Qty: {quantity}</p>
                        </div>
                      </div>
                      <p className="text-white">${(product.price * quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Taxes</span>
                    <span>Calculated at next step</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span>${cartTotal.toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-secondary p-3 rounded-md">
                  <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <p>
                    Your personal data will be used to process your order, support your experience throughout this website, and for other purposes described in our{" "}
                    <Link href="/privacy-policy" className="underline hover:text-primary">
                      privacy policy
                    </Link>
                    .
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" size="lg" className="w-full" disabled={isPlacingOrder}>
                  {isPlacingOrder ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  {isPlacingOrder ? "Placing Order..." : "Place Order"}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </main>
  );
}
