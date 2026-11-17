'use client';

import { useState } from 'react';
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
import {
  History,
  Watch,
  ArrowRight,
  MapPin,
  RefreshCw,
  Plus,
  CheckCircle2,
  Wifi,
  WifiOff,
  Activity,
  Sparkles,
  Smartphone,
  Clock,
  Radio,
  Sliders
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWorkoutLogs } from '@/lib/hooks/use-workout-logs';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  useConnectedDevices,
  DEVICE_METADATA,
  type ConnectedDeviceKey
} from '@/lib/hooks/use-connected-devices';
import { ConnectDeviceModal } from '@/components/connect-device-modal';

const PRESET_WEARABLE_ACTIVITIES = [
  {
    title: 'Morning Swim Practice - 4,000m Main Set',
    source: 'apple-watch' as ConnectedDeviceKey,
    location: 'Aquatic Center (50m Pool)',
    distance: '4,000 m',
    duration: '1h 05m',
    avgPace: '1:18 /100m',
  },
  {
    title: 'FORM Smart Goggles - Interval & Threshold Practice',
    source: 'form-goggles' as ConnectedDeviceKey,
    location: 'University Natatorium (25yd)',
    distance: '3,500 yd',
    duration: '52m 30s',
    avgPace: '1:14 /100yd',
  },
  {
    title: 'Garmin Swim 2 - Open Water Endurance Practice',
    source: 'garmin' as ConnectedDeviceKey,
    location: 'Lake Open Water 2.5k',
    distance: '2,500 m',
    duration: '42m 15s',
    avgPace: '1:24 /100m',
  },
  {
    title: 'Fitbit Sense 2 - Sprint & Kick Practice',
    source: 'fitbit' as ConnectedDeviceKey,
    location: 'YMCA Pool (25yd)',
    distance: '2,800 yd',
    duration: '45m 00s',
    avgPace: '1:20 /100yd',
  },
  {
    title: 'Polar Vantage V3 - VO2 Max Swim Practice',
    source: 'polar' as ConnectedDeviceKey,
    location: 'Olympic Training Pool',
    distance: '3,200 m',
    duration: '50m 10s',
    avgPace: '1:16 /100m',
  },
];

const SourceIcon = ({ source }: { source: string }) => {
  switch (source) {
    case 'apple-watch':
      return <AppleIcon className="size-4" />;
    case 'form-goggles':
      return <Watch className="size-4 text-cyan-400" />;
    case 'garmin':
    case 'suunto':
    case 'polar':
    case 'coros':
      return <Watch className="size-4 text-emerald-400" />;
    case 'fitbit':
      return <FitbitIcon className="size-4 text-sky-400" />;
    default:
      return <Activity className="size-4 text-orange-400" />;
  }
};

