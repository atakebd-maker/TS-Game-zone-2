import React, { useState, useEffect } from 'react';
import { Search, Heart, User, Menu, X, Shield, Sparkles, Gamepad2 } from 'lucide-react';
import { GameItem, CategoryInfo } from '../../types';
import { playerWallet } from '../../utils/wallet';

interface Props {
  brandName: string;
  onNavigateHome: () => void;
  onNavigateCategories: () => void;
  onNavigateAllGames: () => void;
  onNavigateFavorites: () => void;
  onNavigateAdmin: () => void;
  onSearch: (query: string) => void;
  onSelectGame: (game: GameItem) => void;
  favoritesCount: number;
  games: GameItem[];
  currentView: string;
}

export const Navbar: React.FC<Props> = ({
  brandName,
  onNavigateHome,
  onNavigateCategories,
  onNavigateAllGames,
  onNavigateFavorites,
  onNavigateAdmin,
  onSearch,
  onSelectGame,
  favoritesCount,
  games,
  currentView,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [playerCoins, setPlayerCoins] = useState(() => playerWallet.getCoins());

  useEffect(() => {
    return playerWallet.subscribe((coins) => {
      setPlayerCoins(coins);
    });
  }, []);

  // Autocomplete search suggestions
  const searchResults = searchQuery.trim()
    ? games
        .filter(
          (g) =>
            g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
            g.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 5)
    : [];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setIsSearchOpen(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark with custom logo */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 text-slate-900 hover:text-blue-600 transition-colors group"
            >
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkKI4twxct8O-2o4m_D8G6M-Ax82Ya3GW8qkVOllaZnl-zlv123S_m7fKUQcUcGqMvuWgamV12i7allJ7It4vHtNLnYTNC1jYLy505cchZbBlMbtDhE1maYaCQo-5sZL025qckIBlFd6tdd3GKONBOCATB8ep-kN5sp-yun2fUAc0g9vLAIE3JxpOGRXk/s96/1000047095.png"
                alt="TS Game Zone Logo"
                className="w-9 h-9 object-contain rounded-xl shadow-sm"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-xl font-extrabold tracking-tight font-display whitespace-nowrap text-blue-600 sm:text-slate-900">
                {brandName || 'TS Game Zone'}
              </span>
            </button>
          </div>

          {/* Zone 2: 4–5 single-line clean text nav links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={onNavigateHome}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'home' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Home
            </button>
            <button
              onClick={onNavigateCategories}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'categories' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Categories
            </button>
            <button
              onClick={onNavigateAllGames}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'all-games' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              All Games
            </button>
            <button
              onClick={onNavigateFavorites}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                currentView === 'favorites' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.2 rounded font-bold">
                  {favoritesCount}
                </span>
              )}
            </button>
            <button
              onClick={onNavigateAdmin}
              className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 ${
                currentView === 'admin' ? 'text-blue-600 font-semibold' : ''
              }`}
            >
              Admin
            </button>
          </nav>

          {/* Zone 3: Coins Balance + Search + Primary CTA */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Live Coin Wallet Display */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200/80 rounded-xl text-amber-900 text-xs font-bold shadow-xs"
              title="Real Coins Earned by Playing Games (Starts at 0)"
            >
              <span className="text-sm">🪙</span>
              <span className="font-mono">{playerCoins.toLocaleString()}</span>
              <span className="text-[10px] text-amber-700 hidden sm:inline font-semibold">Coins</span>
            </div>
            {/* Search Input on Desktop */}
            <div className="relative hidden lg:block w-64">
              <form onSubmit={handleSearchSubmit}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 14+ free games..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200/70 focus:bg-white text-slate-900 placeholder:text-slate-500 rounded-lg border border-transparent focus:border-blue-500 focus:outline-none transition-all"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </form>

              {/* Autocomplete Dropdown */}
              {searchQuery.trim() && searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50">
                  <div className="p-1.5">
                    {searchResults.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => {
                          onSelectGame(game);
                          setSearchQuery('');
                        }}
                        className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="w-9 h-9 rounded bg-slate-900 shrink-0 overflow-hidden">
                          {game.thumbnail ? (
                            <img src={game.thumbnail} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Gamepad2 className="w-5 h-5 text-blue-400 m-2" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{game.title}</div>
                          <div className="text-[10px] text-slate-500 capitalize">{game.category}</div>
                        </div>
                      </div>
                    ))}
                    <div
                      onClick={handleSearchSubmit}
                      className="text-center py-2 text-xs text-blue-600 font-semibold hover:bg-blue-50 rounded-lg cursor-pointer border-t border-slate-100 mt-1"
                    >
                      See all matches for "{searchQuery}" →
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Search Toggle */}
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Primary Action Button */}
            <button
              onClick={onNavigateAllGames}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap shadow-sm shadow-blue-600/20"
            >
              Play Games
            </button>

            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Search Expansion Bar */}
      {isSearchOpen && (
        <div className="lg:hidden border-t border-slate-200 px-4 py-3 bg-slate-50">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search free online games..."
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </form>
        </div>
      )}

      {/* Mobile Collapsible Navigation Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1 shadow-lg">
          <button
            onClick={() => {
              onNavigateHome();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Home
          </button>
          <button
            onClick={() => {
              onNavigateCategories();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Game Categories (22)
          </button>
          <button
            onClick={() => {
              onNavigateAllGames();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            All Playable Games
          </button>
          <button
            onClick={() => {
              onNavigateFavorites();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50 flex items-center justify-between"
          >
            <span>Favorites</span>
            {favoritesCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded-full">
                {favoritesCount}
              </span>
            )}
          </button>
          <button
            onClick={() => {
              onNavigateAdmin();
              setIsMobileMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-50"
          >
            Admin Dashboard
          </button>
        </div>
      )}
    </header>
  );
};
