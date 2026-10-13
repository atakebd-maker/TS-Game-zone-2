import React from 'react';
import { GameItem } from '../../types';
import { GameCard } from '../common/GameCard';
import { Heart, ArrowRight } from 'lucide-react';

interface Props {
  games: GameItem[];
  favorites: string[];
  onPlayGame: (game: GameItem) => void;
  onToggleFavorite: (gameId: string) => void;
  onBrowseAll: () => void;
}

export const FavoritesView: React.FC<Props> = ({
  games,
  favorites,
  onPlayGame,
  onToggleFavorite,
  onBrowseAll,
}) => {
  const favoriteGames = games.filter((g) => favorites.includes(g.id));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
          <h1 className="text-3xl font-extrabold text-slate-900 font-display">My Favorite Games</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Your saved personal collection of games. Stored in your browser for instant one-click access.
        </p>
      </div>

      {favoriteGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoriteGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isFavorited={true}
              onPlay={onPlayGame}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-white rounded-3xl border border-slate-200 p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">No Favorites Added Yet</h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            Click the heart icon on any game thumbnail or game detail page to save your favorite titles here for quick access.
          </p>
          <button
            onClick={onBrowseAll}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 inline-flex items-center gap-2"
          >
            <span>Browse Games Collection</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
