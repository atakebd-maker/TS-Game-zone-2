import React, { useState } from 'react';
import { GameItem } from '../../types';
import {
  Gamepad2,
  Car,
  Crosshair,
  Shield,
  CircleDot,
  Layers,
  Zap,
  Grid,
  Bike,
  Trophy,
  Brain,
  Crown,
  Users,
  Compass,
} from 'lucide-react';

interface Props {
  game: GameItem;
  className?: string;
  priority?: boolean;
}

export const GameThumbnail: React.FC<Props> = ({ game, className = 'w-full h-full object-cover' }) => {
  const [imgError, setImgError] = useState(false);

  if (game.thumbnail && !imgError) {
    return (
      <img
        src={game.thumbnail}
        alt={game.title}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setImgError(true)}
        className={className}
      />
    );
  }

  // Domain-specific stylized fallback artwork
  const getThemedGraphic = () => {
    switch (game.category) {
      case 'basketball':
        return (
          <div className="w-full h-full bg-gradient-to-br from-amber-600 via-orange-600 to-amber-950 flex flex-col items-center justify-center p-4 text-white">
            <CircleDot className="w-12 h-12 text-amber-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-amber-200 mt-1 uppercase tracking-wider">Street Hoops</div>
          </div>
        );
      case 'board':
        return (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-black flex flex-col items-center justify-center p-4 text-white">
            <span className="text-4xl mb-1 drop-shadow">♔</span>
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-slate-300 mt-1 uppercase tracking-wider">Board Strategy</div>
          </div>
        );
      case 'card':
        return (
          <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-emerald-950 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Layers className="w-12 h-12 text-emerald-300 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-emerald-200 mt-1 uppercase tracking-wider">Klondike Royale</div>
          </div>
        );
      case 'puzzle':
      case 'brain':
        return (
          <div className="w-full h-full bg-gradient-to-br from-blue-700 via-indigo-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Grid className="w-12 h-12 text-blue-300 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-blue-200 mt-1 uppercase tracking-wider">Logic & Brain</div>
          </div>
        );
      case 'motorcycle':
        return (
          <div className="w-full h-full bg-gradient-to-br from-rose-700 via-orange-800 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Bike className="w-12 h-12 text-rose-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-rose-200 mt-1 uppercase tracking-wider">Stunt Trials</div>
          </div>
        );
      case 'football':
        return (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Trophy className="w-12 h-12 text-teal-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-teal-200 mt-1 uppercase tracking-wider">Penalty Cup</div>
          </div>
        );
      case 'educational':
      case 'kids':
        return (
          <div className="w-full h-full bg-gradient-to-br from-sky-600 via-cyan-800 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Brain className="w-12 h-12 text-cyan-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-cyan-200 mt-1 uppercase tracking-wider">IQ Quest</div>
          </div>
        );
      case 'simulation':
        return (
          <div className="w-full h-full bg-gradient-to-br from-amber-700 via-amber-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Crown className="w-12 h-12 text-amber-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-amber-200 mt-1 uppercase tracking-wider">Decision Realm</div>
          </div>
        );
      case 'multiplayer-casual':
      case 'multiplayer':
        return (
          <div className="w-full h-full bg-gradient-to-br from-fuchsia-700 via-purple-900 to-slate-950 flex flex-col items-center justify-center p-4 text-white">
            <Users className="w-12 h-12 text-fuchsia-200 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-fuchsia-200 mt-1 uppercase tracking-wider">2P Battle</div>
          </div>
        );
      default:
        return (
          <div className="w-full h-full bg-gradient-to-br from-blue-600 via-slate-900 to-black flex flex-col items-center justify-center p-4 text-white">
            <Gamepad2 className="w-12 h-12 text-blue-300 mb-2 drop-shadow" />
            <div className="font-bold text-center text-sm drop-shadow">{game.title}</div>
            <div className="text-[10px] text-blue-200 mt-1 uppercase tracking-wider">Arcade HTML5</div>
          </div>
        );
    }
  };

  return <div className="w-full h-full overflow-hidden select-none">{getThemedGraphic()}</div>;
};
