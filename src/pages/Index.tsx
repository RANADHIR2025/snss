import { Header } from '@/components/landing/Header';
import { Hero } from '@/components/landing/Hero';
import { About } from '@/components/landing/About';
import { Partners } from '@/components/landing/Partners';
import { Products } from '@/components/landing/Products';
import Testimonials  from '@/components/landing/Testimonials';
import { Footer } from '@/components/landing/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <About />
        <Partners />
        <Products />
        <Testimonials />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
