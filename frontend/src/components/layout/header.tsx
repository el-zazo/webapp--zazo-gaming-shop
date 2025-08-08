
'use client';

import Link from 'next/link';
import { Search, User, ShoppingCart, Menu, X, LogIn, LayoutDashboard, Heart } from 'lucide-react';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { Button } from '@/components/ui/button';
import { useState, useContext } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { SearchDialog } from './search-dialog';
import { AuthContext } from '@/contexts/auth-context';
import { CartContext } from '@/contexts/cart-context';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const navLinks = [
  { name: 'Home', href: '/' },
  { name: 'Shop', href: '/shop' },
  { name: 'Deals', href: '/deals' },
  { name: 'Build a PC', href: '/build-a-pc' },
];

export default function Header() {
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isSearchOpen, setSearchOpen] = useState(false);
  const { user, isAuthenticated, loading, logout } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <DiamondIcon className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold text-white hidden sm:inline-block">GearUp</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="group text-base font-medium text-foreground transition-colors hover:text-primary">
                {link.name}
                <span className="block max-w-0 group-hover:max-w-full transition-all duration-300 h-0.5 bg-primary"></span>
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-foreground hover:text-primary hover:bg-accent transition-colors duration-200" 
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
            >
              <Search className="h-5 w-5" />
            </Button>
            
            {!loading && (
              <>
                {isAuthenticated && user ? (
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar_url || ''} alt={user.username} />
                          <AvatarFallback>{user.username?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                         <Link href="/account">
                          <User className="mr-2 h-4 w-4" />
                          <span>Account</span>
                        </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                         <Link href="/account/orders">
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          <span>My Orders</span>
                        </Link>
                      </DropdownMenuItem>
                       <DropdownMenuItem asChild>
                         <Link href="/favorites">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>Favorites</span>
                        </Link>
                      </DropdownMenuItem>
                       {user.role === 'admin' && (
                        <DropdownMenuItem asChild>
                            <Link href="/admin">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                            </Link>
                        </DropdownMenuItem>
                       )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()}>
                        <LogIn className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button asChild variant="ghost" className="hidden md:flex text-foreground hover:text-primary hover:bg-accent transition-colors duration-200" aria-label="Login">
                    <Link href="/login">
                        <LogIn className="h-5 w-5 mr-2" />
                        <span>Login</span>
                    </Link>
                  </Button>
                )}
              </>
            )}

            <Button asChild variant="ghost" size="icon" className="relative text-foreground hover:text-primary hover:bg-accent transition-colors duration-200" aria-label="Shopping Cart">
              <Link href="/cart">
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {cartCount}
                  </span>
                )}
              </Link>
            </Button>
            <Sheet open={isMenuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:text-primary hover:bg-accent">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full max-w-sm bg-background p-0">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b border-border">
                    <SheetClose asChild>
                      <Link href="/" className="flex items-center gap-2">
                        <DiamondIcon className="h-7 w-7 text-primary" />
                        <span className="text-xl font-bold text-white">GearUp</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon">
                        <X className="h-6 w-6" />
                        <span className="sr-only">Close menu</span>
                      </Button>
                    </SheetClose>
                  </div>
                  <nav className="flex flex-col space-y-4 p-4">
                    {navLinks.map((link) => (
                      <SheetClose asChild key={link.name}>
                        <Link href={link.href} className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                          {link.name}
                        </Link>
                      </SheetClose>
                    ))}
                     {isAuthenticated && user && (
                       <SheetClose asChild>
                        <Link href="/favorites" className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                          Favorites
                        </Link>
                       </SheetClose>
                    )}
                    {!isAuthenticated && !loading && (
                      <SheetClose asChild>
                        <Link href="/login" className="text-lg font-medium text-foreground transition-colors hover:text-primary">
                            Login
                        </Link>
                      </SheetClose>
                    )}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <SearchDialog open={isSearchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
