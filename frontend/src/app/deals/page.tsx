import FeaturedDealsSection from '@/components/sections/featured-deals';

export default function DealsPage() {
  return (
    <main className="flex-grow">
      <div className="py-16 sm:py-20 lg:py-24">
          <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-white tracking-tight">Hot Deals</h1>
              <p className="mt-4 text-lg text-muted-foreground">Don't miss out on our best offers.</p>
          </div>
          <FeaturedDealsSection />
      </div>
    </main>
  );
}
