"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Testimonial {
  _id: string;
  name: string;
  avatar_url?: string;
  quote: string;
  rating: number;
}

const TestimonialSkeleton = () => (
  <Card className="bg-card border-border p-6">
    <CardContent className="text-center p-0 flex flex-col items-center">
      <Skeleton className="mx-auto h-16 w-16 rounded-full" />
      <Skeleton className="mt-4 h-6 w-40" />
      <div className="mt-2 flex justify-center">
        <Skeleton className="h-5 w-28" />
      </div>
      <div className="mt-4 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </CardContent>
  </Card>
);

export default function TestimonialsSection() {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  const plugin = React.useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");
        const response = await axios.get(`${API_BASE_URL}/quotes?no_pagination=true`);
        setTestimonials(response.data.data);
      } catch (error) {
        // console.error("Failed to fetch testimonials", error);
        setTestimonials([]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (!api) {
      return;
    }

    setCurrent(api.selectedScrollSnap());

    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-white mb-12">What Our Gamers Say</h2>
        <Carousel
          setApi={setApi}
          plugins={[plugin.current]}
          className="w-full max-w-2xl mx-auto"
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          opts={{
            loop: true,
          }}
        >
          <CarouselContent>
            {loading ? (
              Array.from({ length: 3 }).map((_, index) => (
                <CarouselItem key={index}>
                  <div className="p-1">
                    <TestimonialSkeleton />
                  </div>
                </CarouselItem>
              ))
            ) : testimonials.length > 0 ? (
              testimonials.map((testimonial) => (
                <CarouselItem key={testimonial._id}>
                  <div className="p-1">
                    <Card className="bg-card border-border p-6">
                      <CardContent className="text-center p-0 flex flex-col items-center">
                        <Avatar className="mx-auto h-16 w-16 border-2 border-primary">
                          <AvatarImage src={testimonial.avatar_url || "https://placehold.co/100x100.png"} alt={testimonial.name} />
                          <AvatarFallback>{testimonial.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <h3 className="mt-4 text-xl font-semibold text-white">{testimonial.name}</h3>
                        <div className="mt-2 flex justify-center text-yellow-400">
                          {[...Array(testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 fill-current" />
                          ))}
                          {[...Array(5 - testimonial.rating)].map((_, i) => (
                            <Star key={i} className="h-5 w-5 text-gray-600 fill-current" />
                          ))}
                        </div>
                        <blockquote className="mt-4 text-base italic text-muted-foreground min-h-[72px]">"{testimonial.quote}"</blockquote>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))
            ) : (
              <CarouselItem>
                <p className="text-center text-muted-foreground">No testimonials yet.</p>
              </CarouselItem>
            )}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
        </Carousel>
        {!loading && testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: testimonials.length }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollTo(index)}
                className={`h-2 w-2 rounded-full transition-all duration-300 ${current === index ? "w-6 bg-primary" : "bg-muted"}`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
