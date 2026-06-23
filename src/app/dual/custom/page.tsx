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

type Unit = 'meters' | 'yards';

const RACE_TYPES = ['Kick', 'Drill', 'Swim'];
const METER_DISTANCES = [25, 50, 100, 200, 400, 800, 1500];
const YARD_DISTANCES = [25, 50, 100, 200, 500, 1000, 1650];

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
  const [event, setEvent] = useState<string>('');
  const [distance, setDistance] = useState<string>('');
  const [unit, setUnit] = useState<Unit>('meters');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleEquipmentChange = (equipment: string) => {
    setSelectedEquipment(prev => 
      prev.includes(equipment) 
        ? prev.filter(item => item !== equipment)
        : [...prev, equipment]
    );
  };

  const handleCreateParty = async () => {
    if (!event) {
      toast({
        variant: 'destructive',
        title: 'Select a Race Type',
        description: 'You must choose a type for the custom dual.',
      });
      return;
    }
    if (!distance) {
      toast({
        variant: 'destructive',
        title: 'Select a Distance',
        description: 'You must choose a distance for the custom dual.',
      });
      return;
    }
    
    const unitString = unit === 'meters' ? 'm' : 'yd';
    const customEvent = `${distance}${unitString} ${event}${selectedEquipment.length > 0 ? ` - with ${selectedEquipment.join(', ')}` : ''}`;


    try {
      const newParty = await createParty({ event: customEvent, isPublic: false });
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
        description: 'Could not create a party. Please try again.',
      });
    }
  };
  
  const handleUnitChange = (value: string) => {
    setUnit(value as Unit);
    setDistance(''); // Reset distance when unit changes
  }

  const distances = unit === 'meters' ? METER_DISTANCES : YARD_DISTANCES;

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
                  Choose the type, distance, and unit for your custom dual. This will create a private party.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                 <Tabs value={unit} onValueChange={handleUnitChange} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="meters">Meters</TabsTrigger>
                        <TabsTrigger value="yards">Yards</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="grid grid-cols-2 gap-4">
                  <Select onValueChange={setDistance} value={distance}>
                      <SelectTrigger>
                          <SelectValue placeholder="Distance" />
                      </SelectTrigger>
                      <SelectContent>
                          {distances.map((d) => (
                          <SelectItem key={d} value={d.toString()}>{d}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                  <Select onValueChange={setEvent} value={event}>
                      <SelectTrigger>
                          <SelectValue placeholder="Race Type" />
                      </SelectTrigger>
                      <SelectContent>
                          {RACE_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                      </SelectContent>
                  </Select>
                </div>

                {event && (
                  <div>
                    <h3 className="mb-4 text-lg font-medium">Select Equipment (Optional)</h3>
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
                )}
                
                <Button onClick={handleCreateParty} className="w-full">
                    <Plus className="mr-2"/> Create Private Party
                </Button>
            </CardContent>
        </Card>
    </div>
  );
}
