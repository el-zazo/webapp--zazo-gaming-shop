
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export function SearchDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      onOpenChange(false);
      // Use router.replace to ensure the URL is updated and the shop page re-renders
      router.replace(`/shop?search=${encodeURIComponent(searchTerm.trim())}`);
      // Don't clear the search term until after navigation
      setTimeout(() => setSearchTerm(''), 100);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-lg">
        <DialogTitle className="sr-only">Search Products</DialogTitle>
        <form onSubmit={handleSearch}>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for products..."
              className="h-14 w-full border-0 bg-transparent pl-12 pr-4 text-white placeholder:text-muted-foreground focus-visible:ring-0"
            />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
