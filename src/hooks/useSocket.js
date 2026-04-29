import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5000';

let socket = null;

function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: true, reconnection: true });
  }
  return socket;
}

// Hook qui retourne l'instance socket directement
export function useSocket() {
  return getSocket();
}

// Hook pour suivre les stats d'un service en temps réel
export function useServiceStats(serviceId, onUpdate) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!serviceId) return;
    const s = getSocket();
    s.emit('join:service', serviceId);

    const handler = (stats) => onUpdateRef.current(stats);
    s.on('queue:update', handler);

    return () => {
      s.emit('leave:service', serviceId);
      s.off('queue:update', handler);
    };
  }, [serviceId]);
}

// Hook pour suivre un ticket spécifique en temps réel
export function useTicketTracking(ticketId, { onCalled, onUpdate } = {}) {
  const onCalledRef = useRef(onCalled);
  const onUpdateRef = useRef(onUpdate);
  onCalledRef.current = onCalled;
  onUpdateRef.current = onUpdate;

  useEffect(() => {
    if (!ticketId) return;
    const s = getSocket();
    s.emit('join:ticket', ticketId);

    const calledHandler = (data) => onCalledRef.current?.(data);
    const updateHandler = (data) => onUpdateRef.current?.(data);

    s.on('ticket:called', calledHandler);
    s.on('ticket:update', updateHandler);

    return () => {
      s.emit('leave:ticket', ticketId);
      s.off('ticket:called', calledHandler);
      s.off('ticket:update', updateHandler);
    };
  }, [ticketId]);
}
