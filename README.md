# 🎬 Verlet-Cine

Sistema de streaming multimedia personal, ultraligero, sin anuncios y auto-hospedado con interfaz web multi-dispositivo y API Gateway de alta velocidad que conecta **Jellyfin**, **Prowlarr**, **qBittorrent** y **Bazarr / OpenSubtitles**.

Diseñado específicamente para funcionar con fluidez tanto en dispositivos de recursos limitados como **Smart TVs (LG webOS, Samsung Tizen, Fire TV Stick, Google TV / Android TV)**, **móviles (iOS Safari, Android PWA)** y navegadores de escritorio, con acceso global seguro mediante **Cloudflare Tunnel (`cloudflared`)** o red local.

---

## 🏗 Arquitectura del Sistema

```
                        ┌──────────────────────────────────────────────┐
                        │        CLOUDFLARE ZERO TRUST TUNNEL          │
                        │        https://cine.tu-dominio.com           │
                        └──────────────────────┬───────────────────────┘
                                               │ (Túnel Cifrado Saliente)
                                               ▼
     ┌──────────────────────────────────────────────────────────────────────────────────┐
     │                               DISPOSITIVOS CLIENTE                               │
     │  ┌───────────────────────┐   ┌────────────────────────┐   ┌───────────────────┐  │
     │  │  Smart TV (webOS /    │   │  iPhone / Android      │   │  PC / Mac / Tablet│  │
     │  │  Tizen / Fire / Google│   │  (PWA Pantalla Inicio) │   │  (Chrome / Edge)  │  │
     │  │  [D-Pad Navigation]   │   │  [Cuadrícula 2x2 Móvil]│   │  [HLS.js / Direct]│  │
     │  └──────────┬────────────┘   └───────────┬────────────┘   └─────────┬─────────┘  │
     └─────────────┼────────────────────────────┼──────────────────────────┼────────────┘
                   │                            │                          │
                   └────────────────────────────┼──────────────────────────┘
                                                ▼
                   ┌────────────────────────────────────────────────────────┐
                   │    FRONTEND WEB SPA (Preact + Vite + Tailwind CSS)     │
                   │           Puerto 80 Interno (Respaldo Host 8088)       │
                   │               Servido mediante Nginx Alpine            │
                   └───────┬────────────────────────────────┬───────────────┘
                           │                                │
            (Ruta /api/)   ▼                 (Ruta /jellyfin/) ▼
     ┌───────────────────────────────┐     ┌────────────────────────────────┐
     │   BACKEND BRIDGE (FastAPI)    │     │      JELLYFIN MEDIA SERVER     │
     │         Puerto 8000           │     │          Puerto 8096           │
     │ - BFF sin problemas de CORS   │     │ - Direct Play (0% CPU en MP4)  │
     │ - Oculta API Keys del cliente │     │ - Transcodificación QSV Intel  │
     │ - Subtítulos automáticos ES   │     │ - HLS Master Playlists (.m3u8) │
     │ - Auto-indexación descargas   │     │ - Fragmentos TS con prebuffer  │
     └───────┬──────────────┬────────┘     └────────────────────────────────┘
             │              │                              ▲
             ▼              ▼                              │
    ┌────────────────┐ ┌────────────────┐                  │
    │ PROWLARR       │ │ QBITTORRENT    │                  │
    │ Puerto 9696    │ │ Puerto 8080    │                  │
    │ Indexador de   │ │ Descarga       │                  │
    │ Torrents       │ │ Secuencial     │                  │
    └────────────────┘ └────────┬───────┘                  │
                                │ (Guarda en /media)       │
                                └──────────────────────────┘
```

---

## ⚡ Características Principales

1. **Frontend Ultra-Liviano y Responsivo:**
   - Construido con **Preact**, **Vite** y **Tailwind CSS**. Con solo **~25 kB gzipped**, garantiza que navegadores de Smart TVs con memoria RAM limitada (como **Amazon Silk**, **LG webOS Browser** o **Samsung Internet**) no se congelen ni sufran cuelgues por falta de memoria.
   - **Diseño Móvil Optimizado:** Menú hamburguesa opaco con fondo sólido anti-transparencia y catálogo de películas en cuadrícula vertical de **2 en 2 centradas**, para navegar bajando de forma natural con el pulgar.
2. **Motor de Reproducción Inteligente (Direct Play + HLS):**
   - **Archivos MP4 / H.264:** Activa **Direct Play nativo (`static=true`)** por defecto: streaming directo por rangos de bytes con **0% de uso de CPU** en el servidor, inicio instantáneo y cero congelamientos.
   - **Archivos MKV / HEVC (x265):** Transcodificación/remuxing dinámico vía **HLS** con selector de calidades (720p HD optimizado para conexiones remotas, 1080p, 480p y 360p para ahorro de datos).
   - **Pre-Buffering Avanzado:** Amortiguador de 60 a 120 segundos para conexiones residenciales y móviles remotas.
