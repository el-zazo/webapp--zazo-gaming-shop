
import HeroSection from '@/components/sections/hero';
import CategoriesSection from '@/components/sections/categories';
import FeaturedDealsSection from '@/components/sections/featured-deals';
import WhyChooseUsSection from '@/components/sections/why-choose-us';
import TestimonialsSection from '@/components/sections/testimonials';
import NewsletterSection from '@/components/sections/newsletter';


export default function Home() {
  return (
    <>
      <HeroSection />
      <CategoriesSection />
      <FeaturedDealsSection />
      <WhyChooseUsSection />
      <TestimonialsSection />
      <NewsletterSection />
    </>
  );
}
