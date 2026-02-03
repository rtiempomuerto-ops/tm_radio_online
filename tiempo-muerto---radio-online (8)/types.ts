
export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  category: 'local' | 'community' | 'editorial';
  timestamp: Date | string;
  author?: string; // Nombre del medio o periodista
  image?: string;
  url?: string; // URL externa a la noticia real
  source?: string; // Nombre del medio (ej: 03442, La Pirámide)
}

export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  timestamp: Date;
  isModerator?: boolean;
  images?: string[];
  isNews?: boolean;
  status?: 'visible' | 'hidden' | 'deleted';
}

export interface WeatherData {
  temp: number;
  condition: string;
  location: string;
  forecast: Array<{ day: string; temp: number; icon: string }>;
}

export interface SongMetadata {
  title: string;
  artist: string;
  albumArt: string;
  startTime: number;
}

export interface PodcastItem {
  id: string;
  title: string;
  author: string;
  description: string;
  audioUrl: string;
  coverImage?: string;
  timestamp: Date;
  status: 'pending' | 'approved';
}

export interface Advertisement {
  id: string;
  title: string;
  subtitle: string;
  icon_key: string; // nombre del icono fontawesome o emoji
  image_url?: string; // URL de la imagen/poster del anuncio
  target_url: string;
  owner_email: string;
  duration_days: number;
  created_at: Date;
  expires_at: Date;
  status: 'pending_payment' | 'active' | 'expired';
}
