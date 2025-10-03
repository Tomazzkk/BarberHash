import { create } from 'zustand';
import { Session, User, PostgrestError } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Sede } from '@/components/forms/SedeForm';

export type ProfileRole = 'dono' | 'barbeiro' | 'cliente_final' | 'gerente' | 'supervisor' | 'admin';

type Profile = {
  id: string;
  full_name: string | null;
  role: ProfileRole;
  avatar_url: string | null;
  owner_id: string | null;
};

type AppConfig = {
  id: string;
  user_id: string;
  plano_id: string | null;
  theme: string | null;
  logo_url: string | null;
  login_background_url: string | null;
  dashboard_hero_url: string | null;
  loyalty_enabled: boolean;
  loyalty_target_count: number;
  loyalty_reward_service_id: string | null;
  sinal_enabled: boolean;
  training_mode_active: boolean;
  subscription_status: string | null;
  subscription_ends_at: string | null;
  ga4_measurement_id: string | null;
  custom_features?: string[] | null;
  plan_feature_enabled: boolean;
  mercadopago_enabled: boolean;
  mercadopago_access_token: string | null;
};

type Plan = {
    id: string;
    name: string;
    features: string[];
}

type LoyaltyProgress = {
    current_count: number;
    target_count: number;
    reward_service_name: string | null;
}

export type BarberPermissions = {
  pode_ver_agenda_completa: boolean;
  pode_ver_financeiro_completo: boolean;
  pode_editar_servicos: boolean;
  pode_gerenciar_clientes: boolean;
};

type SessionState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  originalProfile: Profile | null; // To store the real profile during simulation
  config: AppConfig | null;
  plan: Plan | null;
  loyaltyProgress: LoyaltyProgress | null;
  loading: boolean;
  error: Error | PostgrestError | null;
  ownerId: string | null;
  barberId: string | null;
  permissions: BarberPermissions | null;
  sedes: Sede[];
  selectedSede: Sede | null;
  trainingModeActive: boolean;
  isChangingView: boolean;
};

type SessionActions = {
  fetchSessionData: (currentSession: Session | null) => Promise<void>;
  changeSede: (sedeId: string | 'all') => void;
  logout: () => Promise<void>;
  setSimulatedRole: (role: ProfileRole | null, onComplete: () => void) => void;
};

const initialState: SessionState = {
  session: null,
  user: null,
  profile: null,
  originalProfile: null,
  config: null,
  plan: null,
  loyaltyProgress: null,
  loading: true,
  error: null,
  ownerId: null,
  barberId: null,
  permissions: null,
  sedes: [],
  selectedSede: null,
  trainingModeActive: false,
  isChangingView: false,
};

