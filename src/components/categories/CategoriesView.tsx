import React, { useState, useMemo } from 'react';
import { CategoryInfo, GameItem, GameCategory } from '../../types';
import { GameCard } from '../common/GameCard';
import { CategoryCard, getCategoryIcon } from '../common/CategoryCard';
import { Search, Filter, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

interface Props {
  categories: CategoryInfo[];
  games: GameItem[];
  selectedCategoryId: GameCategory | null;
  onSelectCategory: (catId: GameCategory | null) => void;
  onPlayGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
  favorites: string[];
}

export const CategoriesView: React.FC<Props> = ({
  categories,
  games,
  selectedCategoryId,
  onSelectCategory,
  onPlayGame,
  onToggleFavorite,
  favorites,
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [sortBy, setSortBy] = useState<'popular' | 'newest' | 'rating' | 'alphabetical'>('popular');
  const [deviceFilter, setDeviceFilter] = useState<'all' | 'mobile' | 'desktop'>('all');
  const [visibleCount, setVisibleCount] = useState(12);

  const activeCategory = categories.find((c) => c.id === selectedCategoryId);

  // Compute game counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of categories) {
      counts[c.id] = games.filter(
        (g) => g.category === c.id || g.secondaryCategories?.includes(c.id)
      ).length;
    }
    return counts;
  }, [categories, games]);

  // Filter games
  const filteredGames = useMemo(() => {
    let result = games;

    if (selectedCategoryId) {
      result = result.filter(
        (g) => g.category === selectedCategoryId || g.secondaryCategories?.includes(selectedCategoryId)
      );
    }

    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q)
      );
    }

    if (deviceFilter !== 'all') {
      result = result.filter((g) => g.deviceSupport.includes(deviceFilter));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'popular') return b.plays - a.plays;
      if (sortBy === 'newest') return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'alphabetical') return a.title.localeCompare(b.title);
      return 0;
    });

    return result;
  }, [games, selectedCategoryId, searchFilter, deviceFilter, sortBy]);

  const displayedGames = filteredGames.slice(0, visibleCount);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category header */}
      <div className="mb-8">
        {activeCategory ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                {getCategoryIcon(activeCategory.icon, 'w-6 h-6')}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
                  {activeCategory.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {activeCategory.description}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectCategory(null)}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl self-start sm:self-auto transition-colors"
            >
              View All 22 Categories
            </button>
          </div>
        ) : (
          <div className="pb-6 border-b border-slate-200">
            <h1 className="text-3xl font-extrabold text-slate-900 font-display">
              Browse Game Categories
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select any of the 22 genre categories to discover playable browser titles.
            </p>
          </div>
        )}
      </div>

      {/* 22 Categories Selection Matrix (when no category selected or toggling) */}
      {!selectedCategoryId && (
        <div className="mb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                count={categoryCounts[cat.id]}
                isSelected={false}
                onSelect={() => onSelectCategory(cat.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Filter & Sort Controls Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-8 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search inside category */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={activeCategory ? `Search in ${activeCategory.name}...` : 'Search games...'}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filters and Sorting */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Device Filter */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            {(['all', 'mobile', 'desktop'] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDeviceFilter(d)}
                className={`px-3 py-1.5 rounded-lg font-medium capitalize transition-all ${
                  deviceFilter === d ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {d === 'all' ? 'All Devices' : d}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-slate-800 font-medium focus:outline-none cursor-pointer"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest First</option>
              <option value="rating">Top Rated</option>
              <option value="alphabetical">A-Z Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* Games Grid */}
      {displayedGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {displayedGames.map((game) => (
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
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-1">No Games Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
            No titles match your current search or device filter criteria. Try clearing filters.
          </p>
          <button
            onClick={() => {
              setSearchFilter('');
              setDeviceFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Load More Button */}
      {filteredGames.length > visibleCount && (
        <div className="mt-12 text-center">
          <button
            onClick={() => setVisibleCount((c) => c + 12)}
            className="px-8 py-3 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-xl border border-slate-200 shadow-sm transition-all hover:scale-[1.02]"
          >
            Load More Games ({filteredGames.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </div>
  );
};
