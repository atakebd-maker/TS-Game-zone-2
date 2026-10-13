import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Crown, Coins, Wheat, Shield, Heart } from 'lucide-react';
import { sound } from '../../utils/audio';

interface DecisionCard {
  id: number;
  character: string;
  role: string;
  prompt: string;
  leftChoice: string;
  leftEffects: { gold: number; food: number; army: number; people: number };
  rightChoice: string;
  rightEffects: { gold: number; food: number; army: number; people: number };
}

const CARDS: DecisionCard[] = [
  {
    id: 1,
    character: 'Grand Treasurer',
    role: 'Imperial Treasury',
    prompt: 'Sire, our treasury coffers run low. Shall we increase taxes on the merchant guilds or cut army stipends?',
    leftChoice: 'Tax the guilds (+Gold, -People)',
    leftEffects: { gold: 20, food: 0, army: 0, people: -15 },
    rightChoice: 'Cut army pay (+Gold, -Army)',
    rightEffects: { gold: 15, food: 0, army: -15, people: 0 },
  },
  {
    id: 2,
    character: 'High Priestess',
    role: 'Temple of the Sun',
    prompt: 'A bountiful harvest festival would lift the spirits of the common folk, though it requires dedicating grain granaries.',
    leftChoice: 'Hold the festival (+People, -Food)',
    leftEffects: { gold: -10, food: -20, army: 0, people: 25 },
    rightChoice: 'Ration the grain (+Food, -People)',
    rightEffects: { gold: 0, food: 15, army: 0, people: -10 },
  },
  {
    id: 3,
    character: 'General Vane',
    role: 'Royal Vanguard',
    prompt: 'Bandits harass our northern grain trade route. Do we dispatch legionnaires to fortify the passes?',
    leftChoice: 'Deploy the legion (-Army, +Food)',
    leftEffects: { gold: -10, food: 20, army: -10, people: 15 },
    rightChoice: 'Bribe their leaders (-Gold)',
    rightEffects: { gold: -25, food: 5, army: 0, people: 0 },
  },
  {
    id: 4,
    character: 'Guild Master',
    role: 'Artisans Guild',
    prompt: 'Foreign traders wish to erect a grand trade bazaar in the capital. It will bring wealth but crowd the citizens.',
    leftChoice: 'Grant the permit (+Gold, -People)',
    leftEffects: { gold: 30, food: 0, army: 0, people: -10 },
    rightChoice: 'Preserve peace (+People)',
    rightEffects: { gold: -5, food: 0, army: 0, people: 15 },
  },
  {
    id: 5,
    character: 'Farmer Elder',
    role: 'Outer Provinces',
    prompt: 'A drought threatens our western valleys. Shall we construct stone aqueducts using military labor?',
    leftChoice: 'Build aqueducts (-Gold, +Food)',
    leftEffects: { gold: -20, food: 30, army: -10, people: 10 },
    rightChoice: 'Pray for rain (+Faith, -Food)',
    rightEffects: { gold: 0, food: -25, army: 0, people: -10 },
  },
  {
    id: 6,
    character: 'Royal Alchemist',
    role: 'Tower of Secrets',
    prompt: 'I have concocted an explosive black powder! Equip our royal guard or seal the formula in secret vaults?',
    leftChoice: 'Equip guards (+Army, -Gold)',
    leftEffects: { gold: -20, food: 0, army: 35, people: -10 },
    rightChoice: 'Lock it away (+Safety)',
    rightEffects: { gold: 0, food: 0, army: 0, people: 10 },
  },
];

