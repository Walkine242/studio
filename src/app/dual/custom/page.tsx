'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { createParty } from '@/lib/services/party-service';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

type Unit = 'meters' | 'yards';
type Stroke = 'Freestyle' | 'Backstroke' | 'Breaststroke' | 'Butterfly' | 'IM';
type RaceType = 'Swim' | 'Kick' | 'Drill';

const STROKES: { name: Stroke; short: string }[] = [
  { name: 'Freestyle', short: 'FR' },
  { name: 'Backstroke', short: 'BK' },
  { name: 'Breaststroke', short: 'BR' },
  { name: 'Butterfly', short: 'FL' },
  { name: 'IM', short: 'IM' },
];

const RACE_TYPES: { name: RaceType; description: string }[] = [
  { name: 'Swim', description: 'Full stroke' },
  { name: 'Kick', description: 'Legs only' },
  { name: 'Drill', description: 'Technique drill' },
];

const METER_DISTANCES = [25, 50, 100, 200, 400, 800, 1500];
const YARD_DISTANCES = [25, 50, 100, 200, 500, 1000, 1650];
// An IM needs one length of each stroke per quarter, so only these distances work.
const IM_DISTANCES = [100, 200, 400];

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

export default function CustomDualPage() {
  const [stroke, setStroke] = useState<Stroke>('Freestyle');
  const [raceType, setRaceType] = useState<RaceType>('Swim');
  const [distance, setDistance] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('meters');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const baseDistances = unit === 'meters' ? METER_DISTANCES : YARD_DISTANCES;
  const distances = stroke === 'IM' ? IM_DISTANCES : baseDistances;
  const unitString = unit === 'meters' ? 'm' : 'yd';

  const eventName = distance
    ? `${distance}${unitString} ${stroke}${raceType !== 'Swim' ? ` ${raceType}` : ''}${selectedEquipment.length > 0 ? ` - with ${selectedEquipment.join(', ')}` : ''}`
    : '';

  const handleEquipmentChange = (equipment: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(item => item !== equipment)
        : [...prev, equipment]
    );
  };

  const handleStrokeChange = (next: Stroke) => {
    setStroke(next);
    if (next === 'IM' && distance && !IM_DISTANCES.includes(Number(distance))) setDistance('');
  };

  const handleUnitChange = (value: string) => {
    setUnit(value as Unit);
    setDistance('');
  };

  const handleCreateParty = async () => {
    if (!distance) {
      toast({
        variant: 'destructive',
        title: 'Select a Distance',
        description: 'You must choose a distance for the custom dual.',
      });
      return;
    }

    setCreating(true);
    try {
      const newParty = await createParty({ event: eventName, isPublic: false });
      toast({
        title: 'Party Created!',
        description: 'Next, invite your friends to the race.',
      });
      router.push(`/dual/invite/${newParty.id}`);
    } catch (error) {
      console.error('Error creating party:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not create a party. Please try again.',
      });
      setCreating(false);
    }
  };

  return (
    <div className="container mx-auto max-w-xl space-y-8">
      <div className="text-center">
        <h1 className="mt-4 font-headline text-3xl font-bold">Create a Custom Dual</h1>
        <p className="mt-2 text-muted-foreground">Set up your own private custom race for friends to join.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Race Settings</CardTitle>
          <CardDescription>
            Choose the stroke, type, distance, and unit for your custom dual. This will create a private party.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={unit} onValueChange={handleUnitChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="meters">Meters</TabsTrigger>
              <TabsTrigger value="yards">Yards</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Stroke</h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {STROKES.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  onClick={() => handleStrokeChange(s.name)}
                  aria-pressed={stroke === s.name}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-lg border px-2 py-3 text-sm transition-colors',
                    stroke === s.name
                      ? 'border-primary bg-primary text-primary-foreground shadow'
                      : 'border-input bg-background hover:bg-muted'
                  )}
                >
                  <span className="text-lg font-extrabold tracking-wider">{s.short}</span>
                  <span className="text-xs">{s.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Race Type</h3>
            <div className="grid grid-cols-3 gap-2">
              {RACE_TYPES.map((t) => (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setRaceType(t.name)}
                  aria-pressed={raceType === t.name}
                  className={cn(
                    'flex flex-col items-center rounded-lg border px-2 py-2 text-sm transition-colors',
                    raceType === t.name
                      ? 'border-primary bg-primary text-primary-foreground shadow'
                      : 'border-input bg-background hover:bg-muted'
                  )}
                >
                  <span className="font-bold">{t.name}</span>
                  <span className="text-xs opacity-80">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Distance</h3>
            <Select onValueChange={setDistance} value={distance}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a distance" />
              </SelectTrigger>
              <SelectContent>
                {distances.map((d) => (
                  <SelectItem key={d} value={d.toString()}>{d} {unitString}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {stroke === 'IM' && (
              <p className="text-xs text-muted-foreground">IM races are 100, 200 or 400 so each stroke gets an equal share.</p>
            )}
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold">Equipment (Optional)</h3>
            <div className="grid grid-cols-2 gap-4">
              {EQUIPMENT_OPTIONS.map((item) => (
                <div key={item} className="flex items-center space-x-2">
                  <Checkbox
                    id={item}
                    onCheckedChange={() => handleEquipmentChange(item)}
                    checked={selectedEquipment.includes(item)}
                  />
                  <Label htmlFor={item} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    {item}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {eventName && (
            <div className="rounded-lg bg-muted p-3 text-center">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Your race</span>
              <p className="font-headline text-lg font-bold">{eventName}</p>
            </div>
          )}

          <Button onClick={handleCreateParty} className="w-full" disabled={creating}>
            <Plus className="mr-2" /> {creating ? 'Creating...' : 'Create Private Party'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
