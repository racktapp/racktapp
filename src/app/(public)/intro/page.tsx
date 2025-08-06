
'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const introSlides = [
  {
    imageSrc: '/intro1.1.png',
    title: 'Welcome to Rackt',
    description: 'The social hub for racket sports enthusiasts. Challenge friends, track stats, and climb the ranks.',
  },
  {
    imageSrc: '/intro2.jpg',
    title: 'Challenge Anyone, Anywhere',
    description:
      'Directly challenge your friends or post open challenges for the community to accept.',
  },
  {
    imageSrc: '/intro3.jpg',
    title: 'Climb the Leaderboard',
    description:
      'Every match updates your RacktRank using a sophisticated ELO system. See how you stack up.',
  },
  {
    imageSrc: '/intro4.jpg',
    title: 'AI-Powered Insights',
    description:
      'Analyze your swing with our AI Coach and get predictions for upcoming matches.',
  },
];

export default function IntroPage() {
  const [emblaApi, setEmblaApi] = React.useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

  // New logic to handle redirection for authenticated users
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && user) {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);


  React.useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    emblaApi.on('select', onSelect);
    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);
  
  // If loading or authenticated, show a loading screen to prevent flash of content.
  if (loading || user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner className="h-12 w-12" />
      </div>
    );
  }


  return (
    <div className="relative min-h-screen w-full bg-slate-900">
      <Carousel
        setApi={setEmblaApi}
        opts={{ loop: true }}
        className="absolute inset-0"
      >
        <CarouselContent>
          {introSlides.map((slide, index) => (
            <CarouselItem key={index} className="relative h-screen w-full">
              <Image
                src={slide.imageSrc}
                alt={slide.title}
                fill
                unoptimized
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col">
        <header className="pointer-events-auto flex items-center justify-between p-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-white">
                <Logo className="h-8 w-8" />
                <span className="text-2xl font-headline">Rackt</span>
            </Link>
        </header>

        <div className="flex flex-1 flex-col items-center justify-end px-6 pb-8 text-center text-white">
            <div className="max-w-md space-y-2">
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                    {introSlides[selectedIndex].title}
                </h1>
                <p className="text-white/80">
                    {introSlides[selectedIndex].description}
                </p>
            </div>

            <div className="pointer-events-auto my-8 flex justify-center gap-2">
            {scrollSnaps.map((_, index) => (
                <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={cn(
                    'h-2 w-2 rounded-full transition-all duration-300',
                    index === selectedIndex ? 'w-4 bg-white' : 'bg-white/50'
                )}
                aria-label={`Go to slide ${index + 1}`}
                />
            ))}
            </div>
            
            <div className="pointer-events-auto w-full max-w-sm space-y-4">
            <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">Get Started</Link>
            </Button>
            <Button asChild variant="link" size="lg" className="w-full text-white">
                <Link href="/login">Log In</Link>
            </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
