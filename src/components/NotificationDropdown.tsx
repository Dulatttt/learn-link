import { supabase } from "@/lib/supabase";
import { Bell, Circle, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function NotificationDropdown() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();

    // ПОДПИСКА НА REAL-TIME (Новые уведомления прилетают мгновенно)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        () => loadNotifications()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  async function loadNotifications() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notifications')
      .select('*, actor:profiles(username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.is_read).length || 0);
  }

  const markAsRead = async (id: string, questionId: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setIsOpen(false);
    loadNotifications();
    navigate(`/forum/${questionId}`);
  };

  return (
    <div className="relative">
      {/* Кнопка колокольчика */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-secondary transition-colors"
      >
        <Bell className={`h-6 w-6 ${unreadCount > 0 ? "text-primary" : "text-muted-foreground"}`} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white border-2 border-background">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Выпадающее меню */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 z-50 rounded-2xl border border-border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h3 className="font-black uppercase text-xs tracking-widest">Уведомления</h3>
              {unreadCount > 0 && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">Новые</span>}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.question_id)}
                    className={`p-4 flex gap-3 cursor-pointer hover:bg-secondary transition-colors border-b border-border/50 last:border-0 ${!n.is_read ? "bg-primary/5" : ""}`}
                  >
                    <div className="h-10 w-10 shrink-0 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {n.actor?.avatar_url ? (
                        <img src={n.actor.avatar_url} className="h-full w-full object-cover" />
                      ) : (
                        <MessageSquare className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm leading-tight">
                        <span className="font-bold">{n.actor?.username || "Кто-то"}</span> {n.content}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {!n.is_read && <Circle className="h-2 w-2 fill-primary text-primary mt-2" />}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-sm text-muted-foreground font-medium">
                  У вас пока нет уведомлений
                </div>
              )}
            </div>
            
            <div className="p-3 bg-secondary/30 text-center">
              <button className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors">
                Показать все
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}