import React, { useEffect } from 'react';
import { Bell, LogOut, User } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useNotificationStore } from '../../store/notification.store';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';

const Header: React.FC = () => {
  const { user, logout } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileMenu, setShowProfileMenu] = React.useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Poll every 30s
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const handleNotificationClick = (id: string) => {
    markAsRead(id);
    // Ideally, navigate to relevant page based on notification type
  };

  return (
    <header className="h-16 bg-white border-b border-border shadow-sm flex items-center justify-between px-4 md:px-6 z-10 relative">
      <div className="flex items-center md:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-lg text-primary tracking-tight">Chama OS</span>
        </div>
      </div>

      <div className="hidden md:block">
        <h1 className="text-lg font-semibold text-foreground">Welcome back, {user?.name.split(' ')[0]}</h1>
        <p className="text-xs text-muted-foreground">{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-white"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border border-border overflow-hidden z-50">
              <div className="p-3 border-b border-border flex justify-between items-center bg-muted/30">
                <h3 className="font-semibold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button 
                    onClick={() => markAllAsRead()}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No notifications
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {notifications.map((n) => (
                      <li 
                        key={n.id} 
                        className={cn(
                          "p-3 text-sm hover:bg-muted/50 cursor-pointer transition-colors",
                          !n.read && "bg-primary/5"
                        )}
                        onClick={() => handleNotificationClick(n.id)}
                      >
                        <p className={cn("text-foreground", !n.read && "font-medium")}>
                          {n.message}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 hover:bg-muted p-1 pr-2 rounded-full transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {user?.photo_url ? (
                <img src={user.photo_url} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-primary font-medium text-sm">
                  {user?.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="hidden md:block text-sm font-medium">{user?.name}</span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-border overflow-hidden z-50">
              <div className="p-3 border-b border-border bg-muted/30 md:hidden">
                <p className="font-medium text-sm">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.phone}</p>
              </div>
              <ul className="py-1">
                <li>
                  <button className="w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted flex items-center gap-2 transition-colors">
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile Settings
                  </button>
                </li>
                <li>
                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Backdrop for mobile menus */}
      {(showNotifications || showProfileMenu) && (
        <div 
          className="fixed inset-0 z-40 bg-transparent" 
          onClick={() => {
            setShowNotifications(false);
            setShowProfileMenu(false);
          }}
        />
      )}
    </header>
  );
};

export default Header;
