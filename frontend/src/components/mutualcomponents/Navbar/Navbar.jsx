import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../../store/auth/authActions';
import { Home, Mail, Users, Settings, LogOut } from 'lucide-react';
import Avatar from '../../common/Avatar';
import ENV from '../../../config';
import Popup from '../../common/Popup';
import { selectTotalUnreadCount } from '../../../store/notifications/notificationSlice';
import useNotifications from '../../../hooks/useNotifications';

export const Navbar = () => {
  const [showTooltip, setShowTooltip] = useState(null);
  const [showLogoutPopup, setShowLogoutPopup] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, loading, isAuthenticated } = useSelector((state) => state.auth);
  
  // Initialize notifications
  const { totalUnreadCount } = useNotifications();
  // We can also get it directly from selector if needed
  // const totalUnreadCount = useSelector(selectTotalUnreadCount);

  const navItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard', path: '/chat-dashboard', color: 'bg-indigo-500' },
    { 
      id: 'inbox', 
      icon: Mail, 
      label: 'Inbox', 
      path: '/chat', 
      color: 'bg-blue-500', 
      badge: totalUnreadCount // Dynamic notification count from Redux
    },
    { id: 'users', icon: Users, label: 'Users', path: '/users', color: 'bg-purple-500' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings', color: 'bg-teal-500' },
  ];

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  // Get user initials from name or username
  const getUserInitials = () => {
    if (!user) return '';
    
    if (user.first_name && user.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    
    return '';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <aside className="fixed top-0 left-0 h-screen bg-white border-r border-gray-200 shadow-sm transition-all duration-300 
                    w-16 md:w-64 z-40">
        {/* Logo */}
        <div className="h-16 flex items-center justify-center md:justify-start px-4 border-b border-gray-200">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="ml-3 text-xl font-bold text-gray-900 hidden md:block">VibeHub</h1>
        </div>

        {/* Navigation Items */}
        <nav className="p-2 md:p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => navigate(item.path)}
                  className="relative w-full flex items-center px-2 py-3 rounded-xl hover:bg-gray-100 transition-all duration-200 group"
                  onMouseEnter={() => setShowTooltip(item.id)}
                  onMouseLeave={() => setShowTooltip(null)}
                >
                  <div className={`flex items-center justify-center w-10 h-10 ${item.color} rounded-lg group-hover:scale-110 transition-transform duration-200`}>
                    <item.icon className="w-5 h-5 text-white" />
                  </div>
                  <span className="ml-3 font-medium text-gray-700 hidden md:block">{item.label}</span>
                  
                  {/* Badge */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 md:static md:ml-auto min-w-[20px] h-5 flex items-center justify-center px-1 text-xs font-bold text-white bg-red-500 rounded-full">
                      {item.badge}
                    </span>
                  )}

                  {/* Tooltip on mobile */}
                  {showTooltip === item.id && (
                    <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap md:hidden">
                      {item.label}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* Divider */}
          <div className="my-4 border-t border-gray-200"></div>

          {/* User Profile */}
          <div className="mt-auto">
            <div className="flex items-center p-2 rounded-xl hover:bg-gray-100 transition-all duration-200 group cursor-pointer" onClick={() => navigate('/profile')}>
              <div className="relative">
                <Avatar
                  src={user?.profile_picture_url ? `${ENV.BASE_API_URL}${user.profile_picture_url}` : null}
                  initials={loading ? '' : getUserInitials()}
                  size="sm"
                />
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div className="ml-3 hidden md:block">
                {loading ? (
                  <p className="text-sm font-medium text-gray-900">Loading...</p>
                ) : user ? (
                  <>
                    <p className="text-sm font-medium text-gray-900">
                      {user.first_name && user.last_name 
                        ? `${user.first_name} ${user.last_name}` 
                        : user.username}
                    </p>
                    <p className="text-xs text-gray-500">{user.email || ''}</p>
                  </>
                ) : (
                  <p className="text-sm font-medium text-gray-900">Not logged in</p>
                )}
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutPopup(true)}
              className="mt-2 w-full flex items-center px-2 py-3 text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 group"
              onMouseEnter={() => setShowTooltip('logout')}
              onMouseLeave={() => setShowTooltip(null)}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg group-hover:scale-110 transition-transform duration-200">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="ml-3 font-medium hidden md:block">Logout</span>
              {/* Logout Tooltip */}
              {showTooltip === 'logout' && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded-md whitespace-nowrap md:hidden">
                  Logout
                </div>
              )}
            </button>
          </div>
        </nav>
      </aside>
      {/* Render Popup at root level for proper z-index */}
      <Popup
        open={showLogoutPopup}
        onClose={() => setShowLogoutPopup(false)}
        title="Logout Confirmation"
        description="Are you sure you want to logout?"
        showClose={false}
      >
        <div className="flex justify-end space-x-2 mt-4">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={() => setShowLogoutPopup(false)}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </Popup>
    </>
  );
};

export default Navbar;