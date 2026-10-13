import React, { useState } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2, HelpCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

const WORDS_TO_FIND = ['ARCADE', 'PIXEL', 'QUEST', 'LEVEL', 'LASER', 'CYBER'];
const GRID_SIZE = 8;

const LETTER_GRID = [
  ['A', 'R', 'C', 'A', 'D', 'E', 'X', 'M'],
  ['P', 'I', 'X', 'E', 'L', 'T', 'Q', 'O'],
  ['B', 'R', 'K', 'V', 'C', 'L', 'U', 'R'],
  ['Q', 'U', 'E', 'S', 'T', 'A', 'E', 'P'],
  ['N', 'O', 'V', 'A', 'Z', 'S', 'S', 'H'],
  ['L', 'A', 'S', 'E', 'R', 'E', 'T', 'G'],
  ['C', 'Y', 'B', 'E', 'R', 'R', 'U', 'N'],
  ['L', 'E', 'V', 'E', 'L', 'W', 'I', 'N'],
];

export const WordQuestGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [selectedCells, setSelectedCells] = useState<[number, number][]>([]);
  const [score, setScore] = useState(0);
  const [hintWord, setHintWord] = useState<string | null>(null);
  const [muted, setMuted] = useState(sound.getMuted());

  const resetGame = () => {
    setFoundWords([]);
    setSelectedCells([]);
    setScore(0);
    setHintWord(null);
    sound.playClick();
  };

  const handleCellClick = (r: number, c: number) => {
    sound.playClick();
    const isAlreadySelected = selectedCells.some(([sr, sc]) => sr === r && sc === c);

    let nextCells: [number, number][];
    if (isAlreadySelected) {
      nextCells = selectedCells.filter(([sr, sc]) => !(sr === r && sc === c));
    } else {
      nextCells = [...selectedCells, [r, c]];
    }
    setSelectedCells(nextCells);

    // Form word from selected cells
    const formedWord = nextCells.map(([cr, cc]) => LETTER_GRID[cr][cc]).join('');

    if (WORDS_TO_FIND.includes(formedWord) && !foundWords.includes(formedWord)) {
      sound.playSuccess();
      const nextFound = [...foundWords, formedWord];
      setFoundWords(nextFound);
      setSelectedCells([]);
      const nextScore = score + formedWord.length * 50;
      setScore(nextScore);
      if (onScoreUpdate) onScoreUpdate(nextScore);
    }
  };

  const giveHint = () => {
    const unFound = WORDS_TO_FIND.find((w) => !foundWords.includes(w));
    if (unFound) {
      setHintWord(unFound);
      sound.playTone(520, 'sine', 0.1, 0.15);
      setTimeout(() => setHintWord(null), 3000);
    }
  };

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-5 md:p-6 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-lg">Word Quest Master</h3>
          <div className="text-xs text-slate-500">Find gaming words in the letter matrix</div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="text-lg font-bold font-mono text-blue-600">{score}</div>
          </div>
          <button onClick={giveHint} className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg" title="Get Hint">
            <HelpCircle className="w-4 h-4" />
          </button>
          <button onClick={resetGame} className="p-2 text-slate-500 hover:text-slate-900 rounded-lg">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {hintWord && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-1.5 rounded-lg mt-3 text-center">
          Hint: Look for the word <strong>"{hintWord}"</strong>
        </div>
      )}

      {/* Word checklist */}
      <div className="flex flex-wrap gap-2 my-4">
        {WORDS_TO_FIND.map((word) => {
          const isFound = foundWords.includes(word);
          return (
            <div
              key={word}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                isFound
                  ? 'bg-emerald-50 text-emerald-700 line-through opacity-70'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {isFound && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              <span>{word}</span>
            </div>
          );
        })}
      </div>

      {/* 8x8 Grid */}
      <div className="max-w-[380px] mx-auto aspect-square grid grid-cols-8 gap-1.5 p-3 bg-slate-50 rounded-2xl border border-slate-200">
        {LETTER_GRID.map((row, r) =>
          row.map((letter, c) => {
            const isSelected = selectedCells.some(([sr, sc]) => sr === r && sc === c);
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                className={`aspect-square rounded-xl font-bold text-sm md:text-base flex items-center justify-center transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md scale-95'
                    : 'bg-white hover:bg-blue-50 text-slate-800 border border-slate-200'
                }`}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {foundWords.length === WORDS_TO_FIND.length && (
        <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-center">
          <Sparkles className="w-6 h-6 text-emerald-600 mx-auto mb-1 animate-bounce" />
          <h4 className="font-bold text-emerald-900">All Words Uncovered!</h4>
          <p className="text-xs text-emerald-700">Vocabulary master quest complete.</p>
        </div>
      )}
    </div>
  );
};
