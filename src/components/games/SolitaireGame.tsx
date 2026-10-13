import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

type Suit = '♠' | '♥' | '♦' | '♣';
type CardColor = 'red' | 'black';

interface Card {
  id: string;
  suit: Suit;
  rank: number; // 1 (A) to 13 (K)
  color: CardColor;
  faceUp: boolean;
}

const SUITS: Suit[] = ['♠', '♥', '♦', '♣'];

function getRankLabel(rank: number): string {
  if (rank === 1) return 'A';
  if (rank === 11) return 'J';
  if (rank === 12) return 'Q';
  if (rank === 13) return 'K';
  return String(rank);
}

function createShuffledDeck(): Card[] {
  const deck: Card[] = [];
  let id = 1;
  SUITS.forEach((suit) => {
    const color: CardColor = suit === '♥' || suit === '♦' ? 'red' : 'black';
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({ id: `c-${id++}`, suit, rank, color, faceUp: false });
    }
  });

  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

export const SolitaireGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [stock, setStock] = useState<Card[]>([]);
  const [waste, setWaste] = useState<Card[]>([]);
  const [foundations, setFoundations] = useState<Card[][]>([[], [], [], []]);
  const [tableau, setTableau] = useState<Card[][]>([[], [], [], [], [], [], []]);
  const [score, setScore] = useState(0);
  const [movesCount, setMovesCount] = useState(0);
  const [isWon, setIsWon] = useState(false);
  const [muted, setMuted] = useState(sound.getMuted());

  const initGame = () => {
    const deck = createShuffledDeck();
    const newTableau: Card[][] = [[], [], [], [], [], [], []];

    // Deal to tableau
    for (let col = 0; col < 7; col++) {
      for (let row = 0; row <= col; row++) {
        const card = deck.pop()!;
        if (row === col) card.faceUp = true;
        newTableau[col].push(card);
      }
    }

    setStock(deck);
    setWaste([]);
    setFoundations([[], [], [], []]);
    setTableau(newTableau);
    setScore(0);
    setMovesCount(0);
    setIsWon(false);
    sound.playClick();
  };

  useEffect(() => {
    initGame();
  }, []);

  // Stock click
  const handleStockClick = () => {
    if (stock.length > 0) {
      const nextStock = [...stock];
      const card = nextStock.pop()!;
      card.faceUp = true;
      setStock(nextStock);
      setWaste((prev) => [...prev, card]);
      sound.playTone(400, 'sine', 0.05, 0.1);
    } else {
      // Recycle waste into stock
      if (waste.length === 0) return;
      const recycled = [...waste].reverse().map((c) => ({ ...c, faceUp: false }));
      setStock(recycled);
      setWaste([]);
      sound.playClick();
    }
  };

  // Auto-move card to foundation or valid tableau
  const tryAutoMoveCard = (card: Card, sourceCol?: number) => {
    if (!card.faceUp) return;

    // Check foundations first
    for (let fIdx = 0; fIdx < 4; fIdx++) {
      const fPile = foundations[fIdx];
      const targetRank = fPile.length === 0 ? 1 : fPile[fPile.length - 1].rank + 1;
      const targetSuit = fPile.length === 0 ? card.suit : fPile[0].suit;

      if (card.rank === targetRank && (fPile.length === 0 || card.suit === targetSuit)) {
        // Move to foundation!
        const nextFoundations = foundations.map((f, i) => (i === fIdx ? [...f, card] : f));
        setFoundations(nextFoundations);

        if (sourceCol !== undefined) {
          const nextTableau = tableau.map((col, i) => {
            if (i === sourceCol) {
              const newCol = col.filter((c) => c.id !== card.id);
              if (newCol.length > 0) newCol[newCol.length - 1].faceUp = true;
              return newCol;
            }
            return col;
          });
          setTableau(nextTableau);
        } else {
          // From waste
          setWaste((prev) => prev.filter((c) => c.id !== card.id));
        }

        const newScore = score + 15;
        setScore(newScore);
        setMovesCount((m) => m + 1);
        if (onScoreUpdate) onScoreUpdate(newScore);
        sound.playCoin();

        // Check victory
        const totalFound = nextFoundations.reduce((acc, pile) => acc + pile.length, 0);
        if (totalFound === 52) {
          setIsWon(true);
          sound.playSuccess();
        }
        return;
      }
    }

    // Check tableau
    for (let tIdx = 0; tIdx < 7; tIdx++) {
      if (sourceCol === tIdx) continue;
      const tCol = tableau[tIdx];

      const canPlace =
        tCol.length === 0
          ? card.rank === 13 // King on empty
          : tCol[tCol.length - 1].color !== card.color && tCol[tCol.length - 1].rank === card.rank + 1;

      if (canPlace) {
        if (sourceCol !== undefined) {
          // Move stack from sourceCol
          const sCol = tableau[sourceCol];
          const cardIdx = sCol.findIndex((c) => c.id === card.id);
          const movingStack = sCol.slice(cardIdx);

          const nextTableau = tableau.map((col, i) => {
            if (i === sourceCol) {
              const rem = sCol.slice(0, cardIdx);
              if (rem.length > 0) rem[rem.length - 1].faceUp = true;
              return rem;
            }
            if (i === tIdx) {
              return [...col, ...movingStack];
            }
            return col;
          });

          setTableau(nextTableau);
        } else {
          // Move single card from waste
          setWaste((prev) => prev.filter((c) => c.id !== card.id));
          setTableau((prev) =>
            prev.map((col, i) => (i === tIdx ? [...col, card] : col))
          );
        }

        setMovesCount((m) => m + 1);
        sound.playTone(350, 'sine', 0.05, 0.1);
        return;
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-emerald-900 bg-emerald-800 p-4 md:p-6 select-none text-white">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-emerald-700/60 flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <div>
            <div className="text-[11px] text-emerald-200">SCORE</div>
            <div className="text-xl font-bold font-mono text-amber-300">{score}</div>
          </div>
          <div className="h-6 w-[1px] bg-emerald-700" />
          <div>
            <div className="text-[11px] text-emerald-200">MOVES</div>
            <div className="text-xl font-bold font-mono text-emerald-100">{movesCount}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(sound.toggleMute())}
            className="p-2 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-700/50"
          >
            {muted ? <VolumeX className="w-5 h-5 text-rose-300" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <button
            onClick={initGame}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" /> New Deal
          </button>
        </div>
      </div>

      {/* Stock & Foundations Row */}
      <div className="grid grid-cols-7 gap-2 md:gap-3 my-5">
        {/* Stock */}
        <div
          onClick={handleStockClick}
          className="aspect-[5/7] rounded-lg border-2 border-dashed border-emerald-600/80 bg-emerald-900/60 flex items-center justify-center cursor-pointer hover:border-emerald-400 transition-colors"
        >
          {stock.length > 0 ? (
            <div className="w-full h-full rounded-md bg-blue-700 border border-blue-400 flex items-center justify-center shadow-md">
              <span className="text-lg">🂠</span>
            </div>
          ) : (
            <RotateCcw className="w-5 h-5 text-emerald-400" />
          )}
        </div>

        {/* Waste */}
        <div className="aspect-[5/7] rounded-lg border border-emerald-700/50 bg-emerald-900/30 flex items-center justify-center">
          {waste.length > 0 && (
            <div
              onClick={() => tryAutoMoveCard(waste[waste.length - 1])}
              className={`w-full h-full rounded-md bg-white border border-slate-300 flex flex-col justify-between p-1.5 shadow-md cursor-pointer hover:ring-2 hover:ring-amber-300 ${
                waste[waste.length - 1].color === 'red' ? 'text-red-600' : 'text-slate-900'
              }`}
            >
              <div className="text-xs font-bold leading-none">{getRankLabel(waste[waste.length - 1].rank)}</div>
              <div className="text-center text-lg leading-none">{waste[waste.length - 1].suit}</div>
              <div className="text-xs font-bold leading-none text-right">{getRankLabel(waste[waste.length - 1].rank)}</div>
            </div>
          )}
        </div>

        {/* Empty Spacer */}
        <div className="aspect-[5/7]" />

        {/* 4 Foundations */}
        {foundations.map((pile, idx) => (
          <div
            key={idx}
            className="aspect-[5/7] rounded-lg border-2 border-dashed border-emerald-600/80 bg-emerald-900/50 flex items-center justify-center"
          >
            {pile.length > 0 ? (
              <div
                className={`w-full h-full rounded-md bg-white border border-slate-300 flex flex-col justify-between p-1.5 shadow-md ${
                  pile[pile.length - 1].color === 'red' ? 'text-red-600' : 'text-slate-900'
                }`}
              >
                <div className="text-xs font-bold leading-none">{getRankLabel(pile[pile.length - 1].rank)}</div>
                <div className="text-center text-lg leading-none">{pile[pile.length - 1].suit}</div>
                <div className="text-xs font-bold leading-none text-right">{getRankLabel(pile[pile.length - 1].rank)}</div>
              </div>
            ) : (
              <span className="text-emerald-500/40 text-lg">{['♠', '♥', '♦', '♣'][idx]}</span>
            )}
          </div>
        ))}
      </div>

      {/* 7 Tableau Columns */}
      <div className="grid grid-cols-7 gap-2 md:gap-3 min-h-[300px]">
        {tableau.map((col, colIdx) => (
          <div key={colIdx} className="relative min-h-[220px]">
            {col.length === 0 && (
              <div className="aspect-[5/7] rounded-lg border-2 border-dashed border-emerald-700/50 bg-emerald-900/20" />
            )}
            {col.map((card, rowIdx) => (
              <div
                key={card.id}
                onClick={() => tryAutoMoveCard(card, colIdx)}
                style={{ top: `${rowIdx * 24}px` }}
                className={`absolute w-full aspect-[5/7] rounded-md transition-all cursor-pointer ${
                  card.faceUp
                    ? `bg-white border border-slate-300 p-1.5 shadow-md hover:ring-2 hover:ring-amber-300 ${
                        card.color === 'red' ? 'text-red-600' : 'text-slate-900'
                      }`
                    : 'bg-blue-700 border border-blue-400 shadow'
                }`}
              >
                {card.faceUp ? (
                  <div className="h-full flex flex-col justify-between">
                    <div className="text-xs font-bold leading-none">{getRankLabel(card.rank)}</div>
                    <div className="text-center text-base leading-none">{card.suit}</div>
                    <div className="text-xs font-bold leading-none text-right">{getRankLabel(card.rank)}</div>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-blue-300/40 text-sm">
                    🂠
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Victory Overlay */}
      {isWon && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-emerald-950/90 backdrop-blur-sm text-white">
          <Sparkles className="w-12 h-12 text-amber-300 mb-3 animate-bounce" />
          <h2 className="text-3xl font-bold mb-2">Victory! Solitaire Solved!</h2>
          <p className="text-sm text-emerald-200 mb-6">You successfully built all four foundation suit stacks.</p>
          <button
            onClick={initGame}
            className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold rounded-xl shadow-lg"
          >
            Play Another Deal
          </button>
        </div>
      )}
    </div>
  );
};
