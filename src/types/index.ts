export type GameCategory =
  | 'action'
  | 'adventure'
  | 'racing'
  | 'car'
  | 'motorcycle'
  | 'shooting'
  | 'puzzle'
  | 'brain'
  | 'arcade'
  | 'sports'
  | 'football'
  | 'basketball'
  | 'strategy'
  | 'simulation'
  | 'multiplayer'
  | 'multiplayer-casual'
  | 'board'
  | 'card'
  | 'kids'
  | 'educational'
  | 'classic'
  | 'html5';

export interface CategoryInfo {
  id: GameCategory;
  name: string;
  description: string;
  icon: string;
  gameCount?: number;
}

export type BuiltInEngineId =
  | 'neon-racer'
  | 'cosmic-defender'
  | 'pixel-tower-defense'
  | 'super-dunk'
  | 'chess-master'
  | 'solitaire-classic'
  | 'cyber-snake'
  | 'block-match-blast'
  | 'moto-rush'
  | 'penalty-shootout'
  | 'word-quest'
  | 'kingdom-governor'
  | 'neon-pong'
  | 'math-speed';

export interface GameItem {
  id: string;
  slug: string;
  title: string;
  category: GameCategory;
  secondaryCategories?: GameCategory[];
  description: string;
  instructions: string;
  controls: {
    keyboard: string[];
    touch: string;
  };
  thumbnail: string;
  badge?: 'Featured' | 'Trending' | 'New' | 'Popular' | 'Hot';
  isFeatured?: boolean;
  isTrending?: boolean;
  isNew?: boolean;
  isPopular?: boolean;
  engineType: 'builtin' | 'embed';
  engineId?: BuiltInEngineId;
  embedUrl?: string;
  plays: number;
  rating: number; // 1-5
  ratingCount: number;
  releaseDate: string;
  developer: string;
  isPublished: boolean;
  deviceSupport: ('desktop' | 'mobile' | 'tablet')[];
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatar: string;
  favorites: string[];
  recentlyPlayed: { gameId: string; playedAt: string }[];
  totalPlays: number;
  createdAt: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  announcementText: string;
  showAnnouncement: boolean;
  showSponsoredAds: boolean;
  contactEmail: string;
}

export interface AdminStats {
  totalPlays: number;
  totalGames: number;
  publishedGames: number;
  totalCategories: number;
  totalUsers: number;
}