3. **Subtítulos en Español 100% Automáticos y Persistentes:**
   - Integración nativa con **OpenSubtitles.com REST API** y espejos de respaldo **YTS Subtitles**.
   - Al terminar de descargar un torrent, el servidor busca automáticamente los subtítulos en español y los guarda físicamente en disco como `.es.srt` al lado de la película.
   - En la primera reproducción se activan solos sin necesidad de tocar ningún botón.
   - Botón **ES** interactivo con feedback en tiempo real si se desea forzar una búsqueda manual.
4. **Buscador Tipo Stremio y Descargas Secuenciales:**
   - Búsqueda unificada en la biblioteca local y en indexadores públicos de **Prowlarr** (YTS, 1337x, EZTV).
   - Filtro inteligente que prioriza torrents saludables y elimina archivos no compatibles.
   - Descarga secuencial con prioridad de primera y última pieza en **qBittorrent**: permite comenzar a ver el video mientras se descarga el resto.
   - Al completar la descarga (100%), el sistema dispara el escaneo en Jellyfin y actualiza automáticamente el catálogo en la página principal sin recargar el navegador.
5. **Módulo Top 15 IMDb:**
   - Catálogo estático ultraligero con los 15 mejores títulos clasificados por géneros y subgéneros.
   - Carga instantánea, sin peticiones pesadas a APIs externas.
   - Botón directo para marcar como vista, agregar a lista por ver o buscar torrents.
6. **Módulo Mi Lista Personal (Multi-Perfil):**
   - Listas independientes **Por Ver** y **Vistas**.
   - Selector de perfiles (ej. *Nano* y *Vane*) con persistencia en navegador.
   - Sistema de votación individual de 1 a 5 estrellas con notas y fecha por usuario.
