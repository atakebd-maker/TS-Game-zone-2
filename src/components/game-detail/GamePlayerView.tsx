import React, { useState, useEffect, useRef } from 'react';
import { GameItem } from '../../types';
import {
  ArrowLeft,
  Maximize2,
  Minimize2,
  Heart,
  Share2,
  Star,
  Play,
  RotateCcw,
  Sparkles,
  Check,
  Smartphone,
  Monitor,
  Flame,
} from 'lucide-react';
import { NeonRacerGame } from '../games/NeonRacerGame';
import { CosmicDefenderGame } from '../games/CosmicDefenderGame';
import { PixelTowerDefenseGame } from '../games/PixelTowerDefenseGame';
import { SuperDunkGame } from '../games/SuperDunkGame';
import { ChessMasterGame } from '../games/ChessMasterGame';
import { SolitaireGame } from '../games/SolitaireGame';
import { CyberSnakeGame } from '../games/CyberSnakeGame';
import { BlockMatchGame } from '../games/BlockMatchGame';
import { PenaltyShootoutGame } from '../games/PenaltyShootoutGame';
import { NeonPongGame } from '../games/NeonPongGame';
import { KingdomGovernorGame } from '../games/KingdomGovernorGame';
import { WordQuestGame } from '../games/WordQuestGame';
import { MotoRushGame } from '../games/MotoRushGame';
import { MathSpeedGame } from '../games/MathSpeedGame';
import { LudoClassicGame } from '../games/LudoClassicGame';
import { ExternalEmbedPlayer } from '../games/ExternalEmbedPlayer';
import { GameThumbnail } from '../common/GameThumbnail';
import { sound } from '../../utils/audio';
import { playerWallet } from '../../utils/wallet';
import { AdBanner } from '../ads/AdBanner';

interface Props {
  game: GameItem;
  allGames: GameItem[];
  isFavorited: boolean;
  onToggleFavorite: (gameId: string) => void;
  onSelectGame: (game: GameItem) => void;
  onBack: () => void;
}

