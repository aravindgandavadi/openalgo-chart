/**
 * Connection Status Service
 * Tracks WebSocket connection state for UI feedback
 */

import { useState, useEffect } from 'react';

// Connection states
export const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
} as const;

export type ConnectionStateType = (typeof ConnectionState)[keyof typeof ConnectionState];

type ConnectionStatusListener = (status: ConnectionStateType) => void;

// Store for current status and listeners
let currentStatus: ConnectionStateType = ConnectionState.DISCONNECTED;
const listeners = new Set<ConnectionStatusListener>();

/**
 * Get current connection status
 */
export const getConnectionStatus = (): ConnectionStateType => currentStatus;

/**
 * Update connection status and notify listeners
 */
export const setConnectionStatus = (status: ConnectionStateType): void => {
  if (currentStatus !== status) {
    currentStatus = status;
    listeners.forEach((listener) => listener(status));
  }
};

/**
 * Subscribe to connection status changes
 * @param callback - Called with new status when it changes
 * @returns Unsubscribe function
 */
export const subscribeToConnectionStatus = (
  callback: ConnectionStatusListener
): (() => void) => {
  listeners.add(callback);
  // Immediately call with current status
  callback(currentStatus);

  return () => {
    listeners.delete(callback);
  };
};

/**
 * React hook for connection status
 * Usage: const status = useConnectionStatus();
 */
export const useConnectionStatus = (): ConnectionStateType => {
  const [status, setStatus] = useState<ConnectionStateType>(currentStatus);

  useEffect(() => {
    return subscribeToConnectionStatus(setStatus);
  }, []);

  return status;
};

export default {
  ConnectionState,
  getConnectionStatus,
  setConnectionStatus,
  subscribeToConnectionStatus,
  useConnectionStatus,
};
