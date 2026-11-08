'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AppleIcon } from '@/components/icons/apple';
import { FitbitIcon } from '@/components/icons/fitbit';
import {
  Watch,
  Wifi,
  ShieldCheck,
  CheckCircle2,
  Loader2,
  Smartphone,
  AlertCircle,
  Unlink,
  Radio,
  Bluetooth,
  Battery,
  Heart,
  Activity,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useConnectedDevices,
  DEVICE_METADATA,
  type ConnectedDeviceKey,
  type DeviceConnectionInfo,
} from '@/lib/hooks/use-connected-devices';

interface ConnectDeviceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceKey: ConnectedDeviceKey | null;
  onSuccess?: () => void;
}

export function ConnectDeviceModal({
  open,
  onOpenChange,
  deviceKey,
  onSuccess,
}: ConnectDeviceModalProps) {
  const {
    devices,
    isBleSupported,
    connectDevice,
    pairBleDevice,
    disconnectDevice,
    testDeviceConnection,
    toggleAutoSync,
  } = useConnectedDevices();

  const { toast } = useToast();

  const [accountId, setAccountId] = useState('');
  const [model, setModel] = useState('');
  const [activeTab, setActiveTab] = useState<'cloud' | 'ble' | 'test'>('cloud');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectingStep, setConnectingStep] = useState<string | null>(null);
  const [isScanningBle, setIsScanningBle] = useState(false);
  const [testResults, setTestResults] = useState<any | null>(null);

  const meta = deviceKey ? DEVICE_METADATA[deviceKey] : null;
  const currentInfo: DeviceConnectionInfo | undefined = deviceKey ? devices[deviceKey] : undefined;
  const isCurrentlyConnected = currentInfo?.connected ?? false;

  useEffect(() => {
    if (deviceKey && meta) {
      setAccountId(currentInfo?.accountId || `swimmer.${deviceKey}@dualswim.app`);
      setModel(currentInfo?.model || meta.defaultModel);
      setActiveTab(isCurrentlyConnected ? 'test' : 'cloud');
    }
    setConnectingStep(null);
    setIsConnecting(false);
    setIsScanningBle(false);
    setTestResults(null);
  }, [deviceKey, meta, currentInfo?.connected, open]);

  if (!deviceKey || !meta) return null;

  const handleCloudConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsConnecting(true);
    setConnectingStep(`Connecting to ${meta.brand} Cloud API...`);

    setTimeout(() => {
      setConnectingStep(`Authorizing telemetry stream for ${accountId}...`);
    }, 600);

    setTimeout(() => {
      connectDevice(deviceKey, accountId, model, 'cloud-api');
      setIsConnecting(false);
      setConnectingStep(null);
      onOpenChange(false);

      toast({
        title: `${meta.name} Connected! 🎉`,
        description: `Successfully linked account "${accountId}". AquaSpeed is ready to auto-sync swim sessions.`,
      });

      if (onSuccess) onSuccess();
    }, 1200);
  };

  const handleBlePairing = async () => {
    setIsScanningBle(true);
    try {
      const res = await pairBleDevice(deviceKey);
      if (res.success) {
        toast({
          title: `Bluetooth Device Paired! 📡`,
          description: `Linked ${res.deviceName || meta.name} over Bluetooth Low Energy. Live HR & swim telemetry active.`,
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          variant: 'destructive',
          title: 'Pairing Not Completed',
          description: res.error || 'Could not discover Bluetooth device. Please make sure Bluetooth is turned on.',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Bluetooth Connection Error',
        description: 'Failed to pair device via Web Bluetooth.',
      });
    } finally {
      setIsScanningBle(false);
    }
  };

  const handleRunDiagnosticTest = () => {
    const res = testDeviceConnection(deviceKey);
    setTestResults(res);
    toast({
      title: 'Telemetry Test Completed! ⚡',
      description: `Connection active. Live Heart Rate: ${res?.liveHeartRate || 142} bpm, Battery: ${res?.batteryLevel || 88}%.`,
    });
  };

  const handleDisconnect = () => {
    disconnectDevice(deviceKey);
    onOpenChange(false);
    toast({
      title: `${meta.name} Disconnected`,
      description: `Removed connection to ${meta.name}. Auto-sync has been turned off for this device.`,
    });
  };

  const renderIcon = () => {
    switch (meta.iconType) {
      case 'apple':
        return <AppleIcon className="size-8 text-slate-100" />;
      case 'fitbit':
        return <FitbitIcon className="size-8 text-sky-400" />;
      case 'goggles':
        return <Watch className="size-8 text-cyan-400" />;
      default:
        return <Watch className="size-8 text-emerald-400" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-slate-950 text-white border-slate-800 shadow-2xl">
        <DialogHeader className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0">
                {renderIcon()}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white flex items-center gap-2">
                  {meta.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-400">
                  {meta.brand} Swim Device & Telemetry Integration
                </DialogDescription>
              </div>
            </div>
            {isCurrentlyConnected ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-xs flex items-center gap-1">
                <CheckCircle2 className="size-3" /> Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                Not Paired
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="font-semibold text-slate-200 flex items-center gap-1.5">
            <Radio className="size-3.5 text-cyan-400 animate-pulse" /> Direct Telemetry Syncing
          </div>
          <p className="text-slate-400">{meta.description}</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 bg-slate-900 border border-slate-800 text-xs">
            <TabsTrigger value="cloud" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
              <Wifi className="size-3.5 mr-1.5" /> Cloud API
            </TabsTrigger>
            <TabsTrigger value="ble" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
              <Bluetooth className="size-3.5 mr-1.5 text-cyan-400" /> BLE Hardware
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white font-semibold">
              <Activity className="size-3.5 mr-1.5 text-emerald-400" /> Diagnostics
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: CLOUD API */}
          <TabsContent value="cloud" className="space-y-4 pt-3">
            {isCurrentlyConnected && currentInfo?.connectionType === 'cloud-api' ? (
              <div className="space-y-3">
                <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="font-semibold">Linked Account:</span>
                    <span className="font-mono text-white">{currentInfo.accountId}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="font-semibold">Watch / Sensor Model:</span>
                    <span className="text-slate-200">{currentInfo.model || meta.defaultModel}</span>
                  </div>
                  <div className="flex items-center justify-between text-emerald-300">
                    <span className="font-semibold">Sync Protocol:</span>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-300 text-[10px]">
                      Cloud API OAuth 2.0
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-200">Automatic Session Auto-Sync</span>
                  <Switch
                    checked={currentInfo.autoSyncEnabled ?? true}
                    onCheckedChange={() => toggleAutoSync(deviceKey)}
                  />
                </div>
              </div>
            ) : (
              <form onSubmit={handleCloudConnect} className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="accountId" className="text-xs font-semibold text-slate-200">
                    {meta.brand} Account Email / Device Sync ID
                  </Label>
                  <Input
                    id="accountId"
                    placeholder={`e.g. swimmer@${meta.brand.toLowerCase()}.com`}
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    required
                    className="bg-slate-900 border-slate-800 text-white text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="model" className="text-xs font-semibold text-slate-200">
                    Swim Watch / Sensor Hardware Model
                  </Label>
                  <Input
                    id="model"
                    placeholder={meta.defaultModel}
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="bg-slate-900 border-slate-800 text-white text-xs"
                  />
                </div>

                {isConnecting && (
                  <div className="p-3 rounded-lg bg-blue-950/60 border border-blue-500/40 flex items-center gap-3">
                    <Loader2 className="size-5 text-cyan-400 animate-spin shrink-0" />
                    <span className="text-xs text-blue-200 font-semibold">{connectingStep}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isConnecting}
                  className="w-full min-h-[44px] h-auto py-2.5 text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" /> Authorizing Account...
                    </>
                  ) : (
                    <>
                      <Wifi className="size-4" /> Authorize {meta.brand} Cloud API
                    </>
                  )}
                </Button>
              </form>
            )}
          </TabsContent>

          {/* TAB 2: BLE HARDWARE */}
          <TabsContent value="ble" className="space-y-4 pt-3">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3 text-center">
              <div className="relative size-16 mx-auto flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full border-2 border-cyan-500/30 ${isScanningBle ? 'animate-ping' : ''}`} />
                <Bluetooth className="size-8 text-cyan-400" />
              </div>

              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-100">Bluetooth Low Energy (BLE) Scan</h4>
                <p className="text-xs text-slate-400">
                  {isBleSupported
                    ? `Pair directly with nearby ${meta.brand} sensors over Web Bluetooth GATT services.`
                    : `Web Bluetooth simulation active. Click pair to connect hardware sensor stream.`}
                </p>
              </div>

              <div className="flex items-center justify-center gap-2 flex-wrap">
                {meta.bleServices.map((srv, idx) => (
                  <Badge key={idx} variant="outline" className="border-slate-700 text-slate-300 text-[10px]">
                    GATT: {srv}
                  </Badge>
                ))}
              </div>

              <Button
                type="button"
                onClick={handleBlePairing}
                disabled={isScanningBle}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-xs h-10 shadow-lg flex items-center justify-center gap-2"
              >
                {isScanningBle ? (
                  <>
                    <Loader2 className="size-4 animate-spin" /> Scanning for {meta.brand} BLE Hardware...
                  </>
                ) : (
                  <>
                    <Bluetooth className="size-4" /> Scan & Pair {meta.brand} BLE Sensor
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* TAB 3: DIAGNOSTICS & TELEMETRY */}
          <TabsContent value="test" className="space-y-4 pt-3">
            {isCurrentlyConnected ? (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Connection Mode:</span>
                    <Badge variant="outline" className="border-cyan-500/40 text-cyan-400 text-[10px]">
                      {currentInfo?.connectionType === 'bluetooth-le' ? 'Bluetooth LE' : 'Cloud API'}
                    </Badge>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <span className="text-slate-400">Battery Level:</span>
                    <span className="font-mono text-emerald-400 font-bold flex items-center gap-1">
                      <Battery className="size-3.5 text-emerald-400" />
                      {currentInfo?.batteryLevel || 88}%
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <Heart className="size-4 text-rose-400 fill-rose-400/30 animate-pulse" /> Live Telemetry
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Last Sync: {currentInfo?.lastSyncedAt ? new Date(currentInfo.lastSyncedAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">Heart Rate</div>
                      <div className="text-lg font-extrabold text-rose-400 font-mono">
                        {currentInfo?.liveHeartRate || 142} <span className="text-xs font-normal text-slate-400">bpm</span>
                      </div>
                    </div>
                    <div className="p-2 rounded bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400">Stroke Tempo</div>
                      <div className="text-lg font-extrabold text-cyan-400 font-mono">
                        {currentInfo?.liveStrokeRate || 38} <span className="text-xs font-normal text-slate-400">spm</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleRunDiagnosticTest}
                  variant="outline"
                  className="w-full border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 font-bold text-xs h-9"
                >
                  <RefreshCw className="size-3.5 mr-2" /> Ping Diagnostic Telemetry Stream
                </Button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-2 text-xs">
                <AlertCircle className="size-8 text-amber-400 mx-auto" />
                <p className="font-semibold text-slate-200">Device Not Paired Yet</p>
                <p className="text-slate-400">
                  Use the Cloud API or BLE Hardware tabs to connect your device first before running telemetry diagnostics.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isCurrentlyConnected && (
          <DialogFooter className="pt-2 border-t border-slate-800">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="w-full border-red-500/40 text-red-400 hover:bg-red-950/40 font-semibold text-xs h-9"
            >
              <Unlink className="size-3.5 mr-2" /> Disconnect {meta.name}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
