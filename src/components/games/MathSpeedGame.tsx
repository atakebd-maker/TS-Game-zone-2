import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Sparkles, Brain, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface Question {
  text: string;
  answer: number;
  options: number[];
}

export const MathSpeedGame: React.FC<{ onScoreUpdate?: (score: number) => void }> = ({ onScoreUpdate }) => {
  const [gameState, setGameState] = useState<'IDLE' | 'PLAYING' | 'GAMEOVER'>('IDLE');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [currentQ, setCurrentQ] = useState<Question | null>(null);
  const [muted, setMuted] = useState(sound.getMuted());

  const generateQuestion = (): Question => {
    const ops = ['+', '-', '×'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a = Math.floor(Math.random() * 12) + 2;
    let b = Math.floor(Math.random() * 12) + 2;
    let ans = 0;

    if (op === '+') {
      ans = a + b;
    } else if (op === '-') {
      if (a < b) [a, b] = [b, a];
      ans = a - b;
    } else {
      a = Math.floor(Math.random() * 9) + 2;
      b = Math.floor(Math.random() * 9) + 2;
      ans = a * b;
    }

    const opts = new Set<number>([ans]);
    while (opts.size < 4) {
      const delta = (Math.random() > 0.5 ? 1 : -1) * (Math.floor(Math.random() * 8) + 1);
      const fake = Math.max(1, ans + delta);
      opts.add(fake);
    }

    return {
      text: `${a} ${op} ${b} = ?`,
      answer: ans,
      options: Array.from(opts).sort(() => Math.random() - 0.5),
    };
  };

  const startGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setStreak(0);
    setTimeLeft(30);
    setCurrentQ(generateQuestion());
    sound.playClick();
  };

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameState('GAMEOVER');
          sound.playGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameState]);

  const handleSelectAnswer = (ans: number) => {
    if (!currentQ || gameState !== 'PLAYING') return;

    if (ans === currentQ.answer) {
      sound.playCoin();
      const addPoints = 100 * (1 + streak);
      const nextScore = score + addPoints;
      const nextStreak = streak + 1;
      setScore(nextScore);
      setStreak(nextStreak);
      setTimeLeft((t) => Math.min(45, t + 2)); // Add bonus time!
      if (onScoreUpdate) onScoreUpdate(nextScore);
    } else {
      sound.playTone(220, 'sawtooth', 0.1, 0.15);
      setStreak(0);
    }

    setCurrentQ(generateQuestion());
  };

  return (
    <div className="relative w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 bg-white p-6 md:p-8 select-none">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Math Speed Rush IQ</h3>
            <div className="text-xs text-slate-500">Fast mental arithmetic sprint</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[11px] text-slate-400">TIME</div>
            <div className="text-lg font-bold font-mono text-rose-600">{timeLeft}s</div>
          </div>
          <div className="text-right">
            <div className="text-[11px] text-slate-400">SCORE</div>
            <div className="text-lg font-bold font-mono text-blue-600">{score}</div>
          </div>
        </div>
      </div>

      {gameState === 'IDLE' && (
        <div className="py-12 text-center">
          <h2 className="text-2xl font-bold mb-2">Race Against the Clock!</h2>
          <p className="text-sm text-slate-600 max-w-sm mx-auto mb-6">
            Solve mental math questions as quickly as possible. Correct answers grant extra time and combo multipliers!
          </p>
          <button
            onClick={startGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg"
          >
            Start Rush
          </button>
        </div>
      )}

      {gameState === 'PLAYING' && currentQ && (
        <div className="py-8">
          {streak > 2 && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-orange-600 font-bold mb-4">
              <Flame className="w-4 h-4 fill-current" />
              <span>{streak}x SPEED STREAK</span>
            </div>
          )}

          <div className="text-4xl md:text-5xl font-black text-center text-slate-900 font-mono tracking-wide mb-8">
            {currentQ.text}
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            {currentQ.options.map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectAnswer(opt)}
                className="py-4 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-500 rounded-2xl font-mono text-2xl font-bold text-slate-800 transition-all active:scale-95 shadow-sm"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="py-8 text-center">
          <div className="text-rose-500 text-xs font-bold uppercase mb-1">Time's Up</div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Rush Complete!</h2>
          <div className="text-2xl font-mono text-blue-600 font-bold mb-6">Final Score: {score}</div>
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg flex items-center gap-2 mx-auto"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      )}
    </div>
  );
};
