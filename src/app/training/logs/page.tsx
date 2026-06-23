
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AppleIcon } from '@/components/icons/apple';
import { FitbitIcon } from '@/components/icons/fitbit';
import { History, Watch, ArrowRight, MapPin } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWorkoutLogs } from '@/lib/hooks/use-workout-logs';
import { Loader2 } from 'lucide-react';

const SourceIcon = ({ source }: { source: string }) => {
  switch (source) {
    case 'apple-watch':
      return <AppleIcon className="size-5" />;
    case 'form-goggles':
      return <Watch className="size-5" />;
    case 'garmin':
    case 'suunto':
    case 'polar':
    case 'wahoo':
    case 'coros':
        return <Watch className="size-5" />;
    case 'fitbit':
        return <FitbitIcon className="size-5" />;
    default:
      return null;
  }
};

export default function WorkoutLogsPage() {
    const { workoutLogs, isInitialized } = useWorkoutLogs({});

  return (
    <div className="container mx-auto max-w-4xl space-y-8">
      <div className="text-center">
        <h1 className="font-headline text-3xl font-bold flex items-center justify-center gap-3">
          <History />
          Workout Logs
        </h1>
        <p className="text-muted-foreground mt-2">
          Your complete history of training sessions and workouts.
        </p>
      </div>

       <Card>
        <CardHeader>
          <CardTitle>Connect Devices</CardTitle>
          <CardDescription>
            Automatically sync your swim workouts by connecting your favorite devices.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex-1">
                <AppleIcon className="mr-2" /> Connect Apple
            </Button>
             <Button variant="outline" className="flex-1">
                <Watch className="mr-2" /> Connect FORM
            </Button>
            <Button variant="outline" className="flex-1">
                <Watch className="mr-2" /> Connect Garmin
            </Button>
             <Button variant="outline" className="flex-1">
                <FitbitIcon className="mr-2" /> Connect Fitbit
            </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workout History</CardTitle>
          <CardDescription>
            Review your past workouts and track your progress over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Distance</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Avg. Pace</TableHead>
                <TableHead className="text-center">Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!isInitialized ? (
                 <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
              ) : (
                workoutLogs.map((log) => (
                    <TableRow key={log.id} className="group">
                    <TableCell>
                        {new Date(log.date).toLocaleDateString(undefined, {
                        timeZone: 'UTC',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        })}
                    </TableCell>
                    <TableCell className="font-medium">{log.title}</TableCell>
                    <TableCell>{log.location}</TableCell>
                    <TableCell>{log.distance}</TableCell>
                    <TableCell>{log.duration}</TableCell>
                    <TableCell className="font-mono">{log.avgPace}</TableCell>
                    <TableCell className="text-center">
                        <Badge variant="outline" className="flex items-center justify-center gap-2">
                        <SourceIcon source={log.source} />
                        <span className="capitalize">{log.source.replace('-', ' ')}</span>
                        </Badge>
                    </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
       <div className="text-center">
            <Button asChild variant="link">
                <Link href="/workout-generator">
                    Need a workout? Try our AI Generator <ArrowRight className="ml-2"/>
                </Link>
            </Button>
        </div>
    </div>
  );
}
