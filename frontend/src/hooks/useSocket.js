import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ total: 0, high: 0, medium: 0, low: 0, avgWait: 0, nextToken: null });
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('queue:update', (data) => setQueue(data));
    socket.on('stats:update', (data) => setStats(data));

    return () => socket.disconnect();
  }, []);

  const callPatient = (token) => {
    socketRef.current?.emit('queue:call', { token });
  };

  return { queue, stats, connected, callPatient };
}
