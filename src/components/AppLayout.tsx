import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  Bell,
  Circle,
  ClipboardCheck, GraduationCap, LayoutDashboard,
  LogOut, Menu, MessageSquare, Trophy, Video
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Комнаты", path: "/rooms", icon: Video },
  { title: "Форум", path: "/forum", icon: MessageSquare },
  { title: "Тесты", path: "/tests", icon: ClipboardCheck },
  { title: "Leaderboard", path: "/leaderboard", icon: Trophy },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [userProfile, setUserProfile] = useState<{username: string, avatar_url: string | null} | null>(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchInitialData();
    
    // Закрытие при клике вне
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 1. Загрузка профиля
    const { data: profile } = await supabase.from('profiles').select('username, avatar_url').eq('id', user.id).single();
    if (profile) setUserProfile(profile);

    // 2. Загрузка уведомлений
    const { data: notifs } = await supabase
      .from('notifications')
      .select('*, actor:profiles(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notifs) {
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.is_read).length);
    }

    // 3. Realtime подписка
    supabase
      .channel(`notifs-${user.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${user.id}` 
      }, (payload) => {
        setNotifications(prev => [payload.new, ...prev].slice(0, 10));
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();
  };

  const handleToggleNotifications = async () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);

    if (nextState && unreadCount > 0) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform duration-300 lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-16 items-center gap-3 border-b border-border px-6">
          <GraduationCap className="h-8 w-8 text-primary" />
          <span className="text-xl font-black tracking-tight uppercase">EduStream</span>
        </div>

        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all",
                  isActive ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}>
                <item.icon className="h-5 w-5" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-5 w-5" />
            Выйти
          </button>
        </div>
      </aside>

      {/* Content Area */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8">
          <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-secondary rounded-lg lg:hidden">
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex items-center ml-auto gap-2 sm:gap-4">
            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button onClick={handleToggleNotifications} className={cn(
                "relative p-2 rounded-full transition-all",
                showNotifications ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary"
              )}>
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-white flex items-center justify-center border-2 border-card animate-bounce">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-border bg-muted/30 flex justify-between items-center">
                    <span className="text-xs font-black uppercase tracking-widest">Уведомления</span>
                    {unreadCount > 0 && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((n) => (
                        <Link key={n.id} to={`/forum/${n.question_id}`} onClick={() => setShowNotifications(false)}
                          className={cn("flex gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors", !n.is_read && "bg-primary/[0.03]")}>
                          <div className="mt-1"><Circle className={cn("h-2 w-2 fill-current", n.is_read ? "text-transparent" : "text-primary")} /></div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium leading-tight">{n.content}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </Link>
                      ))
                    ) : (
                      <div className="p-10 text-center text-muted-foreground text-sm font-medium">Нет новых уведомлений</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="h-6 w-px bg-border mx-1" />

            {/* Profile Link */}
            <Link to="/profile" className="flex items-center gap-3 rounded-full p-1 pr-4 hover:bg-secondary transition-all">
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center overflow-hidden border border-primary/20 shadow-sm shadow-primary/20 font-black text-white text-xs uppercase">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} className="h-full w-full object-cover" alt="avatar" />
                ) : (
                  userProfile?.username?.charAt(0) || "U"
                )}
              </div>
              <span className="hidden sm:inline text-sm font-bold tracking-tight">Профиль</span>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-8 bg-muted/5">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}