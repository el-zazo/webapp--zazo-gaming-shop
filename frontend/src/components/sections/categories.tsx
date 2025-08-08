"use client";

import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { useState, useEffect } from "react";
import axios from "axios";
import { Skeleton } from "../ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Category {
  _id: string;
  name: string;
  image_url: string;
  slug: string;
}

const CategorySkeleton = () => (
  <div className="flex flex-col items-center">
    <Skeleton className="h-[112px] w-[150px] sm:h-[135px] sm:w-[180px] md:h-[120px] md:w-[160px] lg:h-[150px] lg:w-[200px]" />
    <Skeleton className="h-6 w-24 mt-4" />
  </div>
);

export default function CategoriesSection() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");
        const response = await axios.get(`${API_BASE_URL}/categories?no_pagination=true`);
        setCategories(response.data.data);
      } catch (error) {
        // console.error("Failed to fetch categories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  return (
    <section id="categories" className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-12">Explore Our Categories</h2>
        <Carousel
          opts={{
            align: "start",
            loop: !loading && categories.length > 5,
          }}
          className="w-full"
        >
          <CarouselContent>
            {loading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <CategorySkeleton />
                  </CarouselItem>
                ))
              : categories.map((category) => (
                  <CarouselItem key={category.name} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <Link href={`/shop?category=${encodeURIComponent(category.name)}`} className="group block">
                      <Card className="overflow-hidden bg-card border-border shadow-md transition-transform duration-300 ease-in-out group-hover:scale-105">
                        <div className="aspect-w-4 aspect-h-3">
                          <Image src={category.image_url || "https://placehold.co/400x300.png"} alt={category.name} width={400} height={300} className="object-cover w-full h-full" />
                        </div>
                      </Card>
                      <h3 className="mt-4 text-lg font-semibold text-center text-white">{category.name}</h3>
                    </Link>
                  </CarouselItem>
                ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex left-4" />
          <CarouselNext className="hidden sm:flex right-4" />
        </Carousel>
      </div>
    </section>
  );
}
