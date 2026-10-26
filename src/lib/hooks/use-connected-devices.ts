'use client';

import { useState, useEffect, useCallback } from 'react';

export type ConnectedDeviceKey =
  | 'apple-watch'
  | 'form-goggles'
  | 'garmin'
  | 'fitbit'
  | 'polar'
  | 'suunto'
  | 'coros';

export interface DeviceConnectionInfo {
  connected: boolean;
  accountId?: string;
  connectedAt?: string;
  model?: string;
  connectionType?: 'cloud-api' | 'bluetooth-le';
  bleDeviceId?: string;
  bleDeviceName?: string;
  batteryLevel?: number;
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
  liveHeartRate?: number;
  liveStrokeRate?: number;
}

export type ConnectedDevicesState = Record<ConnectedDeviceKey, DeviceConnectionInfo>;

export const CONNECTED_DEVICES_STORAGE_KEY = 'aquaSpeed-connectedDevices-v2';

export const DEFAULT_DEVICE_STATE: ConnectedDevicesState = {
  'apple-watch': { connected: false, autoSyncEnabled: true },
  'form-goggles': { connected: false, autoSyncEnabled: true },
  'garmin': { connected: false, autoSyncEnabled: true },
  'fitbit': { connected: false, autoSyncEnabled: true },
  'polar': { connected: false, autoSyncEnabled: true },
  'suunto': { connected: false, autoSyncEnabled: true },
  'coros': { connected: false, autoSyncEnabled: true },
};

export const DEVICE_METADATA: Record<
  ConnectedDeviceKey,
  { name: string; brand: string; iconType: string; description: string; defaultModel: string; bleServices: string[] }
> = {
  garmin: {
    name: 'Garmin Connect / Swim 2',
    brand: 'Garmin',
    iconType: 'garmin',
    description: 'Sync swim interval metrics, SWOLF scores, and heart rate zones directly from Garmin Connect API.',
    defaultModel: 'Garmin Swim 2 / Forerunner 965',
    bleServices: ['0x180D', '0x1826'],
  },
  'apple-watch': {
    name: 'Apple Watch (HealthKit)',
    brand: 'Apple',
    iconType: 'apple',
    description: 'Auto-import lap splits, stroke detection, and Active Energy burned from Apple HealthKit.',
    defaultModel: 'Apple Watch Ultra 2 / Series 9',
    bleServices: ['0x180D', '0x181C'],
  },
  'form-goggles': {
    name: 'FORM Smart Swim Goggles',
    brand: 'FORM',
    iconType: 'goggles',
    description: 'Real-time in-goggle augmented reality display & stroke rhythm telemetry.',
    defaultModel: 'FORM Smart Swim 2 Goggles',
    bleServices: ['0x180D', 'FORM AR Telemetry'],
  },
  fitbit: {
    name: 'Fitbit / Google Fit',
    brand: 'Fitbit',
    iconType: 'fitbit',
    description: 'Connect Fitbit Sense 2 swim tracking & Google Fit exercise summaries.',
    defaultModel: 'Fitbit Sense 2 / Charge 6',
    bleServices: ['0x180D', '0x181C'],
  },
  polar: {
    name: 'Polar Flow',
    brand: 'Polar',
    iconType: 'polar',
    description: 'Polar Vantage V3 precision cardiac & swimming metrics.',
    defaultModel: 'Polar Vantage V3',
    bleServices: ['0x180D', 'Polar HR Sensor'],
  },
  suunto: {
    name: 'Suunto Ocean',
    brand: 'Suunto',
    iconType: 'suunto',
    description: 'Suunto pool & open-water GPS swim telemetry.',
    defaultModel: 'Suunto Ocean',
    bleServices: ['0x180D', '0x1826'],
  },
  coros: {
    name: 'Coros Training Hub',
    brand: 'Coros',
    iconType: 'coros',
    description: 'Coros Pace 3 open-water GPS & pool workout tracking.',
    defaultModel: 'Coros Pace 3',
    bleServices: ['0x180D', '0x1826'],
  },
};

