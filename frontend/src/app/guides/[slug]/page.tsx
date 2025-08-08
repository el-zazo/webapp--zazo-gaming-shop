"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Cpu, BookOpen, Wrench, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Guide {
  _id: string;
  title: string;
  slug: string;
  content: string;
  image_url: string;
  card_image_url?: string;
  category: string;
  description: string;
  created_at: string;
}

const getCategoryIcon = (category: string) => {
  switch (category?.toLowerCase()) {
    case "building":
      return <Wrench className="h-5 w-5 mr-2" />;
    case "components":
      return <Cpu className="h-5 w-5 mr-2" />;
    case "performance":
    default:
      return <BookOpen className="h-5 w-5 mr-2" />;
  }
};

const GuidePageLoader = () => (
  <div>
    <header className="relative bg-card/50 py-20">
      <Skeleton className="absolute inset-0" />
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <Skeleton className="h-6 w-32 mx-auto" />
        <Skeleton className="h-12 w-3/4 mx-auto" />
      </div>
    </header>
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="lg:w-3/4 space-y-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-5/6" />
          <Skeleton className="h-8 w-1/3 mt-8" />
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
        <aside className="lg:w-1/4">
          <Skeleton className="h-10 w-full mb-8" />
          <Skeleton className="h-8 w-1/2 mb-4" />
          <Skeleton className="h-24 w-full" />
        </aside>
      </div>
    </div>
  </div>
);

export default function GuidePage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const [guide, setGuide] = useState<Guide | null>(null);
  const [relatedGuides, setRelatedGuides] = useState<Guide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuideData = async () => {
      setLoading(true);
      if (!API_BASE_URL) {
        // console.error("API base URL is not configured.");
        setLoading(false);
        return;
      }
      try {
        const guideResponse = await axios.post(`${API_BASE_URL}/guides/search`, {
          query: { slug: slug },
        });

        const currentGuide = guideResponse.data.data[0];
        setGuide(currentGuide);

        if (currentGuide && currentGuide.category) {
          const relatedResponse = await axios.post(`${API_BASE_URL}/guides/search`, {
            query: { category: currentGuide.category },
            per_page: 4,
          });
          setRelatedGuides(relatedResponse.data.data.filter((g: Guide) => g._id !== currentGuide._id).slice(0, 3));
        }
      } catch (error) {
        // console.error("Failed to fetch guide data", error);
        setGuide(null);
      } finally {
        setLoading(false);
      }
    };
    if (slug) {
      fetchGuideData();
    }
  }, [slug]);

  if (loading) {
    return <GuidePageLoader />;
  }

  if (!guide) {
    return notFound();
  }

  return (
    <article>
      <header className="relative bg-card/50 py-20">
        <div className="absolute inset-0">
          <Image src={guide.image_url || "https://placehold.co/1200x600.png"} alt={guide.title} fill objectFit="cover" className="opacity-20" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center text-sm text-muted-foreground mb-4">
            {getCategoryIcon(guide.category)}
            <span>{guide.category}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white max-w-4xl mx-auto">{guide.title}</h1>
        </div>
      </header>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col lg:flex-row gap-12">
          <div className="lg:w-3/4">
            <div className="prose prose-invert prose-lg max-w-none text-muted-foreground" dangerouslySetInnerHTML={{ __html: guide.content }} />
          </div>
          <aside className="lg:w-1/4">
            <div className="sticky top-24">
              <Button asChild variant="outline" className="mb-8 w-full">
                <Link href="/guides">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to All Guides
                </Link>
              </Button>
              <h3 className="text-xl font-semibold text-white mb-4">Related Guides</h3>
              <div className="space-y-4">
                {relatedGuides.length > 0 ? (
                  relatedGuides.map((relatedGuide) => (
                    <Card key={relatedGuide.slug} className="bg-card border-border hover:border-primary transition-colors">
                      <CardContent className="p-4">
                        <div className="flex items-center text-sm text-muted-foreground mb-2">
                          {getCategoryIcon(relatedGuide.category)}
                          <span>{relatedGuide.category}</span>
                        </div>
                        <CardTitle className="text-lg font-semibold text-white">
                          <Link href={`/guides/${relatedGuide.slug}`} className="hover:text-primary transition-colors">
                            {relatedGuide.title}
                          </Link>
                        </CardTitle>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No related guides found.</p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </article>
  );
}
