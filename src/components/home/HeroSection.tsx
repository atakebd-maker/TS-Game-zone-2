import React from 'react';
import { Play, Sparkles, Flame, Shield, ArrowRight } from 'lucide-react';
import { GameItem } from '../../types';
import heroShowcaseImg from '../../assets/images/hero_gaming_showcase_1791766548804.jpg';

interface Props {
  featuredGame?: GameItem;
  onPlayGame: (game: GameItem) => void;
  onBrowseAll: () => void;
}

export const HeroSection: React.FC<Props> = ({ featuredGame, onPlayGame, onBrowseAll }) => {
  return (
    <section className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>TS Game Zone · Play 100% Free Online & Mobile Games</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight font-display leading-[1.15] text-balance">
              TS Game Zone – Free Online Games & Entertainment.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
              Play thousands of free action, racing, car stunts, puzzle, ludo, snake, and sports games directly in your mobile phone or PC browser. Zero download, instant play, and earn real in-game coins as you win!
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              {featuredGame && (
                <button
                  onClick={() => onPlayGame(featuredGame)}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Play {featuredGame.title}</span>
                </button>
              )}

              <button
                onClick={onBrowseAll}
                className="px-6 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl border border-slate-200 transition-colors flex items-center gap-2"
              >
                <span>Browse All Games</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Quiet feature metrics strip */}
            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500">
              <div>
                <span className="font-bold text-slate-900 text-sm">100%</span> Free to Play
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <div>
                <span className="font-bold text-slate-900 text-sm">22</span> Categories
              </div>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <div>
                <span className="font-bold text-slate-900 text-sm">Zero</span> Lag HTML5
              </div>
            </div>
          </div>

          {/* Right Showcase Card Column */}
          <div className="lg:col-span-5">
            <div
              onClick={() => featuredGame && onPlayGame(featuredGame)}
              className="group relative rounded-3xl overflow-hidden border border-slate-200 shadow-2xl bg-slate-900 cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
            >
              <div className="aspect-[16/10] overflow-hidden">
                <img
                  src={heroShowcaseImg}
                  alt="NovaPlay Featured Game Showcase"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent" />

              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
                  <Flame className="w-3.5 h-3.5 fill-current" />
                  <span>Featured Title of the Week</span>
                </div>
                <h3 className="text-xl font-bold font-display group-hover:text-blue-300 transition-colors">
                  {featuredGame?.title || 'Neon Velocity: Overdrive'}
                </h3>
                <p className="text-xs text-slate-300 line-clamp-1 mt-1">
                  {featuredGame?.description || 'Fast arcade racing on high-speed neon speedways.'}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Tap to start instant match</span>
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Play className="w-4 h-4 fill-current text-white ml-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