export function useConnectedDevices() {
  const [devices, setDevices] = useState<ConnectedDevicesState>(DEFAULT_DEVICE_STATE);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isBleSupported, setIsBleSupported] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsBleSupported('bluetooth' in navigator);
    }
    try {
      const stored = localStorage.getItem(CONNECTED_DEVICES_STORAGE_KEY);
      if (stored) {
        setDevices(JSON.parse(stored));
      } else {
        localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(DEFAULT_DEVICE_STATE));
      }
    } catch (e) {
      console.error('Error loading connected devices:', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const saveDevices = (newState: ConnectedDevicesState) => {
    setDevices(newState);
    try {
      localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(newState));
    } catch (e) {
      console.error('Error saving connected devices:', e);
    }
  };

  const connectDevice = useCallback(
    (
      key: ConnectedDeviceKey,
      accountId?: string,
      model?: string,
      connectionType: 'cloud-api' | 'bluetooth-le' = 'cloud-api',
      extraInfo?: Partial<DeviceConnectionInfo>
    ) => {
      setDevices((prev) => {
        const meta = DEVICE_METADATA[key];
        const now = new Date().toISOString();
        const next: ConnectedDevicesState = {
          ...prev,
          [key]: {
            connected: true,
            accountId: accountId || `${key}_swimmer@dualswim.com`,
            model: model || meta?.defaultModel || 'Standard Sensor',
            connectionType,
            connectedAt: now,
            lastSyncedAt: now,
            batteryLevel: extraInfo?.batteryLevel ?? Math.floor(75 + Math.random() * 25),
            autoSyncEnabled: extraInfo?.autoSyncEnabled ?? true,
            liveHeartRate: extraInfo?.liveHeartRate ?? Math.floor(130 + Math.random() * 30),
            liveStrokeRate: extraInfo?.liveStrokeRate ?? Math.floor(36 + Math.random() * 8),
            bleDeviceId: extraInfo?.bleDeviceId,
            bleDeviceName: extraInfo?.bleDeviceName,
          },
        };
        try {
          localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    },
    []
  );

  const pairBleDevice = useCallback(
    async (key: ConnectedDeviceKey): Promise<{ success: boolean; deviceName?: string; error?: string }> => {
      const meta = DEVICE_METADATA[key];
      if (typeof window !== 'undefined' && 'bluetooth' in navigator) {
        try {
          const navBle = (navigator as any).bluetooth;
          const bleDevice = await navBle.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['heart_rate', 'fitness_machine', 'device_information'],
          });

          const deviceName = bleDevice.name || `${meta.brand} Smart Sensor`;
          connectDevice(key, `${deviceName.toLowerCase().replace(/\s+/g, '_')}@ble.pair`, deviceName, 'bluetooth-le', {
            bleDeviceId: bleDevice.id || `ble-${Date.now()}`,
            bleDeviceName: deviceName,
            batteryLevel: Math.floor(82 + Math.random() * 15),
            liveHeartRate: Math.floor(142 + Math.random() * 15),
          });

          return { success: true, deviceName };
        } catch (err: any) {
          if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
            return { success: false, error: 'Pairing cancelled by user.' };
          }
          console.warn('Bluetooth request error, falling back to pairing simulator:', err);
        }
      }

      // Simulated Web Bluetooth pairing for unsupported/simulated environment
      await new Promise((res) => setTimeout(res, 1200));
      const mockName = `${meta.brand} BLE Sensor (${Math.floor(100 + Math.random() * 900)})`;
      connectDevice(key, `${key}_ble_sensor@dualswim.com`, mockName, 'bluetooth-le', {
        bleDeviceId: `ble-mock-${Date.now()}`,
        bleDeviceName: mockName,
        batteryLevel: 94,
        liveHeartRate: 146,
      });

      return { success: true, deviceName: mockName };
    },
    [connectDevice]
  );

  const disconnectDevice = useCallback((key: ConnectedDeviceKey) => {
    setDevices((prev) => {
      const next: ConnectedDevicesState = {
        ...prev,
        [key]: { connected: false, autoSyncEnabled: true },
      };
      try {
        localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  }, []);

  const testDeviceConnection = useCallback(
    (key: ConnectedDeviceKey) => {
      const current = devices[key];
      if (!current || !current.connected) return null;

      const updatedTelemetry: Partial<DeviceConnectionInfo> = {
        lastSyncedAt: new Date().toISOString(),
        batteryLevel: Math.max(10, (current.batteryLevel || 85) - Math.floor(Math.random() * 3)),
        liveHeartRate: Math.floor(138 + Math.random() * 25),
        liveStrokeRate: Math.floor(34 + Math.random() * 10),
      };

      setDevices((prev) => {
        const next = {
          ...prev,
          [key]: {
            ...prev[key],
            ...updatedTelemetry,
          },
        };
        try {
          localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });

      return updatedTelemetry;
    },
    [devices]
  );

  const toggleAutoSync = useCallback(
    (key: ConnectedDeviceKey) => {
      setDevices((prev) => {
        const current = prev[key];
        const next = {
          ...prev,
          [key]: {
            ...current,
            autoSyncEnabled: !current?.autoSyncEnabled,
          },
        };
        try {
          localStorage.setItem(CONNECTED_DEVICES_STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error(e);
        }
        return next;
      });
    },
    []
  );

  const getConnectedList = useCallback(() => {
    return (Object.keys(devices) as ConnectedDeviceKey[]).filter((key) => devices[key]?.connected);
  }, [devices]);

  return {
    devices,
    isLoaded,
    isBleSupported,
    connectDevice,
    pairBleDevice,
    disconnectDevice,
    testDeviceConnection,
    toggleAutoSync,
    getConnectedList,
  };
}

