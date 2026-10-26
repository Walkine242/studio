'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Watch,
  Activity,
  Battery,
  Wifi,
  RefreshCw,
  Plus,
  CheckCircle2,
  Heart,
  ChevronRight,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  useConnectedDevices,
  DEVICE_METADATA,
  type ConnectedDeviceKey,
} from '@/lib/hooks/use-connected-devices';
import { ConnectDeviceModal } from '@/components/connect-device-modal';
import { useToast } from '@/hooks/use-toast';

export function WearableStatusPill() {
  const { devices, getConnectedList, testDeviceConnection } = useConnectedDevices();
  const { toast } = useToast();
  const [modalDeviceKey, setModalDeviceKey] = useState<ConnectedDeviceKey | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  const connectedKeys = getConnectedList();
  const connectedCount = connectedKeys.length;

  // Calculate average heart rate across connected devices if available
  const activeHeartRates = connectedKeys
    .map((k) => devices[k]?.liveHeartRate)
    .filter((hr): hr is number => typeof hr === 'number' && hr > 0);

  const avgHeartRate =
    activeHeartRates.length > 0
      ? Math.round(activeHeartRates.reduce((a, b) => a + b, 0) / activeHeartRates.length)
      : null;

  const handleSyncAll = () => {
    setIsSyncingAll(true);
    let syncedCount = 0;
    connectedKeys.forEach((key) => {
      testDeviceConnection(key);
      syncedCount++;
    });

    setTimeout(() => {
      setIsSyncingAll(false);
      toast({
        title: 'Wearable Telemetry Synced! ⚡',
        description: `Refreshed live telemetry streams from ${syncedCount} active wearable device${syncedCount === 1 ? '' : 's'}.`,
      });
    }, 800);
  };

  const handlePairNew = (key: ConnectedDeviceKey) => {
    setModalDeviceKey(key);
    setIsModalOpen(true);
  };

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-slate-900/80 border-slate-700/80 hover:bg-slate-800 text-white font-medium text-xs gap-2 shadow-inner transition-all hover:border-cyan-500/50"
          >
            <div className="relative flex items-center justify-center">
              <Watch className="size-4 text-cyan-400" />
              {connectedCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 size-2 bg-emerald-400 rounded-full animate-ping" />
              )}
            </div>

            <span className="hidden sm:inline-block">
              {connectedCount > 0 ? (
                <span className="flex items-center gap-1.5 font-bold">
                  <span className="text-cyan-300">{connectedCount} Paired</span>
                  {avgHeartRate && (
                    <span className="text-rose-400 flex items-center gap-0.5 text-[11px] bg-rose-950/60 px-1.5 py-0.5 rounded border border-rose-500/30">
                      <Heart className="size-3 fill-rose-500 animate-pulse" /> {avgHeartRate}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-400 font-semibold">Wearables Off</span>
              )}
            </span>
          </Button>
        </PopoverTrigger>

        <PopoverContent align="end" className="w-80 bg-slate-950 text-white border-slate-800 p-4 shadow-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-cyan-400" />
              <h4 className="font-bold text-sm text-white">Swim Devices Hub</h4>
            </div>
            {connectedCount > 0 ? (
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">
                {connectedCount} Active
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-800 text-slate-400 text-[10px]">
                No Active Paired
              </Badge>
            )}
          </div>

          {connectedCount > 0 ? (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {connectedKeys.map((key) => {
                const info = devices[key];
                const meta = DEVICE_METADATA[key];
                return (
                  <div
                    key={key}
                    className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center justify-between text-xs hover:border-slate-700 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-200 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3 text-emerald-400" />
                        {meta.name}
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{info.connectionType === 'bluetooth-le' ? 'Bluetooth LE' : 'Cloud API'}</span>
                        {info.batteryLevel && (
                          <span className="flex items-center gap-0.5 text-emerald-300 font-mono">
                            <Battery className="size-3 text-emerald-400" /> {info.batteryLevel}%
                          </span>
                        )}
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handlePairNew(key)}
                      className="h-7 text-[10px] text-cyan-300 hover:text-white hover:bg-cyan-950/60 px-2"
                    >
                      Manage
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-slate-900/60 border border-slate-800 text-center space-y-2">
              <Watch className="size-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-300 font-medium">No Wearable Swim Sensors Paired</p>
              <p className="text-[11px] text-slate-500">
                Connect Garmin, Apple Watch, FORM Smart Goggles, Fitbit, Polar, Suunto, or Coros for automatic race telemetry & practice tracking.
              </p>
            </div>
          )}

          <div className="space-y-2 pt-1 border-t border-slate-800">
            {connectedCount > 0 && (
              <Button
                onClick={handleSyncAll}
                disabled={isSyncingAll}
                size="sm"
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs h-8 flex items-center justify-center gap-1.5"
              >
                <RefreshCw className={`size-3.5 ${isSyncingAll ? 'animate-spin' : ''}`} />
                {isSyncingAll ? 'Syncing Telemetry...' : 'Sync Live Telemetry Streams'}
              </Button>
            )}

            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full border-slate-800 hover:bg-slate-900 text-slate-300 hover:text-white text-xs h-8 flex items-center justify-between"
            >
              <Link href="/profile?tab=wearables">
                <span>Manage Devices in Profile</span>
                <ChevronRight className="size-3.5 text-slate-400" />
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      <ConnectDeviceModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        deviceKey={modalDeviceKey}
      />
    </>
  );
}
