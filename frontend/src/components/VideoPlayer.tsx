import { useEffect, useRef, useState, useCallback } from 'preact/hooks';
import Hls from 'hls.js';
import { api } from '../services/api';
import { StreamInfo, SubtitleTrack, AudioTrack } from '../types';

interface VideoPlayerProps {
  itemId: string;
  title: string;
  initialTicks?: number;
  onClose: () => void;
}

interface SubtitleCue {
  start: number;
  end: number;
  text: string;
}

function parseVTT(vttText: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const lines = vttText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let i = 0;

  const parseTime = (timeStr: string): number => {
    const clean = timeStr.trim();
    const parts = clean.split(':');
    if (parts.length === 3) {
      const [h, m, s] = parts;
      return parseFloat(h) * 3600 + parseFloat(m) * 60 + parseFloat(s);
    } else if (parts.length === 2) {
      const [m, s] = parts;
      return parseFloat(m) * 60 + parseFloat(s);
    }
    return 0;
  };

  while (i < lines.length) {
    const line = lines[i].trim();
    if (line.includes('-->')) {
      const parts = line.split('-->');
      const start = parseTime(parts[0]);
      const endStr = parts[1].trim().split(/\s+/)[0];
      const end = parseTime(endStr);
      i++;
      const textLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        // Strip out WebVTT internal styling tags like <v ...>, <b>, <i>, <c.color>
        const cleanLine = lines[i].replace(/<[^>]+>/g, '').trim();
        if (cleanLine) textLines.push(cleanLine);
        i++;
      }
      if (textLines.length > 0 && end > start) {
        cues.push({ start, end, text: textLines.join('\n') });
      }
    } else {
      i++;
    }
  }
  return cues;
}

function getHlsConfig(isTV: boolean, startSecs: number) {
  return {
    enableWorker: !isTV,
    // YouTube-Grade Pre-Buffering:
    // - Mobile / Desktop (Caracas / Remote): 60s to 120s pre-buffer cushion (2 full minutes ahead).
    //   Once 1-2 minutes are buffered into memory, temporary dips in Caracas residential internet are completely invisible!
    // - Smart TV: 15s to 24s protects TV hardware/RAM from GC lag.
    maxBufferLength: isTV ? 15 : 60,
    maxMaxBufferLength: isTV ? 24 : 120,
    maxBufferSize: isTV ? 16 * 1024 * 1024 : 80 * 1024 * 1024,
    backBufferLength: isTV ? 8 : 30,
    lowLatencyMode: false,
    maxBufferHole: 0.8,
    nudgeOffset: 0.1,
    nudgeMaxRetry: 5,
    // High-latency international connection retries (Cloudflare Tunnel to Caracas)
    fragLoadingTimeOut: 30000,
    fragLoadingMaxRetry: 10,
    fragLoadingRetryDelay: 1000,
    fragLoadingMaxRetryTimeout: 64000,
    manifestLoadingTimeOut: 20000,
    manifestLoadingMaxRetry: 8,
    levelLoadingTimeOut: 20000,
    levelLoadingMaxRetry: 8,
    startPosition: startSecs > 5 ? startSecs : -1,
  };
}

