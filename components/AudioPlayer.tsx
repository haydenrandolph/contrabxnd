'use client';

import { useEffect, useState, useRef, useCallback } from 'react';

interface AudioPlayerProps {
  src: string;
  title: string;
  duration?: string;
}

export default function AudioPlayer({ src, title, duration }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [available, setAvailable] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [rate, setRate] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onCanPlay = () => { setAvailable(true); setLoading(false); };
    const onError = () => { setAvailable(false); setLoading(false); };
    const onLoadedMetadata = () => setTotalDuration(audio.duration);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onEnded = () => setPlaying(false);

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const toggle = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  }, [playing]);

  const seek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = pct * totalDuration;
  }, [totalDuration]);

  const skip = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  }, []);

  const changeRate = useCallback((newRate: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = newRate;
    setRate(newRate);
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  if (loading) {
    return (
      <>
        <audio ref={audioRef} src={src} preload="metadata" />
        <style jsx>{`
          .ap-loading {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 14px 16px;
            background: #141414;
            border: 1px solid #1a1a1a;
            border-radius: var(--cb-radius);
          }
          :global(html.light-mode) .ap-loading {
            background: #ffffff;
            border-color: #d0d0d1;
          }
          .ap-loading-text {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: #3a3a3a;
          }
          :global(html.light-mode) .ap-loading-text {
            color: #b0b0b1;
          }
        `}</style>
        <div className="ap-loading">
          <span className="ap-loading-text">Loading audio...</span>
        </div>
      </>
    );
  }

  if (!available) return <audio ref={audioRef} src={src} preload="metadata" style={{ display: 'none' }} />;

  return (
    <>
      <audio ref={audioRef} src={src} preload="metadata" />
      <style jsx>{`
        .audio-player {
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px 16px;
          background: #141414;
          border: 1px solid #1a1a1a;
          border-radius: var(--cb-radius);
        }
        :global(html.light-mode) .audio-player {
          background: #ffffff;
          border-color: #d0d0d1;
        }

        .ap-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .ap-play {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: var(--cb-radius);
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          flex-shrink: 0;
        }
        .ap-play:hover { border-color: #F7931A; }
        .ap-play.active {
          border-color: #F7931A;
          background: #F7931A;
        }
        :global(html.light-mode) .ap-play {
          border-color: #c0c0c1;
        }

        .ap-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .ap-label {
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: #F7931A;
        }

        .ap-title {
          font-family: 'JetBrains Mono', monospace;
          font-size: 11px;
          color: #8a8a8a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ap-title.active { color: #e8e4dc; }
        :global(html.light-mode) .ap-title.active { color: #0a0a0a; }

        .ap-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          flex-shrink: 0;
        }

        .ap-skip {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .ap-skip svg {
          width: 14px;
          height: 14px;
        }

        .ap-speed {
          display: flex;
          align-items: center;
          gap: 3px;
          margin-left: 8px;
        }

        .ap-speed-btn {
          padding: 3px 6px;
          background: transparent;
          border: 1px solid #3a3a3a;
          border-radius: var(--cb-radius);
          font-family: 'JetBrains Mono', monospace;
          font-size: 9px;
          color: #8a8a8a;
          cursor: pointer;
          transition: border-color 0.15s ease, color 0.15s ease;
        }
        .ap-speed-btn:hover { border-color: #F7931A; color: #F7931A; }
        .ap-speed-btn.active { border-color: #F7931A; color: #F7931A; }
        :global(html.light-mode) .ap-speed-btn { border-color: #c0c0c1; }
        :global(html.light-mode) .ap-speed-btn:hover,
        :global(html.light-mode) .ap-speed-btn.active {
          border-color: #F7931A;
          color: #F7931A;
        }

        .ap-bottom {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .ap-time {
          font-family: 'JetBrains Mono', monospace;
          font-size: 10px;
          color: #8a8a8a;
          font-variant-numeric: tabular-nums;
          min-width: 36px;
          flex-shrink: 0;
        }

        .ap-bar {
          flex: 1;
          height: 4px;
          background: #1a1a1a;
          border-radius: var(--cb-radius);
          cursor: pointer;
          position: relative;
        }
        :global(html.light-mode) .ap-bar {
          background: #d0d0d1;
        }

        .ap-bar-fill {
          height: 100%;
          background: #F7931A;
          border-radius: var(--cb-radius);
          transition: width 0.1s linear;
        }

        .ap-bar-handle {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 10px;
          height: 10px;
          background: #F7931A;
          border-radius: 50%;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .ap-bar:hover .ap-bar-handle { opacity: 1; }

        @media (max-width: 768px) {
          .ap-speed { display: none; }
          .ap-controls { gap: 2px; }
          .ap-play { width: 32px; height: 32px; }
        }

        @media (max-width: 480px) {
          .ap-skip { display: none; }
        }
      `}</style>

      <div className="audio-player">
        <div className="ap-top">
          <button className={`ap-play${playing ? ' active' : ''}`} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <rect x="6" y="4" width="4" height="16" fill={playing ? '#fff' : '#8a8a8a'} />
                <rect x="14" y="4" width="4" height="16" fill={playing ? '#fff' : '#8a8a8a'} />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <polygon points="6 3 20 12 6 21" fill="#8a8a8a" />
              </svg>
            )}
          </button>

          <div className="ap-info">
            <span className="ap-label">Listen</span>
            <span className={`ap-title${playing ? ' active' : ''}`}>
              {playing ? title : duration ? `${duration} · ${title}` : title}
            </span>
          </div>

          <div className="ap-controls">
            <button className="ap-skip" onClick={() => skip(-15)} aria-label="Back 15s">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2">
                <path d="M1 4v6h6" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                <text x="12" y="16" textAnchor="middle" fill="#8a8a8a" stroke="none" fontSize="7" fontFamily="JetBrains Mono">15</text>
              </svg>
            </button>
            <button className="ap-skip" onClick={() => skip(30)} aria-label="Forward 30s">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8a8a8a" strokeWidth="2">
                <path d="M23 4v6h-6" /><path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
                <text x="12" y="16" textAnchor="middle" fill="#8a8a8a" stroke="none" fontSize="7" fontFamily="JetBrains Mono">30</text>
              </svg>
            </button>
            <div className="ap-speed">
              {[1, 1.25, 1.5, 2].map(r => (
                <button
                  key={r}
                  className={`ap-speed-btn${rate === r ? ' active' : ''}`}
                  onClick={() => changeRate(r)}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="ap-bottom">
          <span className="ap-time">{fmt(currentTime)}</span>
          <div className="ap-bar" onClick={seek}>
            <div className="ap-bar-fill" style={{ width: `${progress}%` }} />
            <div className="ap-bar-handle" style={{ left: `${progress}%` }} />
          </div>
          <span className="ap-time">{fmt(totalDuration)}</span>
        </div>
      </div>
    </>
  );
}
