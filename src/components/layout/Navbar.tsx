import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Compass,
  PlusCircle,
  Bell,
  Menu,
  X,
  Shield,
  Layers,
  ChevronDown,
  Building,
  User,
  LogOut,
  ExternalLink,
  Star,
} from 'lucide-react';
import {
  getCurrentUser,
  getCampuses,
  getCurrentCampusId,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  subscribeDataChanges,
  signOutUser,
} from '../../services/dataService';
import type { Profile, Campus, Notification } from '../../types';
import { Button } from '../ui/Button';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [activeCampus, setActiveCampus] = useState<Campus | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const loadData = async () => {
    const user = await getCurrentUser();
    const campusList = await getCampuses();
    const currentId = getCurrentCampusId();
    setCurrentUser(user);
    setActiveCampus(campusList.find(c => c.id === currentId) || campusList[0] || null);

    if (user) {
      const notifs = await getUserNotifications(user.id);
      setNotifications(notifs);
    }
  };

  useEffect(() => {
    loadData();
    return subscribeDataChanges(loadData);
  }, []);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E1E8E4] shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#059669] to-[#064E3B] flex items-center justify-center text-white shadow-sm shadow-emerald-800/20 group-hover:scale-105 transition-transform">
                <Compass className="w-5 h-5 text-emerald-200 animate-spin-slow" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-[#12241E] flex items-center gap-1">
                  Back2You
                  <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-[#536B63] block -mt-1">
                  Campus Recovery
                </span>
              </div>
            </Link>

            {/* Campus Selector Pill */}
            {activeCampus && (
              <div
                className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E7EFEA] border border-[#CBD5CE] text-xs font-semibold text-[#12241E]"
                title={`${activeCampus.name} (${activeCampus.city}, ${activeCampus.state || ''})`}
              >
                <Building className="w-3.5 h-3.5 text-[#059669]" />
                <span className="truncate max-w-[200px]">
                  {activeCampus.code === 'DNR-BVRM' ? 'DNR Engineering College' : activeCampus.name}
                </span>
              </div>
            )}
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              to="/explore"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/explore'
                  ? 'text-[#059669] bg-[#E7EFEA]'
                  : 'text-[#536B63] hover:text-[#12241E] hover:bg-[#F1F5F2]'
              }`}
            >
              Explore Items
            </Link>

            <Link
              to="/my-reports"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/my-reports'
                  ? 'text-[#059669] bg-[#E7EFEA]'
                  : 'text-[#536B63] hover:text-[#12241E] hover:bg-[#F1F5F2]'
              }`}
            >
              My Dashboard
            </Link>

            <Link
              to="/rewards"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                location.pathname === '/rewards'
                  ? 'text-amber-800 bg-amber-50 font-semibold'
                  : 'text-[#536B63] hover:text-[#12241E] hover:bg-[#F1F5F2]'
              }`}
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
              Stars & Rewards
            </Link>

            {currentUser && (currentUser.role === 'moderator' || currentUser.role === 'admin') && (
              <Link
                to="/moderator"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/moderator'
                    ? 'text-amber-800 bg-amber-100 border border-amber-300'
                    : 'text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                Moderator
              </Link>
            )}

            {currentUser && currentUser.role === 'admin' && (
              <Link
                to="/admin"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/admin'
                    ? 'text-purple-800 bg-purple-100 border border-purple-300'
                    : 'text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Admin
              </Link>
            )}
          </nav>

          {/* Right: Actions, Notifications, & Profile */}
          <div className="flex items-center gap-2.5">
            {/* Primary Action Button: Report */}
            <Link to="/report">
              <Button
                variant="primary"
                size="sm"
                className="hidden sm:inline-flex shadow-sm"
                leftIcon={<PlusCircle className="w-4 h-4" />}
              >
                Report Lost / Found
              </Button>
            </Link>

            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                type="button"
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-lg text-[#536B63] hover:text-[#12241E] hover:bg-[#F1F5F2] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                aria-label="View notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer */}
              {showNotifs && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-white border border-[#E1E8E4] shadow-xl py-2 z-50">
                  <div className="flex items-center justify-between px-4 py-2 border-b border-[#E1E8E4]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#12241E]">
                        Notifications
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && currentUser && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsAsRead(currentUser.id)}
                        className="text-[11px] text-[#059669] hover:underline font-medium cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-[#E1E8E4]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-[#536B63]">
                        No notifications yet. You'll be alerted when matches or claims appear!
                      </div>
                    ) : (
                      notifications.map(notif => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          className={`p-3 text-xs transition-colors hover:bg-[#F8FBF9] cursor-pointer ${
                            !notif.is_read ? 'bg-emerald-50/40 font-medium' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-semibold text-[#12241E]">{notif.title}</span>
                            {!notif.is_read && (
                              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="mt-1 text-[#536B63] leading-relaxed">{notif.message}</p>
                          {notif.link && (
                            <Link
                              to={notif.link}
                              onClick={() => setShowNotifs(false)}
                              className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#059669] hover:underline"
                            >
                              View details <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar & Dropdown */}
            {currentUser && (
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#F1F5F2] focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <img
                    src={
                      currentUser.avatar_url ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'
                    }
                    alt={currentUser.full_name}
                    className="w-8 h-8 rounded-full object-cover border border-[#CBD5CE]"
                  />
                  <span className="hidden sm:inline text-xs font-medium text-[#12241E]">
                    {currentUser.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#536B63]" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-[#E1E8E4] shadow-xl py-2 z-50">
                    <div className="px-4 py-2 border-b border-[#E1E8E4]">
                      <p className="text-xs font-bold text-[#12241E]">{currentUser.full_name}</p>
                      <p className="text-[11px] text-[#536B63] truncate">{currentUser.email}</p>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#E7EFEA] text-[#12241E]">
                          {currentUser.role}
                        </span>
                        {currentUser.team_designation && (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {currentUser.team_designation}
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to="/my-reports"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-[#12241E] hover:bg-[#F1F5F2]"
                    >
                      <User className="w-4 h-4 text-[#536B63]" />
                      My Reports & Claims
                    </Link>

                    {currentUser.role === 'moderator' && (
                      <Link
                        to="/moderator"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-amber-900 hover:bg-amber-50"
                      >
                        <Shield className="w-4 h-4 text-amber-600" />
                        Campus Moderator Panel
                      </Link>
                    )}

                    {currentUser.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2 px-4 py-2 text-xs text-purple-900 hover:bg-purple-50"
                      >
                        <Layers className="w-4 h-4 text-purple-600" />
                        Platform Administration
                      </Link>
                    )}

                    <div className="border-t border-[#E1E8E4] my-1"></div>

                    <Link
                      to="/login"
                      onClick={() => {
                        setShowUserMenu(false);
                        signOutUser();
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out / Switch Account
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-[#536B63] hover:text-[#12241E] hover:bg-[#F1F5F2]"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E1E8E4] bg-white px-4 pt-2 pb-4 space-y-1">
          <Link
            to="/explore"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-[#12241E] hover:bg-[#F1F5F2]"
          >
            Explore Items
          </Link>
          <Link
            to="/report"
            className="block px-3 py-2 rounded-lg text-sm font-bold text-[#059669] bg-emerald-50"
          >
            + Report Lost or Found Item
          </Link>
          <Link
            to="/my-reports"
            className="block px-3 py-2 rounded-lg text-sm font-medium text-[#12241E] hover:bg-[#F1F5F2]"
          >
            My Reports & Claims
          </Link>
          <Link
            to="/rewards"
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-amber-900 bg-amber-50/70 hover:bg-amber-100"
          >
            ⭐ Stars & Rewards Leaderboard
          </Link>
          {currentUser && (currentUser.role === 'moderator' || currentUser.role === 'admin') && (
            <Link
              to="/moderator"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-amber-800 hover:bg-amber-50"
            >
              Moderator Dashboard
            </Link>
          )}
          {currentUser && currentUser.role === 'admin' && (
            <Link
              to="/admin"
              className="block px-3 py-2 rounded-lg text-sm font-medium text-purple-800 hover:bg-purple-50"
            >
              Platform Administration
            </Link>
          )}
        </div>
      )}
    </header>
  );
};
