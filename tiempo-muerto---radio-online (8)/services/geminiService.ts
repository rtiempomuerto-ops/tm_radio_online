
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { NewsItem } from "../types";

// Configuración de la API y el modelo
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const GEMINI_MODEL = 'gemini-3-flash-preview'; 

const DURATIONS = {
  ONE_HOUR: 60 * 60 * 1000,
};

// Incrementamos versión para invalidar cachés viejos/rotos
const CACHE_KEYS = {
  WEATHER: 'tm_weather_cache_v4', 
  NEWS: 'tm_news_json_cache_v4'
};

// NOTICIAS DE RESPALDO (EMERGENCIA)
// Se muestran solo si falla la API Y no hay caché guardado.
const FALLBACK_NEWS: NewsItem[] = [
  {
    id: 'fb_1',
    title: 'Radio Tiempo Muerto: La voz de Concepción del Uruguay',
    excerpt: 'Seguimos transmitiendo las 24hs con la mejor programación local y regional. Comunicate con nosotros al WhatsApp.',
    category: 'community',
    timestamp: 'Institucional',
    author: 'Estación',
    source: 'Tiempo Muerto',
    url: '#'
  },
  {
    id: 'fb_2',
    title: 'Clima en la región: Se esperan condiciones variables',
    excerpt: 'Consultá el pronóstico extendido en nuestra sección de clima. Temperatura agradable para la jornada en la Histórica.',
    category: 'local',
    timestamp: 'Servicio',
    author: 'Redacción',
    source: 'Clima',
    url: '#'
  },
  {
    id: 'fb_3',
    title: 'Agenda Cultural: Actividades para el fin de semana',
    excerpt: 'La ciudad ofrece diversas propuestas artísticas, musicales y ferias en la Plaza Ramírez y zona portuaria.',
    category: 'local',
    timestamp: 'Agenda',
    author: 'Cultura',
    source: 'Ciudad',
    url: '#'
  },
  {
    id: 'fb_4',
    title: 'Deportes: Actualidad de los clubes locales',
    excerpt: 'Gimnasia y Esgrima, Parque Sur y Rocamora continúan sus actividades. Toda la info en nuestro bloque deportivo.',
    category: 'local',
    timestamp: 'Deportes',
    author: 'Deportes',
    source: 'Local',
    url: '#'
  }
];

/**
 * Helper seguro para leer caché
 */
const getCacheEntry = (key: string) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn("Error leyendo caché", e);
    return null;
  }
};

const saveToCache = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify({
      timestamp: Date.now(),
      data: data
    }));
  } catch (e) {
    console.warn("Error guardando caché", e);
  }
};

/**
 * Extractor JSON robusto
 */
const extractJson = (text: string): string => {
  if (!text) return "[]";
  
  // Intenta encontrar array primero
  const firstSquare = text.indexOf('[');
  const lastSquare = text.lastIndexOf(']');
  
  if (firstSquare !== -1 && lastSquare !== -1 && lastSquare > firstSquare) {
      return text.substring(firstSquare, lastSquare + 1);
  }

  // Si no, intenta encontrar objeto
  const firstCurly = text.indexOf('{');
  const lastCurly = text.lastIndexOf('}');
  
  if (firstCurly !== -1 && lastCurly !== -1 && lastCurly > firstCurly) {
      return text.substring(firstCurly, lastCurly + 1);
  }

  return "[]";
};

