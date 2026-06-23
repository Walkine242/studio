'use client';

type ErrorListener = (error: any) => void;

class ErrorEmitter {
  private listeners: { [channel: string]: ErrorListener[] } = {};

  on(channel: string, listener: ErrorListener) {
    if (!this.listeners[channel]) this.listeners[channel] = [];
    this.listeners[channel].push(listener);
  }

  off(channel: string, listener: ErrorListener) {
    if (!this.listeners[channel]) return;
    this.listeners[channel] = this.listeners[channel].filter((l) => l !== listener);
  }

  emit(channel: string, error: any) {
    if (!this.listeners[channel]) return;
    this.listeners[channel].forEach((l) => l(error));
  }
}

export const errorEmitter = new ErrorEmitter();
