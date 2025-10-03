import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from './useSessionStore';

export const useUnreadNotifications = () => {
    const [count, setCount] = useState(0);
    const { user } = useSessionStore();

    useEffect(() => {
        if (!user) return;

        const fetchCount = async () => {
            const { count, error } = await supabase
                .from('notifications')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('is_read', false);
            
            if (!error) {
                setCount(count || 0);
            }
        };

        fetchCount();

        const channel = supabase.channel(`unread-notifications-${user.id}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
            () => fetchCount()
        ).subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return count;
};