// --- FUNCIÓN DE NOTICIAS BLINDADA ---
export const getLocalNews = async (topic: string = 'general'): Promise<NewsItem[]> => {
  const safeTopic = topic.trim().replace(/\s+/g, '_').toLowerCase();
  const cacheKey = `${CACHE_KEYS.NEWS}_${safeTopic}`;
  const now = Date.now();
  
  const cacheEntry = getCacheEntry(cacheKey);
  const isFresh = cacheEntry && (now - cacheEntry.timestamp < DURATIONS.ONE_HOUR);

  // 1. CAPA 1: Caché Fresco
  if (isFresh && Array.isArray(cacheEntry.data) && cacheEntry.data.length > 0) {
    return cacheEntry.data;
  }

  // 2. CAPA 2: API Gemini
  try {
    const prompt = `Actúa como un agregador de noticias.
    Busca en Google noticias ACTUALES (de las últimas 24 horas) para: "${topic}, Concepción del Uruguay, Entre Ríos".
    
    Fuentes prioritarias: 03442, La Pirámide, El Miércoles Digital, Diario La Calle, Diario Junio.
    
    Devuelve estrictamente un ARRAY JSON con 4 noticias.
    Formato: [{"title": "Titular", "source": "Medio", "url": "Enlace", "excerpt": "Resumen corto", "timestamp": "Hace X hs"}]`;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { 
        tools: [{ googleSearch: {} }],
        temperature: 0.1 
      }
    });

    const text = response.text || "[]";
    const cleanJson = extractJson(text);
    
    let newsItems: any[] = [];
    try {
        newsItems = JSON.parse(cleanJson);
    } catch (parseError) {
        console.warn("Error parseando JSON de noticias, usando fallback de caché");
    }

    if (Array.isArray(newsItems) && newsItems.length > 0) {
        const formattedNews: NewsItem[] = newsItems.map((item: any, index: number) => ({
          id: `ai_${now}_${index}`,
          title: item.title || "Noticia Local",
          excerpt: item.excerpt || "Sin resumen disponible.",
          category: 'local',
          timestamp: item.timestamp || "Hoy",
          author: item.source || 'Redacción',
          source: item.source || "Info Gral",
          url: item.url || "#"
        }));
        
        saveToCache(cacheKey, formattedNews);
        return formattedNews;
    }
  } catch (e) {
    console.error("Error API Noticias:", e);
  }

  // 3. CAPA 3: Caché vencido (Stale)
  if (cacheEntry && Array.isArray(cacheEntry.data) && cacheEntry.data.length > 0) {
      return cacheEntry.data; // Devolvemos data vieja antes que nada
  }

  // 4. CAPA 4: Fallback estático (Nunca vacío)
  return FALLBACK_NEWS.map(item => ({ ...item, id: `fb_${Date.now()}_${Math.random()}` }));
};

// --- FUNCIÓN DE CLIMA Y RÍO BLINDADA ---
export const getFullLocalData = async () => {
  const cacheKey = CACHE_KEYS.WEATHER;
  const now = Date.now();
  
  const cacheEntry = getCacheEntry(cacheKey);
  const isFresh = cacheEntry && (now - cacheEntry.timestamp < DURATIONS.ONE_HOUR);

  // 1. Caché Fresco
  if (isFresh && cacheEntry.data) {
      return { ...cacheEntry.data, isFromCache: true };
  }

  // 2. API
  try {
    const prompt = `
    Busca en Google: "Clima actual Concepción del Uruguay" y "Altura río Uruguay prefectura Concepción del Uruguay".
    Genera un JSON: {
      "current": { "temp": "25", "condition": "Soleado", "humidity": "60%", "wind": "N 10km/h", "feelsLike": "27", "pressure": "1013 hPa", "uvIndex": "Alto" }, 
      "river": { "height": "2.10", "status": "Estacionario" }, 
      "forecast": [{"day": "Lun", "icon": "fa-sun", "min": 18, "max": 30}, {"day": "Mar", "icon": "fa-cloud", "min": 20, "max": 28}, {"day": "Mie", "icon": "fa-rain", "min": 15, "max": 22}]
    }`;
    
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: { tools: [{ googleSearch: {} }] }
    });

    const text = response.text || "{}";
    const cleanJson = extractJson(text);
    const data = JSON.parse(cleanJson);
      
    if (data && data.current) {
      // Limpieza básica de datos
      if(data.current.temp) data.current.temp = String(data.current.temp).replace('°C','').replace('°','').trim();
      
      saveToCache(cacheKey, data);
      return { ...data, isFromCache: false };
    }
  } catch (e) {
    console.error("Error API Clima:", e);
  }

  // 3. Caché Vencido
  if (cacheEntry && cacheEntry.data) {
      return { ...cacheEntry.data, isFromCache: true, error: true }; // Marcamos error para UI pero mostramos datos
  }

  // 4. Fallback Seguro (UI Vacía pero funcional)
  return { 
      current: { temp: '--', condition: 'Sin datos', humidity: '--', wind: '--', feelsLike: '--', pressure: '--', uvIndex: '--' }, 
      river: { height: '--', status: '--' },
      forecast: [],
      isFromCache: false,
      error: true
  };
};

// --- FUNCIÓN DE CHAT (REMANSO) ---
export const getChatResponse = async (prompt: string): Promise<GenerateContentResponse> => {
  try {
    return await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: "Sos Remanso, el asistente de 'Tiempo Muerto Radio'. Respondé breve, amable y con modismos entrerrianos.",
      },
    });
  } catch (e: any) {
    return { text: "¡Disculpe aparcero! El satélite está con interferencia. Pruebe en un ratito." } as any;
  }
};
