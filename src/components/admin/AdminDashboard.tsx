import React, { useState } from 'react';
import { GameItem, CategoryInfo, SiteSettings, GameCategory } from '../../types';
import {
  Shield,
  Plus,
  Trash2,
  Edit2,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  ExternalLink,
  BarChart3,
  Settings,
  Layers,
  Gamepad2,
  Lock,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface Props {
  games: GameItem[];
  categories: CategoryInfo[];
  settings: SiteSettings;
  onUpdateGame: (game: GameItem) => void;
  onAddGame: (game: GameItem) => void;
  onDeleteGame: (gameId: string) => void;
  onUpdateSettings: (settings: SiteSettings) => void;
}

export const AdminDashboard: React.FC<Props> = ({
  games,
  categories,
  settings,
  onUpdateGame,
  onAddGame,
  onDeleteGame,
  onUpdateSettings,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'games' | 'analytics' | 'settings'>('games');
  const [editingGame, setEditingGame] = useState<GameItem | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // URL Validator Tool
  const [urlToTest, setUrlToTest] = useState('');
  const [urlValidationResult, setUrlValidationResult] = useState<{
    tested: boolean;
    valid: boolean;
    message: string;
  }>({ tested: false, valid: false, message: '' });

  // Settings form
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(settings);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Quick login handler
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      (adminEmail === 'admin@novaplay.com' && adminPassword === 'admin123') ||
      (adminEmail === 'admin' && adminPassword === 'admin')
    ) {
      setIsAuthenticated(true);
      setLoginError('');
    } else {
      setLoginError('Invalid credentials. Use admin@novaplay.com / admin123');
    }
  };

  const testEmbedUrl = () => {
    if (!urlToTest.trim()) return;
    try {
      const u = new URL(urlToTest);
      const trusted = [
        'itch.io',
        'crazygames.com',
        'poki.com',
        'html5.gamedistribution.com',
        'games.gamepix.com',
        'github.io',
      ];
      const isAllowed = trusted.some((t) => u.hostname.endsWith(t) || u.hostname === t);
      if (isAllowed) {
        setUrlValidationResult({
          tested: true,
          valid: true,
          message: 'URL is valid and belongs to an authorized trusted HTML5 game distribution network.',
        });
      } else {
        setUrlValidationResult({
          tested: true,
          valid: false,
          message: 'URL is not from an approved trusted gaming CDN (e.g. itch.io, poki, gamedistribution).',
        });
      }
    } catch {
      setUrlValidationResult({
        tested: true,
        valid: false,
        message: 'Invalid URL format. Please provide a full valid HTTPS URL.',
      });
    }
  };

  const handleSaveGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGame) return;

    if (isCreatingNew) {
      onAddGame(editingGame);
    } else {
      onUpdateGame(editingGame);
    }
    setEditingGame(null);
    setIsCreatingNew(false);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(settingsForm);
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 2000);
  };

  // If not authenticated, render Admin Login screen
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto mb-4 shadow-md shadow-blue-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-display">Admin Authentication</h2>
          <p className="text-xs text-slate-500 mt-1 mb-6">
            Authorized portal management access
          </p>

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Admin Email
              </label>
              <input
                type="text"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@novaplay.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {loginError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs transition-colors"
            >
              Sign In to Dashboard
            </button>
          </form>

          {/* Quick Demo Credentials Autofill button */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={() => {
                setAdminEmail('admin@novaplay.com');
                setAdminPassword('admin123');
              }}
              className="text-xs text-blue-600 hover:underline font-medium"
            >
              Fill Demo Credentials (admin@novaplay.com / admin123)
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calculate analytics
  const totalPlays = games.reduce((acc, g) => acc + g.plays, 0);
  const publishedCount = games.filter((g) => g.isPublished).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Top Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              Verified Administrator
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display mt-1">
            TS Game Zone Control Center
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsCreatingNew(true);
              setEditingGame({
                id: `g-custom-${Date.now()}`,
                slug: `game-${Date.now()}`,
                title: 'New Arcade Title',
                category: 'action',
                description: 'Exciting browser title with high-speed reflex challenges.',
                instructions: 'Use arrow keys or touch to navigate and overcome obstacles.',
                controls: { keyboard: ['Arrow Keys or WASD to move'], touch: 'Touch screen to steer' },
                thumbnail: '',
                badge: 'New',
                isNew: true,
                engineType: 'builtin',
                engineId: 'neon-racer',
                plays: 0,
                rating: 5.0,
                ratingCount: 1,
                releaseDate: new Date().toISOString().split('T')[0],
                developer: 'Independent Creator',
                isPublished: true,
                deviceSupport: ['desktop', 'mobile', 'tablet'],
              });
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
          >
            <Plus className="w-4 h-4" /> Add New Game
          </button>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="p-2.5 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 border border-slate-200 transition-colors"
            title="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 my-6">
        <button
          onClick={() => setActiveTab('games')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'games'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Gamepad2 className="w-4 h-4" /> Games Catalog ({games.length})
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'analytics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Site Analytics & URL Validator
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'settings'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" /> Platform Branding & SEO
        </button>
      </div>

      {/* TAB 1: Games Management */}
      {activeTab === 'games' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Title</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Engine</th>
                    <th className="px-4 py-3">Plays</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {games.map((g) => (
                    <tr key={g.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 font-bold text-slate-900">{g.title}</td>
                      <td className="px-4 py-3 capitalize text-slate-600">{g.category}</td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-slate-500">
                          {g.engineType === 'embed' ? 'Embed URL' : g.engineId}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-medium text-slate-700">
                        {g.plays.toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => onUpdateGame({ ...g, isPublished: !g.isPublished })}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                            g.isPublished
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {g.isPublished ? 'Published' : 'Hidden'}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => {
                            setIsCreatingNew(false);
                            setEditingGame({ ...g });
                          }}
                          className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteGame(g.id)}
                          className="p-1.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Analytics & URL Validator */}
      {activeTab === 'analytics' && (
        <div className="space-y-8">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Game Plays</div>
              <div className="text-2xl font-bold font-mono text-blue-600 mt-1">
                {totalPlays.toLocaleString()}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Total Titles</div>
              <div className="text-2xl font-bold font-mono text-slate-900 mt-1">{games.length}</div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Active Categories</div>
              <div className="text-2xl font-bold font-mono text-emerald-600 mt-1">
                {categories.length}
              </div>
            </div>
            <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="text-xs text-slate-500 uppercase font-semibold">Published Status</div>
              <div className="text-2xl font-bold font-mono text-purple-600 mt-1">
                {publishedCount} / {games.length}
              </div>
            </div>
          </div>

          {/* Embed URL Validator Tool */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Game Embed Sandbox Validator</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4 max-w-xl">
              Validate third-party game URLs against the security sandbox before publishing them to visitors.
            </p>

            <div className="flex gap-3 max-w-xl">
              <input
                type="text"
                value={urlToTest}
                onChange={(e) => setUrlToTest(e.target.value)}
                placeholder="https://html5.gamedistribution.com/..."
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={testEmbedUrl}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
              >
                Test Domain Safety
              </button>
            </div>

            {urlValidationResult.tested && (
              <div
                className={`mt-4 p-4 rounded-xl text-xs flex items-start gap-3 max-w-xl ${
                  urlValidationResult.valid
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {urlValidationResult.valid ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold">
                    {urlValidationResult.valid ? 'Domain Authorized' : 'Verification Issue'}
                  </div>
                  <div>{urlValidationResult.message}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Settings */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm max-w-2xl">
          <h3 className="text-lg font-bold text-slate-900 mb-4 font-display">Website Branding & SEO</h3>
          <form onSubmit={handleSaveSettings} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Website Brand Name
              </label>
              <input
                type="text"
                value={settingsForm.brandName}
                onChange={(e) => setSettingsForm({ ...settingsForm, brandName: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Headline Tagline
              </label>
              <input
                type="text"
                value={settingsForm.tagline}
                onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Contact & Support Email
              </label>
              <input
                type="email"
                value={settingsForm.contactEmail}
                onChange={(e) => setSettingsForm({ ...settingsForm, contactEmail: e.target.value })}
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <input
                type="checkbox"
                id="adsCheck"
                checked={settingsForm.showSponsoredAds}
                onChange={(e) => setSettingsForm({ ...settingsForm, showSponsoredAds: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="adsCheck" className="text-xs text-slate-700 font-medium">
                Enable separate discrete sponsored advertising banner spaces (Monetization readiness)
              </label>
            </div>

            {settingsSaved && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
                Settings saved successfully!
              </div>
            )}

            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-md shadow-blue-600/20"
            >
              Save Configuration
            </button>
          </form>
        </div>
      )}

      {/* Edit Game Modal */}
      {editingGame && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4 font-display">
              {isCreatingNew ? 'Add New Game' : `Edit: ${editingGame.title}`}
            </h3>

            <form onSubmit={handleSaveGame} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Game Title</label>
                <input
                  type="text"
                  required
                  value={editingGame.title}
                  onChange={(e) => setEditingGame({ ...editingGame, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Primary Category</label>
                <select
                  value={editingGame.category}
                  onChange={(e) => setEditingGame({ ...editingGame, category: e.target.value as GameCategory })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Engine Type</label>
                <select
                  value={editingGame.engineType}
                  onChange={(e) => setEditingGame({ ...editingGame, engineType: e.target.value as any })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                >
                  <option value="builtin">Built-In HTML5 Engine</option>
                  <option value="embed">External Embed URL</option>
                </select>
              </div>

              {editingGame.engineType === 'builtin' ? (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Built-in Engine ID</label>
                  <select
                    value={editingGame.engineId || 'neon-racer'}
                    onChange={(e) => setEditingGame({ ...editingGame, engineId: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  >
                    <option value="neon-racer">Neon Velocity (Racing / Car / Arcade)</option>
                    <option value="cosmic-defender">Cosmic Defender (Shooting / Space)</option>
                    <option value="pixel-tower-defense">Pixel Citadel (Tower Defense / Strategy)</option>
                    <option value="super-dunk">Super Dunk (Basketball / Sports)</option>
                    <option value="chess-master">Grand Chess Master (Board / Minimax AI)</option>
                    <option value="solitaire-classic">Solitaire Klondike (Card / Patience)</option>
                    <option value="cyber-snake">Cyber Snake (Arcade / Classic)</option>
                    <option value="block-match-blast">Block Match Blast (Puzzle 1010)</option>
                    <option value="penalty-shootout">Apex Penalty Cup (Football / Sports)</option>
                    <option value="neon-pong">Neon Pong (Multiplayer Casual 2P)</option>
                    <option value="kingdom-governor">Kingdom Governor (Simulation / Decision)</option>
                    <option value="word-quest">Word Quest (Educational / Word Search)</option>
                    <option value="moto-rush">Moto Rush (Motorcycle Trials)</option>
                    <option value="math-speed">Math Speed Rush (Kids / Brain IQ)</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Authorized Embed URL</label>
                  <input
                    type="url"
                    value={editingGame.embedUrl || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, embedUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={editingGame.description}
                  onChange={(e) => setEditingGame({ ...editingGame, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Developer</label>
                <input
                  type="text"
                  value={editingGame.developer}
                  onChange={(e) => setEditingGame({ ...editingGame, developer: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGame.isFeatured}
                    onChange={(e) => setEditingGame({ ...editingGame, isFeatured: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Featured Game</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGame.isTrending}
                    onChange={(e) => setEditingGame({ ...editingGame, isTrending: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Trending</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingGame.isPublished}
                    onChange={(e) => setEditingGame({ ...editingGame, isPublished: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>Published in Portal</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingGame(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md"
                >
                  Save Game
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
