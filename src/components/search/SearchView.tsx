import React, { useState, useMemo } from 'react';
import { GameItem, CategoryInfo } from '../../types';
import { GameCard } from '../common/GameCard';
import { Search, ArrowUpDown, Smartphone, Monitor } from 'lucide-react';

interface Props {
  query: string;
  games: GameItem[];
  categories: CategoryInfo[];
  onPlayGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
  favorites: string[];
}

export const SearchView: React.FC<Props> = ({
  query,
  games,
  categories,
  onPlayGame,
  onToggleFavorite,
  favorites,
}) => {
  const [searchTerm, setSearchTerm] = useState(query);
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'alphabetical'>('popular');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');

  const filteredGames = useMemo(() => {
    let result = games;
    const q = searchTerm.trim().toLowerCase();

    if (q) {
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.instructions.toLowerCase().includes(q) ||
          g.developer.toLowerCase().includes(q)
      );
    }

    if (selectedCat !== 'all') {
      result = result.filter(
        (g) => g.category === selectedCat || g.secondaryCategories?.includes(selectedCat as any)
      );
    }

    if (deviceFilter !== 'all') {
      result = result.filter((g) => g.deviceSupport.includes(deviceFilter));
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'popular') return b.plays - a.plays;
      if (sortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [games, searchTerm, selectedCat, deviceFilter, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Search Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Search Games</h1>
        <p className="text-sm text-slate-500 mt-1">
          Showing results for <span className="font-semibold text-blue-600">"{searchTerm || 'All Games'}"</span>
        </p>

        {/* Big Search Bar */}
        <div className="relative max-w-2xl mt-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by game title, category, keywords..."
            className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 border border-slate-200 rounded-2xl shadow-sm focus:border-blue-500 focus:outline-none text-sm transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="all">All Categories (22)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Device filter */}
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Device:</span>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
              {(['all', 'mobile', 'desktop'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => setDeviceFilter(d)}
                  className={`px-2.5 py-1 rounded-md capitalize font-medium ${
                    deviceFilter === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Results Count */}
      <div className="text-xs text-slate-500 mb-6">
        Found <strong className="text-slate-900">{filteredGames.length}</strong> matching{' '}
        {filteredGames.length === 1 ? 'game' : 'games'}
      </div>

      {/* Grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
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
        <div className="py-20 text-center bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Games Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            We couldn't find any games matching "{searchTerm}". Try searching for categories like "racing", "shooting", or "chess".
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCat('all');
              setDeviceFilter('all');
            }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-colors"
          >
            Clear Search
          </button>
        </div>
      )}
    </div>
  );
};
