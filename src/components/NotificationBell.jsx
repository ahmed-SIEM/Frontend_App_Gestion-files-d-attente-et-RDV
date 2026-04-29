import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';
import { notificationsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const TYPE_ICONS = {
  ticket_appele:          '🔔',
  ticket_annule:          '❌',
  rdv_confirme:           '📅',
  rdv_annule:             '❌',
  rdv_rappel:             '⏰',
  etablissement_valide:   '✅',
  etablissement_rejete:   '❌',
  etablissement_suspendu: '⚠️',
  agent_cree:             '👤',
  info:                   'ℹ️',
};

function timeAgo(date) {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000);
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export default function NotificationBell({ align = 'right' }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const socket = useSocket();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [nonLues, setNonLues] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getMine();
      setNotifications(res.data || []);
      setNonLues(res.non_lues || 0);
    } catch {
      // silencieux
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger au montage
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Rejoindre la room user pour les notifs temps réel
  useEffect(() => {
    if (!socket || !user) return;
    socket.emit('join:user', user._id);

    socket.on('notification:new', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setNonLues(prev => prev + 1);
      // Toast discret
      toast(notif.titre, {
        description: notif.message,
        duration: 5000,
        icon: TYPE_ICONS[notif.type] || '🔔',
        action: notif.lien ? {
          label: 'Voir',
          onClick: () => navigate(notif.lien)
        } : undefined
      });
    });

    return () => {
      socket.off('notification:new');
    };
  }, [socket, user, navigate]);

  // Fermer en cliquant dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleMarkAsRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, lu: true } : n)
      );
      setNonLues(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, lu: true })));
      setNonLues(0);
    } catch { /* silent */ }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.delete(id);
      const deleted = notifications.find(n => n._id === id);
      setNotifications(prev => prev.filter(n => n._id !== id));
      if (deleted && !deleted.lu) setNonLues(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  };

  const handleClick = async (notif) => {
    if (!notif.lu) {
      await notificationsAPI.markAsRead(notif._id).catch(() => {});
      setNotifications(prev =>
        prev.map(n => n._id === notif._id ? { ...n, lu: true } : n)
      );
      setNonLues(prev => Math.max(0, prev - 1));
    }
    if (notif.lien) {
      setOpen(false);
      navigate(notif.lien);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Cloche */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-gray-600" />
        <AnimatePresence>
          {nonLues > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold"
            >
              {nonLues > 9 ? '9+' : nonLues}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden ${align === 'left' ? 'left-0' : 'right-0'}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-600" />
                <span className="font-semibold text-gray-800">Notifications</span>
                {nonLues > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                    {nonLues}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {nonLues > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Tout marquer comme lu"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    Tout lire
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Bell className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">Aucune notification</p>
                  <p className="text-xs mt-1">Vous êtes à jour !</p>
                </div>
              ) : (
                notifications.map((notif) => (
                  <motion.div
                    key={notif._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 cursor-pointer transition-colors group ${
                      notif.lu ? 'bg-white hover:bg-gray-50' : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                    onClick={() => handleClick(notif)}
                  >
                    <div className="text-xl flex-shrink-0 mt-0.5">
                      {TYPE_ICONS[notif.type] || '🔔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-tight ${notif.lu ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'}`}>
                        {notif.titre}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(notif.createdAt)}</p>
                    </div>
                    <div className="flex flex-col items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.lu && (
                        <button
                          onClick={(e) => handleMarkAsRead(notif._id, e)}
                          className="p-1 rounded hover:bg-blue-100"
                          title="Marquer comme lu"
                        >
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => handleDelete(notif._id, e)}
                        className="p-1 rounded hover:bg-red-50"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                    {!notif.lu && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