export default function WorkoutLogsPage() {
  const { workoutLogs, isInitialized, addWorkoutLog } = useWorkoutLogs({});
  const { toast } = useToast();
  const { devices, getConnectedList } = useConnectedDevices();

  const [modalDeviceKey, setModalDeviceKey] = useState<ConnectedDeviceKey | null>(null);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);

  const [isSyncDialogOpen, setIsSyncDialogOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [activeSyncTab, setActiveSyncTab] = useState<'wearable' | 'manual'>('wearable');

  // Manual Form States
  const [manualTitle, setManualTitle] = useState('');
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualLocation, setManualLocation] = useState('Competition Pool (50m)');
  const [manualDistance, setManualDistance] = useState('3,000 m');
  const [manualDuration, setManualDuration] = useState('48m');
  const [manualPace, setManualPace] = useState('1:20 /100m');
  const [manualSource, setManualSource] = useState('apple-watch');

  const handleOpenConnectModal = (key: ConnectedDeviceKey) => {
    setModalDeviceKey(key);
    setIsConnectModalOpen(true);
  };

  const activeConnectedKeys = getConnectedList();
  const availableSyncActivities = PRESET_WEARABLE_ACTIVITIES.filter(
    (act) => devices[act.source]?.connected
  );

  const handleSyncPresetActivity = (activity: typeof PRESET_WEARABLE_ACTIVITIES[0]) => {
    setIsSyncing(true);
    setSyncProgress(0);
    const interval = setInterval(() => {
      setSyncProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          addWorkoutLog({
            title: activity.title,
            date: new Date().toISOString().split('T')[0],
            location: activity.location,
            distance: activity.distance,
            duration: activity.duration,
            avgPace: activity.avgPace,
            source: activity.source,
          });
          setIsSyncing(false);
          setIsSyncDialogOpen(false);
          toast({
            title: 'Wearable Activity Synced!',
            description: `Successfully imported "${activity.title}" from your ${DEVICE_METADATA[activity.source]?.name || 'device'}.`,
          });
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const handleSaveManualPractice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle.trim()) {
      toast({
        variant: 'destructive',
        title: 'Title Required',
        description: 'Please enter a practice or activity title.',
      });
      return;
    }

    addWorkoutLog({
      title: manualTitle,
      date: manualDate || new Date().toISOString().split('T')[0],
      location: manualLocation || 'Local Pool',
      distance: manualDistance || '2,500 m',
      duration: manualDuration || '45m',
      avgPace: manualPace || '1:20 /100m',
      source: manualSource,
    });

    toast({
      title: 'Practice Activity Logged!',
      description: `Recorded "${manualTitle}" to your training history.`,
    });

    setManualTitle('');
    setIsSyncDialogOpen(false);
  };

  const allDeviceKeys: ConnectedDeviceKey[] = [
    'garmin',
    'apple-watch',
    'form-goggles',
    'fitbit',
    'polar',
    'suunto',
    'coros',
  ];

  return (
    <div className="container mx-auto max-w-5xl space-y-8 py-4">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 p-6 rounded-2xl border border-blue-500/20 shadow-xl">
        <div>
          <h1 className="font-headline text-3xl font-extrabold flex items-center gap-3 text-white">
            <History className="size-8 text-cyan-400" />
            Workout & Practice Logs
          </h1>
          <p className="text-blue-200/80 mt-1 text-sm">
            Sync wearable swim devices (Garmin, Apple Watch, FORM Goggles, Fitbit, Polar) and manage your practice history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-cyan-500/20">
                <RefreshCw className="mr-2 size-4" />
                Sync Wearable / Record Practice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 text-white border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="size-5 text-cyan-400" />
                  Sync Wearables & Record Practice
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Import recorded swim workouts directly from your authorized wearable sensors or manually log your practice sets.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeSyncTab} onValueChange={(val) => setActiveSyncTab(val as any)} className="w-full mt-2">
                <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800">
                  <TabsTrigger value="wearable" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                    <Wifi className="mr-2 size-4" /> Wearable Auto Sync
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                    <Plus className="mr-2 size-4" /> Record Practice Set
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wearable" className="space-y-4 pt-4">
                  {isSyncing ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-4">
                      <div className="relative size-16 rounded-full border-4 border-dashed border-cyan-400 animate-spin flex items-center justify-center">
                        <Smartphone className="size-8 text-cyan-400" />
                      </div>
                      <p className="text-cyan-300 font-semibold">Fetching telemetry from paired device...</p>
                      <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-xs">
                        <div className="bg-gradient-to-r from-cyan-400 to-blue-500 h-full transition-all duration-300" style={{ width: `${syncProgress}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{syncProgress}% Complete</span>
                    </div>
                  ) : availableSyncActivities.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Recent Activities Ready to Sync from Connected Devices</p>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {availableSyncActivities.map((activity, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-cyan-500/50 transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <SourceIcon source={activity.source} />
                                <span className="font-bold text-sm text-slate-100">{activity.title}</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-400">
                                <span><MapPin className="inline size-3 mr-1" />{activity.location}</span>
                                <span><Clock className="inline size-3 mr-1" />{activity.duration}</span>
                                <span className="font-mono text-cyan-400">{activity.distance} @ {activity.avgPace}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleSyncPresetActivity(activity)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                            >
                              Sync Now
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 px-4 rounded-xl border border-slate-800 bg-slate-900/40 space-y-3">
                      <WifiOff className="size-10 text-slate-500 mx-auto" />
                      <h4 className="font-bold text-slate-200 text-base">No Wearable Swim Devices Connected</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        You have not paired any swim devices yet. Connect your Garmin, Apple Watch, or FORM Goggles below to enable telemetry syncing.
                      </p>
                      <div className="flex flex-wrap justify-center gap-2 pt-2">
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsSyncDialogOpen(false);
                            handleOpenConnectModal('garmin');
                          }}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
                        >
                          <Watch className="mr-1.5 size-3.5" /> Connect Garmin
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsSyncDialogOpen(false);
                            handleOpenConnectModal('apple-watch');
                          }}
                          className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
                        >
                          <AppleIcon className="mr-1.5 size-3.5" /> Connect Apple Watch
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsSyncDialogOpen(false);
                            handleOpenConnectModal('form-goggles');
                          }}
                          className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs"
                        >
                          <Watch className="mr-1.5 size-3.5" /> Connect FORM Goggles
                        </Button>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="manual" className="pt-4">
                  <form onSubmit={handleSaveManualPractice} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2 space-y-1">
                        <Label htmlFor="title">Practice / Activity Title</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Morning Masters Practice - 10x100 Freestyles"
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="date">Date</Label>
                        <Input
                          id="date"
                          type="date"
                          value={manualDate}
                          onChange={(e) => setManualDate(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="source">Wearable / Recording Source</Label>
                        <Select value={manualSource} onValueChange={setManualSource}>
                          <SelectTrigger className="bg-slate-900 border-slate-800 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-900 border-slate-800 text-white">
                            <SelectItem value="garmin">Garmin Connect</SelectItem>
                            <SelectItem value="apple-watch">Apple Watch</SelectItem>
                            <SelectItem value="form-goggles">FORM Smart Swim Goggles</SelectItem>
                            <SelectItem value="fitbit">Fitbit / Google Fit</SelectItem>
                            <SelectItem value="polar">Polar Flow</SelectItem>
                            <SelectItem value="suunto">Suunto</SelectItem>
                            <SelectItem value="coros">Coros</SelectItem>
                            <SelectItem value="manual">Manual Entry</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="location">Location / Facility</Label>
                        <Input
                          id="location"
                          placeholder="e.g., YMCA Pool 25yd"
                          value={manualLocation}
                          onChange={(e) => setManualLocation(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="distance">Total Distance</Label>
                        <Input
                          id="distance"
                          placeholder="e.g., 3,500 m"
                          value={manualDistance}
                          onChange={(e) => setManualDistance(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="duration">Duration</Label>
                        <Input
                          id="duration"
                          placeholder="e.g., 55m"
                          value={manualDuration}
                          onChange={(e) => setManualDuration(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="pace">Average Pace</Label>
                        <Input
                          id="pace"
                          placeholder="e.g., 1:18 /100m"
                          value={manualPace}
                          onChange={(e) => setManualPace(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-white"
                        />
                      </div>
                    </div>
                    <DialogFooter className="pt-2">
                      <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold text-white">
                        Record Practice Activity
                      </Button>
                    </DialogFooter>
                  </form>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Connected Wearables Dashboard */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span className="flex items-center gap-2 text-white">
              <Watch className="size-5 text-cyan-400" />
              Connected Wearables & Swim Devices
            </span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
              {activeConnectedKeys.length} Active {activeConnectedKeys.length === 1 ? 'Connection' : 'Connections'}
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Pair your swim watch or sensors to authorize direct automatic telemetry syncing.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {allDeviceKeys.map((key) => {
              const meta = DEVICE_METADATA[key];
              const isConnected = devices[key]?.connected;

              return (
                <div
                  key={key}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between gap-3 transition-all ${
                    isConnected ? 'bg-slate-950 border-cyan-500/50 shadow-md' : 'bg-slate-950/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <SourceIcon source={key} />
                      <div>
                        <span className="font-bold text-sm text-slate-200 block">{meta.brand}</span>
                        {isConnected && devices[key]?.accountId && (
                          <span className="text-[10px] text-slate-400 font-mono block truncate max-w-[120px]">
                            {devices[key].accountId}
                          </span>
                        )}
                      </div>
                    </div>
                    {isConnected ? (
                      <span className="size-2.5 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
                    ) : (
                      <span className="size-2 rounded-full bg-slate-600" title="Not Connected" />
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={isConnected ? 'secondary' : 'outline'}
                    onClick={() => handleOpenConnectModal(key)}
                    className={`text-xs font-semibold h-8 w-full ${
                      isConnected
                        ? 'bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                        : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 text-emerald-400">
                        <CheckCircle2 className="size-3.5" /> Connected
                      </span>
                    ) : (
                      <span>Connect {meta.brand}</span>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Workout History Table */}
      <Card className="border-slate-800 bg-slate-900/60 shadow-xl">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl text-white">Workout & Practice History</CardTitle>
              <CardDescription className="text-slate-400">
                Review your logged practices, interval pacing, and synced wearable telemetry.
              </CardDescription>
            </div>

            {workoutLogs.length > 0 && (
              <Badge variant="secondary" className="w-fit bg-slate-800 text-cyan-300 font-mono">
                {workoutLogs.length} Recorded Sessions
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!isInitialized ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-xs text-slate-400">Loading workout logs...</p>
            </div>
          ) : workoutLogs.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/50 space-y-3">
              <Activity className="size-12 text-slate-600 mx-auto" />
              <h3 className="text-lg font-bold text-slate-200">No Recorded Swim Activities Yet</h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                Connect your Garmin, Apple Watch, or FORM Smart Goggles above to automatically sync your practice sets, or log an activity manually.
              </p>
              <Button
                onClick={() => setIsSyncDialogOpen(true)}
                className="mt-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold"
              >
                <Plus className="mr-2 size-4" /> Sync First Practice
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-950">
                  <TableRow className="border-slate-800">
                    <TableHead className="text-slate-300">Date</TableHead>
                    <TableHead className="text-slate-300">Title & Practice Set</TableHead>
                    <TableHead className="text-slate-300">Location</TableHead>
                    <TableHead className="text-slate-300">Distance</TableHead>
                    <TableHead className="text-slate-300">Duration</TableHead>
                    <TableHead className="text-slate-300">Avg. Pace</TableHead>
                    <TableHead className="text-center text-slate-300">Device Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workoutLogs.map((log) => (
                    <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/40">
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString(undefined, {
                          timeZone: 'UTC',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-white">{log.title}</TableCell>
                      <TableCell className="text-slate-400">
                        <div className="flex items-center gap-1.5 text-xs">
                          <MapPin className="size-3 text-slate-400" />
                          {log.location}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-cyan-300 font-semibold">{log.distance}</TableCell>
                      <TableCell className="text-slate-300">{log.duration}</TableCell>
                      <TableCell className="font-mono text-slate-300">{log.avgPace}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className="border-slate-700 bg-slate-950 text-slate-200 gap-1.5 py-1">
                          <SourceIcon source={log.source} />
                          <span className="capitalize">{log.source.replace('-', ' ')}</span>
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer Generator Callout */}
      <div className="text-center pt-2">
        <Button asChild variant="link" className="text-cyan-400 hover:text-cyan-300">
          <Link href="/workout-generator" className="inline-flex items-center gap-2 text-base font-semibold">
            <Sparkles className="size-4" />
            Generate AI Practice Workouts & Live Smartwatch HUD
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      {/* Connect Device Modal */}
      <ConnectDeviceModal
        open={isConnectModalOpen}
        onOpenChange={setIsConnectModalOpen}
        deviceKey={modalDeviceKey}
      />
    </div>
  );
}
