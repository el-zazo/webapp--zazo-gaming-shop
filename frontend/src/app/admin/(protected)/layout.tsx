
'use client';

import { useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { AuthContext } from '@/contexts/auth-context';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Shapes, BookOpen, LayoutDashboard, HelpCircle, Mail, MessageSquare, Quote, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthenticated } = useContext(AuthContext);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && (!isAuthenticated || user?.role !== 'admin')) {
      router.push('/admin/login');
    }
  }, [loading, isAuthenticated, user, router]);

  if (loading || !isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row gap-8">
            <aside className="w-full md:w-64">
                <Skeleton className="h-10 w-full mb-4" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-full mb-2" />
                <Skeleton className="h-8 w-full" />
            </aside>
            <main className="flex-1">
                <Skeleton className="h-12 w-1/3 mb-6" />
                <Skeleton className="h-40 w-full" />
            </main>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/admin', icon: <LayoutDashboard className="h-5 w-5" />, name: 'Dashboard' },
    { href: '/admin/orders', icon: <ShoppingCart className="h-5 w-5" />, name: 'Orders' },
    { href: '/admin/categories', icon: <Shapes className="h-5 w-5" />, name: 'Categories' },
    { href: '/admin/products', icon: <Package className="h-5 w-5" />, name: 'Products' },
    { href: '/admin/guides', icon: <BookOpen className="h-5 w-5" />, name: 'Guides' },
    { href: '/admin/faqs', icon: <HelpCircle className="h-5 w-5" />, name: 'FAQs' },
    { href: '/admin/contact-messages', icon: <Mail className="h-5 w-5" />, name: 'Messages' },
    { href: '/admin/newsletter-subscriptions', icon: <MessageSquare className="h-5 w-5" />, name: 'Subscribers' },
    { href: '/admin/quotes', icon: <Quote className="h-5 w-5" />, name: 'Quotes' },
  ];

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64">
          <h2 className="text-lg font-semibold text-white mb-4">Admin Menu</h2>
          <nav className="flex flex-col space-y-1">
            {navItems.map(item => (
              <Button
                key={item.name}
                variant={pathname.startsWith(item.href) && (item.href !== '/admin' || pathname === '/admin') ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                asChild
              >
                <Link href={item.href}>
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              </Button>
            ))}
          </nav>
        </aside>
        <main className="flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
