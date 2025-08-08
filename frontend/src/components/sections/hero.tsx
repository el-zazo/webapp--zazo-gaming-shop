import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-background text-white h-[60vh] md:h-[80vh] min-h-[400px] flex items-center justify-center">
      <Image src="https://placehold.co/1920x1080.png" alt="Dark forest background" layout="fill" objectFit="cover" className="opacity-20" priority />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-transparent"></div>
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-shadow" style={{ textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)" }}>
          Level Up Your Game
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground" style={{ textShadow: "0 1px 2px rgba(0, 0, 0, 0.5)" }}>
          Explore the best gaming hardware and accessories to enhance your gaming experience.
        </p>
        <Button asChild size="lg" className="mt-8 bg-primary text-primary-foreground font-semibold rounded-md px-8 py-6 text-base transition-transform duration-200 ease-in-out hover:scale-105">
          <Link href="/shop">Shop Now</Link>
        </Button>
      </div>
    </section>
  );
}
