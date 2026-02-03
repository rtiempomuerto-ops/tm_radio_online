
import { createClient } from '@supabase/supabase-js';
import { ChatMessage, Advertisement } from '../types';

// Credenciales de Supabase
const SUPABASE_URL = 'https://kalnpagaxknpvqxkgknt.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_ruVj7jz2hVKauMGJwrykew_fmVUQajz'; 

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- CHAT ---
export const saveChatMessage = async (userName: string, message: string, imageUrl: string[] | null = null, isNews: boolean = false) => {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{ user_name: userName, message, image_url: imageUrl || [], is_news: isNews, status: 'visible' }])
    .select();
  if (error) throw error;
  return data[0];
};

export const getChatHistory = async () => {
  const { data, error } = await supabase
    .from('chat_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return [];
  return (data || []).reverse().map(m => ({
    id: m.id,
    user: m.user_name,
    text: m.message,
    images: m.image_url || [],
    isNews: m.is_news,
    timestamp: new Date(m.created_at),
    status: m.status
  })) as ChatMessage[];
};

export const subscribeToChat = (callback: (payload: any) => void) => {
  return supabase.channel('chat').on('postgres_changes', { event: '*', schema: 'public', table: 'chat_messages' }, callback).subscribe();
};

// --- MATES (CONTADOR GLOBAL) ---
export const getGlobalMates = async () => {
  try {
    const { data, error } = await supabase
      .from('global_stats')
      .select('counter_value')
      .eq('id', 'mates_cebados')
      .maybeSingle();
    
    if (error) return 0;
    return data?.counter_value || 0;
  } catch {
    return 0;
  }
};

export const logMateAction = async (userName: string) => {
  // 1. Obtener valor actual
  const currentVal = await getGlobalMates();
  const nextVal = currentVal + 1;

  // 2. UPSERT: Si no existe 'mates_cebados', lo crea. Si existe, lo actualiza.
  // ESTA ES LA CLAVE PARA QUE EL BOTÓN FUNCIONE SIEMPRE.
  const { error: upsertError } = await supabase
    .from('global_stats')
    .upsert({ 
      id: 'mates_cebados', 
      counter_value: nextVal, 
      updated_at: new Date().toISOString() 
    });

  if (upsertError) throw upsertError;

  // 3. Registrar actividad en el muro (opcional pero recomendado)
  await supabase.from('contributions').insert([{ 
    user_name: userName, 
    item_type: 'Mate Virtual', 
    amount: 0 
  }]);

  return nextVal;
};

export const subscribeToGlobalStats = (callback: (val: number) => void) => {
  return supabase.channel('stats_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'global_stats' }, (payload) => {
      if (payload.new && payload.new.id === 'mates_cebados') {
        callback(payload.new.counter_value);
      }
    })
    .subscribe();
};

// --- OTROS SERVICIOS ---
export const registerContribution = async (userName: string, itemType: string, amount: number) => {
  await supabase.from('contributions').insert([{ user_name: userName, item_type: itemType, amount }]);
};

export const updateChatMessageStatus = async (messageId: number, newStatus: 'visible' | 'hidden' | 'deleted') => {
  await supabase.from('chat_messages').update({ status: newStatus }).eq('id', messageId);
};

export const sendRadioGreeting = async (userName: string, location: string, message: string) => {
  await supabase.from('radio_greetings').insert([{ user_name: userName, location, message }]);
};

// Fix: Added getGreetingsHistory as requested by GreetingsWall.tsx
export const getGreetingsHistory = async () => {
  const { data, error } = await supabase
    .from('radio_greetings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) return [];
  return data;
};

// Fix: Added subscribeToGreetings as requested by GreetingsWall.tsx
export const subscribeToGreetings = (callback: (payload: any) => void) => {
  return supabase.channel('greetings').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_greetings' }, callback).subscribe();
};

export const getRecentContributions = async () => {
  const { data } = await supabase.from('contributions').select('*').order('created_at', { ascending: false }).limit(10);
  return data || [];
};

export const subscribeToContributions = (callback: (payload: any) => void) => {
  return supabase.channel('contributions').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, (p) => callback(p.new)).subscribe();
};

export const submitPodcastProposal = async (proposal: any) => {
  await supabase.from('podcast_proposals').insert([proposal]);
};

