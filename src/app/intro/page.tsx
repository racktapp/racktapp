'use client';

import * as React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useEmblaCarousel from 'embla-carousel-react';

import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/ui/logo';
import { cn } from '@/lib/utils';

const introSlides = [
  {
    image: {
      src: 'https://placehold.co/800x1200.png',
      hint: 'tennis players shaking hands',
    },
    title: 'Welcome to Rackt',
    description: 'The social hub for racket sports enthusiasts. Challenge friends, track stats, and climb the ranks.',
  },
  {
    image: {
      src: 'https://placehold.co/800x1200.png',
      hint: 'padel players high five',
    },
    title: 'Challenge Anyone, Anywhere',
    description:
      'Directly challenge your friends or post open challenges for the community to accept.',
  },
  {
    image: {
      src: 'https://placehold.co/800x1200.png',
      hint: 'badminton shuttlecock net',
    },
    title: 'Climb the Leaderboard',
    description:
      'Every match updates your RacktRank using a sophisticated ELO system. See how you stack up.',
  },
  {
    image: {
      src: 'https://placehold.co/800x1200.png',
      hint: 'table tennis action',
    },
    title: 'AI-Powered Insights',
    description:
      'Analyze your swing with our AI Coach and get predictions for upcoming matches.',
  },
];

export default function IntroPage() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [scrollSnaps, setScrollSnaps] = React.useState<number[]>([]);

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

  return (
    <div className="relative min-h-screen w-full bg-slate-900">
      <Carousel ref={emblaRef} className="absolute inset-0">
        <CarouselContent>
          {introSlides.map((slide, index) => (
            <CarouselItem key={index} className="relative h-screen w-full">
              <Image
                src={slide.image.src}
                data-ai-hint={slide.image.hint}
                alt={slide.title}
                fill
                className="object-cover"
                priority={index === 0}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent" />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>

      <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-white">
          <Logo className="h-8 w-8" />
          <span className="text-2xl font-headline">Rackt</span>
        </Link>
      </header>
      
      <div className="relative z-10 flex h-screen flex-col items-center justify-end px-6 pb-8 text-center text-white">
        <div className="max-w-md space-y-2">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {introSlides[selectedIndex].title}
            </h1>
            <p className="text-white/80">
                {introSlides[selectedIndex].description}
            </p>
        </div>

        <div className="my-8 flex justify-center gap-2">
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
        
        <div className="w-full max-w-sm space-y-4">
          <Button asChild size="lg" className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="link" size="lg" className="w-full text-white">
            <Link href="/login">Log In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