7. **Navegación Espacial (D-Pad Ready para Smart TV):**
   - Soporte total para mandos a distancia de Smart TV (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Enter`, `Back / Return`, `Escape`).
   - Anillos de enfoque de alto contraste (`ring-2 ring-emerald-400 scale-105`), márgenes seguros (`px-[4vw]`) y navegación sin ratón.

---

## 📁 1. Estructura del Proyecto

```
verlet-cine/
├── media/
│   ├── movies/          <-- Películas locales y completadas
│   ├── tv/              <-- Series y temporadas completadas
│   └── downloads/       <-- Descargas temporales en curso de qBittorrent
├── config/              <-- Configuraciones persistentes de contenedores (ignorado en git)
│   ├── jellyfin/
│   ├── prowlarr/
│   ├── qbittorrent/
│   └── bazarr/
├── backend/             <-- API Gateway BFF en FastAPI (Python 3.11)
├── frontend/            <-- Single Page Application en Preact + Vite + Tailwind
├── docker-compose.yml   <-- Orquestación de todos los microservicios Docker
├── .env                 <-- Variables de entorno y credenciales (IGNORADO EN GIT)
└── .env.example         <-- Plantilla de variables de entorno limpia de tokens
```

---

## ⚙️ 2. Configuración de Variables de Entorno (`.env`)

Copia la plantilla de ejemplo a tu archivo local `.env`:

```bash
cp .env.example .env
```

> **IMPORTANTE:** El archivo `.env` está incluido en `.gitignore` y **nunca** se sube al repositorio Git. Tus contraseñas y tokens permanecen seguros en tu máquina local.

```ini
# ==============================================================================
# CONFIGURACIÓN GENERAL
# ==============================================================================
ENVIRONMENT=production
SECRET_KEY=clave_secreta_aleatoria_super_segura_para_el_gateway

# Puertos
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
FRONTEND_PORT=8088

# ==============================================================================
# JELLYFIN
# ==============================================================================
JELLYFIN_URL=http://jellyfin:8096/jellyfin
JELLYFIN_API_KEY=tu_api_key_de_jellyfin_aqui
JELLYFIN_CLIENT_NAME=verlet-cine

# ==============================================================================
# PROWLARR (Indexador de Torrents)
# ==============================================================================
PROWLARR_URL=http://prowlarr:9696
PROWLARR_API_KEY=tu_api_key_de_prowlarr_aqui

# ==============================================================================
# QBITTORRENT
# ==============================================================================
QBITTORRENT_URL=http://qbittorrent:8080
QBITTORRENT_USER=admin
QBITTORRENT_PASS=adminadmin

# ==============================================================================
# BAZARR & OPENSUBTITLES
# ==============================================================================
BAZARR_URL=http://bazarr:6767
BAZARR_API_KEY=tu_bazarr_api_key_aqui
OPENSUBTITLES_USER=tu_usuario_opensubtitles
OPENSUBTITLES_PASS=tu_password_opensubtitles
OPENSUBTITLES_API_KEY=tu_api_key_de_opensubtitles_aqui

# ==============================================================================
# RUTAS DE MEDIOS EN EL HOST
# ==============================================================================
HOST_MEDIA_MOVIES=./media/movies
HOST_MEDIA_TV=./media/tv
HOST_MEDIA_DOWNLOADS=./media/downloads

# ==============================================================================
# CLOUDFLARE TUNNEL (OPCIONAL - ACCESO GLOBAL SEGURO)
# ==============================================================================
CLOUDFLARE_TUNNEL_TOKEN=tu_cloudflare_tunnel_token_aqui
```

---

## 🚀 3. Puesta en Marcha en 5 Minutos

1. **Iniciar contenedores:**
   ```bash
   docker compose up -d
   ```

2. **Configurar Jellyfin (`http://localhost:8096`):**
   - Completa el asistente inicial (crea tu usuario administrador).
   - Ve a **Panel de Control** -> **Redes** (*Networking*) -> **Ruta base** (*Base URL*) y escribe `/jellyfin`. Guarda los cambios.
   - Ve a **Panel de Control** -> **Claves de API** (*API Keys*), genera una clave nueva y cópiala en `JELLYFIN_API_KEY` en tu `.env`.

3. **Configurar Prowlarr (`http://localhost:9696`):**
   - Ve a **Indexers** -> Pulsa **Add Indexer (+)** y añade indexadores estándar (ej. **YTS**, **1337x**, **EZTV**).
   - Ve a **Settings** -> **General** -> Sección **Security** y copia tu **API Key** a `PROWLARR_API_KEY` en `.env`.

4. **Configurar qBittorrent (`http://localhost:8080`):**
   - Accede con `admin` y la contraseña inicial (revisa `docker logs verlet-qbittorrent`).
   - Ve a **Opciones (⚙️)** -> **Descargas**: ruta de guardado por defecto `/media/movies`.
   - Ve a **BitTorrent** y verifica que estén activadas las casillas de descarga secuencial.

5. **Aplicar claves y reiniciar:**
   ```bash
   docker compose up -d
   ```
   Accede a la aplicación en `http://localhost:8088` o mediante tu dominio de Cloudflare Tunnel.

---

## 📺 4. Guía de Uso en Smart TV: ¿Qué Navegador Usar?

La aplicación está diseñada para funcionar impecablemente en pantallas de televisión sin necesidad de compilar apps nativas independientes:

### 1. Amazon Fire TV Stick / Fire TV Cube
* **Navegador recomendado:** **Amazon Silk Browser** o **BrowseHere** (disponibles en la Amazon Appstore).
* **Configuración óptima en Silk:**
  * Abre la URL de tu aplicación.
  * Pulsa el botón de menú (☰ en el control remoto) y selecciona **"Agregar a Marcadores"** o **"Fijar en Inicio"**.
  * La navegación con las flechas del control (D-pad), selección (`Enter`) y retorno (`Back`) funcionan de forma nativa.

### 2. Google TV / Android TV (Chromecast, Xiaomi Mi Box, Sony, TCL, Philips)
* **Navegador recomendado:** **BrowseHere** o **JioPages** (disponibles gratis en Google Play Store de Android TV).
  * *BrowseHere* está especialmente optimizado para video streaming en televisores: bloquea popups, soporta aceleración por hardware de pantalla completa y mapea las flechas del control de forma automática.
* **Alternativa:** **TV Bro** (código abierto, disponible en Play Store y GitHub).

### 3. LG Smart TV (webOS)
* **Navegador recomendado:** El navegador nativo **"Web Browser"** (icono de globo terráqueo en la barra de apps de LG).
* **Cómo usarlo:**
  * Abre la app de Navegador de LG e ingresa la URL.
  * Añade la página a marcadores o pulsa **"Añadir a pantalla de inicio"**.
  * Funciona tanto con el puntero Magic Remote como con la cruceta de flechas.

### 4. Samsung Smart TV (Tizen OS)
* **Navegador recomendado:** El navegador nativo **"Internet"** de Samsung.
* **Cómo usarlo:**
  * Abre el navegador e ingresa tu URL.
  * Pulsa en el icono de estrella o menú superior y añade un acceso directo a la barra de aplicaciones.

---

## ⌨️ Controles D-Pad para Control Remoto

| Tecla / Mando | Acción en el Catálogo | Acción en el Reproductor de Video |
| :--- | :--- | :--- |
| **Flecha Arriba (↑)** | Mueve el foco a la fila superior | Sube el volumen (+10%) |
| **Flecha Abajo (↓)** | Mueve el foco a la fila inferior | Baja el volumen (-10%) |
| **Flecha Izquierda (←)** | Mueve el foco a la tarjeta izquierda | Retrocede 10 segundos |
| **Flecha Derecha (→)** | Mueve el foco a la tarjeta derecha | Adelanta 10 segundos |
| **Enter / Botón Central** | Abre el detalle o reproduce | Play / Pausa |
| **Atrás (Back / Return / 461)** | Vuelve a Inicio o cierra modales | Sale del reproductor guardando posición |
| **F** | N/A | Alterna Pantalla Completa |
