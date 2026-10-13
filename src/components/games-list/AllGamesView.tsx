import React, { useState, useMemo } from 'react';
import { GameItem, CategoryInfo } from '../../types';
import { GameCard } from '../common/GameCard';
import { Search, ArrowUpDown, Smartphone, Monitor } from 'lucide-react';

interface Props {
  games: GameItem[];
  categories: CategoryInfo[];
  favorites: string[];
  onPlayGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
}

export const AllGamesView: React.FC<Props> = ({
  games,
  categories,
  favorites,
  onPlayGame,
  onToggleFavorite,
}) => {
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'alphabetical'>('popular');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  const filtered = useMemo(() => {
    let list = games.filter((g) => g.isPublished);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    if (selectedCat !== 'all') {
      list = list.filter(
        (g) => g.category === selectedCat || g.secondaryCategories?.includes(selectedCat as any)
      );
    }

    if (deviceFilter !== 'all') {
      list = list.filter((g) => g.deviceSupport.includes(deviceFilter));
    }

    list = [...list].sort((a, b) => {
      if (sortBy === 'popular') return b.plays - a.plays;
      if (sortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });

    return list;
  }, [games, search, selectedCat, deviceFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">All Playable Games</h1>
        <p className="text-sm text-slate-500 mt-1">
          Explore our complete catalog of browser titles. Filter by genre, device compatibility, or popularity.
        </p>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Categories, Device & Sort */}
        <div className="flex items-center gap-3 flex-wrap text-xs">
          {/* Category */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-700 cursor-pointer focus:outline-none"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Device */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['all', 'mobile', 'desktop'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDeviceFilter(d)}
                className={`px-2.5 py-1 rounded-lg capitalize font-medium ${
                  deviceFilter === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent font-semibold text-slate-700 cursor-pointer focus:outline-none"
            >
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="rating">Top Rated</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filtered.slice(0, visibleCount).map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorited={favorites.includes(game.id)}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <h3 className="text-base font-bold text-slate-800 mb-1">No Games Match Filters</h3>
          <p className="text-xs text-slate-500 mb-4">Try clearing filters or search keyword.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCat('all');
              setDeviceFilter('all');
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Load More */}
      {filtered.length > visibleCount && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setVisibleCount((v) => v + 12)}
            className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
          >
            Load More Games
          </button>
        </div>
      )}
    </div>
  );
};
