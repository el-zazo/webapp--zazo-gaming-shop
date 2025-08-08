
'use client';

import Link from 'next/link';
import { Facebook, Twitter, Instagram } from 'lucide-react';
import { DiamondIcon } from '@/components/icons/diamond-icon';
import { useEffect, useState } from 'react';

export default function Footer() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop', href: '/shop' },
    { name: 'Deals', href: '/deals' },
    { name: 'Build a PC', href: '/build-a-pc' },
    { name: 'Guides', href: '/guides' },
    { name: 'Support', href: '/support' },
  ];
  const socialIcons = [
    { icon: Facebook, href: '#', 'aria-label': 'Facebook' },
    { icon: Twitter, href: '#', 'aria-label': 'Twitter' },
    { icon: Instagram, href: '#', 'aria-label': 'Instagram' },
  ];

  return (
    <footer className="bg-background border-t border-border mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold text-white">
            <DiamondIcon className="h-6 w-6 text-primary" />
            <span>GearUp</span>
          </Link>
          <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
            {navLinks.map((link) => (
              <Link key={link.name} href={link.href} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                {link.name}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-4">
            {socialIcons.map((social, index) => (
              <Link key={index} href={social.href} aria-label={social['aria-label']} className="text-muted-foreground hover:text-primary transition-colors">
                <social.icon className="h-6 w-6" />
              </Link>
            ))}
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground flex flex-col sm:flex-row justify-center items-center gap-4">
          <p>&copy; {year || new Date().getFullYear()} GearUp. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-primary transition-colors">Privacy Policy</Link>
            <Link href="/terms-of-service" className="hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
