
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const statusMessages = [
    'Connecting to Race...',
    'Syncing with Server...',
    'Finalizing Handshake...',
    'Good luck!',
];

export default function ConnectingPage({ params }: { params: { partyId: string } }) {
    const router = useRouter();
    const { partyId } = params;
    const [statusIndex, setStatusIndex] = useState(0);
    const image = PlaceHolderImages.find(img => img.id === 'connecting-background');

    useEffect(() => {
        const statusTimer = setInterval(() => {
            setStatusIndex(prevIndex => {
                if (prevIndex < statusMessages.length - 1) {
                    return prevIndex + 1;
                }
                return prevIndex;
            });
        }, 1200);

        const redirectTimer = setTimeout(() => {
            if (partyId) {
                router.push(`/dual/lobby/${partyId}`);
            }
        }, 5000); // 5 seconds total

        return () => {
            clearInterval(statusTimer);
            clearTimeout(redirectTimer);
        };
    }, [router, partyId]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center bg-background">
            <div className="w-full max-w-md h-48 bg-primary/10 rounded-lg overflow-hidden relative group">
                {image && (
                    <Image
                      src={image.imageUrl}
                      alt={image.description}
                      data-ai-hint={image.imageHint}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                )}
                 <div className="absolute inset-0 bg-black/40" />
                 <div className="absolute inset-x-0 bottom-4 text-center">
                    <p className="text-lg font-semibold text-white drop-shadow-md">
                        {statusMessages[statusIndex]}
                    </p>
                </div>
            </div>
            <h1 className="mt-8 text-3xl font-bold font-headline tracking-tight">
                Preparing Your Race
            </h1>
            <p className="mt-2 text-muted-foreground">
                Please wait while we get everything ready for you.
            </p>
            <Loader2 className="mt-6 h-8 w-8 animate-spin text-primary" />
        </div>
    );
}
