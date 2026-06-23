'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Trophy, ArrowUp, ArrowDown, Award as AwardIcon } from 'lucide-react';
import Link from 'next/link';
import { countries } from '@/lib/countries';
import Image from 'next/image';

const getCountry = (name: string) => {
    // Simple logic to assign a country to a mock swimmer
    const hash = name.split('').reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0);
    return countries[Math.abs(hash) % countries.length];
};

const mockResults = [
  { name: 'You', rank: 1, points: 50, time: '01:58.23', country: getCountry('You') },
  { name: 'Swimmer 2', rank: 2, points: 25, time: '02:01.45', country: getCountry('Swimmer 2') },
  { name: 'Swimmer 3', rank: 3, points: -10, time: '02:05.11', country: getCountry('Swimmer 3') },
  { name: 'Swimmer 4', rank: 4, points: -20, time: '02:10.98', country: getCountry('Swimmer 4') },
  { name: 'Swimmer 5', rank: 5, points: -25, time: '02:12.34', country: getCountry('Swimmer 5') },
  { name: 'Swimmer 6', rank: 6, points: -30, time: '02:15.67', country: getCountry('Swimmer 6') },
  { name: 'Swimmer 7', rank: 7, points: -35, time: '02:18.90', country: getCountry('Swimmer 7') },
  { name: 'Swimmer 8', rank: 8, points: -40, time: '02:22.22', country: getCountry('Swimmer 8') },
];


const Podium = ({ winners }: { winners: typeof mockResults}) => (
    <div className="flex justify-center items-end gap-4 mt-8 h-64">
        {/* 2nd Place */}
        <div className="flex flex-col items-center w-1/4">
            <Trophy className="text-gray-400 size-10"/>
            <p className="font-bold">{winners[1].name}</p>
            <div className="flex items-center gap-2">
                <Image src={winners[1].country.flag} alt={winners[1].country.name} width={20} height={15} />
                <span className="text-sm">{winners[1].country.code}</span>
            </div>
            <div className="bg-muted w-full rounded-t-lg text-center p-4 mt-2 h-24 flex items-center justify-center">
                <span className="font-bold text-2xl">2</span>
            </div>
        </div>
        {/* 1st Place */}
        <div className="flex flex-col items-center w-1/4">
            <Trophy className="text-yellow-500 size-14"/>
            <p className="font-bold">{winners[0].name}</p>
             <div className="flex items-center gap-2">
                <Image src={winners[0].country.flag} alt={winners[0].country.name} width={20} height={15} />
                <span className="text-sm">{winners[0].country.code}</span>
            </div>
            <div className="bg-primary w-full rounded-t-lg text-center p-4 mt-2 h-36 flex items-center justify-center">
                <span className="font-bold text-3xl text-primary-foreground">1</span>
            </div>
        </div>
        {/* 3rd Place */}
        <div className="flex flex-col items-center w-1/4">
             <Trophy className="text-orange-400 size-8"/>
             <p className="font-bold">{winners[2].name}</p>
              <div className="flex items-center gap-2">
                <Image src={winners[2].country.flag} alt={winners[2].country.name} width={20} height={15} />
                <span className="text-sm">{winners[2].country.code}</span>
            </div>
             <div className="bg-muted w-full rounded-t-lg text-center p-4 mt-2 h-16 flex items-center justify-center">
                <span className="font-bold text-xl">3</span>
            </div>
        </div>
    </div>
)

export default function DualResultsPage() {
  const topThree = mockResults.slice(0, 3);
  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <AwardIcon className="mx-auto h-24 w-24 text-primary" />
        <h1 className="mt-4 font-headline text-4xl font-bold">Race Finished!</h1>
        <p className="mt-2 text-muted-foreground">Here are the final results and points awarded.</p>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .result-card {
          animation: slide-in 0.5s ease-out forwards;
        }
        @keyframes point-gain {
          from { transform: scale(1); color: hsl(var(--foreground)); }
          to { transform: scale(1.2); color: hsl(var(--chart-2)); }
        }
        @keyframes point-loss {
          from { transform: scale(1); color: hsl(var(--foreground)); }
          to { transform: scale(1.2); color: hsl(var(--destructive)); }
        }
        .points-gain {
          animation: point-gain 0.7s ease-in-out forwards;
          animation-delay: 0.5s;
        }
         .points-loss {
          animation: point-loss 0.7s ease-in-out forwards;
          animation-delay: 0.5s;
        }
      `}</style>
      
      <Card>
        <CardHeader>
          <CardTitle>Finals Podium</CardTitle>
          <CardDescription>Event: 200m Freestyle</CardDescription>
        </CardHeader>
        <CardContent>
            <Podium winners={topThree} />
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Final Standings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mockResults.map((result, index) => (
            <div
              key={index}
              className="result-card flex items-center justify-between p-4 rounded-lg bg-muted"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold w-8 text-center">{result.rank}</span>
                <div>
                  <p className="font-bold text-lg">{result.name}</p>
                  <p className="font-mono text-muted-foreground">{result.time}</p>
                </div>
                 <div className="flex items-center gap-2">
                    <Image src={result.country.flag} alt={result.country.name} width={20} height={15} />
                    <span className="text-sm text-muted-foreground">{result.country.code}</span>
                </div>
              </div>
              <div
                className={`flex items-center gap-1 text-xl font-bold ${
                  result.points > 0 ? 'points-gain' : 'points-loss'
                }`}
              >
                {result.points > 0 ? <ArrowUp className="size-5" /> : <ArrowDown className="size-5" />}
                {result.points > 0 ? `+${result.points}` : result.points}
                <span className="text-sm font-normal ml-1">pts</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Button asChild className="w-full" size="lg">
        <Link href="/">
          <Home className="mr-2" /> Back to Dashboard
        </Link>
      </Button>
    </div>
  );
}
