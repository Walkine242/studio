'use client';

import { useState, useRef, useEffect } from 'react';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { generateWorkout, analyzeWorkoutPerformance } from '@/ai/flows/workout-generator';
import { 
  Loader2, 
  Wand2, 
  Printer, 
  Download, 
  Send, 
  Bookmark, 
  BookmarkCheck, 
  Trash2, 
  History,
  Calendar,
  Sparkles,
  Layers,
  Clock,
  Dumbbell,
  Play,
  Pause,
  Activity,
  Heart,
  Flame,
  TrendingUp,
  RotateCcw,
  Smartphone,
  Trophy
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { getFriends, type Friend } from '@/lib/friends';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { saveWorkout, getSavedWorkouts, deleteSavedWorkout, type SavedWorkout } from '@/lib/services/workout-service';
import { useWorkoutLogs } from '@/lib/hooks/use-workout-logs';
import Image from 'next/image';
import {
  useConnectedDevices,
  DEVICE_METADATA,
  type ConnectedDeviceKey,
} from '@/lib/hooks/use-connected-devices';
import { ConnectDeviceModal } from '@/components/connect-device-modal';
import { Badge } from '@/components/ui/badge';
import { Bluetooth, CheckCircle2, Wifi, AlertCircle, X } from 'lucide-react';

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
  duration: z.string().optional(),
  intensity: z.string().optional(),
  basePace: z.string().optional(),
  restInterval: z.string().optional(),
});

type WorkoutFormData = z.infer<typeof workoutSchema>;

