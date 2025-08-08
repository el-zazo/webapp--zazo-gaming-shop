"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LifeBuoy, BookOpen, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

interface Faq {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export default function SupportPage() {
  const contactSectionRef = useRef<HTMLElement>(null);
  const faqSectionRef = useRef<HTMLElement>(null);
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loadingFaqs, setLoadingFaqs] = useState(true);

  // Contact form state
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactMessage, setContactMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const supportCards = [
    {
      icon: <LifeBuoy className="h-8 w-8 text-primary" />,
      title: "Contact Support",
      description: "Get in touch with our expert support team for any questions or issues.",
      buttonText: "Contact Us",
      actionType: "scroll" as const,
      href: contactSectionRef,
    },
    {
      icon: <BookOpen className="h-8 w-8 text-primary" />,
      title: "Knowledge Base",
      description: "Browse our detailed guides and articles to find answers to common questions.",
      buttonText: "Read Articles",
      actionType: "link" as const,
      href: "/guides",
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-primary" />,
      title: "Community Forum",
      description: "Join our community forum to connect with other gamers and share tips.",
      buttonText: "Visit Forum",
      actionType: "link" as const,
      href: "/forum",
    },
  ];

  useEffect(() => {
    const fetchFaqs = async () => {
      setLoadingFaqs(true);
      try {
        if (!API_BASE_URL) throw new Error("API base URL is not configured.");
        const response = await axios.get(`${API_BASE_URL}/faqs?no_pagination=true`);
        setFaqs(response.data.data);
      } catch (error: any) {
        // console.error("Failed to fetch FAQs", error);
        toast({
          title: "Error",
          description: `Failed to load FAQs: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setLoadingFaqs(false);
      }
    };
    fetchFaqs();
  }, [toast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/guides?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!API_BASE_URL) throw new Error("API base URL is not configured.");
      await axios.post(`${API_BASE_URL}/contact-messages`, {
        name: contactName,
        email: contactEmail,
        message: contactMessage,
      });
      toast({
        title: "Message Sent!",
        description: "Thanks for contacting us. We will get back to you shortly.",
      });
      setContactName("");
      setContactEmail("");
      setContactMessage("");
    } catch (error: any) {
      const errorMessage = axios.isAxiosError(error) ? error.response?.data?.error?.message || "Could not send message." : error.message;
      toast({
        title: "Submission Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardButtonClick = (card: (typeof supportCards)[0]) => {
    if (card.actionType === "scroll" && card.href.current) {
      card.href.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <section className="bg-card/50 py-20 text-center">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Support Center</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">How can we help you today?</p>
          <form onSubmit={handleSearchSubmit} className="mt-8 flex w-full max-w-xl mx-auto">
            <label htmlFor="search-support" className="sr-only">
              Search
            </label>
            <Input
              type="search"
              id="search-support"
              name="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-auto min-w-0 appearance-none rounded-l-md border-border bg-background px-4 py-3 text-foreground placeholder-gray-500 focus:z-10 focus:border-primary focus:outline-none focus:ring-primary text-base"
              placeholder="Search our knowledge base..."
            />
            <Button type="submit" className="rounded-r-md bg-primary text-primary-foreground font-semibold px-6 text-base border-0 hover:brightness-110">
              Search
            </Button>
          </form>
        </div>
      </section>

      <section className="py-16 sm:py-20 lg:py-24 bg-background">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {supportCards.map((card) => (
              <Card key={card.title} className="bg-card border-border p-6 flex flex-col items-center justify-center hover:border-primary transition-colors duration-300">
                <div className="bg-primary/10 p-4 rounded-full">{card.icon}</div>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white">{card.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                  <p className="text-muted-foreground">{card.description}</p>
                </CardContent>
                {card.actionType === "link" ? (
                  <Link href={card.href as string} passHref>
                    <Button>{card.buttonText}</Button>
                  </Link>
                ) : (
                  <Button onClick={() => handleCardButtonClick(card)}>{card.buttonText}</Button>
                )}
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section ref={faqSectionRef} id="faq-section" className="py-16 sm:py-20 lg:py-24 bg-card/50 scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Frequently Asked Questions</h2>
          <Accordion type="single" collapsible className="w-full">
            {loadingFaqs
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="border-b border-border py-4">
                    <Skeleton className="h-6 w-3/4" />
                  </div>
                ))
              : faqs.map((faq, index) => (
                  <AccordionItem value={`item-${index + 1}`} key={faq._id}>
                    <AccordionTrigger className="text-lg text-left text-white hover:text-primary">{faq.question}</AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground">{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
          </Accordion>
        </div>
      </section>

      <section ref={contactSectionRef} id="contact-section" className="py-16 sm:py-20 lg:py-24 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-3xl">
          <h2 className="text-3xl font-bold text-center text-white mb-4">Contact Us</h2>
          <p className="text-center text-muted-foreground mb-12">Have a question that's not in the FAQ? Send us a message below.</p>
          <Card className="bg-card border-border">
            <CardContent className="p-6">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Your Name" required disabled={isSubmitting} value={contactName} onChange={(e) => setContactName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Your Email" required disabled={isSubmitting} value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Your message..."
                    className="min-h-[150px]"
                    required
                    disabled={isSubmitting}
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                  />
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Sending..." : "Send Message"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </>
  );
}