export function VideoPlayer({ itemId, title, initialTicks = 0, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [selectedSub, setSelectedSub] = useState<number>(-1); // -1 = off
  const [selectedAudio, setSelectedAudio] = useState<number>(0);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [fetchingSub, setFetchingSub] = useState(false);
  const [subNotice, setSubNotice] = useState<string | null>(null);

  // Custom subtitle overlay state for TV & mobile
  const [activeSubtitleText, setActiveSubtitleText] = useState<string | null>(null);
  const subtitleCuesRef = useRef<SubtitleCue[]>([]);

  // Quality selector states
  const [selectedQuality, setSelectedQuality] = useState<string>('720p');
  const [qualityModalOpen, setQualityModalOpen] = useState(false);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  const controlsTimeoutRef = useRef<number | null>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // ─── Dual-Mode Subtitle Engine (Universal Web/TV Overlay + Native iOS Fullscreen) ───
  // 1. In web player view (inline or container fullscreen on Desktop/Android/Smart TV):
  //    • Active native track mode is set to 'hidden' (cues loaded in memory, NOT drawn by browser).
  //    • The custom React overlay (activeSubtitleText) renders high-contrast yellow subtitles.
  //    • Result: EXACTLY ONE subtitle displayed. Zero double subtitles!
  // 2. In native OS video fullscreen (iOS Safari AVPlayer / webkitEnterFullscreen):
  //    • The web page DOM (and the React overlay) is hidden by iOS.
  //    • Active native track mode is switched to 'showing'.
  //    • iOS AVPlayer natively renders clean subtitles on the fullscreen video.
  //    • Result: Subtitles work flawlessly in iOS fullscreen!
  // 3. Exiting native video fullscreen:
  //    • Active native track mode switches back to 'hidden'.
  //    • React overlay takes over. Zero double subtitles!
  const syncNativeTracks = useCallback((forceNativeFs?: boolean) => {
    const video = videoRef.current;
    if (!video) return;

    const doc = document as any;
    const v = video as any;
    const isNativeFs = forceNativeFs !== undefined
      ? forceNativeFs
      : !!(
          v.webkitDisplayingFullscreen ||
          ((doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement) === video)
        );

    const trackEls = video.querySelectorAll('track');
    if (trackEls && trackEls.length > 0) {
      trackEls.forEach((el) => {
        const subIdxStr = el.getAttribute('data-sub-index');
        const subIdx = subIdxStr !== null ? parseInt(subIdxStr, 10) : -1;
        const tt = el.track;
        if (!tt) return;

        if (selectedSub !== -1 && subIdx === selectedSub) {
          tt.mode = isNativeFs ? 'showing' : 'hidden';
        } else {
          tt.mode = 'disabled';
        }
      });
    } else if (video.textTracks) {
      for (let i = 0; i < video.textTracks.length; i++) {
        const tt = video.textTracks[i];
        if (selectedSub !== -1 && i === selectedSub) {
          tt.mode = isNativeFs ? 'showing' : 'hidden';
        } else {
          tt.mode = 'disabled';
        }
      }
    }
  }, [selectedSub]);

  // Format seconds to mm:ss or hh:mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    }
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const resetControlsTimeout = useCallback(() => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused && !subModalOpen && !qualityModalOpen) {
        setShowControls(false);
      }
    }, 3500);
  }, [subModalOpen, qualityModalOpen]);

  // Load stream information
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        const info = await api.getStreamInfo(itemId);
        if (isMounted) {
          setStreamInfo(info);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Error al obtener enlace de streaming');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [itemId]);

  // Auto-activate Spanish subtitles helper
  const activateSpanishSubtitles = useCallback((tracks: SubtitleTrack[]) => {
    if (!tracks || tracks.length === 0) return -1;
    // Find Spanish track: spa, es, spanish, castellano, español
    const isSpanish = (str?: string) => {
      if (!str) return false;
      const lower = str.toLowerCase();
      return (
        lower.includes('spa') ||
        lower.includes('es') ||
        lower.includes('español') ||
        lower.includes('castellano') ||
        lower.includes('spanish')
      );
    };

    const spanishTrack = tracks.find(
      t => isSpanish(t.language) || isSpanish(t.title)
    );

    if (spanishTrack) {
      return spanishTrack.index;
    }
    return -1;
  }, []);

  // Fetch and parse WebVTT subtitle track dynamically for guaranteed TV & browser support
  useEffect(() => {
    if (selectedSub === -1 || !streamInfo) {
      subtitleCuesRef.current = [];
      setActiveSubtitleText(null);
      return;
    }

    const targetTrack = streamInfo.subtitle_tracks.find((t) => t.index === selectedSub);
    if (!targetTrack || !targetTrack.delivery_url) {
      subtitleCuesRef.current = [];
      setActiveSubtitleText(null);
      return;
    }

    let isMounted = true;
    fetch(targetTrack.delivery_url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((vttText) => {
        if (!isMounted) return;
        const cues = parseVTT(vttText);
        subtitleCuesRef.current = cues;
        if (videoRef.current) {
          const ct = videoRef.current.currentTime;
          const match = cues.find((c) => ct >= c.start && ct <= c.end);
          setActiveSubtitleText(match ? match.text : null);
        }
      })
      .catch((err) => {
        console.warn('Error loading custom subtitle track:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedSub, streamInfo]);

  // Initialize Video Player Engine (Hybrid: Native iOS vs HLS.js for TV/Desktop)
  useEffect(() => {
    if (!streamInfo || !videoRef.current) return;
    const video = videoRef.current;
    const hlsUrl = streamInfo.hls_url;

    // Detect TV browsers (BrowseHere, Android TV, GoogleTV, Fire TV, webOS, Tizen, etc.)
    const ua = navigator.userAgent;
    const isTV = /BrowseHere|SmartTV|Android.*TV|GoogleTV|AFT|AppleTV|HbbTV|POV_TV|webOS|Tizen|NetCast|Viera/i.test(ua);
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
    const useNativeHls = (isIOS || isSafari) && video.canPlayType('application/vnd.apple.mpegurl');

    // Ensure inline playback is enabled by default on mobile WebKit
    video.playsInline = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');

    // Resume position
    const startSeconds = (initialTicks || streamInfo.playback_position_ticks || 0) / 10000000;

    // Detect default spanish subtitle
    const autoSpanishSub = activateSpanishSubtitles(streamInfo.subtitle_tracks);
    setSelectedSub(autoSpanishSub);

    const isDirect = streamInfo.hls_url.includes('static=true');
    setSelectedQuality(isDirect ? 'direct' : (streamInfo.qualities[0]?.id || '720p'));

    if (isDirect) {
      // Direct Play (native HTML5 MP4 Range streaming - 0% CPU, instant start)
      video.src = streamInfo.direct_url;
      syncNativeTracks();
      const onLoadedMetadata = () => {
        if (startSeconds > 5 && startSeconds < (video.duration || Infinity) - 10) {
          video.currentTime = startSeconds;
        }
        video.play().catch(() => {});
        syncNativeTracks();
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.src = '';
      };
    } else if (useNativeHls) {
      // Native Apple HLS (iOS, Safari)
      video.src = hlsUrl;
      video.playsInline = true;
      video.setAttribute('playsinline', 'true');
      video.setAttribute('webkit-playsinline', 'true');
      syncNativeTracks();

      const onLoadedMetadata = () => {
        if (startSeconds > 5 && startSeconds < video.duration - 10) {
          video.currentTime = startSeconds;
        }
        video.play().catch(() => {});
        syncNativeTracks();
      };
      video.addEventListener('loadedmetadata', onLoadedMetadata);

      return () => {
        video.removeEventListener('loadedmetadata', onLoadedMetadata);
        video.src = '';
      };
    } else if (Hls.isSupported()) {
      // YouTube-Grade Buffering Engine:
      // - Mobile / Desktop (Caracas / Remote): 60s to 120s pre-buffer creates an uninterrupted cushion
      // - Smart TV: 15s to 24s protects limited TV RAM from memory GC freezes
      const hls = new Hls(getHlsConfig(isTV, startSeconds));
      // Disable HLS.js internal subtitle renderer immediately after creation
      hls.subtitleDisplay = false;
      hlsRef.current = hls;
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
        syncNativeTracks();
      });

      hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
        // Disable internal HLS.js display, native <track> handles iOS and React overlay handles TV/Web
        hls.subtitleTrack = -1;
        hls.subtitleDisplay = false;
        syncNativeTracks();
      });

      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
          // Re-trigger loading and ensure video resumes instead of freezing
          hls.startLoad();
          if (video.paused && video.currentTime > 0) {
            video.play().catch(() => {});
          }
          return;
        }
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setError('Error de conexión con el servidor. Si tu señal en Caracas está lenta, selecciona calidad 480p o 360p.');
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else {
      // Fallback direct URL
      video.src = streamInfo.direct_url;
      syncNativeTracks();
      video.play().catch(() => {});
      return () => {
        video.src = '';
      };
    }
  }, [streamInfo?.hls_url, initialTicks, activateSpanishSubtitles, syncNativeTracks]);

  // Quality switcher function
  const changeQuality = (qualityId: string) => {
    if (!videoRef.current || !streamInfo) return;
    const video = videoRef.current;
    const currentSecs = video.currentTime;
    setQualityModalOpen(false);

    // Guard: block Direct Play for browser-incompatible containers (MKV, HEVC, etc.)
    // Browsers can only natively play MP4/H.264 or WebM/VP9 without transcoding.
    const isDirectCompatible =
      (streamInfo.container || '').toLowerCase() === 'mp4' &&
      ['h264', 'avc', 'avc1'].includes((streamInfo.video_codec || '').toLowerCase());

    if (qualityId === 'direct' && !isDirectCompatible) {
      setSubNotice(
        `⚠️ Direct Play no disponible para ${(streamInfo.container || 'este formato').toUpperCase()} / ${(streamInfo.video_codec || '').toUpperCase()}. ` +
        `El navegador no puede reproducir este formato sin transcodificación. Usa 720p o 1080p.`
      );
      setTimeout(() => setSubNotice(null), 6000);
      return; // Do NOT change quality
    }

    setSelectedQuality(qualityId);

    let targetUrl = streamInfo.hls_url;
    if (qualityId === 'direct') {
      targetUrl = streamInfo.direct_url;
    } else {
      const match = (streamInfo.qualities || []).find(q => q.id === qualityId);
      if (match) targetUrl = match.hls_url;
    }

    if (qualityId === 'direct') {
      // Direct Play (native Web MP4 stream - 0% CPU)
      if (hlsRef.current) {
        hlsRef.current.stopLoad();
        hlsRef.current.detachMedia();
      }
      video.src = targetUrl;
      const onLoaded = () => {
        if (currentSecs > 0 && currentSecs < (video.duration || Infinity) - 5) {
          video.currentTime = currentSecs;
        }
        video.play().catch(() => {});
        video.removeEventListener('loadedmetadata', onLoaded);
      };
      video.addEventListener('loadedmetadata', onLoaded);
    } else {
      // HLS Transcoded or remuxed stream
      if (video.src) {
        video.removeAttribute('src');
        video.load();
      }
      if (hlsRef.current) {
        hlsRef.current.loadSource(targetUrl);
        hlsRef.current.attachMedia(video);
        const onManifest = () => {
          if (currentSecs > 0 && currentSecs < (video.duration || Infinity) - 5) {
            video.currentTime = currentSecs;
          }
          video.play().catch(() => {});
          hlsRef.current?.off(Hls.Events.MANIFEST_PARSED, onManifest);
        };
        hlsRef.current.on(Hls.Events.MANIFEST_PARSED, onManifest);
      } else if (Hls.isSupported()) {
        // Re-initialize HLS if it was destroyed (e.g. started as Direct then switching to HLS)
        const ua = navigator.userAgent;
        const isTV = /BrowseHere|SmartTV|Android.*TV|GoogleTV|AFT|AppleTV|HbbTV|POV_TV|webOS|Tizen|NetCast|Viera/i.test(ua);
        const hls = new Hls(getHlsConfig(isTV, currentSecs));
        hls.subtitleDisplay = false;
        hlsRef.current = hls;
        syncNativeTracks();
        hls.loadSource(targetUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
        });
        hls.on(Hls.Events.SUBTITLE_TRACKS_UPDATED, () => {
          hls.subtitleTrack = -1;
          hls.subtitleDisplay = false;
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR) {
            hls.startLoad();
            if (video.paused && video.currentTime > 0) {
              video.play().catch(() => {});
            }
            return;
          }
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                setError('Error al cambiar de calidad. Prueba con 480p o 720p.');
                break;
            }
          }
        });
      }
    }
  };

  // Video element events and progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      const ct = video.currentTime;
      setCurrentTime(ct);
      if (video.buffered.length > 0) {
        setBufferedTime(video.buffered.end(video.buffered.length - 1));
      }
      // Instant synchronization with custom TV subtitle cues
      if (subtitleCuesRef.current.length > 0) {
        const match = subtitleCuesRef.current.find((c) => ct >= c.start && ct <= c.end);
        const newText = match ? match.text : null;
        setActiveSubtitleText((prev) => (prev === newText ? prev : newText));
      } else {
        setActiveSubtitleText(null);
      }
    };
    const onDurationChange = () => setDuration(video.duration);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);

    // Periodic progress report and keep-alive to Jellyfin (every 6 seconds)
    progressIntervalRef.current = window.setInterval(() => {
      if (video && !video.paused && video.currentTime > 0) {
        const ticks = Math.floor(video.currentTime * 10000000);
        api.reportProgress(
          itemId,
          ticks,
          false,
          streamInfo?.play_session_id,
          streamInfo?.media_source_id
        );
      }
    }, 6000);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [itemId, streamInfo?.play_session_id, streamInfo?.media_source_id]);

  // Toggle Fullscreen across Android, iOS Safari (iPhone/iPad), Smart TV, and Desktop
  const toggleFullscreen = useCallback(async () => {
    const video = videoRef.current as any;
    const container = playerContainerRef.current as any;
    const doc = document as any;

    if (!video) return;

    const isCurrentlyFullscreen = !!(
      doc.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      video.webkitDisplayingFullscreen
    );

    if (isCurrentlyFullscreen) {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.mozCancelFullScreen) {
        doc.mozCancelFullScreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      } else if (video.webkitExitFullscreen) {
        video.webkitExitFullscreen();
      }
      setIsFullscreen(false);
      try {
        if (screen.orientation && (screen.orientation as any).unlock) {
          (screen.orientation as any).unlock();
        }
      } catch {}
    } else {
      // 1. Try Element requestFullscreen on container (Android, Desktop, iPadOS, Smart TVs)
      const target = container || video;
      let requested = false;

      if (target.requestFullscreen) {
        try {
          await target.requestFullscreen();
          requested = true;
        } catch {
          // If container request fails, will try video
        }
      } else if (target.webkitRequestFullscreen) {
        try {
          target.webkitRequestFullscreen();
          requested = true;
        } catch {}
      } else if (target.mozRequestFullScreen) {
        try {
          target.mozRequestFullScreen();
          requested = true;
        } catch {}
      } else if (target.msRequestFullscreen) {
        try {
          target.msRequestFullscreen();
          requested = true;
        } catch {}
      }

      // 2. iOS Safari (iPhone) specific fullscreen method
      if (!requested && video.webkitEnterFullscreen && (video.webkitSupportsFullscreen !== false)) {
        try {
          video.webkitEnterFullscreen();
          requested = true;
        } catch (err) {
          console.warn('webkitEnterFullscreen error:', err);
        }
      }

      if (requested) {
        setIsFullscreen(true);
        try {
          if (screen.orientation && (screen.orientation as any).lock) {
            await (screen.orientation as any).lock('landscape').catch(() => {});
          }
        } catch {}
      }
    }
  }, []);

  // Listen for fullscreen state changes across all browser vendors & iOS
  useEffect(() => {
    const onFullscreenChange = () => {
      const doc = document as any;
      const video = videoRef.current as any;
      const isFs = !!(
        doc.fullscreenElement ||
        doc.webkitFullscreenElement ||
        doc.mozFullScreenElement ||
        doc.msFullscreenElement ||
        (video && video.webkitDisplayingFullscreen)
      );
      setIsFullscreen(isFs);
      syncNativeTracks();
    };

    const video = videoRef.current as any;
    const onWebkitBegin = () => {
      setIsFullscreen(true);
      // In iOS native fullscreen (AVPlayer), enable native text tracks so subtitles show!
      syncNativeTracks(true);
    };
    const onWebkitEnd = () => {
      setIsFullscreen(false);
      // Exiting iOS native fullscreen: hide native tracks so custom overlay takes over without duplicates
      syncNativeTracks(false);
    };

    const onAddTrack = () => {
      syncNativeTracks();
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    document.addEventListener('mozfullscreenchange', onFullscreenChange);
    document.addEventListener('MSFullscreenChange', onFullscreenChange);

    if (video) {
      video.addEventListener('webkitbeginfullscreen', onWebkitBegin);
      video.addEventListener('webkitendfullscreen', onWebkitEnd);
      if (video.textTracks) {
        video.textTracks.addEventListener('addtrack', onAddTrack);
      }
    }

    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      document.removeEventListener('mozfullscreenchange', onFullscreenChange);
      document.removeEventListener('MSFullscreenChange', onFullscreenChange);
      if (video) {
        video.removeEventListener('webkitbeginfullscreen', onWebkitBegin);
        video.removeEventListener('webkitendfullscreen', onWebkitEnd);
        if (video.textTracks) {
          video.textTracks.removeEventListener('addtrack', onAddTrack);
        }
      }
    };
  }, [syncNativeTracks]);

  // Sync native subtitle tracks whenever selectedSub or streamInfo updates
  useEffect(() => {
    syncNativeTracks();
  }, [selectedSub, streamInfo, syncNativeTracks]);

  // Exit & Report stopped
  const handleExit = useCallback(() => {
    const doc = document as any;
    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }
    const video = videoRef.current as any;
    if (video && video.webkitExitFullscreen) {
      try {
        video.webkitExitFullscreen();
      } catch {}
    }
    if (videoRef.current) {
      const ticks = Math.floor(videoRef.current.currentTime * 10000000);
      api.reportStopped(itemId, ticks, streamInfo?.play_session_id);
    }
    onClose();
  }, [itemId, onClose, streamInfo?.play_session_id]);

  // D-Pad and Keyboard navigation for video player
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      resetControlsTimeout();

      // LG webOS / Samsung / Fire TV remote back buttons
      if (e.key === 'Escape' || e.key === 'Backspace' || e.keyCode === 461 || e.keyCode === 10009) {
        e.preventDefault();
        if (subModalOpen) {
          setSubModalOpen(false);
        } else if (qualityModalOpen) {
          setQualityModalOpen(false);
        } else if (isFullscreen) {
          toggleFullscreen();
        } else {
          handleExit();
        }
        return;
      }

      if (subModalOpen || qualityModalOpen) return;

      switch (e.key) {
        case ' ':
        case 'Enter':
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.duration || 0, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1.0, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0.0, video.volume - 0.1);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [resetControlsTimeout, subModalOpen, qualityModalOpen, isFullscreen, toggleFullscreen, handleExit]);

  // Trigger Subtitle download in Spanish via OpenSubtitles / YTS / Jellyfin
  const handleFetchSpanishSubtitles = async () => {
    try {
      setFetchingSub(true);
      setSubNotice('Buscando subtítulos en español en OpenSubtitles y servidores espejo...');
      const res = await api.fetchSpanishSubtitles(itemId);
      setSubNotice(res.message);

      if (res.success) {
        setSubModalOpen(false);
        // Refresh stream info to discover newly added subtitle tracks without restarting video player
        const updated = await api.getStreamInfo(itemId);
        setStreamInfo((prev) => {
          if (!prev) return updated;
          return {
            ...prev,
            subtitle_tracks: updated.subtitle_tracks
          };
        });

        const newSpanishIdx = activateSpanishSubtitles(updated.subtitle_tracks);
        if (newSpanishIdx !== -1) {
          setSelectedSub(newSpanishIdx);
        }
      }
    } catch (err: any) {
      setSubNotice('Error al descargar subtítulos: ' + (err.message || 'Error de conexión con el servidor'));
    } finally {
      setFetchingSub(false);
      setTimeout(() => setSubNotice(null), 6000);
    }
  };

  const handleSelectSubtitle = (index: number) => {
    setSelectedSub(index);
    // HLS.js: disable internal subtitle renderer — custom overlay / native <track> handles display
    if (hlsRef.current) {
      hlsRef.current.subtitleTrack = -1;
    }
    setSubModalOpen(false);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPercent = duration > 0 ? (bufferedTime / duration) * 100 : 0;

  return (
    <div
      ref={playerContainerRef}
      class="fixed inset-0 z-50 bg-black flex items-center justify-center select-none cursor-default"
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      onDblClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'BUTTON' || target.closest('button')) return;
        toggleFullscreen();
      }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        class="w-full h-full object-contain"
        crossOrigin="anonymous"
        playsInline
        webkit-playsinline="true"
        preload="auto"
        controls={false}
      >
        {/* Native WebVTT tracks:
            - Inline/Container Fullscreen: mode is 'hidden' (no duplicate captions over React yellow overlay)
            - iOS AVPlayer Fullscreen: mode is 'showing' (native iOS fullscreen captions display flawlessly!) */}
        {streamInfo?.subtitle_tracks.map((sub) => (
          sub.delivery_url && (
            <track
              key={sub.index}
              data-sub-index={sub.index}
              kind="subtitles"
              label={sub.title || sub.language || `Subtítulo ${sub.index + 1}`}
              srcLang={sub.language || 'es'}
              src={sub.delivery_url}
            />
          )
        ))}
      </video>

      {/* Dedicated High-Contrast Subtitle Overlay for TV (BrowseHere) & Mobile */}
      {selectedSub !== -1 && activeSubtitleText && (
        <div class="absolute bottom-16 sm:bottom-20 left-0 right-0 pointer-events-none z-30 flex justify-center px-4">
          <div class="bg-black/85 text-yellow-300 sm:text-white font-bold text-base sm:text-xl md:text-2xl px-4 py-1.5 rounded-xl shadow-2xl tracking-wide text-center leading-snug [text-shadow:_0_2px_4px_rgba(0,0,0,0.95)] max-w-3xl border border-black/50 whitespace-pre-line">
            {activeSubtitleText}
          </div>
        </div>
      )}

      {/* Loading Spinner */}
      {loading && (
        <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/70 text-white gap-4">
          <div class="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm font-medium tracking-wide">Cargando transmisión HLS...</p>
        </div>
      )}

      {/* Error Screen */}
      {error && (
        <div class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6 text-center gap-6">
          <div class="w-16 h-16 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center text-3xl border border-rose-500/40">
            ⚠️
          </div>
          <div class="max-w-md space-y-2">
            <h3 class="text-xl font-bold text-white">No se pudo reproducir el contenido</h3>
            <p class="text-rose-400 font-medium text-sm">{error}</p>
            <p class="text-xs text-slate-400">Si la descarga finalizó hace pocos segundos, Jellyfin puede estar procesando el archivo.</p>
          </div>
          <div class="flex items-center gap-4">
            <button
              data-nav="item"
              data-nav-default="true"
              onClick={handleExit}
              class="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-xl text-sm border border-slate-700 transition-all"
            >
              Volver al catálogo
            </button>
            <button
              data-nav="item"
              onClick={() => {
                setError(null);
                setLoading(true);
                api.getStreamInfo(itemId)
                  .then(info => {
                    setStreamInfo(info);
                    setLoading(false);
                  })
                  .catch(err => {
                    setError(err.message || 'Error al obtener streaming');
                    setLoading(false);
                  });
              }}
              class="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm shadow-lg shadow-emerald-950/50 transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* Subtitle Notice Toast */}
      {subNotice && (
        <div class="absolute top-8 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-emerald-500/40 text-emerald-300 px-6 py-3 rounded-full text-sm font-medium shadow-2xl backdrop-blur-md z-50 animate-fade-in flex items-center gap-3">
          {fetchingSub && <span class="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></span>}
          <span>{subNotice}</span>
        </div>
      )}

      {/* Subtitle Selection Modal */}
      {subModalOpen && (
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={(e) => { e.stopPropagation(); setSubModalOpen(false); }}
        >
          <div
            class="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>Subtítulos</span>
                <span class="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-mono">
                  ES auto-activo
                </span>
              </h3>
              <button
                data-nav="item"
                onClick={() => setSubModalOpen(false)}
                class="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕ Cerrar
              </button>
            </div>

            <div class="my-4 max-h-64 overflow-y-auto space-y-2 pr-1">
              <button
                data-nav="item"
                onClick={() => handleSelectSubtitle(-1)}
                class={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                  selectedSub === -1
                    ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Desactivados
              </button>
              {(streamInfo?.subtitle_tracks || []).map((sub) => {
                const isSpa = (sub.language || '').toLowerCase().includes('spa') ||
                  (sub.language || '').toLowerCase().includes('es') ||
                  (sub.title || '').toLowerCase().includes('español');
                return (
                  <button
                    key={sub.index}
                    data-nav="item"
                    onClick={() => handleSelectSubtitle(sub.index)}
                    class={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                      selectedSub === sub.index
                        ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{sub.title || sub.language || `Pista ${sub.index + 1}`}</span>
                    {isSpa && (
                      <span class="text-xs bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        Español
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div class="pt-3 border-t border-slate-800 flex flex-col gap-2">
              <button
                data-nav="item"
                disabled={fetchingSub}
                onClick={handleFetchSpanishSubtitles}
                class="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30"
              >
                {fetchingSub ? (
                  <>
                    <span class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>Descargando...</span>
                  </>
                ) : (
                  <>
                    <span>Descargar subtítulos en español al instante</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quality Selection Modal */}
      {qualityModalOpen && (
        <div
          class="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6"
          onClick={(e) => { e.stopPropagation(); setQualityModalOpen(false); }}
        >
          <div
            class="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-md w-full shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 class="text-lg font-bold text-white flex items-center gap-2">
                <span>⚙ Calidad de Reproducción</span>
              </h3>
              <button
                data-nav="item"
                onClick={() => setQualityModalOpen(false)}
                class="text-slate-400 hover:text-white p-1 text-sm rounded-lg"
              >
                ✕ Cerrar
              </button>
            </div>

            <div class="my-4 max-h-64 overflow-y-auto space-y-2 pr-1">
              {(streamInfo?.qualities || []).map((q) => {
                const isSelected = selectedQuality === q.id;
                // Block Direct Play for browser-incompatible containers (MKV, HEVC, etc.)
                const isDirectCompatible =
                  (streamInfo?.container || '').toLowerCase() === 'mp4' &&
                  ['h264', 'avc', 'avc1'].includes((streamInfo?.video_codec || '').toLowerCase());
                const isDisabled = q.id === 'direct' && !isDirectCompatible;
                return (
                  <button
                    key={q.id}
                    data-nav="item"
                    disabled={isDisabled}
                    onClick={() => changeQuality(q.id)}
                    class={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed bg-slate-800/40 text-slate-500'
                        : isSelected
                          ? 'bg-emerald-600 text-white font-bold ring-2 ring-emerald-400'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <span>{q.label}</span>
                    {q.id === '720p' && (
                      <span class="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-mono">
                        YouTube Fluida
                      </span>
                    )}
                    {q.id === 'direct' && isDirectCompatible && (
                      <span class="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded font-mono">
                        0% CPU Direct
                      </span>
                    )}
                    {q.id === 'direct' && !isDirectCompatible && (
                      <span class="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded font-mono">
                        No compatible ({(streamInfo?.container || '?').toUpperCase()})
                      </span>
                    )}
                    {q.id === '1080p' && (
                      <span class="text-xs bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded font-mono">
                        FHD Original
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <p class="text-[11px] text-slate-400 pt-2 border-t border-slate-800 text-center">
              💡 <strong>720p HD</strong> está calibrada al estándar de YouTube para máxima fluidez sin cortes desde cualquier red o dispositivo.
            </p>
          </div>
        </div>
      )}

      {/* On-screen Controls Overlay */}
      {!error && (
        <div
          class={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/70 flex flex-col justify-between p-[4vw] transition-opacity duration-300 ${
            showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        >
        {/* Top bar: Back, Title, Subtitle Action */}
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button
              data-nav="item"
              data-nav-default="true"
              onClick={handleExit}
              class="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 backdrop-blur-md border border-slate-700/50 flex-none"
            >
              <span class="text-emerald-400">←</span>
              <span class="hidden xs:inline sm:inline">Salir</span>
            </button>
            <h2 class="text-xs sm:text-base md:text-xl font-bold text-white tracking-wide truncate max-w-[120px] xs:max-w-[180px] sm:max-w-xs md:max-w-md">
              {title}
            </h2>
          </div>

          <div class="flex items-center gap-1.5 sm:gap-2.5 flex-none">
            {/* Quality button */}
            <button
              data-nav="item"
              onClick={() => setQualityModalOpen(true)}
              class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-semibold rounded-xl border border-slate-700/50 backdrop-blur-sm flex items-center gap-1"
            >
              <span class="text-emerald-400">⚙</span>
              <span>{selectedQuality.toUpperCase()}</span>
            </button>

            {/* Quick Spanish Subtitle Fetch button */}
            <button
              data-nav="item"
              disabled={fetchingSub}
              onClick={handleFetchSpanishSubtitles}
              class="px-2 sm:px-3 py-1 sm:py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] sm:text-xs font-semibold rounded-xl flex items-center gap-1 shadow-lg shadow-emerald-950/40 backdrop-blur-sm border border-emerald-400/30 transition-all"
              title="Descargar subtítulo en español desde Bazarr / Jellyfin"
            >
              <span class="hidden sm:inline">Subtítulos </span>
              <span>ES</span>
            </button>

            {/* Subtitles track picker button */}
            <button
              data-nav="item"
              onClick={() => setSubModalOpen(true)}
              class="px-2 sm:px-2.5 py-1 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white text-[11px] sm:text-xs font-semibold rounded-xl border border-slate-700/50 backdrop-blur-sm"
            >
              <span class="hidden sm:inline">Pistas </span>
              <span>({selectedSub === -1 ? 'Off' : 'Activo'})</span>
            </button>

            {/* Fullscreen shortcut in top bar */}
            <button
              data-nav="item"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              class="p-1.5 sm:px-2.5 sm:py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700/50 backdrop-blur-sm flex items-center justify-center transition-all"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4H5v4m0-4l5 5m6-5h4v4m0-4l-5 5M5 20h4v-4m-4 4l5-5m10 5l-5-5m5 5h-4v-4" />
                </svg>
              ) : (
                <svg class="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Center Play/Pause button for touch devices */}
        <div class="flex items-center justify-center gap-4 sm:gap-8 my-auto">
          <button
            data-nav="item"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
              }
            }}
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white flex items-center justify-center text-xs sm:text-sm font-bold backdrop-blur-md border border-slate-700/40 active:scale-90 transition-transform"
          >
            -10s
          </button>

          <button
            data-nav="item"
            onClick={() => {
              if (videoRef.current) {
                if (videoRef.current.paused) videoRef.current.play();
                else videoRef.current.pause();
              }
            }}
            class="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-black shadow-xl shadow-emerald-500/30 transition-transform active:scale-95"
          >
            {isPlaying ? (
              <span class="text-lg sm:text-xl">❚❚</span>
            ) : (
              <span class="text-xl sm:text-2xl ml-0.5">▶</span>
            )}
          </button>

          <button
            data-nav="item"
            onClick={() => {
              if (videoRef.current) {
                videoRef.current.currentTime = Math.min(videoRef.current.duration || 0, videoRef.current.currentTime + 10);
              }
            }}
            class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-slate-800/70 hover:bg-slate-700 text-white flex items-center justify-center text-xs sm:text-sm font-bold backdrop-blur-md border border-slate-700/40 active:scale-90 transition-transform"
          >
            +10s
          </button>
        </div>

        {/* Bottom progress bar & time */}
        <div class="flex flex-col gap-2">
          {/* Progress track */}
          <div
            class="relative w-full h-3 bg-slate-800/80 rounded-full overflow-hidden cursor-pointer backdrop-blur-sm border border-slate-700/40"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              if (videoRef.current && duration > 0) {
                videoRef.current.currentTime = ratio * duration;
              }
            }}
          >
            {/* Buffered */}
            <div
              class="absolute left-0 top-0 bottom-0 bg-slate-600/60 rounded-full"
              style={{ width: `${bufferedPercent}%` }}
            />
            {/* Played */}
            <div
              class="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div class="flex items-center justify-between text-xs text-slate-400 font-mono">
            <div class="flex items-center gap-2">
              <span class="text-white font-bold">{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>

            <div class="flex items-center gap-3">
              <span class="text-emerald-400 font-sans font-semibold hidden md:inline">
                {selectedQuality === 'direct'
                  ? `${(streamInfo?.video_codec || 'H.264').toUpperCase()} / AAC Direct Stream`
                  : `HLS ${selectedQuality} · ${(streamInfo?.video_codec || 'H.264').toUpperCase()}`}
              </span>
              <button
                data-nav="item"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                class="px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700 text-white rounded-xl border border-slate-700/50 backdrop-blur-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5"
                title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
              >
                {isFullscreen ? (
                  <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 4H5v4m0-4l5 5m6-5h4v4m0-4l-5 5M5 20h4v-4m-4 4l5-5m10 5l-5-5m5 5h-4v-4" />
                  </svg>
                ) : (
                  <svg class="w-4 h-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                )}
                <span class="text-xs font-sans font-medium">{isFullscreen ? 'Ventana' : 'Pantalla completa'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}

