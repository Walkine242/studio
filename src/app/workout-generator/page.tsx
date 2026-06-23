'use client';
import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { generateWorkout } from '@/ai/flows/workout-generator';
import { Loader2, Wand2, Printer, Download, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { getFriends, type Friend } from '@/lib/friends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';

const EQUIPMENT_OPTIONS = [
  'Buoy',
  'Drag Suit',
  'Fins',
  'Kickboard',
  'Paddles',
  'Parachute',
  'Resistance Bands',
  'Resistance Pulley',
  'Snorkel',
  'Socks',
  'Ankle Band'
];

const workoutSchema = z.object({
  experience: z.string().min(1, 'Experience level is required.'),
  typicalDistance: z.string().min(1, 'Practice distance is required.'),
  currentTrainingPlan: z.string().optional(),
  targetStroke: z.string().optional(),
  equipment: z.array(z.string()).optional(),
});

type WorkoutFormData = z.infer<typeof workoutSchema>;

export default function WorkoutGeneratorPage() {
  const [workout, setWorkout] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const { toast } = useToast();
  const workoutRef = useRef<HTMLDivElement>(null);

  const friends = getFriends();

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      experience: 'intermediate',
      typicalDistance: '2000m',
      currentTrainingPlan: 'N/A',
      targetStroke: 'N/A',
      equipment: [],
    },
  });

  async function onSubmit(values: WorkoutFormData) {
    setIsLoading(true);
    setWorkout(null);
    try {
      const result = await generateWorkout(values);
      setWorkout(result.workout);
    } catch (error) {
      console.error('Error generating workout:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate workout. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (workout) {
      const blob = new Blob([workout.replace(/<br \/>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "")], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'workout.txt';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleSendWorkout = (friend: Friend) => {
    // In a real app, this would trigger a notification for the other user.
    // For now, we'll just show a toast and update the UI state.
    toast({
        title: 'Workout Sent!',
        description: `Your generated workout has been sent to ${friend.name}.`
    });
    setSentInvites(prev => [...prev, friend.id]);
  }

  return (
    <div className="container mx-auto max-w-4xl grid gap-8 lg:grid-cols-2">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Workout Generator</CardTitle>
          <CardDescription>
            Tell us about your swimming, and our AI coach, Coach Mikey, will create a custom
            workout for you.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your experience level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="typicalDistance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Practice Distance</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 2500m" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="targetStroke"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Focus Stroke (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Butterfly" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="equipment"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">Available Equipment</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Select any equipment you have available for the workout.
                      </p>
                    </div>
                    {EQUIPMENT_OPTIONS.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="equipment"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={item}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...(field.value || []), item])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== item
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {item}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currentTrainingPlan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Training Plan (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your current training focus..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Wand2 className="mr-2 h-4 w-4" />
                )}
                Generate Workout
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="lg:pt-16">
        <Card className="shadow-lg sticky top-24 border-8 border-gray-800 dark:border-gray-300 rounded-lg bg-white dark:bg-gray-50 text-gray-800 printable-area">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="font-headline text-2xl text-center font-marker">Your Workout</CardTitle>
            {workout && (
              <div className="flex gap-2 no-print">
                <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Send className="size-5" /></Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Send Workout to a Friend</DialogTitle>
                      <DialogDescription>
                        They will receive this workout as a notification.
                      </DialogDescription>
                    </DialogHeader>
                    <ScrollArea className="max-h-64">
                      <ul className="space-y-3 pr-4">
                        {friends.map(friend => {
                          const isSent = sentInvites.includes(friend.id);
                          return (
                             <li key={friend.id} className="flex items-center justify-between gap-2 p-2 bg-muted rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={friend.avatar} alt={friend.name} />
                                        <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{friend.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Image src={friend.country.flag} alt={friend.country.name} width={16} height={12} />
                                            <span>{friend.country.name}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button size="sm" disabled={isSent} onClick={() => handleSendWorkout(friend)}>
                                    <Send className="mr-2"/> {isSent ? 'Sent' : 'Send'}
                                </Button>
                            </li>
                          )
                        })}
                      </ul>
                    </ScrollArea>
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="icon" onClick={handlePrint}>
                  <Printer className="size-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleDownload}>
                  <Download className="size-5" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="min-h-[400px]">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            {workout && (
               <ScrollArea className="h-[400px] p-4">
                  <div
                    ref={workoutRef}
                    className="font-marker text-lg leading-loose whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ __html: workout.replace(/\n/g, '<br />') }}
                  />
               </ScrollArea>
            )}
            {!workout && !isLoading && (
              <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                <p className="font-marker text-2xl">Your workout plan will appear here.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