export const useSessionStore = create<SessionState & SessionActions>((set, get) => ({
  ...initialState,

  fetchSessionData: async (currentSession) => {
    set({ loading: true });

    if (!currentSession) {
      set({ ...initialState, loading: false });
      return;
    }

    set({
        session: currentSession,
        user: currentSession.user,
        error: null,
        config: null,
        plan: null,
        loyaltyProgress: null,
        ownerId: null,
        barberId: null,
        permissions: null,
        sedes: [],
        selectedSede: null,
        trainingModeActive: false,
        originalProfile: null, // Reset simulation on new session
    });
    
    const currentUser = currentSession.user;

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles').select('id, full_name, role, avatar_url, owner_id').eq('id', currentUser.id).single();
      if (profileError) throw profileError;
      
      set({ profile: profileData as Profile });

      let ownerIdForConfig: string | null = null;
      let clientIdForLoyalty: string | null = null;
      let newSedes: Sede[] = [];
      let newSelectedSede: Sede | null = null;

      if (profileData.role === 'cliente_final') {
        const { data: sedesData, error: sedesError } = await supabase.rpc('get_my_barbershop_sedes');
        if (sedesError) {
            console.error("Error fetching barbershop sedes for client:", sedesError);
        } else if (sedesData && sedesData.length > 0) {
            newSedes = sedesData;
            ownerIdForConfig = sedesData[0].user_id;
        }
      } else { // For staff and dono
        ownerIdForConfig = profileData.role === 'dono' || profileData.role === 'admin' ? currentUser.id : profileData.owner_id;
        if (ownerIdForConfig) {
            const { data: sedesData, error: sedesError } = await supabase.from('sedes').select('*').eq('user_id', ownerIdForConfig).order('is_matriz', { ascending: false }).order('created_at', { ascending: true });
            if (sedesError) { console.error("Error fetching sedes:", sedesError); }
            newSedes = sedesData || [];
        }
      }

      if (newSedes.length > 0) {
        newSelectedSede = newSedes[0]; // The first one is either the main or the oldest.
      } else {
        newSelectedSede = null;
      }

      set({ ownerId: ownerIdForConfig });

      if (profileData.role === 'barbeiro' || profileData.role === 'supervisor') {
        const { data: barberRecord, error: barberError } = await supabase.from('barbeiros').select('id, sede_id').eq('profile_id', currentUser.id).single();
        if (barberError) { console.error("Error fetching barber record:", barberError); }
        if (barberRecord) {
          set({ barberId: barberRecord.id });
          if (barberRecord.sede_id) {
            const sede = newSedes.find(s => s.id === barberRecord.sede_id);
            if (sede) newSelectedSede = sede;
          }
          const { data: permissionsData, error: permissionsError } = await supabase.from('barbeiro_permissoes').select('*').eq('barbeiro_id', barberRecord.id).single();
          if (permissionsError) { console.error("Error fetching barber permissions:", permissionsError); }
          set({ permissions: permissionsData });
        }
      } else if (profileData.role === 'cliente_final') {
        const { data: clientRecord, error: clientError } = await supabase.from('clientes').select('id').eq('email', currentUser.email).single();
        if (clientError) { console.error("Error fetching client record:", clientError); }
        if (clientRecord) {
          clientIdForLoyalty = clientRecord.id;
        }
      }

      set({ sedes: newSedes, selectedSede: newSelectedSede });

      if (ownerIdForConfig) {
        const { data: configData, error: configError } = await supabase.from('config_cliente').select('*').eq('user_id', ownerIdForConfig).maybeSingle();
        if (configError) { console.error("Error fetching client config:", configError); }
        if (configData) {
          const planFeatureEnabled = configData.custom_features?.includes('plan_system') || false;
          const fullConfigData = { ...configData, plan_feature_enabled: planFeatureEnabled };
          set({ config: fullConfigData, trainingModeActive: configData.training_mode_active || false });
          
          let finalPlan: Plan | null = null;
          if (configData.plano_id) {
              const { data: planData, error: planError } = await supabase.from('planos').select('*').eq('id', configData.plano_id).single();
              if (planError) { console.error("Error fetching plan data:", planError); }
              if (planData) {
                  finalPlan = planData;
              }
          }
      
          if (configData.custom_features !== null && typeof configData.custom_features !== 'undefined') {
              if (finalPlan) {
                  finalPlan.features = configData.custom_features;
              } else {
                  finalPlan = {
                      id: 'custom-' + configData.user_id,
                      name: 'Plano Customizado',
                      features: configData.custom_features,
                  };
              }
          }
          set({ plan: finalPlan });

          if (clientIdForLoyalty && configData.loyalty_enabled) {
            const { data: loyaltyData, error: loyaltyError } = await supabase.from('cliente_fidelidade').select('current_count').eq('cliente_id', clientIdForLoyalty).single();
            if (loyaltyError) { console.error("Error fetching loyalty data:", loyaltyError); }
            let rewardServiceName: string | null = null;
            if (configData.loyalty_reward_service_id) {
              const { data: serviceData, error: serviceError } = await supabase.from('servicos').select('name').eq('id', configData.loyalty_reward_service_id).single();
              if (serviceError) { console.error("Error fetching reward service name:", serviceError); }
              rewardServiceName = serviceData?.name || null;
            }
            set({ loyaltyProgress: {
              current_count: loyaltyData?.current_count || 0,
              target_count: configData.loyalty_target_count || 10,
              reward_service_name: rewardServiceName,
            }});
          }
        }
      }
    } catch (e: any) {
      set({ error: e });
      console.error("Error fetching session data:", e);
    } finally {
      set({ loading: false });
    }
  },

  changeSede: (sedeId) => {
    const { sedes } = get();
    if (sedeId === 'all') {
      set({ selectedSede: null });
      localStorage.setItem('selectedSedeId', 'all');
    } else {
      const newSede = sedes.find(s => s.id === sedeId);
      if (newSede) {
        set({ selectedSede: newSede });
        localStorage.setItem('selectedSedeId', sedeId);
      }
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ ...initialState, loading: false });
  },

  setSimulatedRole: (role, onComplete) => {
    const { profile, originalProfile } = get();
    if (!profile) return;

    set({ isChangingView: true });

    if (role === null) {
        if (originalProfile) {
            set({ profile: originalProfile, originalProfile: null });
        }
    } else {
        const newOriginalProfile = originalProfile || profile;
        set({
            originalProfile: newOriginalProfile,
            profile: { ...profile, role },
        });
    }
    
    onComplete();
    
    set({ isChangingView: false });
  },
}));