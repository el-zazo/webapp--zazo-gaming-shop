import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Rocket, LifeBuoy, BadgePercent, ShieldCheck } from 'lucide-react';

const features = [
  {
    icon: <Rocket className="h-8 w-8 text-primary" />,
    title: 'Fast Shipping',
    description: 'Get your gear at lightspeed. We offer fast and reliable shipping to get you back in the game.',
  },
  {
    icon: <LifeBuoy className="h-8 w-8 text-primary" />,
    title: 'Top-Tier Support',
    description: "Our team of gaming experts is here to help you with any questions or issues. We've got your back.",
  },
  {
    icon: <BadgePercent className="h-8 w-8 text-primary" />,
    title: 'Exclusive Deals',
    description: 'Access the best deals and exclusive offers on the latest gaming hardware and accessories.',
  },
  {
    icon: <ShieldCheck className="h-8 w-8 text-primary" />,
    title: 'Quality Guaranteed',
    description: 'We stand by our products. All our gear is tested and certified to ensure the best quality.',
  },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-card/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white">Why GameGear?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            We're more than just a store. We're your ultimate partner in gaming.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature) => (
            <Card key={feature.title} className="bg-card text-center border-border hover:border-primary transition-colors duration-300">
              <CardHeader className="items-center">
                <div className="bg-primary/10 p-4 rounded-full">
                  {feature.icon}
                </div>
              </CardHeader>
              <CardContent>
                <CardTitle className="text-xl font-semibold text-white mb-2">{feature.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
