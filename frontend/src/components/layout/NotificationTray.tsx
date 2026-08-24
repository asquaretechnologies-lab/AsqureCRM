import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  CheckCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { api, NotificationItem } from '../../services/api';

export const NotificationTray: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const fetchNotifications = async (generateFirst = false) => {
    try {
      setLoading(true);
      if (generateFirst) {
        await api.generateNotifications().catch(() => {});
      }
      const res = await api.getNotifications({ limit: 15 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(true);
    // Poll for notifications every 60 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      api.markNotificationRead(item.id).catch(() => {});
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    setIsOpen(false);

    // Route target navigation
    if (item.category === 'LICENSE') {
      navigate('/licenses');
    } else if (item.category === 'FINANCE') {
      navigate('/invoices');
    } else if (item.category === 'SALES') {
      navigate('/leads');
    } else if (item.category === 'SUPPORT') {
      navigate('/tickets');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />;
      case 'WARNING':
        return <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />;
      case 'SUCCESS':
        return <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />;
      default:
        return <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />;
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'LICENSE':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'FINANCE':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'SALES':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'SUPPORT':
        return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors focus:outline-none"
        title="Notifications & Alerts"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown Tray */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchNotifications(true)}
                disabled={loading}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md transition-colors"
                title="Refresh notifications"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline px-2 py-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  No notifications
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  You are all caught up!
                </p>
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 ${
                    !item.isRead
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="mt-0.5">{getAlertIcon(item.type)}</div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span
                        className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${getCategoryBadgeClass(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                    </div>

                    <p
                      className={`text-xs font-semibold text-slate-900 dark:text-white truncate ${
                        !item.isRead ? 'font-bold' : ''
                      }`}
                    >
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5 leading-relaxed">
                      {item.message}
                    </p>
                  </div>

                  {!item.isRead && (
                    <button
                      onClick={(e) => handleMarkRead(item.id, e)}
                      className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 p-1"
                      title="Mark as read"
                    >
                      <span className="h-2 w-2 rounded-full bg-blue-600 block" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate('/licenses');
              }}
              className="text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center gap-1 mx-auto py-1"
            >
              View System Alerts & Licensing
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
