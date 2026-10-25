import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { notificationService } from '../../services/notificationService';
import { formatDateTime } from '../../utils/helpers';
import { Bell, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const NotificationIcon = ({ type }) => {
  const iconMap = {
    APPLICATION_SUBMITTED: '📋',
    APPLICATION_APPROVED: '🎉',
    APPLICATION_REJECTED: '❌',
    CORRECTION_REQUESTED: '⚠️',
    DOCUMENT_VERIFIED: '✅',
    DOCUMENT_REJECTED: '❌',
    APPLICATION_VERIFIED: '✅',
    DISBURSEMENT_COMPLETED: '💰',
    SCHOLARSHIP_NEW: '🎓',
    GENERAL: '📢',
  };
  return <span className="text-lg">{iconMap[type] || '📢'}</span>;
};

const StudentNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll({ limit: 50 });
      setNotifications(res.data.data?.notifications || []);
      setUnreadCount(res.data.data?.unreadCount || 0);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {}
  };

  return (
    <DashboardLayout>
      <div className="fade-in">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 text-sm mt-1">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="btn-secondary text-xs">
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <LoadingSpinner text="Loading notifications..." />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Bell className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500 font-medium">No Notifications</p>
            <p className="text-gray-400 text-sm mt-1">You're all caught up!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
            {notifications.map((notif) => (
              <div
                key={notif._id}
                className={`flex gap-4 px-5 py-4 transition-colors cursor-pointer ${
                  !notif.isRead ? 'bg-purple-50/50' : 'hover:bg-slate-50'
                }`}
                onClick={() => !notif.isRead && markRead(notif._id)}
              >
                <div className="flex-shrink-0 mt-1">
                  <NotificationIcon type={notif.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${!notif.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                      {notif.title}
                    </p>
                    {!notif.isRead && (
                      <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#5B21B6] mt-1.5" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{notif.message}</p>
                  <p className="text-xs text-slate-400 mt-1.5">{formatDateTime(notif.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentNotifications;
