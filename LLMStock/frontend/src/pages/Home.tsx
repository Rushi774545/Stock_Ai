import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, ChevronLeft, ChevronRight, ArrowRight, TrendingUp, Shield, LineChart } from 'lucide-react';
import { cn } from '../utils/utils';

const THEME_KEY = 'morpheus-theme';
const SLIDE_MS = 7000;

/**
 * First slide uses video. Override with `VITE_HERO_VIDEO=/hero/hero.mp4` for a local file.
 * Default: Google sample bucket (allows embedding; replace anytime).
 */
const HERO_VIDEO_OVERRIDE =
  typeof import.meta.env.VITE_HERO_VIDEO === 'string' && import.meta.env.VITE_HERO_VIDEO.trim() !== ''
    ? import.meta.env.VITE_HERO_VIDEO.trim()
    : null;

const DEFAULT_HERO_VIDEO =
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

type Slide = {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  /** Optional looping background video (first slide) */
  video?: string;
  image: string;
};

/** Remote hero art only (no bundled PNGs) — finance / data / team themes */
const SLIDES: Slide[] = [
  {
    id: 'analytics',
    badge: '✨ AI-powered institutional analytics',
    title: 'Clarity in every market decision',
    subtitle:
      'Morpheus unifies portfolio intelligence, risk, and narrative insight—built for teams who treat capital as a craft.',
    video: HERO_VIDEO_OVERRIDE ?? DEFAULT_HERO_VIDEO,
    /** Poster while the MP4 loads */
    image:
      'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'models',
    badge: '💡 Models + narrative',
    title: 'Deterministic math, human-grade answers',
    subtitle: 'Copilots grounded in your data boundary—audit-friendly, fast, and never generic.',
    image:
      'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'risk',
    badge: '✨ Risk & compliance',
    title: 'Stress paths you can defend',
    subtitle:
      'Exposure maps and scenario exports that satisfy ops and regulators without leaving the workflow.',
    image:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'markets',
    badge: '📈 Live market context',
    title: 'Signals that survive the open',
    subtitle: 'Streaming quotes, fundamentals, and AI summaries in one institutional workspace.',
    image:
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=2400&q=80',
  },
  {
    id: 'execution',
    badge: '⚡ Execution-ready',
    title: 'From thesis to portfolio in one flow',
    subtitle: 'Watchlists, allocation, and chat with your data—without tab sprawl.',
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=2400&q=80',
  },
];

function applyThemeClass(isDark: boolean) {
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
  }
}

