import React, { useState, useEffect } from 'react';
import { GameItem, CategoryInfo, SiteSettings, GameCategory } from './types';
import { CATEGORIES } from './data/categories';
import { INITIAL_GAMES } from './data/initialGames';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { HomePage } from './components/home/HomePage';
import { GamePlayerView } from './components/game-detail/GamePlayerView';
import { CategoriesView } from './components/categories/CategoriesView';
import { AllGamesView } from './components/games-list/AllGamesView';
import { FavoritesView } from './components/favorites/FavoritesView';
import { SearchView } from './components/search/SearchView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import {
  AboutPage,
  ContactPage,
  PrivacyPage,
  TermsPage,
  ResponsibleGamingPage,
} from './components/pages/StaticPages';
import { CoinRewardToast } from './components/common/CoinRewardToast';
import { AdBanner } from './components/ads/AdBanner';
import { Sparkles, X } from 'lucide-react';

export default function App() {
  const [games, setGames] = useState<GameItem[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ts_game_zone_custom_games') || localStorage.getItem('novaplay_custom_games');
      if (saved) {
        try {
          const parsed: GameItem[] = JSON.parse(saved);
          const initialMap = new Map(INITIAL_GAMES.map((g) => [g.id, g]));
          const merged = INITIAL_GAMES.map((initGame) => {
            const found = parsed.find((p) => p.id === initGame.id);
            return found ? { ...initGame, ...found, thumbnail: initGame.thumbnail || found.thumbnail } : initGame;
          });
          const extraCustom = parsed.filter((p) => !initialMap.has(p.id));
          return [...merged, ...extraCustom];
        } catch {}
      }
    }
    return INITIAL_GAMES;
  });

  const [categories] = useState<CategoryInfo[]>(CATEGORIES);

  const [settings, setSettings] = useState<SiteSettings>({
    brandName: 'TS Game Zone',
    tagline: 'free online game site free entertainment game site Ts game zone',
    announcementText: '🔥 Welcome to TS Game Zone! Play 100% Free Games & Earn Coins on Every Match!',
    showAnnouncement: true,
    showSponsoredAds: true,
    contactEmail: 'support@tsgamezone.com',
  });

  const [showAnnouncementBanner, setShowAnnouncementBanner] = useState(true);

  const [currentView, setCurrentView] = useState<
    | 'home'
    | 'categories'
    | 'all-games'
    | 'favorites'
    | 'admin'
    | 'search'
    | 'game-detail'
    | 'about'
    | 'contact'
    | 'privacy'
    | 'terms'
    | 'responsible'
  >('home');

  const [selectedGame, setSelectedGame] = useState<GameItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<GameCategory | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyPlayedIds, setRecentlyPlayedIds] = useState<string[]>([]);

  // Load preferences from localStorage & backend settings
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load favorites
    const favSaved = localStorage.getItem('novaplay_favorites');
    if (favSaved) {
      try {
        setFavorites(JSON.parse(favSaved));
      } catch {}
    }

    // Load recently played
    const recSaved = localStorage.getItem('novaplay_recent');
    if (recSaved) {
      try {
        setRecentlyPlayedIds(JSON.parse(recSaved));
      } catch {}
    }

    // Direct game deep-link detection from URL search query or hash
    const params = new URLSearchParams(window.location.search);
    const gameSlugFromQuery = params.get('game');
    const hash = window.location.hash;
    const gameSlugFromHash = hash.startsWith('#game/') ? hash.replace('#game/', '') : null;
    const targetSlug = gameSlugFromQuery || gameSlugFromHash;

    if (targetSlug) {
      const found = games.find((g) => g.slug === targetSlug || g.id === targetSlug);
      if (found) {
        setSelectedGame(found);
        setCurrentView('game-detail');
      }
    }

    // Fetch site settings from backend API
    fetch('/api/settings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSettings((prev) => ({ ...prev, ...data }));
      })
      .catch(() => {});
  }, [games]);

  // Dynamic SEO Page Title & Meta Description updater for Google indexing
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (currentView === 'game-detail' && selectedGame) {
      document.title = `${selectedGame.title} - Play Free Online Game | TS Game Zone free online game site`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          `Play ${selectedGame.title} 100% free online on TS Game Zone! ${selectedGame.description.slice(0, 130)}... Earn coins and play free without download.`
        );
      }
    } else if (currentView === 'categories') {
      const catName = selectedCategory ? selectedCategory.toUpperCase() : 'All';
      document.title = `Free Online ${catName} Games - TS Game Zone free online game site`;
    } else if (currentView === 'search') {
      document.title = `Search "${searchQuery}" Games - TS Game Zone free online game site`;
    } else if (currentView === 'all-games') {
      document.title = `All 100% Free Online Games & Mobile Games - TS Game Zone`;
    } else if (currentView === 'favorites') {
      document.title = `My Favorite Free Online Games - TS Game Zone`;
    } else {
      document.title = `TS Game Zone - Free Online Games | Play Best Online Games, Mobile Games, Video Games, Free Fire, PUBG, Ludo, Snake & Free Entertainment Game Site Ts Game Zone`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute(
          'content',
          'TS Game Zone is the best free online game site! Play 100% free online games, mobile games, video games, online free fire game, online pubg, Minecraft mobile games, car racing, ludo, snake game, boys game & girls game with zero downloads. Free entertainment gaming site in Bangladesh, India, UK, USA.'
        );
      }
    }
  }, [currentView, selectedGame, selectedCategory, searchQuery]);

  // Sync favorites
  const handleToggleFavorite = (gameId: string) => {
    setFavorites((prev) => {
      const exists = prev.includes(gameId);
      const updated = exists ? prev.filter((id) => id !== gameId) : [...prev, gameId];
      localStorage.setItem('novaplay_favorites', JSON.stringify(updated));
      return updated;
    });
  };

  // Recently played games list
  const recentlyPlayedGames = recentlyPlayedIds
    .map((id) => games.find((g) => g.id === id))
    .filter((g): g is GameItem => g !== undefined);

  // Navigation Handlers with Clean URL deep-links
  const navigateToHome = () => {
    setCurrentView('home');
    setSelectedGame(null);
    setSelectedCategory(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', window.location.pathname);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCategories = () => {
    setCurrentView('categories');
    setSelectedGame(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '?view=categories');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAllGames = () => {
    setCurrentView('all-games');
    setSelectedGame(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '?view=all-games');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToFavorites = () => {
    setCurrentView('favorites');
    setSelectedGame(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '?view=favorites');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToAdmin = () => {
    setCurrentView('admin');
    setSelectedGame(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', '?view=admin');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (q: string) => {
    setSearchQuery(q);
    setCurrentView('search');
    setSelectedGame(null);
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', `?search=${encodeURIComponent(q)}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGame = (game: GameItem) => {
    setSelectedGame(game);
    setCurrentView('game-detail');
    // Update browser URL so each game has its own distinct link!
    if (typeof window !== 'undefined' && window.history.pushState) {
      window.history.pushState({}, '', `?game=${encodeURIComponent(game.slug)}`);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Update play count on backend & locally
    setGames((prev) =>
      prev.map((item) => (item.id === game.id ? { ...item, plays: item.plays + 1 } : item))
    );
  };

  const handleSelectCategory = (catId: GameCategory | null) => {
    setSelectedCategory(catId);
    setCurrentView('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigatePage = (
    page: 'about' | 'contact' | 'privacy' | 'terms' | 'responsible'
  ) => {
    setCurrentView(page);
    setSelectedGame(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Admin Game Mutations
  const handleAddGame = (newGame: GameItem) => {
    const updated = [newGame, ...games];
    setGames(updated);
    localStorage.setItem('novaplay_custom_games', JSON.stringify(updated));
  };

  const handleUpdateGame = (updatedGame: GameItem) => {
    const updated = games.map((g) => (g.id === updatedGame.id ? updatedGame : g));
    setGames(updated);
    localStorage.setItem('novaplay_custom_games', JSON.stringify(updated));
  };

  const handleDeleteGame = (gameId: string) => {
    const updated = games.filter((g) => g.id !== gameId);
    setGames(updated);
    localStorage.setItem('novaplay_custom_games', JSON.stringify(updated));
  };

  const handleUpdateSettings = (newSettings: SiteSettings) => {
    setSettings(newSettings);
    fetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSettings),
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* Optional Top Announcement Strip */}
      {settings.showAnnouncement && showAnnouncementBanner && (
        <div className="bg-blue-600 text-white text-xs py-2 px-4 flex items-center justify-between shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center gap-2 font-medium truncate">
            <Sparkles className="w-3.5 h-3.5 shrink-0 text-blue-200" />
            <span className="truncate">{settings.announcementText}</span>
          </div>
          <button
            onClick={() => setShowAnnouncementBanner(false)}
            className="p-1 hover:bg-blue-700 rounded transition-colors text-blue-200 hover:text-white"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        brandName={settings.brandName}
        onNavigateHome={navigateToHome}
        onNavigateCategories={navigateToCategories}
        onNavigateAllGames={navigateToAllGames}
        onNavigateFavorites={navigateToFavorites}
        onNavigateAdmin={navigateToAdmin}
        onSearch={handleSearch}
        onSelectGame={handleSelectGame}
        favoritesCount={favorites.length}
        games={games}
        currentView={currentView}
      />

      {/* Top of Website Ad Banner requested by user */}
      <div className="w-full bg-white border-b border-slate-100 py-1.5 flex justify-center shadow-2xs">
        <AdBanner format="468x60" label="Sponsored Banner" className="my-0" />
      </div>

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomePage
            games={games}
            categories={categories}
            recentlyPlayedGames={recentlyPlayedGames}
            favorites={favorites}
            onPlayGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onSelectCategory={handleSelectCategory}
            onBrowseAll={navigateToAllGames}
            showSponsoredAds={settings.showSponsoredAds}
          />
        )}

        {currentView === 'game-detail' && selectedGame && (
          <GamePlayerView
            game={selectedGame}
            allGames={games}
            isFavorited={favorites.includes(selectedGame.id)}
            onToggleFavorite={handleToggleFavorite}
            onSelectGame={handleSelectGame}
            onBack={navigateToHome}
          />
        )}

        {currentView === 'categories' && (
          <CategoriesView
            categories={categories}
            games={games}
            selectedCategoryId={selectedCategory}
            onSelectCategory={handleSelectCategory}
            onPlayGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {currentView === 'all-games' && (
          <AllGamesView
            games={games}
            categories={categories}
            favorites={favorites}
            onPlayGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentView === 'favorites' && (
          <FavoritesView
            games={games}
            favorites={favorites}
            onPlayGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            onBrowseAll={navigateToAllGames}
          />
        )}

        {currentView === 'search' && (
          <SearchView
            query={searchQuery}
            games={games}
            categories={categories}
            onPlayGame={handleSelectGame}
            onToggleFavorite={handleToggleFavorite}
            favorites={favorites}
          />
        )}

        {currentView === 'admin' && (
          <AdminDashboard
            games={games}
            categories={categories}
            settings={settings}
            onUpdateGame={handleUpdateGame}
            onAddGame={handleAddGame}
            onDeleteGame={handleDeleteGame}
            onUpdateSettings={handleUpdateSettings}
          />
        )}

        {currentView === 'about' && <AboutPage onExplore={navigateToAllGames} />}
        {currentView === 'contact' && <ContactPage />}
        {currentView === 'privacy' && <PrivacyPage />}
        {currentView === 'terms' && <TermsPage />}
        {currentView === 'responsible' && <ResponsibleGamingPage />}
      </main>

      {/* Very Bottom of Website Ad Banner requested by user */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-2 flex justify-center w-full">
        <AdBanner format="728x90" label="Advertisement" />
      </div>

      {/* Footer */}
      <Footer
        brandName={settings.brandName}
        onNavigatePage={handleNavigatePage}
        onNavigateHome={navigateToHome}
      />

      {/* Real-time Coin Reward Notification Toast */}
      <CoinRewardToast />
    </div>
  );
}
