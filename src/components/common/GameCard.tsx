import React from 'react';
import { GameItem } from '../../types';
import { GameThumbnail } from './GameThumbnail';
import { Play, Star, Heart } from 'lucide-react';

interface Props {
  game: GameItem;
  isFavorited?: boolean;
  onPlay: (game: GameItem) => void;
  onToggleFavorite?: (gameId: string) => void;
}

export const GameCard: React.FC<Props> = ({ game, isFavorited, onPlay, onToggleFavorite }) => {
  return (
    <div
      onClick={() => onPlay(game)}
      className="group relative bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition-all duration-300 cursor-pointer flex flex-col"
    >
      {/* Thumbnail with hover Play CTA overlay */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
        <GameThumbnail
          game={game}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />

        {/* Hover quick play button overlay */}
        <div className="absolute inset-0 bg-slate-950/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-xl shadow-blue-500/50 transform scale-90 group-hover:scale-105 transition-transform">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>
        </div>

        {/* Favorite quick button */}
        {onToggleFavorite && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(game.id);
            }}
            className="absolute top-2.5 right-2.5 p-2 rounded-xl bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-colors shadow-sm"
          >
            <Heart
              className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : 'text-slate-200'}`}
            />
          </button>
        )}
      </div>

      {/* Card Content: Title + Unboxed Metadata */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Quiet Category & Free Kicker */}
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-blue-600 uppercase tracking-wider capitalize">
              {game.category}
            </span>
            <span className="text-emerald-600 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px]">
              100% Free
            </span>
          </div>

          <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
            {game.title}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {game.description}
          </p>
        </div>

        {/* Bottom Actions: Rating + Extra Prominent Big Play Button */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span className="font-bold text-slate-800">{game.rating.toFixed(1)}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{game.plays.toLocaleString()} plays</span>
          </div>

          {/* Large, Eye-Catching Play Button */}
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:from-blue-500 group-hover:to-indigo-500 text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md shadow-blue-600/30 group-hover:scale-105 active:scale-95 transition-all">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>PLAY NOW</span>
          </div>
        </div>
      </div>
    </div>
  );
};
