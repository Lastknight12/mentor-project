import { useEffect, useRef, useState } from 'react'
import { setA11y, useA11y } from '../a11y.js'

const RATES = [0.5, 0.75, 1, 1.25, 1.5, 2]

function formatTime(value) {
  if (!Number.isFinite(value) || value < 0) return '0:00'
  const total = Math.floor(value)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = String(total % 60).padStart(2, '0')
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${seconds}`
  return `${minutes}:${seconds}`
}

function Icon({ children, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

const PlayGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.2v13.6c0 .8.9 1.3 1.5.9l10.2-6.8a1 1 0 0 0 0-1.8L9.5 4.3C8.9 3.9 8 4.4 8 5.2Z" />
  </svg>
)

const PauseGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <rect x="6" y="5" width="4.2" height="14" rx="1.2" />
    <rect x="13.8" y="5" width="4.2" height="14" rx="1.2" />
  </svg>
)

const VolumeGlyph = ({ muted }) => (
  <Icon>
    <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4Z" fill="currentColor" />
    {muted ? (
      <path d="m16 9.5 5 5m0-5-5 5" />
    ) : (
      <path d="M15.5 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" />
    )}
  </Icon>
)

const SettingsGlyph = () => (
  <Icon>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" />
  </Icon>
)

const CaptionsGlyph = () => (
  <Icon>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="M7 11h4M13 11h4M7 15h2.5M12 15h5" />
  </Icon>
)

const FullscreenGlyph = ({ active }) => (
  <Icon>
    {active ? (
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
    ) : (
      <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
    )}
  </Icon>
)

/**
 * Кінопрогравач: великий play, перемотка, гучність, швидкість, якість,
 * повний екран і гарячі клавіші (Пробіл/K, ←/→, ↑/↓, M, F).
 */
export function VideoPlayer({ sources, subtitles = [], poster, title }) {
  const { captions } = useA11y()
  const containerRef = useRef(null)
  const videoRef = useRef(null)
  const hideTimer = useRef(null)
  const resumeRef = useRef({ time: 0, play: false })

  const [sourceIndex, setSourceIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [started, setStarted] = useState(false)
  const [waiting, setWaiting] = useState(false)
  const [current, setCurrent] = useState(0)
  const [duration, setDuration] = useState(0)
  const [buffered, setBuffered] = useState(0)
  const [volume, setVolume] = useState(1)
  const [muted, setMuted] = useState(false)
  const [rate, setRate] = useState(1)
  const [fullscreen, setFullscreen] = useState(false)
  const [controlsVisible, setControlsVisible] = useState(true)
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')

  const source = sources[sourceIndex] || sources[0]

  useEffect(() => {
    function onFullscreenChange() {
      setFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      clearTimeout(hideTimer.current)
    }
  }, [])

  // Субтитри: вмикаються кнопкою CC або панеллю доступності
  useEffect(() => {
    const video = videoRef.current
    if (!video) return undefined
    function apply() {
      Array.from(video.textTracks).forEach((track) => {
        track.mode = captions ? 'showing' : 'hidden'
      })
    }
    apply()
    video.addEventListener('loadedmetadata', apply)
    return () => video.removeEventListener('loadedmetadata', apply)
  }, [captions, sourceIndex, subtitles])

  function showControls() {
    setControlsVisible(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false)
        setMenuOpen(false)
      }
    }, 2800)
  }

  function togglePlay() {
    const video = videoRef.current
    if (!video) return
    setStarted(true)
    setError('')
    if (video.paused) {
      video.play().catch(() => setError('Не вдалося запустити відео.'))
    } else {
      video.pause()
    }
  }

  function seekBy(seconds) {
    const video = videoRef.current
    if (!video) return
    video.currentTime = Math.min(
      Math.max(0, video.currentTime + seconds),
      video.duration || Infinity,
    )
  }

  function seekTo(value) {
    const video = videoRef.current
    if (video) video.currentTime = Number(value)
  }

  function changeVolume(value) {
    const video = videoRef.current
    if (!video) return
    const next = Math.min(1, Math.max(0, Number(value)))
    video.volume = next
    video.muted = next === 0
  }

  function toggleMute() {
    const video = videoRef.current
    if (video) video.muted = !video.muted
  }

  function changeRate(next) {
    const video = videoRef.current
    if (video) video.playbackRate = next
    setRate(next)
  }

  function changeQuality(index) {
    const video = videoRef.current
    if (video) {
      resumeRef.current = { time: video.currentTime, play: !video.paused }
    }
    setSourceIndex(index)
    setMenuOpen(false)
  }

  function toggleFullscreen() {
    const container = containerRef.current
    if (!container) return
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      container.requestFullscreen?.()
    }
  }

  function onKeyDown(event) {
    const onInput = event.target.tagName === 'INPUT'
    switch (event.key) {
      case ' ':
      case 'k':
      case 'K':
        if (event.target.tagName === 'BUTTON') return
        event.preventDefault()
        togglePlay()
        break
      case 'ArrowLeft':
        if (onInput) return
        event.preventDefault()
        seekBy(-10)
        break
      case 'ArrowRight':
        if (onInput) return
        event.preventDefault()
        seekBy(10)
        break
      case 'ArrowUp':
        if (onInput) return
        event.preventDefault()
        changeVolume((videoRef.current?.volume ?? 1) + 0.1)
        break
      case 'ArrowDown':
        if (onInput) return
        event.preventDefault()
        changeVolume((videoRef.current?.volume ?? 1) - 0.1)
        break
      case 'm':
      case 'M':
        toggleMute()
        break
      case 'f':
      case 'F':
        toggleFullscreen()
        break
      default:
        return
    }
    showControls()
  }

  function onLoadedMetadata(event) {
    const video = event.currentTarget
    setDuration(video.duration || 0)
    const resume = resumeRef.current
    if (resume.time > 0) {
      video.currentTime = resume.time
      if (resume.play) video.play().catch(() => {})
      resumeRef.current = { time: 0, play: false }
    }
    video.playbackRate = rate
  }

  function onProgress(event) {
    const video = event.currentTarget
    const { buffered: ranges } = video
    if (!ranges.length) return
    setBuffered(ranges.end(ranges.length - 1))
  }

  const playedPercent = duration ? (current / duration) * 100 : 0
  const bufferedPercent = duration ? (buffered / duration) * 100 : 0
  const showBigPlay = !playing && !waiting

  return (
    <div
      ref={containerRef}
      className={`vp ${controlsVisible || !playing ? 'vp-controls' : ''} ${fullscreen ? 'vp-fullscreen' : ''}`}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseMove={showControls}
      onMouseLeave={() => playing && setControlsVisible(false)}
    >
      <video
        ref={videoRef}
        className="vp-video"
        src={source.url}
        poster={poster || undefined}
        preload="metadata"
        playsInline
        crossOrigin={subtitles.length ? 'anonymous' : undefined}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        onPlay={() => {
          setPlaying(true)
          setStarted(true)
          showControls()
        }}
        onPause={() => {
          setPlaying(false)
          setControlsVisible(true)
        }}
        onEnded={() => setPlaying(false)}
        onWaiting={() => setWaiting(true)}
        onPlaying={() => setWaiting(false)}
        onCanPlay={() => setWaiting(false)}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onProgress={onProgress}
        onLoadedMetadata={onLoadedMetadata}
        onVolumeChange={(event) => {
          setVolume(event.currentTarget.volume)
          setMuted(event.currentTarget.muted)
        }}
        onError={() =>
          setError('Не вдалося завантажити відео. Спробуйте інше джерело або оновіть сторінку.')
        }
      >
        {subtitles.map((track) => (
          <track
            key={track.url}
            kind="subtitles"
            src={track.url}
            srcLang={track.lang}
            label={track.label}
          />
        ))}
      </video>

      {waiting && playing && <span className="vp-spinner" aria-label="Завантаження" />}

      {showBigPlay && !error && (
        <button
          type="button"
          className="vp-big-play"
          onClick={togglePlay}
          aria-label={started ? 'Продовжити перегляд' : `Дивитися «${title}»`}
        >
          <PlayGlyph />
        </button>
      )}

      {error && <p className="vp-error">{error}</p>}

      <div className="vp-bar">
        <input
          className="vp-seek"
          type="range"
          min="0"
          max={duration || 0}
          step="0.1"
          value={Math.min(current, duration || 0)}
          onChange={(event) => seekTo(event.target.value)}
          style={{
            '--played': `${playedPercent}%`,
            '--buffered': `${bufferedPercent}%`,
          }}
          aria-label="Перемотка"
        />

        <div className="vp-row">
          <button
            type="button"
            className="vp-btn"
            onClick={togglePlay}
            aria-label={playing ? 'Пауза' : 'Грати'}
          >
            {playing ? <PauseGlyph /> : <PlayGlyph />}
          </button>

          <span className="vp-time">
            {formatTime(current)} / {formatTime(duration)}
          </span>

          <span className="vp-spacer" />

          <button
            type="button"
            className="vp-btn"
            onClick={toggleMute}
            aria-label={muted ? 'Увімкнути звук' : 'Вимкнути звук'}
          >
            <VolumeGlyph muted={muted || volume === 0} />
          </button>
          <input
            className="vp-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={muted ? 0 : volume}
            onChange={(event) => changeVolume(event.target.value)}
            style={{ '--played': `${(muted ? 0 : volume) * 100}%` }}
            aria-label="Гучність"
          />

          {subtitles.length > 0 && (
            <button
              type="button"
              className={`vp-btn ${captions ? 'is-on' : ''}`}
              onClick={() => setA11y({ captions: !captions })}
              aria-label={captions ? 'Вимкнути субтитри' : 'Увімкнути субтитри'}
              aria-pressed={captions}
            >
              <CaptionsGlyph />
            </button>
          )}

          <div className="vp-menu-wrap">
            <button
              type="button"
              className="vp-btn"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Налаштування"
              aria-expanded={menuOpen}
            >
              <SettingsGlyph />
            </button>
            {menuOpen && (
              <div className="vp-menu">
                {sources.length > 1 && (
                  <>
                    <strong>Якість</strong>
                    {sources.map((item, index) => (
                      <button
                        key={item.url}
                        type="button"
                        className={index === sourceIndex ? 'is-active' : ''}
                        onClick={() => changeQuality(index)}
                      >
                        {item.label}
                      </button>
                    ))}
                  </>
                )}
                <strong>Швидкість</strong>
                {RATES.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={item === rate ? 'is-active' : ''}
                    onClick={() => changeRate(item)}
                  >
                    {item === 1 ? 'Звичайна' : `${item}×`}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            className="vp-btn"
            onClick={toggleFullscreen}
            aria-label="На весь екран"
          >
            <FullscreenGlyph active={fullscreen} />
          </button>
        </div>
      </div>
    </div>
  )
}
