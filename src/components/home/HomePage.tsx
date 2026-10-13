import React from 'react';
import { GameItem, CategoryInfo } from '../../types';
import { HeroSection } from './HeroSection';
import { GameCard } from '../common/GameCard';
import { CategoryCard } from '../common/CategoryCard';
import { Sparkles, Flame, Clock, Trophy, Grid, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
  games: GameItem[];
  categories: CategoryInfo[];
  recentlyPlayedGames: GameItem[];
  favorites: string[];
  onPlayGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
  onSelectCategory: (catId: any) => void;
  onBrowseAll: () => void;
  showSponsoredAds: boolean;
}

export const HomePage: React.FC<Props> = ({
  games,
  categories,
  recentlyPlayedGames,
  favorites,
  onPlayGame,
  onToggleFavorite,
  onSelectCategory,
  onBrowseAll,
  showSponsoredAds,
}) => {
  const featuredGame = games.find((g) => g.isFeatured) || games[0];
  const featuredGamesList = games.filter((g) => g.isFeatured).slice(0, 4);
  const trendingGames = games.filter((g) => g.isTrending).slice(0, 4);
  const popularGames = games.filter((g) => g.isPopular).slice(0, 4);
  const newGames = games.filter((g) => g.isNew || g.badge === 'New').slice(0, 4);

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section */}
      <HeroSection
        featuredGame={featuredGame}
        onPlayGame={onPlayGame}
        onBrowseAll={onBrowseAll}
      />

      {/* Discrete Sponsored Advertising Banner (Monetization readiness, separated from game controls) */}
      {showSponsoredAds && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-100/60 p-3 text-center text-xs text-slate-500">
            <span className="font-semibold text-slate-400 uppercase tracking-widest text-[10px] mr-2">
              Sponsored
            </span>
            <span>Premium High-Speed Cloud Gaming Partner Showcase</span>
          </div>
        </div>
      )}

      {/* 2. Recently Played Section (if user has played any) */}
      {recentlyPlayedGames.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                Continue Playing (Recently Played)
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {recentlyPlayedGames.slice(0, 4).map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorited={favorites.includes(game.id)}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* 3. Featured Games Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Featured Games
            </h2>
          </div>
          <button
            onClick={onBrowseAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {featuredGamesList.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorited={favorites.includes(game.id)}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* 4. Trending Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 fill-orange-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Trending Right Now
            </h2>
          </div>
          <button
            onClick={onBrowseAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {trendingGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorited={favorites.includes(game.id)}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* 5. Explore Game Categories (All 22 Categories Grid) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Game Categories (22)
            </h2>
          </div>
          <button
            onClick={() => onSelectCategory(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {categories.map((cat) => {
            const count = games.filter(
              (g) => g.category === cat.id || g.secondaryCategories?.includes(cat.id)
            ).length;
            return (
              <CategoryCard
                key={cat.id}
                category={cat}
                count={count}
                isSelected={false}
                onSelect={() => onSelectCategory(cat.id)}
              />
            );
          })}
        </div>
      </section>

      {/* 6. Popular Games */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              Most Popular Hits
            </h2>
          </div>
          <button
            onClick={onBrowseAll}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <span>See All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {popularGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorited={favorites.includes(game.id)}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>

      {/* 7. New Releases */}
      {newGames.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-500" />
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
                New Releases
              </h2>
            </div>
            <button
              onClick={onBrowseAll}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>See All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {newGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isFavorited={favorites.includes(game.id)}
                onPlay={onPlayGame}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
          </div>
        </section>
      )}

      {/* Quality commitment callout banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-950 rounded-3xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-300 bg-blue-800/60 px-3 py-1 rounded-md">
              <ShieldCheck className="w-4 h-4 text-blue-300" />
              <span>TS Game Zone · Certified Free Play</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display">
              Play Free Mobile & PC Browser Games
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              No account creation required. Optimized touch controls for Android and iPhone, full keyboard mapping for PCs. Play, earn coins, and enjoy endless entertainment.
            </p>
          </div>

          <button
            onClick={onBrowseAll}
            className="px-8 py-3.5 bg-white hover:bg-slate-100 text-blue-900 font-bold rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 text-xs sm:text-sm"
          >
            Start Playing Free Now
          </button>
        </div>
      </section>

      {/* SEO Popular Search Tags Cloud (Exact user requested keywords for Google Search Indexing) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Popular Search Topics & Gaming Keywords (TS Game Zone)
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Find the best trending free online games across all categories in Bangladesh, India, UK, USA and worldwide.
          </p>

          <div className="flex flex-wrap gap-2 text-xs text-slate-600">
            {[
              'Online games',
              'free online games',
              'best online games',
              'games',
              'video games',
              'mobile games',
              'free fire game',
              'online free fire game',
              'online free fire',
              'online pubg',
              'pubg',
              'free fire',
              'Minecraft',
              'Minecraft mobile game',
              'play free online games',
              'online games free fire',
              'online games for PC',
              'boys game',
              'girls game',
              'online game paisa',
              'play game',
              'online game app',
              'best online games for mobile',
              'best online game Bangladesh',
              'best online game India',
              'United Kingdom game',
              'United status game',
              'online game ludo',
              'online game site',
              'free online game site',
              'free entertainment online game',
              'game game',
              'online game',
              'snake game',
              'TS Game Zone',
              'ts game zone',
            ].map((tag, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-slate-700 transition-colors border border-slate-200/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};