export default function WorkoutGeneratorPage() {
  const [workout, setWorkout] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSendDialogOpen, setIsSendDialogOpen] = useState(false);
  const [sentInvites, setSentInvites] = useState<string[]>([]);
  const [savedList, setSavedList] = useState<SavedWorkout[]>([]);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('generator');
  const [selectedHistoryWorkout, setSelectedHistoryWorkout] = useState<SavedWorkout | null>(null);
  const { toast } = useToast();
  const { addWorkoutLog } = useWorkoutLogs();
  const workoutRef = useRef<HTMLDivElement>(null);

  // Practice Mode states
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [practiceStep, setPracticeStep] = useState<'syncing' | 'active' | 'summary'>('syncing');
  const [syncProgress, setSyncProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [recordedLaps, setRecordedLaps] = useState<number>(0);
  const [lapSplits, setLapSplits] = useState<string[]>([]);
  const [activePracticeSet, setActivePracticeSet] = useState<'Warm Up' | 'Main Set' | 'Cool Down'>('Warm Up');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coachAnalysis, setCoachAnalysis] = useState<string | null>(null);

  // Wearable Device Connection Integration
  const { devices, getConnectedList } = useConnectedDevices();
  const [modalDeviceKey, setModalDeviceKey] = useState<ConnectedDeviceKey | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const connectedKeys = getConnectedList();
  const hasConnectedDevice = connectedKeys.length > 0;
  const activeDeviceKey = hasConnectedDevice ? connectedKeys[0] : null;
  const activeDeviceInfo = activeDeviceKey ? devices[activeDeviceKey] : null;
  const activeDeviceMeta = activeDeviceKey ? DEVICE_METADATA[activeDeviceKey] : null;

  const friends = getFriends();

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      experience: 'intermediate',
      typicalDistance: '2000m',
      currentTrainingPlan: 'N/A',
      targetStroke: 'N/A',
      equipment: [],
      duration: '60 minutes',
      intensity: 'aerobic endurance',
      basePace: '1:30',
      restInterval: '15s',
    },
  });

  // Load Saved Library on Mount
  useEffect(() => {
    loadSavedWorkouts();
  }, []);

  // Practice Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPracticeMode && practiceStep === 'active' && !isPaused) {
      timer = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPracticeMode, practiceStep, isPaused]);

  // Syncing screen animation
  useEffect(() => {
    let syncTimer: NodeJS.Timeout;
    if (isPracticeMode && practiceStep === 'syncing') {
      setSyncProgress(0);
      syncTimer = setInterval(() => {
        setSyncProgress((prev) => {
          if (prev >= 100) {
            clearInterval(syncTimer);
            setPracticeStep('active');
            setSecondsElapsed(0);
            setRecordedLaps(0);
            setLapSplits([]);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
    }
    return () => clearInterval(syncTimer);
  }, [isPracticeMode, practiceStep]);

  async function loadSavedWorkouts() {
    try {
      const data = await getSavedWorkouts();
      setSavedList(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function onSubmit(values: WorkoutFormData) {
    setIsLoading(true);
    setWorkout(null);
    setCurrentSavedId(null);
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

  const handleSaveWorkout = async () => {
    if (!workout) return;
    const values = form.getValues();
    try {
      const saved = await saveWorkout({
        workout,
        experience: values.experience,
        typicalDistance: values.typicalDistance,
        targetStroke: values.targetStroke,
        duration: values.duration,
        intensity: values.intensity,
      });
      setCurrentSavedId(saved.id);
      loadSavedWorkouts();
      toast({
        title: 'Workout Saved!',
        description: 'This workout has been added to your local library.',
      });
    } catch (e) {
      console.error(e);
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the workout.',
      });
    }
  };

  const handleDeleteWorkout = async (id: string) => {
    try {
      await deleteSavedWorkout(id);
      if (currentSavedId === id) {
        setCurrentSavedId(null);
      }
      loadSavedWorkouts();
      toast({
        title: 'Deleted',
        description: 'Workout removed from library.',
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handlePrint = (content?: string) => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = (text: string) => {
    const cleanText = text.replace(/<br \/>/g, '\n').replace(/<\/?[^>]+(>|$)/g, "");
    const blob = new Blob([cleanText], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'swim-workout.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendWorkout = (friend: Friend) => {
    toast({
        title: 'Workout Sent!',
        description: `Your generated workout has been sent to ${friend.name}.`
    });
    setSentInvites(prev => [...prev, friend.id]);
  };

  // Practice Mode trigger
  const startPractice = () => {
    setPracticeStep('syncing');
    setIsPracticeMode(true);
    setCoachAnalysis(null);
  };

  // Record a simulated lap split
  const recordLap = () => {
    const targetPaceStr = form.getValues().basePace || '1:30';
    const [min, sec] = targetPaceStr.split(':').map(Number);
    const targetSeconds = (min * 60) + sec;
    // Add random slight variation (-3 to +3 seconds)
    const lapSeconds = targetSeconds + (Math.floor(Math.random() * 7) - 3);
    const lapMin = Math.floor(lapSeconds / 60);
    const lapSec = lapSeconds % 60;
    const formattedSplit = `${lapMin}:${lapSec < 10 ? '0' : ''}${lapSec}`;
    
    setLapSplits((prev) => [...prev, formattedSplit]);
    setRecordedLaps((prev) => prev + 1);
    toast({
      title: `Lap ${recordedLaps + 1} Recorded!`,
      description: `Split: ${formattedSplit} per 100m`,
    });
  };

  // Finish Practice and generate AI feedback
  const finishPractice = async () => {
    setIsPaused(true);
    setPracticeStep('summary');
    setIsAnalyzing(true);

    const values = form.getValues();
    const finalLaps = recordedLaps === 0 ? 10 : recordedLaps;
    const dummySplits = lapSplits.length === 0 ? ['1:29', '1:31', '1:30', '1:28', '1:32'] : lapSplits;
    
    // Calculate average pace from splits
    let totalSec = 0;
    dummySplits.forEach((s) => {
      const [m, sc] = s.split(':').map(Number);
      totalSec += (m * 60) + sc;
    });
    const avgSec = Math.round(totalSec / dummySplits.length);
    const avgPaceStr = `${Math.floor(avgSec / 60)}:${avgSec % 60 < 10 ? '0' : ''}${avgSec % 60}`;

    const activeHr = hasConnectedDevice ? (activeDeviceInfo?.liveHeartRate || 142) : undefined;

    try {
      addWorkoutLog({
        title: `AI Practice Set: ${values.targetStroke || 'Freestyle'} (${values.intensity || 'Endurance'})`,
        date: new Date().toISOString().split('T')[0],
        location: hasConnectedDevice && activeDeviceMeta ? `${activeDeviceMeta.name} Session` : 'Pool Practice (Manual Timer)',
        distance: `${finalLaps * 100}m`,
        duration: formatTime(secondsElapsed) || '45m',
        avgPace: `${avgPaceStr} /100m`,
        source: activeDeviceKey || 'manual',
      });

      const analysis = await analyzeWorkoutPerformance({
        targetPace: values.basePace || '1:30',
        avgPace: avgPaceStr,
        duration: formatTime(secondsElapsed),
        laps: finalLaps,
        avgHeartRate: activeHr,
        strokeFocus: values.targetStroke || 'General',
        splits: dummySplits,
      });
      setCoachAnalysis(analysis.feedback);
    } catch (error) {
      console.error(error);
      setCoachAnalysis("Excellent swim session! You maintained consistent pacing throughout the set and finished strong. Keep working on high elbow catch on your recovery phase.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="container mx-auto max-w-6xl py-4 space-y-6">
        
        {/* Practice Mode Fullscreen Overlay */}
        {isPracticeMode && (
          <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-y-auto">
            
            {/* Step 1: Device Syncing Screen */}
            {practiceStep === 'syncing' && (
              <div className="flex flex-col items-center gap-6 max-w-md text-center bg-slate-900/80 p-8 rounded-2xl border border-slate-800 shadow-2xl">
                {hasConnectedDevice ? (
                  <>
                    <div className="relative size-28 rounded-full border-4 border-dashed border-cyan-400 animate-spin flex items-center justify-center">
                      <Smartphone className="size-12 text-cyan-400 absolute animate-bounce" />
                    </div>
                    <div>
                      <Badge className="bg-cyan-500/20 text-cyan-300 border-cyan-500/30 text-xs mb-2">
                        {activeDeviceInfo?.connectionType === 'bluetooth-le' ? 'Bluetooth LE Stream' : 'Cloud API Telemetry'}
                      </Badge>
                      <h2 className="text-2xl font-bold text-white">Synchronizing Swim Set</h2>
                      <p className="text-slate-300 mt-2 text-sm">
                        Authorizing real-time session telemetry stream from <strong>{activeDeviceMeta?.name}</strong>...
                      </p>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700">
                      <div 
                        className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300"
                        style={{ width: `${syncProgress}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 font-mono">{syncProgress}% Telemetry Stream Ready</span>
                  </>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400">
                      <Clock className="size-12" />
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs">
                        Manual Stopwatch Mode
                      </Badge>
                      <h2 className="text-xl font-bold text-white">No Swim Sensor Connected</h2>
                      <p className="text-slate-400 text-xs">
                        No wearable heart rate sensor or smartwatch is paired. Practice will run in manual stopwatch mode without real-time heart rate telemetry.
                      </p>
                    </div>

                    <div className="flex flex-col w-full gap-2 pt-2">
                      <Button
                        onClick={() => {
                          setModalDeviceKey(null);
                          setIsConnectModalOpen(true);
                        }}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold text-xs h-10 shadow-lg"
                      >
                        <Bluetooth className="mr-2 size-4" /> Connect Wearable Swim Sensor
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPracticeStep('active')}
                        className="w-full border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs h-10"
                      >
                        <Play className="mr-2 size-4 text-emerald-400" /> Start Manual Stopwatch Practice
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Active Practice HUD */}
            {practiceStep === 'active' && (
              <div className="w-full max-w-5xl flex flex-col gap-6">
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <Activity className="size-6 text-orange-500 animate-pulse" />
                    <h2 className="text-xl font-bold uppercase tracking-widest text-orange-400">Dual Live HUD</h2>
                  </div>

                  <div className="flex items-center gap-3">
                    {hasConnectedDevice ? (
                      <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs flex items-center gap-1.5 px-3 py-1">
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        <span>Synced with {activeDeviceMeta?.name}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-xs flex items-center gap-1.5 px-3 py-1">
                        <Clock className="size-3.5 text-amber-400" />
                        <span>Manual Stopwatch Mode (No HR Sensor)</span>
                      </Badge>
                    )}

                    <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                      {activePracticeSet}
                    </span>
                  </div>
                </div>

                <div className="grid gap-8 md:grid-cols-12 items-stretch">
                  {/* Smartwatch Simulator Column */}
                  <div className="md:col-span-5 flex flex-col items-center justify-center bg-black/40 border border-white/10 p-6 rounded-2xl">
                    <div className="relative size-72 rounded-full border-[10px] border-slate-800 bg-slate-900 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                      {/* Pulse Ring (Only if heart rate sensor is connected) */}
                      {hasConnectedDevice && activeDeviceInfo?.liveHeartRate && (
                        <div 
                          className="absolute inset-[-10px] rounded-full border-[10px] border-orange-500/30 transition-all duration-500 animate-ping"
                          style={{ animationDuration: `${60 / ((activeDeviceInfo.liveHeartRate || 140) / 60)}s` }}
                        />
                      )}

                      <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-1">
                        {hasConnectedDevice ? 'Live Telemetry' : 'Stopwatch Timer'}
                      </div>
                      <div className="text-4xl font-mono font-extrabold tracking-widest text-white">
                        {formatTime(secondsElapsed)}
                      </div>
                      
                      {hasConnectedDevice ? (
                        <div className="flex items-center gap-1.5 mt-3 text-red-500 font-bold text-lg">
                          <Heart className="size-5 fill-current animate-pulse" />
                          <span>{activeDeviceInfo?.liveHeartRate || 142} <span className="text-xs text-gray-400">BPM</span></span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 mt-3">
                          <div className="flex items-center gap-1.5 text-gray-500 font-bold text-base">
                            <Heart className="size-4 text-gray-500" />
                            <span className="font-mono text-gray-400">-- <span className="text-xs text-gray-500">BPM</span></span>
                          </div>
                          <span className="text-[10px] text-amber-400/90 font-medium">No Sensor Connected</span>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-400 flex flex-col items-center">
                        <div>Lap Target: <strong className="text-white font-mono">{form.getValues().basePace || '1:30'}</strong></div>
                        <div className="mt-0.5 text-blue-400">Laps: <strong className="text-sm">{recordedLaps}</strong></div>
                      </div>
                    </div>

                    {!hasConnectedDevice && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setModalDeviceKey(null);
                          setIsConnectModalOpen(true);
                        }}
                        className="mt-4 border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 font-semibold text-xs h-8"
                      >
                        <Bluetooth className="size-3.5 mr-1.5" /> Pair Heart Rate Monitor
                      </Button>
                    )}

                    {/* Device HUD Controls */}
                    <div className="flex gap-3 mt-6">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsPaused(!isPaused)} 
                        className="border-white/20 bg-white/5 hover:bg-white/15 text-white text-xs h-9"
                      >
                        {isPaused ? <Play className="mr-1.5 size-3.5" /> : <Pause className="mr-1.5 size-3.5" />}
                        {isPaused ? 'Resume' : 'Pause'}
                      </Button>
                      <Button onClick={recordLap} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-9">
                        Lap Split
                      </Button>
                      <Button onClick={finishPractice} className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs h-9">
                        Finish Workout
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Workout Overview */}
                  <div className="md:col-span-7 flex flex-col justify-between bg-black/30 border border-white/5 p-6 rounded-2xl">
                    <div>
                      <h3 className="text-lg font-bold text-blue-400 mb-2">Practice Overview</h3>
                      <p className="text-sm text-gray-300 leading-relaxed mb-4">
                        Perform the sets as written on the whiteboard. When you complete a lap, click the <strong>Lap Split</strong> button to record your interval pacing splits.
                      </p>
                      
                      {/* Active Workout Whiteboard Preview */}
                      <ScrollArea className="h-64 rounded-lg bg-slate-900 border border-white/10 p-4">
                        <div 
                          className="font-marker text-slate-200 text-base whitespace-pre-wrap leading-loose"
                          dangerouslySetInnerHTML={{ __html: workout ? workout.replace(/\n/g, '<br />') : '' }}
                        />
                      </ScrollArea>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4">
                      <span className="text-xs text-gray-500">Practice pacing: {form.getValues().basePace} per 100m</span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            const sets: ('Warm Up' | 'Main Set' | 'Cool Down')[] = ['Warm Up', 'Main Set', 'Cool Down'];
                            const idx = sets.indexOf(activePracticeSet);
                            setActivePracticeSet(sets[(idx + 1) % sets.length]);
                          }}
                          className="text-gray-400 hover:text-white"
                        >
                          Next Set Focus
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Post-Workout Summary & AI Report */}
            {practiceStep === 'summary' && (
              <div className="w-full max-w-4xl flex flex-col gap-6">
                <div className="text-center">
                  <Trophy className="size-16 text-yellow-500 mx-auto animate-bounce mb-2" />
                  <h2 className="text-3xl font-extrabold text-white">Workout Finished!</h2>
                  <p className="text-blue-200 mt-1">Excellent performance. Here is your practice telemetry report.</p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Total Time</span>
                    <strong className="text-2xl font-mono text-white">{formatTime(secondsElapsed)}</strong>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Laps Completed</span>
                    <strong className="text-2xl font-mono text-white">{recordedLaps === 0 ? 10 : recordedLaps}</strong>
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Avg Heart Rate</span>
                    {hasConnectedDevice ? (
                      <div>
                        <strong className="text-2xl font-mono text-red-400 flex items-center justify-center gap-1">
                          <Heart className="size-4 fill-current" /> {activeDeviceInfo?.liveHeartRate || 142} BPM
                        </strong>
                        <span className="text-[10px] text-emerald-400 font-medium block mt-0.5">Synced via {activeDeviceMeta?.brand}</span>
                      </div>
                    ) : (
                      <div>
                        <strong className="text-2xl font-mono text-gray-400 flex items-center justify-center gap-1">
                          -- BPM
                        </strong>
                        <span className="text-[10px] text-amber-400/80 font-medium block mt-0.5">No Sensor Connected</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-center">
                    <span className="text-xs uppercase text-gray-400 font-bold block mb-1">Est. Calories</span>
                    <strong className="text-2xl font-mono text-orange-400 flex items-center justify-center gap-1">
                      <Flame className="size-4 fill-current" /> {Math.round((secondsElapsed * (hasConnectedDevice ? 0.16 : 0.12)))} kcal
                    </strong>
                    <span className="text-[10px] text-gray-400 font-medium block mt-0.5">
                      {hasConnectedDevice ? 'From Telemetry' : 'Manual Estimate'}
                    </span>
                  </div>
                </div>

                {/* AI Performance Analysis Section */}
                <div className="grid gap-6 md:grid-cols-12">
                  {/* Left Column: Recorded Splits */}
                  <div className="md:col-span-5 bg-white/5 p-6 rounded-xl border border-white/10">
                    <h3 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
                      <TrendingUp className="size-4" /> Lap Split Times
                    </h3>
                    <ScrollArea className="h-64 pr-2">
                      <ul className="space-y-2">
                        {(lapSplits.length === 0 ? ['1:29', '1:31', '1:30', '1:28', '1:32'] : lapSplits).map((split, i) => (
                          <li key={i} className="flex justify-between items-center text-sm bg-white/5 p-2 rounded border border-white/5 font-mono">
                            <span className="text-gray-400">Lap {i + 1}</span>
                            <span className="text-white font-bold">{split} /100m</span>
                          </li>
                        ))}
                      </ul>
                    </ScrollArea>
                  </div>

                  {/* Right Column: AI Analysis Output */}
                  <div className="md:col-span-7 bg-slate-50 text-slate-800 p-6 rounded-xl border-8 border-slate-700 dark:border-slate-800 shadow-xl flex flex-col justify-stretch">
                    <h3 className="font-marker text-2xl text-slate-900 border-b-2 border-slate-200 pb-2 mb-4">
                      COACH MIKEY'S PERFORMANCE REVIEW
                    </h3>
                    
                    <div className="flex-1 min-h-[200px] overflow-y-auto">
                      {isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                          <p className="font-marker text-slate-500">Coach Mikey is reviewing the telemetry...</p>
                        </div>
                      ) : (
                        <div 
                          className="font-marker text-slate-800 leading-relaxed whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: coachAnalysis || '' }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex justify-center mt-4">
                  <Button onClick={() => setIsPracticeMode(false)} className="bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 px-8 py-6 text-lg font-bold">
                    Close Practice Summary
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="text-orange-500 animate-pulse size-8" />
              Dual Workout Hub
            </h1>
            <p className="text-blue-200 mt-1">
              Generate state-of-the-art custom workouts or browse your saved training library.
            </p>
          </div>

          <TabsList className="bg-black/40 border border-white/10 p-1">
            <TabsTrigger value="generator" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
              <Wand2 className="mr-2 size-4" /> Coach Mikey
            </TabsTrigger>
            <TabsTrigger value="library" className="data-[state=active]:bg-primary data-[state=active]:text-white text-gray-300">
              <History className="mr-2 size-4" /> Workout Library ({savedList.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="generator" className="mt-0">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Form Card */}
            <Card className="lg:col-span-5 bg-black/60 border-white/10 text-white backdrop-blur-md shadow-2xl">
              <CardHeader>
                <CardTitle className="font-headline text-2xl text-blue-400">Workout Builder</CardTitle>
                <CardDescription className="text-gray-400">
                  Define your training targets, and Coach Mikey will write an optimized set for you.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="experience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-300">Experience Level</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-white/10 text-white">
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
                            <FormLabel className="text-blue-300">Target Distance</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 2500m" className="bg-white/5 border-white/10 text-white" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-300">Workout Duration</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="30 minutes">30 Minutes</SelectItem>
                                <SelectItem value="45 minutes">45 Minutes</SelectItem>
                                <SelectItem value="60 minutes">60 Minutes</SelectItem>
                                <SelectItem value="90 minutes">90 Minutes</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="intensity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-300">Workout Focus</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select intensity" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="recovery">Recovery</SelectItem>
                                <SelectItem value="aerobic endurance">Aerobic Endurance</SelectItem>
                                <SelectItem value="threshold/sprint">Threshold / Sprint</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="basePace"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-300">Base Pace (per 100m)</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select pace" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="1:15">1:15 min</SelectItem>
                                <SelectItem value="1:30">1:30 min</SelectItem>
                                <SelectItem value="1:45">1:45 min</SelectItem>
                                <SelectItem value="2:00">2:00 min</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="restInterval"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-blue-300">Preferred Rest</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue placeholder="Select rest" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-gray-900 border-white/10 text-white">
                                <SelectItem value="10s">10 seconds</SelectItem>
                                <SelectItem value="15s">15 seconds</SelectItem>
                                <SelectItem value="30s">30 seconds</SelectItem>
                                <SelectItem value="45s">45 seconds</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="targetStroke"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-300">Stroke Focus</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Butterfly, Freestyle, Individual Medley" className="bg-white/5 border-white/10 text-white" {...field} />
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
                          <div>
                            <FormLabel className="text-blue-300 text-sm">Pool Equipment Available</FormLabel>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 bg-white/5 p-3 rounded-lg border border-white/5 max-h-40 overflow-y-auto">
                            {EQUIPMENT_OPTIONS.map((item) => (
                              <FormField
                                key={item}
                                control={form.control}
                                name="equipment"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={item}
                                      className="flex flex-row items-center space-x-2 space-y-0"
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
                                          className="border-white/30"
                                        />
                                      </FormControl>
                                      <span className="text-xs text-gray-300 font-normal">
                                        {item}
                                      </span>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentTrainingPlan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-blue-300">Extra Details / Goals (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add specific instructions for Coach Mikey..."
                              className="bg-white/5 border-white/10 text-white h-20 resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" disabled={isLoading} className="w-full bg-gradient-to-r from-blue-600 to-orange-500 hover:from-blue-700 hover:to-orange-600 text-white font-bold transition-all duration-300 py-6 text-lg">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Writing on whiteboard...
                        </>
                      ) : (
                        <>
                          <Wand2 className="mr-2 h-5 w-5" />
                          Ask Coach Mikey
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Whiteboard Output */}
            <div className="lg:col-span-7 flex flex-col justify-stretch">
              <Card className="flex-1 shadow-2xl border-8 border-slate-700 dark:border-slate-800 rounded-xl bg-slate-50 text-slate-800 flex flex-col printable-area min-h-[500px]">
                <CardHeader className="flex flex-row items-center justify-between border-b-2 border-slate-200 pb-3 bg-white rounded-t-lg">
                  <div className="flex items-center gap-2">
                    <div className="size-4 rounded-full bg-blue-500 animate-pulse" />
                    <CardTitle className="font-headline text-2xl font-marker tracking-wide text-slate-900">
                      COACH MIKEY'S WHITEBOARD
                    </CardTitle>
                  </div>
                  {workout && (
                    <div className="flex gap-1 no-print">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={startPractice}
                        className="hover:bg-slate-100 text-green-600 font-bold"
                        title="Start Practice Mode"
                      >
                        <Play className="size-5 text-green-600 animate-pulse fill-current" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleSaveWorkout}
                        disabled={!!currentSavedId}
                        className="hover:bg-slate-100 text-slate-700"
                        title="Save to Library"
                      >
                        {currentSavedId ? <BookmarkCheck className="size-5 text-green-600" /> : <Bookmark className="size-5" />}
                      </Button>
                      <Dialog open={isSendDialogOpen} onOpenChange={setIsSendDialogOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-slate-100 text-slate-700" title="Send to Swimmer"><Send className="size-5" /></Button>
                        </DialogTrigger>
                        <DialogContent className="bg-gray-900 border-white/10 text-white">
                          <DialogHeader>
                            <DialogTitle>Send Workout to a Friend</DialogTitle>
                            <DialogDescription className="text-gray-400">
                              They will receive this workout as a notification.
                            </DialogDescription>
                          </DialogHeader>
                          <ScrollArea className="max-h-64 mt-2">
                            <ul className="space-y-3 pr-4">
                              {friends.map(friend => {
                                const isSent = sentInvites.includes(friend.id);
                                return (
                                   <li key={friend.id} className="flex items-center justify-between gap-2 p-2 bg-white/5 rounded-lg border border-white/5">
                                      <div className="flex items-center gap-3">
                                          <Avatar>
                                              <AvatarImage src={friend.avatar} alt={friend.name} />
                                              <AvatarFallback>{friend.name.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <div>
                                              <p className="font-medium text-white">{friend.name}</p>
                                              <div className="flex items-center gap-2 text-sm text-gray-400">
                                                  <Image src={friend.country.flag} alt={friend.country.name} width={16} height={12} />
                                                  <span>{friend.country.name}</span>
                                              </div>
                                          </div>
                                      </div>
                                      <Button size="sm" variant={isSent ? 'outline' : 'default'} disabled={isSent} onClick={() => handleSendWorkout(friend)}>
                                          <Send className="mr-1 size-3"/> {isSent ? 'Sent' : 'Send'}
                                      </Button>
                                  </li>
                                )
                              })}
                            </ul>
                          </ScrollArea>
                        </DialogContent>
                      </Dialog>

                      <Button variant="ghost" size="icon" onClick={() => handlePrint()} className="hover:bg-slate-100 text-slate-700" title="Print Workout">
                        <Printer className="size-5" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(workout)} className="hover:bg-slate-100 text-slate-700" title="Download Text">
                        <Download className="size-5" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="flex-1 flex flex-col p-6 min-h-[400px] justify-center bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                  {isLoading && (
                    <div className="flex flex-col items-center justify-center gap-3 py-16">
                      <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                      <p className="font-marker text-xl text-slate-500 animate-pulse">Squeegeeing the board...</p>
                    </div>
                  )}
                  {workout && !isLoading && (
                     <ScrollArea className="flex-1 h-[400px] pr-2">
                        <div
                          ref={workoutRef}
                          className="font-marker text-slate-800 text-lg leading-relaxed whitespace-pre-wrap selection:bg-blue-200"
                          dangerouslySetInnerHTML={{ __html: workout.replace(/\n/g, '<br />') }}
                        />
                     </ScrollArea>
                  )}
                  {!workout && !isLoading && (
                    <div className="text-center text-slate-400 py-16 flex flex-col items-center justify-center gap-4">
                      <div className="size-16 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                        <Wand2 className="size-8" />
                      </div>
                      <p className="font-marker text-2xl">Board is clean.<br/>Configure your set and click generate!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="library" className="mt-0">
          {savedList.length === 0 ? (
            <Card className="bg-black/60 border-white/10 text-white backdrop-blur-md p-12 text-center flex flex-col items-center justify-center gap-4">
              <div className="size-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400">
                <History className="size-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold">No Saved Workouts</h3>
                <p className="text-gray-400 mt-1 max-w-sm mx-auto">
                  Once you generate a workout with Coach Mikey, save it to access it in your library anytime.
                </p>
              </div>
              <Button onClick={() => setActiveTab('generator')} className="mt-2">
                Generate a Workout
              </Button>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {savedList.map((item) => (
                <Card key={item.id} className="bg-black/60 border-white/10 text-white backdrop-blur-sm flex flex-col justify-between hover:border-blue-500/50 transition-all duration-300 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold uppercase tracking-wider">
                          <Clock className="size-3" /> {item.duration || '60 mins'} • {item.intensity || 'Aerobic'}
                        </div>
                        <CardTitle className="text-lg font-bold text-white mt-1 group-hover:text-blue-400 transition-colors">
                          Focus: {item.targetStroke !== 'N/A' ? item.targetStroke : 'General'}
                        </CardTitle>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleDeleteWorkout(item.id)}
                        className="text-gray-400 hover:text-red-500 hover:bg-white/5 size-8 rounded-full"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    <div className="space-y-2 text-sm text-gray-300">
                      <div className="flex items-center gap-2">
                        <Layers className="size-3.5 text-blue-400" />
                        <span>Level: <strong className="text-white capitalize">{item.experience}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Dumbbell className="size-3.5 text-blue-400" />
                        <span>Distance: <strong className="text-white">{item.typicalDistance}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="size-3.5 text-blue-400" />
                        <span>Saved: <strong className="text-white">{new Date(item.date).toLocaleDateString()}</strong></span>
                      </div>
                    </div>
                  </CardContent>
                  <div className="p-4 pt-0 border-t border-white/5 flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="secondary" size="sm" className="flex-1 bg-white/10 text-white hover:bg-white/20" onClick={() => {
                          setSelectedHistoryWorkout(item);
                          setWorkout(item.workout);
                        }}>
                          Open Workout
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-slate-50 text-slate-800 border-none max-w-2xl min-h-[500px] flex flex-col p-0">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-white rounded-t-lg">
                          <div>
                            <DialogTitle className="font-marker text-2xl text-slate-900">
                              Saved Set - {item.targetStroke !== 'N/A' ? item.targetStroke : 'General Swim'}
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 text-xs mt-1">
                              Level: {item.experience} | Distance: {item.typicalDistance} | Focus: {item.intensity} ({item.duration})
                            </DialogDescription>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setWorkout(item.workout);
                              startPractice();
                            }} className="hover:bg-slate-100 text-green-600" title="Start Practice">
                              <Play className="size-5 fill-current" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handlePrint()} className="hover:bg-slate-100 text-slate-700">
                              <Printer className="size-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDownload(item.workout)} className="hover:bg-slate-100 text-slate-700">
                              <Download className="size-5" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex-1 p-6 overflow-y-auto bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:16px_16px]">
                          <div 
                            className="font-marker text-slate-800 text-lg leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: item.workout.replace(/\n/g, '<br />') }}
                          />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </div>
      <ConnectDeviceModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        deviceKey={modalDeviceKey}
      />
    </Tabs>
  );
}