const Home: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(THEME_KEY) !== 'light';
  });
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    applyThemeClass(isDark);
    localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
  }, [isDark]);

  const slide = SLIDES[index];
  const total = SLIDES.length;

  const go = useCallback((dir: -1 | 1) => {
    setIndex((i) => (i + dir + total) % total);
  }, [total]);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const tick = setInterval(() => {
      const p = Math.min(1, (Date.now() - start) / SLIDE_MS);
      setProgress(p);
    }, 40);
    const advance = setTimeout(() => {
      setIndex((i) => (i + 1) % total);
    }, SLIDE_MS);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
  }, [index, total]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !slide.video) return;
    v.play().catch(() => {});
  }, [slide.video, index]);

  const toggleTheme = () => setIsDark((d) => !d);

  const heroImage = slide.image;

  return (
    <div
      className={cn(
        'min-h-screen flex flex-col transition-colors duration-500',
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'
      )}
    >
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 transition-all',
          isDark
            ? 'bg-slate-200/85 backdrop-blur-xl border-b border-slate-300/50'
            : 'bg-white/90 backdrop-blur-xl border-b border-slate-200/80'
        )}
      >
        <Link
          to="/"
          className={cn(
            'text-lg md:text-xl font-black tracking-[0.14em] uppercase text-slate-950'
          )}
        >
            MORPHEUS
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
          <a href="#services" className="hover:text-primary-600 transition-colors">
            Services
          </a>
          <a href="#about" className="hover:text-primary-600 transition-colors">
            About
          </a>
          <a href="#insights" className="hover:text-primary-600 transition-colors">
            Insights
          </a>
          <a href="#contact" className="hover:text-primary-600 transition-colors">
            Contact
          </a>
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          <button
            type="button"
            onClick={toggleTheme}
            className={cn(
              'p-2 rounded-full transition-colors',
              isDark ? 'text-slate-800 hover:bg-slate-300/60' : 'text-slate-600 hover:bg-slate-100'
            )}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Moon size={20} strokeWidth={2} /> : <Sun size={20} strokeWidth={2} />}
          </button>
          <Link
            to="/login"
            className={cn(
              'hidden sm:inline text-sm font-medium',
              isDark ? 'text-slate-800' : 'text-slate-700'
            )}
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 shadow-lg shadow-primary-600/25 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      <section className="relative min-h-[100dvh] flex flex-col pt-16">
        <div className="absolute inset-0 overflow-hidden bg-slate-950">
          {slide.video ? (
            <video
              ref={videoRef}
              key={slide.video}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              poster={slide.image}
            >
              <source src={slide.video} type="video/mp4" />
            </video>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id + heroImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="absolute inset-0"
              >
                <img src={heroImage} alt="" className="h-full w-full object-cover" />
              </motion.div>
            </AnimatePresence>
          )}

          <div
            className={cn(
              'absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/55 to-slate-950/90',
              !isDark && 'from-black/50 via-black/40 to-black/75'
            )}
          />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_20%,rgba(14,165,233,0.12),transparent)] pointer-events-none" />
        </div>

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.45 }}
              className="space-y-6"
            >
              <span
                className={cn(
                  'inline-flex items-center rounded-full border px-4 py-1.5 text-xs font-medium tracking-wide',
                  'bg-white/10 border-white/25 text-white/95 backdrop-blur-md'
                )}
              >
                {slide.badge}
              </span>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white tracking-tight text-balance leading-[1.1]">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-white/85 max-w-2xl mx-auto font-light leading-relaxed">
                {slide.subtitle}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Link
                  to="/register"
                  className="rounded-full bg-primary-600 hover:bg-primary-500 text-white font-semibold px-8 py-3.5 shadow-xl shadow-primary-900/40 transition-colors"
                >
                  Enquire Now
                </Link>
                <Link
                  to="/app"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-3.5 transition-colors"
                >
                  Explore platform
                  <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 pb-10 flex flex-col items-center gap-3">
          <div className="flex items-center gap-3 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-2 py-2">
            <button
              type="button"
              onClick={() => go(-1)}
              className="p-2 rounded-full text-white hover:bg-white/15 transition-colors"
              aria-label="Previous slide"
            >
              <ChevronLeft size={22} />
            </button>
            <div className="flex items-center gap-1.5 px-2">
              {SLIDES.map((_, i) => (
                <button
                  key={SLIDES[i].id}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    i === index ? 'w-8 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/60'
                  )}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => go(1)}
              className="p-2 rounded-full text-white hover:bg-white/15 transition-colors"
              aria-label="Next slide"
            >
              <ChevronRight size={22} />
            </button>
          </div>
          <div className="h-0.5 w-48 md:w-64 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-white/90 rounded-full transition-[width] duration-100 ease-linear"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </section>

      <section
        id="services"
        className={cn(
          'py-24 px-6 border-t',
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        )}
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Services
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Built for serious equity workflows</h2>
          <p className={cn('max-w-2xl mb-14', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Everything you expect from a modern markets stack—unified in Morpheus so research, risk, and execution stay
            connected.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: TrendingUp,
                title: 'Markets & watchlists',
                body: 'Screen, compare, and drill into symbols with live context and clean fundamentals.',
              },
              {
                icon: LineChart,
                title: 'Portfolio analytics',
                body: 'Holdings, performance, and scenario views designed for decisions—not static reports.',
              },
              {
                icon: Shield,
                title: 'Governance-friendly AI',
                body: 'Chat and summaries grounded in your workspace data with clear audit boundaries.',
              },
            ].map(({ icon: Icon, title, body }) => (
              <div
                key={title}
                className={cn(
                  'rounded-2xl p-8 border transition-colors',
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-primary-600/15 flex items-center justify-center text-primary-600 dark:text-primary-400 mb-4">
                  <Icon size={24} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{title}</h3>
                <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className={cn('py-24 px-6', isDark ? 'bg-slate-900/50' : 'bg-white')}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-14 items-center">
          <div>
            <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-2">
              About
            </p>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Capital markets, distilled</h2>
            <p className={cn('leading-relaxed mb-4', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Morpheus is an institutional-style workspace for individual investors and teams who need reliable data,
              disciplined analytics, and AI that respects boundaries—without noise or generic answers.
            </p>
            <p className={cn('leading-relaxed', isDark ? 'text-slate-400' : 'text-slate-600')}>
              Sign in to reach your dashboard, positions, and AI copilot in one place.
            </p>
          </div>
          <div
            className={cn(
              'rounded-2xl overflow-hidden border aspect-video',
              isDark ? 'border-slate-700' : 'border-slate-200'
            )}
          >
            <img
              src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80"
              alt="Team collaboration"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      <section
        id="insights"
        className={cn('py-24 px-6 border-t', isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}
      >
        <div className="max-w-6xl mx-auto">
          <p className="text-primary-600 dark:text-primary-400 text-sm font-semibold uppercase tracking-wider mb-2">
            Insights
          </p>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">Signals at a glance</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { label: 'Universe coverage', value: 'Global equities' },
              { label: 'Update cadence', value: 'Near real-time' },
              { label: 'Risk views', value: 'Exposure maps' },
              { label: 'AI layer', value: 'Document-grounded' },
            ].map((row) => (
              <div
                key={row.label}
                className={cn(
                  'rounded-xl p-6 border',
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                )}
              >
                <p className={cn('text-sm mb-1', isDark ? 'text-slate-500' : 'text-slate-500')}>{row.label}</p>
                <p className="text-xl font-semibold">{row.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className={cn('py-24 px-6', isDark ? 'bg-slate-900/40' : 'bg-white')}>
        <div
          className={cn(
            'max-w-4xl mx-auto rounded-3xl p-10 md:p-14 text-center border',
            isDark ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800' : 'bg-primary-50 border-primary-100'
          )}
        >
          <h2 className="text-3xl font-bold mb-4">Start with your workspace</h2>
          <p className={cn('mb-8 max-w-lg mx-auto', isDark ? 'text-slate-400' : 'text-slate-600')}>
            Create an account or sign in to open the full platform—dashboard, stocks, portfolio, and AI chat.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/register"
              className="rounded-full bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className={cn(
                'rounded-full font-semibold px-8 py-3 border transition-colors',
                isDark
                  ? 'border-slate-600 hover:bg-slate-800'
                  : 'border-slate-300 bg-white hover:bg-slate-50'
              )}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      <footer
        className={cn(
          'py-10 px-6 border-t text-sm',
          isDark ? 'bg-slate-950 border-slate-800 text-slate-500' : 'bg-slate-50 border-slate-200 text-slate-600'
        )}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-black uppercase tracking-tight text-slate-800 dark:text-slate-200">MORPHEUS</span>
          <div className="flex gap-6">
            <a href="#services" className="hover:text-primary-600">
              Services
            </a>
            <Link to="/login" className="hover:text-primary-600">
              Sign in
            </Link>
            <Link to="/app" className="hover:text-primary-600">
              Platform
            </Link>
          </div>
          <p>© {new Date().getFullYear()} MORPHEUS. For informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
