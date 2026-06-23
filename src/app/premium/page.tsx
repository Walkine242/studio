
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Lock, Sparkles, Trophy, Users } from 'lucide-react';
import { usePremiumMember } from '@/lib/hooks/use-premium-member';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Link from 'next/link';

const premiumFeatures = [
  {
    title: 'Access Public Swim Meets',
    description: 'Compete against a global pool of swimmers in our scheduled public meets.',
    icon: <Trophy className="text-primary" />,
  },
  {
    title: 'Advanced Leaderboards',
    description: 'See how you stack up with exclusive filters and historical data.',
    icon: <Users className="text-primary" />,
  },
];


export default function PremiumPage() {
  const { isPremium } = usePremiumMember();
  const image = PlaceHolderImages.find((img) => img.id === 'premium-header');

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="relative w-full h-64 rounded-lg overflow-hidden">
        {image && (
          <Image
            src={image.imageUrl}
            alt={image.description}
            data-ai-hint={image.imageHint}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        <div className="absolute bottom-0 left-0 p-8">
          <h1 className="font-headline text-4xl font-bold text-foreground">
            Go Premium
          </h1>
          <p className="text-lg text-muted-foreground">
            Unlock your full potential with Dual Premium.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Premium Features</CardTitle>
          <CardDescription>
            Upgrade to access exclusive features and take your training to the next level.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-6">
            {premiumFeatures.map(feature => (
                 <div key={feature.title} className="flex items-start gap-4">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                        {feature.icon}
                    </div>
                    <div>
                        <h3 className="font-bold">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                 </div>
            ))}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Your Subscription Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
             {isPremium ? (
                <div className="p-4 bg-green-100 dark:bg-green-900/50 rounded-lg flex items-center">
                    <Check className="size-5 text-green-600 dark:text-green-400" />
                    <p className="ml-2 font-medium text-green-800 dark:text-green-200">
                        You are a Premium Member!
                    </p>
                </div>
            ) : (
                 <div className="p-4 bg-yellow-100 dark:bg-yellow-900/50 rounded-lg flex items-center">
                    <Lock className="size-5 text-yellow-600 dark:text-yellow-400" />
                    <p className="ml-2 font-medium text-yellow-800 dark:text-yellow-200">
                        You are currently on the Free plan. Premium features are reserved for the app owner.
                    </p>
                </div>
            )}
            {!isPremium && (
                 <Button asChild variant="link" className="w-full">
                    <Link href="/dual">
                        See locked features in Dual Mode
                    </Link>
                </Button>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
