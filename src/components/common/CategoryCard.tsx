import React from 'react';
import { CategoryInfo } from '../../types';
import {
  Sword,
  Compass,
  Gauge,
  Car,
  Bike,
  Crosshair,
  Puzzle,
  Brain,
  Gamepad2,
  Trophy,
  Footprints,
  CircleDot,
  Target,
  Sliders,
  Users,
  Sparkles,
  Grid,
  Layers,
  Smile,
  GraduationCap,
  History,
  Code2,
} from 'lucide-react';

interface Props {
  category: CategoryInfo;
  count?: number;
  isSelected?: boolean;
  onSelect: (category: CategoryInfo) => void;
}

export const getCategoryIcon = (iconName: string, className = 'w-5 h-5') => {
  switch (iconName) {
    case 'Sword':
      return <Sword className={className} />;
    case 'Compass':
      return <Compass className={className} />;
    case 'Gauge':
      return <Gauge className={className} />;
    case 'Car':
      return <Car className={className} />;
    case 'Bike':
      return <Bike className={className} />;
    case 'Crosshair':
      return <Crosshair className={className} />;
    case 'Puzzle':
      return <Puzzle className={className} />;
    case 'Brain':
      return <Brain className={className} />;
    case 'Gamepad2':
      return <Gamepad2 className={className} />;
    case 'Trophy':
      return <Trophy className={className} />;
    case 'Footprints':
      return <Footprints className={className} />;
    case 'CircleDot':
      return <CircleDot className={className} />;
    case 'Target':
      return <Target className={className} />;
    case 'Sliders':
      return <Sliders className={className} />;
    case 'Users':
      return <Users className={className} />;
    case 'Sparkles':
      return <Sparkles className={className} />;
    case 'Grid':
      return <Grid className={className} />;
    case 'Layers':
      return <Layers className={className} />;
    case 'Smile':
      return <Smile className={className} />;
    case 'GraduationCap':
      return <GraduationCap className={className} />;
    case 'History':
      return <History className={className} />;
    case 'Code2':
      return <Code2 className={className} />;
    default:
      return <Gamepad2 className={className} />;
  }
};

export const CategoryCard: React.FC<Props> = ({ category, count, isSelected, onSelect }) => {
  return (
    <button
      onClick={() => onSelect(category)}
      className={`group flex items-center gap-3.5 p-3.5 rounded-2xl border text-left transition-all duration-200 ${
        isSelected
          ? 'bg-blue-50 border-blue-500 shadow-sm'
          : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
          isSelected
            ? 'bg-blue-600 text-white'
            : 'bg-slate-100 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600'
        }`}
      >
        {getCategoryIcon(category.icon, 'w-5 h-5')}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-bold text-slate-900 text-sm truncate group-hover:text-blue-600 transition-colors">
          {category.name}
        </div>
        {count !== undefined && (
          <div className="text-[11px] text-slate-500">
            {count} {count === 1 ? 'game' : 'games'}
          </div>
        )}
      </div>
    </button>
  );
};
