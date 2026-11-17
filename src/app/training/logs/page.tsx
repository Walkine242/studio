'use client';

import { Fragment, useEffect, useState } from 'react';
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
import { DeviceImport } from '@/components/device-import';
import { SwimDetails } from '@/components/swim-details';

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
  const { workoutLogs, isInitialized, addWorkoutLog, refetch } = useWorkoutLogs({});
  const [openLogId, setOpenLogId] = useState<string | null>(null);
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

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('import')) {
      setActiveSyncTab('wearable');
      setIsSyncDialogOpen(true);
    }
  }, []);

  const handleOpenConnectModal = (key: ConnectedDeviceKey) => {
    setModalDeviceKey(key);
    setIsConnectModalOpen(true);
  };

  const activeConnectedKeys = getConnectedList();
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
            Import swims from your watch (Garmin, Apple Watch, COROS, Suunto, Polar) or log a practice by hand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Dialog open={isSyncDialogOpen} onOpenChange={setIsSyncDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold shadow-lg shadow-cyan-500/20">
                <RefreshCw className="mr-2 size-4" />
                Import Swim / Record Practice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-slate-950 text-white border-slate-800">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Activity className="size-5 text-cyan-400" />
                  Import Swims & Record Practice
                </DialogTitle>
                <DialogDescription className="text-slate-400">
                  Upload the activity file from your watch, or log a practice set by hand.
                </DialogDescription>
              </DialogHeader>

              <Tabs value={activeSyncTab} onValueChange={(val) => setActiveSyncTab(val as any)} className="w-full mt-2">
                <TabsList className="grid grid-cols-2 bg-slate-900 border border-slate-800">
                  <TabsTrigger value="wearable" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                    <Wifi className="mr-2 size-4" /> Import from Watch
                  </TabsTrigger>
                  <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
                    <Plus className="mr-2 size-4" /> Record Practice Set
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="wearable" className="space-y-4 pt-4">
                  <DeviceImport
                    defaultDevice="garmin"
                    onDone={() => { refetch(); setIsSyncDialogOpen(false); }}
                  />
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
              Import From Your Watch
            </span>
            <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 font-mono text-xs">
              .FIT · .TCX · Garmin .zip
            </Badge>
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Pick your device for step-by-step instructions, then upload the swim file. Automatic syncing is coming later.
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
                      <span>Import {meta.brand}</span>
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
                Automatic device sync is coming soon. For now, log an activity manually.
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
                    <Fragment key={log.id}>
                    <TableRow
                      className={`border-slate-800 hover:bg-slate-800/40 ${log.details ? 'cursor-pointer' : ''}`}
                      onClick={() => log.details && setOpenLogId(openLogId === log.id ? null : log.id)}
                    >
                      <TableCell className="text-slate-300 whitespace-nowrap">
                        {new Date(log.date).toLocaleDateString(undefined, {
                          timeZone: 'UTC',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="font-semibold text-white">
                        {log.title}
                        {log.details ? (
                          <span className="ml-2 text-[11px] font-normal text-cyan-400">{openLogId === log.id ? 'Hide splits ▲' : 'Splits ▼'}</span>
                        ) : null}
                      </TableCell>
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
                    {openLogId === log.id && log.details ? (
                      <TableRow className="border-slate-800 bg-slate-950/70 hover:bg-slate-950/70">
                        <TableCell colSpan={7} className="p-3">
                          <SwimDetails details={log.details} />
                        </TableCell>
                      </TableRow>
                    ) : null}
                    </Fragment>
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
        onSuccess={() => refetch()}
      />
    </div>
  );
}