export const KingdomGovernorGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [years, setYears] = useState(1);
  const [gold, setGold] = useState(60);
  const [food, setFood] = useState(60);
  const [army, setArmy] = useState(60);
  const [people, setPeople] = useState(60);
  const [cardIndex, setCardIndex] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [deathReason, setDeathReason] = useState('');
  const [muted, setMuted] = useState(sound.getMuted());

  const currentCard = CARDS[cardIndex % CARDS.length];

  const resetGame = () => {
    setYears(1);
    setGold(60);
    setFood(60);
    setArmy(60);
    setPeople(60);
    setCardIndex(0);
    setIsGameOver(false);
    setDeathReason('');
    sound.playClick();
  };

  const makeChoice = (isLeft: boolean) => {
    if (isGameOver) return;
    const eff = isLeft ? currentCard.leftEffects : currentCard.rightEffects;

    const ng = Math.max(0, Math.min(100, gold + eff.gold));
    const nf = Math.max(0, Math.min(100, food + eff.food));
    const na = Math.max(0, Math.min(100, army + eff.army));
    const np = Math.max(0, Math.min(100, people + eff.people));

    setGold(ng);
    setFood(nf);
    setArmy(na);
    setPeople(np);

    sound.playTone(350, 'sine', 0.08, 0.12);

    // Check collapse conditions
    if (ng <= 0) {
      setDeathReason('The kingdom went bankrupt and moneylenders seized the throne.');
      setIsGameOver(true);
      sound.playGameOver();
      return;
    }
    if (nf <= 0) {
      setDeathReason('Widespread famine sparked riots that toppled the royal palace.');
      setIsGameOver(true);
      sound.playGameOver();
      return;
    }
    if (na <= 0) {
      setDeathReason('Foreign invaders overwhelmed your defenseless borders.');
      setIsGameOver(true);
      sound.playGameOver();
      return;
    }
    if (np <= 0) {
      setDeathReason('The peasantry revolted and declared a new commonwealth.');
      setIsGameOver(true);
      sound.playGameOver();
      return;
    }

    const nextYears = years + 1;
    setYears(nextYears);
    setCardIndex((idx) => idx + 1);
    if (onScoreUpdate) onScoreUpdate(nextYears * 50);
  };

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-5 md:p-7 select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Kingdom Governor</h3>
            <div className="text-xs text-slate-500">Year {years} of your Reign</div>
          </div>
        </div>

        <button onClick={resetGame} className="p-2 text-slate-400 hover:text-slate-900 rounded-lg">
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 4 Pillars of Power */}
      <div className="grid grid-cols-4 gap-2 my-5 text-center">
        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
          <Coins className="w-4 h-4 text-amber-600 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-600">Treasury</div>
          <div className="text-sm font-bold font-mono text-amber-700">{gold}%</div>
        </div>
        <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <Wheat className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-600">Granary</div>
          <div className="text-sm font-bold font-mono text-emerald-700">{food}%</div>
        </div>
        <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200">
          <Shield className="w-4 h-4 text-blue-600 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-600">Legion</div>
          <div className="text-sm font-bold font-mono text-blue-700">{army}%</div>
        </div>
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
          <Heart className="w-4 h-4 text-rose-600 mx-auto mb-1" />
          <div className="text-[11px] font-semibold text-slate-600">People</div>
          <div className="text-sm font-bold font-mono text-rose-700">{people}%</div>
        </div>
      </div>

      {/* Narrative Event Card */}
      {!isGameOver ? (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="text-center mb-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
              {currentCard.role}
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-1">{currentCard.character}</h4>
          </div>

          <p className="text-slate-700 text-sm text-center leading-relaxed mb-6 font-medium">
            "{currentCard.prompt}"
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => makeChoice(true)}
              className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all text-xs font-medium text-slate-800 shadow-sm"
            >
              <div className="text-blue-600 font-bold mb-1">Choice A</div>
              {currentCard.leftChoice}
            </button>
            <button
              onClick={() => makeChoice(false)}
              className="p-3 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left transition-all text-xs font-medium text-slate-800 shadow-sm"
            >
              <div className="text-blue-600 font-bold mb-1">Choice B</div>
              {currentCard.rightChoice}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center">
          <div className="text-rose-600 font-bold uppercase text-xs tracking-wider mb-1">Dynasty Fallen</div>
          <h4 className="text-2xl font-bold text-slate-900 mb-2">Reign Ended in Year {years}</h4>
          <p className="text-slate-700 text-sm mb-6">{deathReason}</p>
          <button
            onClick={resetGame}
            className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-sm"
          >
            Rule Again
          </button>
        </div>
      )}
    </div>
  );
};
