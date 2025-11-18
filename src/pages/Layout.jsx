

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "./utils";
import { MapPin, Users, Menu, X, ChevronLeft, ChevronRight, Bell, Info, User, LogIn, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Layout({ children, currentPageName }) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(true);
  const [showLogoutDialog, setShowLogoutDialog] = React.useState(false);

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false }),
    enabled: user?.role === 'admin',
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  const navigation = [
    { name: "Spots", page: "Home", icon: MapPin },
    { name: "Communautés", page: "Communities", icon: Users },
    { name: "Aide", page: "Help", icon: Info }
  ];

  const adminNavigation = [
    { name: "Catégories", page: "Categories", icon: Tag }
  ];

  const handleLogoutConfirm = () => {
    base44.auth.logout();
  };

  return (
    <div className="min-h-screen w-screen max-w-screen bg-gradient-to-br from-emerald-50 to-teal-50 overflow-x-hidden notranslate" translate="no">
      {/* Mobile Header - More discreet */}
      <header className="md:hidden sticky top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm w-screen max-w-screen">
        <div className="flex items-center justify-between p-3 w-full">
          <h1 className="text-lg font-bold text-emerald-600">SpotMe</h1>
          <div className="flex items-center gap-2">
            {user?.role === 'admin' && (
              <Link to={createPageUrl('Notifications')}>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Bell className="w-5 h-5" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                      {notifications.length}
                    </Badge>
                  )}
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="h-8 w-8"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="border-t border-gray-200 bg-white/95 backdrop-blur w-full">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = currentPageName === item.page;
              return (
                <Link
                  key={item.page}
                  to={createPageUrl(item.page)}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
            
            {user?.role === 'admin' && (
              <>
                <div className="border-t border-gray-200 my-2" />
                {adminNavigation.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPageName === item.page;
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium text-sm">{item.name}</span>
                    </Link>
                  );
                })}
                <Link
                  to={createPageUrl('Notifications')}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 transition-colors ${
                    currentPageName === 'Notifications'
                      ? "bg-emerald-50 text-emerald-600 border-l-4 border-emerald-600"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <div className="relative">
                    <Bell className="w-4 h-4" />
                    {notifications.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                        {notifications.length}
                      </Badge>
                    )}
                  </div>
                  <span className="font-medium text-sm">Notifications</span>
                  {notifications.length > 0 && (
                    <Badge className="ml-auto bg-red-500 text-white text-xs">
                      {notifications.length}
                    </Badge>
                  )}
                </Link>
              </>
            )}
            
            {/* User/Login section in mobile menu */}
            <div className="border-t border-gray-200 mt-2 pt-2">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowLogoutDialog(true);
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors text-gray-600 hover:bg-gray-50 w-full"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm">{user.email}</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    base44.auth.redirectToLogin();
                  }}
                  className="flex items-center gap-3 px-4 py-2.5 transition-colors text-emerald-600 hover:bg-emerald-50 w-full"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium text-sm">Connexion</span>
                </button>
              )}
            </div>
          </nav>
        )}
      </header>

      {/* Desktop Sidebar - More discreet */}
      <aside 
        className={`hidden md:block fixed left-0 top-0 h-full bg-white/90 backdrop-blur-md border-r border-gray-200/50 shadow-md z-50 transition-all duration-300 flex flex-col ${
          sidebarCollapsed ? 'w-16' : 'w-56'
        }`}
      >
        <div className="p-4 border-b border-gray-200/50 flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <h1 className="text-lg font-bold text-emerald-600 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                SpotMe
              </h1>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="w-full flex justify-center">
              <MapPin className="w-5 h-5 text-emerald-600" />
            </div>
          )}
        </div>
        
        <nav className="p-3 space-y-1 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPageName === item.page;
            return (
              <Link
                key={item.page}
                to={createPageUrl(item.page)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                  isActive
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
              </Link>
            );
          })}

          {/* Admin section */}
          {user?.role === 'admin' && (
            <>
              {!sidebarCollapsed && (
                <div className="pt-3 pb-1">
                  <p className="text-xs font-semibold text-gray-500 px-3">Administration</p>
                </div>
              )}
              {sidebarCollapsed && <div className="border-t border-gray-200 my-2" />}
              
              {adminNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                      isActive
                        ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    } ${sidebarCollapsed ? 'justify-center' : ''}`}
                    title={sidebarCollapsed ? item.name : ''}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span className="font-medium">{item.name}</span>}
                  </Link>
                );
              })}

              <Link
                to={createPageUrl('Notifications')}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm ${
                  currentPageName === 'Notifications'
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm"
                    : "text-gray-600 hover:bg-gray-50"
                } ${sidebarCollapsed ? 'justify-center' : ''}`}
                title={sidebarCollapsed ? 'Notifications' : ''}
              >
                <div className="relative">
                  <Bell className="w-4 h-4 flex-shrink-0" />
                  {notifications.length > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-white text-[10px]">
                      {notifications.length}
                    </Badge>
                  )}
                </div>
                {!sidebarCollapsed && (
                  <span className="font-medium flex items-center gap-2">
                    Notifications
                    {notifications.length > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">
                        {notifications.length}
                      </Badge>
                    )}
                  </span>
                )}
              </Link>
            </>
          )}

          {/* User/Login section */}
          <div className="pt-2 border-t border-gray-200/50">
            {user ? (
              <button
                onClick={() => setShowLogoutDialog(true)}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm text-gray-600 hover:bg-gray-50 w-full ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? user.email : ''}
              >
                <User className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && (
                  <span className="font-medium truncate">{user.email}</span>
                )}
              </button>
            ) : (
              <button
                onClick={() => base44.auth.redirectToLogin()}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-sm hover:from-emerald-600 hover:to-teal-700 w-full ${
                  sidebarCollapsed ? 'justify-center' : ''
                }`}
                title={sidebarCollapsed ? 'Connexion' : ''}
              >
                <LogIn className="w-4 h-4 flex-shrink-0" />
                {!sidebarCollapsed && <span className="font-medium">Connexion</span>}
              </button>
            )}
          </div>
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-gray-200/50">
          <Button
            variant="outline"
            size={sidebarCollapsed ? "icon" : "sm"}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={`border-emerald-200 hover:bg-emerald-50 ${
              sidebarCollapsed ? 'w-full h-8' : 'w-full h-8'
            }`}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4 mr-2" />
                <span className="text-xs">Réduire</span>
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={`w-screen max-w-screen overflow-x-hidden md:transition-all md:duration-300 ${
          sidebarCollapsed ? 'md:ml-16' : 'md:ml-56'
        }`}
      >
        {children}
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="z-[10000]">
          <AlertDialogHeader>
            <AlertDialogTitle>Se déconnecter ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir vous déconnecter de votre compte ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogoutConfirm}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Se déconnecter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

