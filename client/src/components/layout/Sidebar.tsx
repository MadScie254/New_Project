import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Wallet, 
  CreditCard, 
  Briefcase, 
  Calendar, 
  Users, 
  FileText, 
  Settings 
} from 'lucide-react';
import { useChamaStore } from '../../store/chama.store';
import { cn } from '../../lib/utils';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: Wallet, label: 'Contributions', path: '/contributions' },
  { icon: CreditCard, label: 'Loans', path: '/loans' },
  { icon: Briefcase, label: 'Investments', path: '/investments' },
  { icon: Calendar, label: 'Meetings', path: '/meetings' },
  { icon: Users, label: 'Members', path: '/members' },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

const Sidebar: React.FC = () => {
  const activeChama = useChamaStore((state) => state.activeChama);

  return (
    <div className="h-full flex flex-col bg-white border-r border-border shadow-sm">
      {/* Logo Area */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">C</span>
          </div>
          <span className="font-bold text-xl text-primary tracking-tight">Chama OS</span>
        </div>
      </div>

      {/* Chama Selector (simplified for now) */}
      <div className="p-4 border-b border-border">
        <div className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mb-1">
          Active Chama
        </div>
        <div className="font-medium text-sm truncate">
          {activeChama ? activeChama.name : 'No active chama'}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Settings */}
      <div className="p-4 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )
          }
        >
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
