"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cpu, MemoryStick, HardDrive, Video, Cog } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

const components = [
  { name: "Processors (CPU)", icon: <Cpu className="h-10 w-10 text-primary" />, category: "Processors" },
  { name: "Motherboards", icon: <Cog className="h-10 w-10 text-primary" />, category: "Motherboards" },
  { name: "Memory (RAM)", icon: <MemoryStick className="h-10 w-10 text-primary" />, category: "RAM" },
  { name: "Storage", icon: <HardDrive className="h-10 w-10 text-primary" />, category: "Storage" },
  { name: "Graphics Cards", icon: <Video className="h-10 w-10 text-primary" />, category: "Graphics Cards" },
  {
    name: "PC Cases",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M20 18h-2c-1.1 0-2-.9-2-2V8c0-1.1.9-2 2-2h2"></path>
        <path d="M4 6h12"></path>
        <path d="M4 12h12"></path>
        <path d="M4 18h12"></path>
      </svg>
    ),
    category: "PC Cases",
  },
  {
    name: "Power Supplies",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M12 22v-3"></path>
        <path d="M10 12.5v-1.5"></path>
        <path d="m14 12.5-1-1-1 1"></path>
        <path d="M10 19h4"></path>
        <path d="M10 16h.01"></path>
        <path d="M14 16h.01"></path>
        <path d="M22 12V6.5C22 5.2 21 4 19.5 4h-15C3 4 2 5.2 2 6.5V12H10v3.5a2.5 2.5 0 0 1-5 0V12h0"></path>
        <path d="M14 12h8v-1.5a2.5 2.5 0 0 0-5 0V12Z"></path>
      </svg>
    ),
    category: "Power Supplies",
  },
  {
    name: "CPU Coolers",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-primary"
      >
        <path d="M14.2 12a2.5 2.5 0 0 0-3.3 0"></path>
        <path d="M12 17.8a2.5 2.5 0 0 0-3.3 0"></path>
        <path d="M12 6.2a2.5 2.5 0 0 0 3.3 0"></path>
        <path d="m12 12-1.8-1.8"></path>
        <path d="m6.2 12-1.8 1.8"></path>
        <path d="m17.8 12 1.8 1.8"></path>
        <path d="m12 12 1.8 1.8"></path>
        <path d="m12 6.2 1.8-1.8"></path>
        <path d="m6.2 12 1.8-1.8"></path>
        <path d="m17.8 6.2-1.8 1.8"></path>
        <circle cx="12" cy="12" r="10"></circle>
      </svg>
    ),
    category: "CPU Coolers",
  },
];

export default function BuildAPcPage() {
  const componentsSectionRef = useRef<HTMLElement>(null);

  const handleStartBuildingClick = () => {
    componentsSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <section className="relative bg-card/50 py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white">Build Your Dream PC</h1>
          <p className="mt-4 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">Customize your rig from scratch with our powerful PC builder.</p>
          <Button
            size="lg"
            className="mt-8 bg-primary text-primary-foreground font-semibold rounded-md px-8 py-6 text-base transition-transform duration-200 ease-in-out hover:scale-105"
            onClick={handleStartBuildingClick}
          >
            Start Building
          </Button>
        </div>
      </section>
      <section ref={componentsSectionRef} id="components" className="py-16 sm:py-20 lg:py-24 bg-background scroll-mt-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white">Choose Your Components</h2>
            <p className="mt-4 text-lg text-muted-foreground">Select the best parts for your build.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {components.map((component) => (
              <Card key={component.name} className="bg-card border-border text-center p-6 flex flex-col items-center justify-center hover:border-primary transition-colors duration-300">
                {component.icon}
                <h3 className="mt-4 text-lg font-semibold text-white">{component.name}</h3>
                <Link href={`/shop?category=${encodeURIComponent(component.category)}`} passHref>
                  <Button variant="outline" className="mt-4">
                    Select
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>
      <section className="py-16 sm:py-20 lg:py-24 bg-card/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white">Need Help?</h2>
              <p className="mt-4 text-lg text-muted-foreground">Our PC building experts are here to guide you. Check out our guides or contact support for personalized assistance.</p>
              <div className="mt-6 flex gap-4">
                <Link href="/guides" passHref>
                  <Button>Read Guides</Button>
                </Link>
                <Link href="/support" passHref>
                  <Button variant="outline">Contact Support</Button>
                </Link>
              </div>
            </div>
            <div className="flex justify-center">
              <Image src="https://placehold.co/600x400.png" alt="PC Building" width={600} height={400} className="rounded-lg shadow-lg" />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
