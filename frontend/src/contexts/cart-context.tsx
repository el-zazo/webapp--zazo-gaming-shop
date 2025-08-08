
'use client';

import React, { createContext, useState, useEffect, ReactNode, useContext, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { AuthContext } from './auth-context';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const LOCAL_STORAGE_CART_KEY = 'guestCart';

interface Product {
    _id: string;
    name: string;
    price: number;
    images: string[];
    slug: string;
    stock_quantity?: number;
}

interface CartItem {
    product_id: string;
    product: Product;
    quantity: number;
}

interface ServerCart {
    _id: string;
    user_id: string;
    items: {
        product_id: string;
        quantity: number;
        price_at_add: number;
    }[];
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: Product, quantity: number) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    updateQuantity: (productId: string, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartCount: number;
    cartTotal: number;
    loading: boolean;
}

export const CartContext = createContext<CartContextType>({
    cartItems: [],
    addToCart: async () => {},
    removeFromCart: async () => {},
    updateQuantity: async () => {},
    clearCart: async () => {},
    cartCount: 0,
    cartTotal: 0,
    loading: true,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [serverCart, setServerCart] = useState<ServerCart | null>(null);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user, token, loading: authLoading, isAuthenticated } = useContext(AuthContext);

    const fetchProductDetails = async (itemData: { product_id: string, quantity: number }[]): Promise<CartItem[]> => {
        if (itemData.length === 0) return [];
        const productIds = itemData.map(item => item.product_id);
        
        try {
            const response = await axios.post(`${API_BASE_URL}/products/search`, {
                query: { _id: { $in: productIds } },
                no_pagination: true,
            });
            const products = response.data.data;
            const productMap = new Map(products.map((p: Product) => [p._id, p]));
            
            return itemData.map(item => ({
                product_id: item.product_id,
                product: productMap.get(item.product_id)!,
                quantity: item.quantity,
            })).filter(item => item.product); // Filter out items where product details couldn't be fetched
        } catch (error) {
            // console.error("Failed to fetch product details for cart", error);
            toast({ title: 'Error', description: 'Could not load some cart item details.', variant: 'destructive'});
            return [];
        }
    };
    
    // Effect to handle user login/logout and initial load
    useEffect(() => {
        const syncCart = async () => {
            setLoading(true);
            if (isAuthenticated && user && token) {
                // User is logged in
                try {
                    const response = await axios.post(`${API_BASE_URL}/carts/search`, { query: { user_id: user._id } }, { headers: { Authorization: `Bearer ${token}` } });
                    const serverCartData = response.data.data[0] || null;
                    setServerCart(serverCartData);
                    
                    const localCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY) || '[]');
                    
                    if (serverCartData && localCart.length > 0) {
                        // Merge local cart into server cart
                        const updatedItems = [...serverCartData.items];
                        localCart.forEach((localItem: any) => {
                            const existingItemIndex = updatedItems.findIndex(item => item.product_id === localItem.product._id);
                            if (existingItemIndex > -1) {
                                updatedItems[existingItemIndex].quantity += localItem.quantity;
                            } else {
                                updatedItems.push({ product_id: localItem.product._id, quantity: localItem.quantity, price_at_add: localItem.product.price });
                            }
                        });
                        
                        const mergedCartResponse = await axios.put(`${API_BASE_URL}/carts/${serverCartData._id}`, { items: updatedItems }, { headers: { Authorization: `Bearer ${token}` } });
                        const finalCart = mergedCartResponse.data.data;
                        setServerCart(finalCart);
                        setCartItems(await fetchProductDetails(finalCart.items));
                        localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
                    } else if (serverCartData) {
                         setCartItems(await fetchProductDetails(serverCartData.items));
                    } else if (localCart.length > 0) {
                        // User has no server cart, create one from local cart
                        const newCartItems = localCart.map((item: any) => ({
                            product_id: item.product._id,
                            quantity: item.quantity,
                            price_at_add: item.product.price
                        }));
                        const newCartResponse = await axios.post(`${API_BASE_URL}/carts`, { user_id: user._id, items: newCartItems }, { headers: { Authorization: `Bearer ${token}` } });
                        const newServerCart = newCartResponse.data.data;
                        setServerCart(newServerCart);
                        setCartItems(await fetchProductDetails(newServerCart.items));
                        localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
                    } else {
                        // No server cart, no local cart
                        setCartItems([]);
                    }
                } catch (error) {
                    // console.error("Failed to sync cart:", error);
                    toast({ title: 'Error', description: 'Could not sync your shopping cart.', variant: 'destructive'});
                    setCartItems([]);
                }
            } else {
                // Guest user
                const guestCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY) || '[]');
                const guestCartItems = guestCart.map((item: any) => ({
                    product_id: item.product._id,
                    product: item.product,
                    quantity: item.quantity
                }));
                setCartItems(guestCartItems);
                setServerCart(null);
            }
            setLoading(false);
        };

        if (!authLoading) {
            syncCart();
        }
    }, [isAuthenticated, user, token, authLoading, toast]);


    // Helper function to check product stock availability
    const checkStockAvailability = async (productId: string, requestedQuantity: number): Promise<{available: boolean, availableQuantity: number, productName: string}> => {
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
                    productName: product.name
                };
            }
            return { available: false, availableQuantity: 0, productName: 'Unknown Product' };
        } catch (error) {
            // console.error("Failed to check product stock:", error);
            return { available: false, availableQuantity: 0, productName: 'Unknown Product' };
        }
    };

    // Helper function to get current cart quantity for a product
    const getCurrentCartQuantity = (productId: string): number => {
        const existingCartItem = cartItems.find(item => item.product_id === productId);
        return existingCartItem ? existingCartItem.quantity : 0;
    };

    const addToCart = async (product: Product, quantity: number) => {
        // Check stock availability including what's already in cart
        const currentCartQuantity = getCurrentCartQuantity(product._id);
        const totalRequestedQuantity = currentCartQuantity + quantity;
        
        const { available, availableQuantity, productName } = await checkStockAvailability(product._id, totalRequestedQuantity);
        
        if (!available) {
            toast({
                title: 'Insufficient Stock',
                description: `Only ${availableQuantity} units of ${productName} are available. You already have ${currentCartQuantity} in your cart.`,
                variant: 'destructive'
            });
            return;
        }
        
        if (isAuthenticated && user && token) {
            // Logged-in user logic
            const currentItems = serverCart ? [...serverCart.items] : [];
            const existingItemIndex = currentItems.findIndex(item => item.product_id === product._id);
            
            if (existingItemIndex > -1) {
                currentItems[existingItemIndex].quantity += quantity;
            } else {
                currentItems.push({ product_id: product._id, quantity, price_at_add: product.price });
            }

            let updatedCart;
            if (serverCart) {
                const response = await axios.put(`${API_BASE_URL}/carts/${serverCart._id}`, { items: currentItems }, { headers: { Authorization: `Bearer ${token}` } });
                updatedCart = response.data.data;
            } else {
                const response = await axios.post(`${API_BASE_URL}/carts`, { user_id: user._id, items: currentItems }, { headers: { Authorization: `Bearer ${token}` } });
                updatedCart = response.data.data;
            }
            setServerCart(updatedCart);
            setCartItems(await fetchProductDetails(updatedCart.items));

        } else {
            // Guest user logic
            const currentGuestCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY) || '[]');
            const existingItem = currentGuestCart.find((item: any) => item.product._id === product._id);
            let newItems;
            if (existingItem) {
                newItems = currentGuestCart.map((item: any) =>
                    item.product._id === product._id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newItems = [...currentGuestCart, { product, quantity }];
            }
            localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
            setCartItems(newItems.map((item: any) => ({ product_id: item.product._id, ...item })));
        }
        toast({
            title: 'Added to Cart',
            description: `${quantity} x ${product.name} has been added.`,
        });
    };

    const updateCart = async (productId: string, newQuantity: number, isRemoval: boolean = false) => {
        // If removing or setting quantity to 0, no need to check stock
        if (newQuantity <= 0 || isRemoval) {
            if (isAuthenticated && serverCart && token) {
                const updatedItems = serverCart.items
                    .filter(item => item.product_id !== productId || newQuantity > 0);

                const response = await axios.put(`${API_BASE_URL}/carts/${serverCart._id}`, { items: updatedItems }, { headers: { Authorization: `Bearer ${token}` } });
                const updatedCart = response.data.data;
                setServerCart(updatedCart);
                setCartItems(await fetchProductDetails(updatedCart.items));
            } else {
                const currentGuestCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY) || '[]');
                const newItems = currentGuestCart.filter((item: any) => item.product._id !== productId);
                localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
                setCartItems(newItems.map((item: any) => ({ product_id: item.product._id, ...item })));
            }

            if (isRemoval) {
                const removedItem = cartItems.find(item => item.product._id === productId);
                if(removedItem) {
                    toast({
                        title: 'Removed from Cart',
                        description: `${removedItem.product.name} has been removed.`,
                        variant: 'destructive'
                    });
                }
            }
            return;
        }

        // Check stock availability for the new quantity
        const { available, availableQuantity, productName } = await checkStockAvailability(productId, newQuantity);
        
        if (!available) {
            toast({
                title: 'Insufficient Stock',
                description: `Only ${availableQuantity} units of ${productName} are available.`,
                variant: 'destructive'
            });
            return;
        }
        
        if (isAuthenticated && serverCart && token) {
            const updatedItems = serverCart.items
                .map(item => item.product_id === productId ? { ...item, quantity: newQuantity } : item)
                .filter(item => item.quantity > 0);

            const response = await axios.put(`${API_BASE_URL}/carts/${serverCart._id}`, { items: updatedItems }, { headers: { Authorization: `Bearer ${token}` } });
            const updatedCart = response.data.data;
            setServerCart(updatedCart);
            setCartItems(await fetchProductDetails(updatedCart.items));
        } else {
            const currentGuestCart = JSON.parse(localStorage.getItem(LOCAL_STORAGE_CART_KEY) || '[]');
            const newItems = currentGuestCart.map((item: any) =>
                item.product._id === productId ? { ...item, quantity: newQuantity } : item
            );
            localStorage.setItem(LOCAL_STORAGE_CART_KEY, JSON.stringify(newItems));
            setCartItems(newItems.map((item: any) => ({ product_id: item.product._id, ...item })));
        }

        toast({
            title: 'Cart Updated',
            description: `Quantity updated to ${newQuantity}.`,
        });
    };
    
    const removeFromCart = (productId: string) => updateCart(productId, 0, true);
    const updateQuantity = (productId: string, quantity: number) => updateCart(productId, quantity, false);

    const clearCart = async () => {
         if (isAuthenticated && serverCart && token) {
            await axios.delete(`${API_BASE_URL}/carts/${serverCart._id}`, { headers: { Authorization: `Bearer ${token}` } });
            setServerCart(null);
            setCartItems([]);
         } else {
            localStorage.removeItem(LOCAL_STORAGE_CART_KEY);
            setCartItems([]);
         }
         toast({
            title: 'Cart Cleared',
            description: 'All items have been removed from your cart.',
        });
    };

    const cartCount = cartItems.length;
    const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cartItems,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            cartCount,
            cartTotal,
            loading
        }}>
            {children}
        </CartContext.Provider>
    );
};