export const GamePlayerView: React.FC<Props> = ({
  game,
  allGames,
  isFavorited,
  onToggleFavorite,
  onSelectGame,
  onBack,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [walletCoins, setWalletCoins] = useState<number>(() => playerWallet.getCoins());
  const playerContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return playerWallet.subscribe((coins) => {
      setWalletCoins(coins);
    });
  }, []);

  // Auto record recently played
  useEffect(() => {
    try {
      const saved = localStorage.getItem('novaplay_recent');
      let recent: string[] = saved ? JSON.parse(saved) : [];
      recent = [game.id, ...recent.filter((id) => id !== game.id)].slice(0, 10);
      localStorage.setItem('novaplay_recent', JSON.stringify(recent));
    } catch {}
  }, [game.id]);

  const handleLaunchGame = () => {
    sound.playClick();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsPlaying(true);
    }, 350);
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleShare = () => {
    sound.playClick();
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: `${game.title} - TS Game Zone`,
        text: `Play ${game.title} free online on TS Game Zone!`,
        url,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopiedShare(true);
        setTimeout(() => setCopiedShare(false), 2000);
      });
    }
  };

  const renderGameEngine = () => {
    if (game.engineType === 'embed' && game.embedUrl) {
      return <ExternalEmbedPlayer embedUrl={game.embedUrl} title={game.title} onBack={() => setIsPlaying(false)} />;
    }

    switch (game.engineId) {
      case 'neon-racer':
        return <NeonRacerGame />;
      case 'cosmic-defender':
        return <CosmicDefenderGame />;
      case 'pixel-tower-defense':
        return <PixelTowerDefenseGame />;
      case 'super-dunk':
        return <SuperDunkGame />;
      case 'chess-master':
        return <ChessMasterGame />;
      case 'solitaire-classic':
        return <SolitaireGame />;
      case 'cyber-snake':
        return <CyberSnakeGame />;
      case 'block-match-blast':
        return <BlockMatchGame />;
      case 'penalty-shootout':
        return <PenaltyShootoutGame />;
      case 'neon-pong':
        return <NeonPongGame />;
      case 'kingdom-governor':
        return <KingdomGovernorGame />;
      case 'word-quest':
        return <WordQuestGame />;
      case 'moto-rush':
        return <MotoRushGame />;
      case 'math-speed':
        return <MathSpeedGame />;
      case 'ludo-classic':
        return <LudoClassicGame />;
      default:
        return <NeonRacerGame />;
    }
  };

  const similarGames = allGames
    .filter((g) => g.id !== game.id && (g.category === game.category || g.secondaryCategories?.includes(game.category)))
    .slice(0, 4);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20 sm:pb-8">
      {/* Top action breadcrumb & back button */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" />
          <span>Back to Games</span>
        </button>

        {/* Clean Live Metadata with Coins */}
        <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
          <span className="capitalize font-bold text-blue-600">{game.category} Games</span>
          <span aria-hidden="true">·</span>
          <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            100% Free
          </span>
          <span aria-hidden="true">·</span>
          <span className="bg-amber-50 text-amber-700 font-bold px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-mono">
            <span>🪙</span>
            <span>{walletCoins} Coins Earned</span>
          </span>
          <span aria-hidden="true" className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{game.plays.toLocaleString()} plays</span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1 text-amber-500 font-semibold">
            <Star className="w-3.5 h-3.5 fill-current" />
            {game.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Top Game Leaderboard Ad requested by user */}
      {!isFullscreen && (
        <div className="mb-4 flex justify-center w-full">
          <AdBanner format="728x90" label="Sponsored Banner" />
        </div>
      )}

      {/* Main Game Stage / Theater Container */}
      <div
        ref={playerContainerRef}
        className={`relative w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-200 shadow-2xl transition-all ${
          isFullscreen ? 'p-0 h-screen rounded-none' : ''
        }`}
      >
        {isPlaying ? (
          <div className="relative w-full h-full min-h-[560px] md:min-h-[660px] flex flex-col justify-center bg-slate-950 p-2 sm:p-4">
            {renderGameEngine()}

            {/* Quick in-theater toolbar */}
            <div className="mt-3 flex items-center justify-between px-4 py-2.5 bg-slate-900/90 rounded-2xl text-xs text-slate-300 border border-slate-800">
              <div className="flex items-center gap-3">
                <span className="text-white font-extrabold text-sm">{game.title}</span>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="text-amber-400 font-bold flex items-center gap-1 font-mono">
                  <span>🪙</span> {walletCoins} Coins in Wallet
                </span>
                <span className="hidden sm:inline text-slate-600">·</span>
                <span className="hidden sm:inline text-emerald-400 font-semibold">Instant Free Play</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleToggleFullscreen}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span>{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative w-full aspect-[16/10] min-h-[500px] md:min-h-[620px] flex items-center justify-center overflow-hidden group">
            {/* Background thumbnail with slight blur and darkening */}
            <div className="absolute inset-0 scale-105 filter blur-[3px] opacity-40">
              <GameThumbnail game={game} />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-slate-950/40" />

            {/* Center Super Sized Play Now CTA Box */}
            <div className="relative z-10 flex flex-col items-center text-center p-6 sm:p-12 max-w-3xl">
              {/* Massive Glowing Extra-Large Play Circle Button */}
              <div
                onClick={handleLaunchGame}
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-full bg-gradient-to-tr from-blue-700 via-blue-600 to-cyan-400 hover:from-blue-600 hover:to-cyan-300 text-white flex items-center justify-center shadow-[0_0_60px_rgba(37,99,235,0.7)] cursor-pointer transform hover:scale-108 active:scale-95 transition-all duration-300 mb-6 group-hover:ring-8 group-hover:ring-blue-400/40 animate-pulse"
              >
                <Play className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 fill-current ml-2 sm:ml-3 text-white drop-shadow-2xl" />
              </div>

              {/* Title & Badge */}
              <div className="inline-flex items-center gap-2 text-xs font-extrabold text-cyan-300 bg-cyan-950/80 border border-cyan-500/50 px-4 py-1.5 rounded-full mb-3 backdrop-blur-md shadow-lg">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span>100% FREE ONLINE GAME · ZERO DOWNLOAD REQUIRED</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 tracking-tight drop-shadow-lg">
                {game.title}
              </h1>

              <p className="text-sm md:text-base text-slate-200 line-clamp-2 mb-8 max-w-xl leading-relaxed drop-shadow">
                {game.description}
              </p>

              {/* Giant Clickable Play Button requested by user */}
              <button
                onClick={handleLaunchGame}
                disabled={isLoading}
                className="w-full sm:w-auto px-12 sm:px-18 py-5 md:py-6 bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xl sm:text-2xl font-black rounded-2xl shadow-[0_0_40px_rgba(37,99,235,0.6)] flex items-center justify-center gap-4 transition-all transform hover:scale-105 active:scale-95 tracking-wider uppercase cursor-pointer"
              >
                <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current text-white" />
                <span>PLAY GAME NOW (FREE)</span>
              </button>

              <div className="mt-5 flex items-center flex-wrap justify-center gap-4 text-xs sm:text-sm text-slate-300">
                <span className="flex items-center gap-1.5 text-amber-400 font-bold bg-slate-900/80 px-3 py-1 rounded-lg border border-amber-400/30">
                  <span>🪙</span> Earn In-Game Coins
                </span>
                <span>·</span>
                <span className="text-cyan-300 font-medium">Touch Screen & Keyboard Ready</span>
                <span>·</span>
                <span className="text-emerald-400 font-medium">Fast HTML5 Loading</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Sticky Mobile Play Action Bar */}
      {!isPlaying && (
        <div className="fixed sm:hidden bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-lg p-3.5 border-t border-blue-900/60 flex items-center justify-between gap-3 shadow-[0_-10px_25px_rgba(0,0,0,0.5)]">
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-black text-white truncate">{game.title}</span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span>🪙</span> Earn Coins · 100% Free
            </span>
          </div>
          <button
            onClick={handleLaunchGame}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 active:scale-95 text-white font-black text-sm uppercase rounded-xl shadow-lg shadow-blue-600/50 flex items-center gap-2 shrink-0 animate-pulse"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>PLAY NOW</span>
          </button>
        </div>
      )}

      {/* Below Game Stage Ad Banner requested by user */}
      {!isFullscreen && (
        <div className="my-6 flex justify-center w-full">
          <AdBanner format="728x90" label="Advertisement" />
        </div>
      )}

      {/* Game Details Bar & Actions */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <span className="capitalize font-semibold text-blue-600">{game.category} Games</span>
              <span aria-hidden="true">·</span>
              <span>Developer: {game.developer}</span>
              <span aria-hidden="true">·</span>
              <span>Updated {game.releaseDate}</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">{game.title}</h2>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => onToggleFavorite(game.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all ${
                isFavorited
                  ? 'bg-rose-50 border-rose-200 text-rose-600 shadow-sm'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current text-rose-600' : 'text-slate-400'}`} />
              <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              {copiedShare ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-400" />}
              <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
            </button>

            <button
              onClick={handleToggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Maximize2 className="w-4 h-4 text-slate-400" />
              <span>Fullscreen</span>
            </button>
          </div>
        </div>

        {/* Description & Controls Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
          <div className="lg:col-span-8 space-y-5">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">About the Game</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{game.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">How to Play</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{game.instructions}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Controls</h3>
              <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-600" /> Keyboard & Mouse:
                </div>
                {game.controls.keyboard.map((ctrl, i) => (
                  <div key={i} className="pl-5">· {ctrl}</div>
                ))}
                <div className="font-semibold text-slate-800 mt-3 mb-1 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-blue-600" /> Touch & Mobile:
                </div>
                <div className="pl-5">· {game.controls.touch}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-4">
            {/* Rating card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Player Rating</div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-3xl font-extrabold text-slate-900 font-mono">{game.rating.toFixed(1)}</div>
                <div className="text-xs text-slate-500">out of 5 ({game.ratingCount.toLocaleString()} votes)</div>
              </div>

              <div className="flex items-center gap-1 pt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => {
                      setUserRating(star);
                      sound.playCoin();
                    }}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        (userRating || Math.round(game.rating)) >= star
                          ? 'text-amber-400 fill-current'
                          : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                {userRating && <span className="text-xs text-emerald-600 font-semibold ml-2">Thanks!</span>}
              </div>
            </div>

            {/* Device Support */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800 uppercase tracking-wider">Device Compatibility</div>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-blue-600" />
                <span>Compatible with iOS, Android, Tablets, and Desktops</span>
              </div>
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-blue-600" />
                <span>Instant HTML5 engine · No downloads or plugins</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mid-content Ad Banner requested by user */}
      {!isFullscreen && (
        <div className="mt-8 mb-4 flex justify-center w-full">
          <AdBanner format="468x60" label="Sponsored Partner" />
        </div>
      )}

      {/* Recommended & Similar Games Row */}
      {similarGames.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-slate-900">Recommended Similar Games</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {similarGames.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectGame(item);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-blue-400 transition-all cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  <GameThumbnail game={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] text-slate-500 capitalize mb-1">{item.category}</div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between mt-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1 text-amber-500 font-semibold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {item.rating.toFixed(1)}
                    </span>
                    <span className="text-blue-600 font-bold group-hover:underline">Play Now →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
