
'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  ArrowRight,
  Swords,
  Dumbbell,
  Trophy,
} from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Button } from '@/components/ui/button';

const features = [
  {
    title: 'Personal Bests',
    description: 'Track and display your best times for each stroke.',
    href: '/profile?tab=pbs',
    icon: <Trophy className="size-8 text-primary" />,
    imgId: 'dashboard-personal-bests',
  },
  {
    title: 'Dual Mode',
    description: 'Challenge other swimmers to a head-to-head race.',
    href: '/dual',
    icon: <Swords className="size-8 text-primary" />,
    imgId: 'dashboard-dual',
  },
  {
    title: 'Training',
    description: 'View your workout logs and generate new AI-powered workouts.',
    href: '/training/logs',
    icon: <Dumbbell className="size-8 text-primary" />,
    imgId: 'dashboard-workout-generator',
  },
];

export default function DashboardPage() {
  const getImage = (id: string) =>
    PlaceHolderImages.find((img) => img.id === id);
    
  const topFeatures = features.slice(0, 2);
  const bottomFeature = features[2];

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      <div className="lg:w-1/3">
        <h1 className="text-3xl font-bold tracking-tight font-headline text-white">
          Welcome to Dual
        </h1>
        <p className="text-muted-foreground mt-2">
          Your all-in-one portal to challenge swimmers across the globe. No need to stop training. Dual during your main set and see how you rank before swimming in your local swim meet.
        </p>
      </div>
      <div className="lg:w-2/3 flex flex-col gap-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topFeatures.map((feature) => {
              const image = getImage(feature.imgId);
              return (
                <Card
                  key={feature.title}
                  className="group flex flex-col overflow-hidden transition-all hover:shadow-lg"
                >
                  <CardContent className="p-0">
                    <div className="relative aspect-video w-full">
                        {image && (
                          <Image
                            src={image.imageUrl}
                            alt={image.description}
                            data-ai-hint={image.imageHint}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        )}
                    </div>
                  </CardContent>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      {feature.icon}
                      <CardTitle className="font-headline">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="pt-2">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <div className="flex-grow" />
                  <div className="p-6 pt-0">
                    <Button asChild className="w-full">
                      <Link href={feature.href}>
                        Go to {feature.title} <ArrowRight className="ml-2 size-4" />
                      </Link>
                    </Button>
                  </div>
                </Card>
              );
            })}
        </div>
         <Card
          key={bottomFeature.title}
          className="group flex flex-col md:flex-row overflow-hidden transition-all hover:shadow-lg h-full"
        >
          <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto">
            {getImage(bottomFeature.imgId) && (
              <Image
                src={getImage(bottomFeature.imgId)!.imageUrl}
                alt={getImage(bottomFeature.imgId)!.description}
                data-ai-hint={getImage(bottomFeature.imgId)!.imageHint}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
            )}
          </div>
          <div className="flex flex-col flex-1">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {bottomFeature.icon}
                  <CardTitle className="font-headline">{bottomFeature.title}</CardTitle>
                </div>
                <CardDescription className="pt-2">
                  {bottomFeature.description}
                </CardDescription>
              </CardHeader>
              <div className="flex-grow" />
              <div className="p-6 pt-0">
                <Button asChild className="w-full">
                  <Link href={bottomFeature.href}>
                    Go to {bottomFeature.title} <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
