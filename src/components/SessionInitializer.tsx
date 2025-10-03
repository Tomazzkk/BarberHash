import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSessionStore } from '@/hooks/useSessionStore';

const SessionInitializer = () => {
  const fetchSessionData = useSessionStore((state) => state.fetchSessionData);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      fetchSessionData(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { user } = session;
        // Um novo usuário geralmente tem last_sign_in_at como nulo no primeiro login após a confirmação
        if (user.last_sign_in_at === null) {
          const phone = user.user_metadata.phone;
          const name = user.user_metadata.full_name || 'novo usuário';
          if (phone) {
            supabase.functions.invoke('send-whatsapp', {
              body: { to: phone, message: `Bem-vindo ao Barber#, ${name}! Sua conta foi criada e confirmada com sucesso.` }
            }).catch(e => console.error("Failed to send welcome WhatsApp message:", e));
          }
        }
      }
      fetchSessionData(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchSessionData]);

  return null;
};

export default SessionInitializer;