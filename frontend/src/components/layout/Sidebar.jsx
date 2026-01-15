// src/components/layout/Sidebar.jsx
import { useAuth } from '../../context/AuthContext';
import { Users, User } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Container,
  ClipboardList,
  Camera,
  FileText,
  Settings,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import logo from '../../assets/ipetro_logo.png'
const Sidebar = ({ isOpen, setIsOpen }) => {
  const { user, isAdmin, isInspector, isReviewer } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['admin', 'inspector', 'reviewer'] },
    { name: 'Vessels', path: '/vessels', icon: Container, roles: ['admin', 'inspector', 'reviewer'] },
    { name: 'Inspections', path: '/inspections', icon: ClipboardList, roles: ['admin', 'inspector'] },
    { name: 'Observations', path: '/observations', icon: AlertCircle, roles: ['admin', 'inspector'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['admin', 'inspector', 'reviewer'] },
    //AI Analysis menu item
    { 
      name: 'AI Analysis', 
      icon: Sparkles, 
      path: '/ai-analysis', 
      roles: ['admin', 'reviewer', 'inspector'],
      badge: 'AI' 
    },
    { name: 'Users', icon: Users, path: '/users', roles: ['admin'] },

    { name: 'My Profile', path: '/profile', icon: User, roles: ['admin', 'inspector', 'reviewer'] },

    //{ name: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-64 bg-gradient-to-b from-neutral-800 to-neutral-900 
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-center border-b border-neutral-700">
          <div className="flex items-center gap-2">
              <img
                  src={logo}
                  alt="iPetro Logo"
                  className="w-14 h-14 object-contain"
                />
            <div>
              <h1 className="text-xs text-neutral-400">Inspection System</h1>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-600 text-white shadow-lg shadow-primary-600/50'
                    : 'text-neutral-300 hover:bg-neutral-700 hover:text-white'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.badge && (
                    <span className="ml-auto px-2 py-0.5 text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full">
                      {item.badge}
                    </span>
                  )}
            </NavLink>
          ))}

          

        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-neutral-700">
          <div className="flex items-center gap-3 px-4 py-3 bg-neutral-700/50 rounded-lg">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-secondary-600 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-semibold">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name}</p>
              <p className="text-xs text-neutral-400 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;