export const submitCitizenReport = async (name: string, title: string, description: string, images: string[]) => {
  const content = `[REPORTE CIUDADANO]\nTITULO: ${title}\nREPORTE: ${description}`;
  await supabase.from('chat_messages').insert([{ 
    user_name: name, 
    message: content, 
    image_url: images, 
    is_news: true, 
    status: 'hidden' 
  }]);
};

export const logSongRequest = async (song: string, notes: string, mode: string) => {
  await supabase.from('song_requests').insert([{ song_title: song, notes: notes, submission_mode: mode, status: 'pending' }]);
};

export const getActiveAdvertisements = async (slot: string = 'top'): Promise<Advertisement[]> => {
  const nowISO = new Date().toISOString();
  const { data } = await supabase
    .from('advertisements')
    .select('*')
    .eq('slot', slot)
    .eq('status', 'active')
    .gt('expires_at', nowISO)
    .order('created_at', { ascending: false })
    .limit(3);
  return (data || []) as Advertisement[];
};

export const submitAdvertisement = async (adData: any, slot: string = 'top') => {
  const now = new Date();
  const expiresAt = new Date(now.setDate(now.getDate() + parseInt(adData.duration_days)));
  await supabase.from('advertisements').insert([{
    slot,
    title: adData.title,
    subtitle: adData.subtitle,
    icon_key: adData.icon_key,
    image_url: adData.image_url,
    target_url: adData.target_url,
    owner_email: adData.owner_email,
    duration_days: adData.duration_days,
    status: 'active', 
    expires_at: expiresAt
  }]);
};

// Fix: Added getTickerNews as requested by BreakingNewsTicker.tsx
export const getTickerNews = async () => {
  const { data, error } = await supabase
    .from('ticker_news')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data;
};

// Fix: Added addTickerNews as requested by BreakingNewsTicker.tsx
export const addTickerNews = async (content: string) => {
  const { data, error } = await supabase
    .from('ticker_news')
    .insert([{ content }])
    .select();
  if (error) throw error;
  return data[0];
};

// Fix: Added subscribeToTickerNews as requested by BreakingNewsTicker.tsx
export const subscribeToTickerNews = (callback: (payload: any) => void) => {
  return supabase.channel('ticker').on('postgres_changes', { event: '*', schema: 'public', table: 'ticker_news' }, callback).subscribe();
};

// Fix: Added deleteTickerNews as requested by BreakingNewsTicker.tsx
export const deleteTickerNews = async (id: number | string) => {
  const { error } = await supabase
    .from('ticker_news')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export interface CommunityActivity {
  id: string;
  type: 'contribution' | 'greeting' | 'request' | 'report';
  user: string;
  detail: string;
  subDetail?: string; 
  timestamp: Date;
}

export const getRecentCommunityActivity = async (): Promise<CommunityActivity[]> => {
  const [contributions, greetings, requests, reports] = await Promise.all([
    supabase.from('contributions').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('radio_greetings').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('song_requests').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('chat_messages').select('*').eq('is_news', true).eq('status', 'visible').order('created_at', { ascending: false }).limit(5)
  ]);

  const activities: CommunityActivity[] = [];
  contributions.data?.forEach((c: any) => activities.push({ id: `c_${c.id}`, type: 'contribution', user: c.user_name, detail: c.item_type, timestamp: new Date(c.created_at) }));
  greetings.data?.forEach((g: any) => activities.push({ id: `g_${g.id}`, type: 'greeting', user: g.user_name, detail: g.message, subDetail: g.location, timestamp: new Date(g.created_at) }));
  requests.data?.forEach((r: any) => activities.push({ id: `r_${r.id}`, type: 'request', user: 'Oyente', detail: r.song_title, subDetail: r.notes, timestamp: new Date(r.created_at) }));
  
  return activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, 15);
};

export const subscribeToCommunityActivity = (callback: (activity: CommunityActivity) => void) => {
  return supabase.channel('community_feed')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contributions' }, (payload) => {
      callback({ id: `c_${payload.new.id}`, type: 'contribution', user: payload.new.user_name, detail: payload.new.item_type, timestamp: new Date(payload.new.created_at) });
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'radio_greetings' }, (payload) => {
      callback({ id: `g_${payload.new.id}`, type: 'greeting', user: payload.new.user_name, detail: payload.new.message, subDetail: payload.new.location, timestamp: new Date(payload.new.created_at) });
    })
    .subscribe();
};
