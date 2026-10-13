import React, { useState, useEffect } from 'react';
import { RotateCcw, Volume2, VolumeX, Users, User, Trophy, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';
import { playerWallet } from '../../utils/wallet';

interface Props {
  onScoreUpdate?: (score: number) => void;
}

type PlayerColor = 'red' | 'green';

interface Token {
  id: number;
  color: PlayerColor;
  step: number; // -1: base, 0..27: track, 28: home
}

const TRACK_TOTAL = 28;

export const LudoClassicGame: React.FC<Props> = ({ onScoreUpdate }) => {
  const [mode, setMode] = useState<'vsAI' | '2P'>('vsAI');
  const [turn, setTurn] = useState<PlayerColor>('red');
  const [diceVal, setDiceVal] = useState<number>(6);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [hasRolled, setHasRolled] = useState<boolean>(false);
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [coinsEarned, setCoinsEarned] = useState<number>(0);
  const [muted, setMuted] = useState(sound.getMuted());
  const [matchScore, setMatchScore] = useState(0);

  // 2 tokens each for fast, engaging casual browser gameplay
  const [tokens, setTokens] = useState<Token[]>([
    { id: 1, color: 'red', step: -1 },
    { id: 2, color: 'red', step: -1 },
    { id: 3, color: 'green', step: -1 },
    { id: 4, color: 'green', step: -1 },
  ]);

  const resetGame = () => {
    setTokens([
      { id: 1, color: 'red', step: -1 },
      { id: 2, color: 'red', step: -1 },
      { id: 3, color: 'green', step: -1 },
      { id: 4, color: 'green', step: -1 },
    ]);
    setTurn('red');
    setDiceVal(6);
    setHasRolled(false);
    setWinner(null);
    setCoinsEarned(0);
    setMatchScore(0);
    sound.playClick();
  };

  const handleRollDice = () => {
    if (isRolling || hasRolled || winner) return;

    setIsRolling(true);
    sound.playBounce();

    let rolls = 0;
    const interval = setInterval(() => {
      setDiceVal(Math.floor(Math.random() * 6) + 1);
      rolls++;
      if (rolls >= 6) {
        clearInterval(interval);
        const finalVal = Math.floor(Math.random() * 6) + 1;
        setDiceVal(finalVal);
        setIsRolling(false);
        setHasRolled(true);
        sound.playTone(520, 'sine', 0.1, 0.2);

        // Check if player has any valid moves
        const playerTokens = tokens.filter((t) => t.color === turn);
        const canMoveAny = playerTokens.some((t) => {
          if (t.step === -1) return finalVal === 6;
          return t.step + finalVal <= TRACK_TOTAL;
        });

        if (!canMoveAny) {
          // No moves possible, pass turn after delay
          setTimeout(() => {
            passTurn();
          }, 800);
        } else if (turn === 'green' && mode === 'vsAI') {
          // AI bot auto-picks best token
          setTimeout(() => {
            aiMoveToken(finalVal);
          }, 900);
        }
      }
    }, 60);
  };

  const passTurn = () => {
    setTurn((prev) => (prev === 'red' ? 'green' : 'red'));
    setHasRolled(false);
  };

  const moveToken = (token: Token) => {
    if (!hasRolled || token.color !== turn || winner) return;

    // Must roll 6 to leave base
    if (token.step === -1) {
      if (diceVal !== 6) return;
      const updated = tokens.map((t) => (t.id === token.id ? { ...t, step: 0 } : t));
      setTokens(updated);
      sound.playCoin();
      playerWallet.addCoins(2, 'Ludo Token Deployed');
      setCoinsEarned((prev) => prev + 2);

      // Rolling a 6 gives another roll!
      setHasRolled(false);
      return;
    }

    const nextStep = token.step + diceVal;
    if (nextStep > TRACK_TOTAL) return; // overshoot

    sound.playTone(440 + nextStep * 10, 'triangle', 0.1, 0.2);

    let updated = tokens.map((t) => (t.id === token.id ? { ...t, step: nextStep } : t));

    // Check capture if on regular track and not home
    if (nextStep < TRACK_TOTAL) {
      const oppColor: PlayerColor = turn === 'red' ? 'green' : 'red';
      const captured = updated.find(
        (t) => t.color === oppColor && t.step === (nextStep + 14) % TRACK_TOTAL
      );
      if (captured) {
        sound.playExplosion();
        updated = updated.map((t) => (t.id === captured.id ? { ...t, step: -1 } : t));
        playerWallet.addCoins(10, 'Ludo Token Capture');
        setCoinsEarned((prev) => prev + 10);
      }
    }

    // Check Home Arrival
    if (nextStep === TRACK_TOTAL) {
      sound.playPowerup();
      playerWallet.addCoins(15, 'Ludo Token Home!');
      setCoinsEarned((prev) => prev + 15);
      const newScore = matchScore + 500;
      setMatchScore(newScore);
      if (onScoreUpdate) onScoreUpdate(newScore);
    }

    setTokens(updated);

    // Check win condition (both tokens home)
    const activeColorTokens = updated.filter((t) => t.color === turn);
    const hasWon = activeColorTokens.every((t) => t.step === TRACK_TOTAL);

    if (hasWon) {
      sound.playVictory();
      setWinner(turn);
      playerWallet.addCoins(25, 'Ludo Match Victory!');
      setCoinsEarned((prev) => prev + 25);
      return;
    }

    // If rolled 6, get another turn, otherwise pass turn
    if (diceVal === 6) {
      setHasRolled(false);
      if (turn === 'green' && mode === 'vsAI') {
        setTimeout(handleRollDice, 700);
      }
    } else {
      passTurn();
    }
  };

  const aiMoveToken = (roll: number) => {
    const aiTokens = tokens.filter((t) => t.color === 'green');
    // Prefer advancing an active token, or deployment on 6
    const movingToken =
      aiTokens.find((t) => t.step >= 0 && t.step + roll <= TRACK_TOTAL) ||
      (roll === 6 ? aiTokens.find((t) => t.step === -1) : null);

    if (movingToken) {
      moveToken(movingToken);
    } else {
      passTurn();
    }
  };

  // Trigger AI roll when turn switches to green in vsAI mode
  useEffect(() => {
    if (turn === 'green' && mode === 'vsAI' && !hasRolled && !isRolling && !winner) {
      const timer = setTimeout(() => {
        handleRollDice();
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [turn, mode, hasRolled, isRolling, winner]);

  return (
    <div className="relative w-full max-w-3xl mx-auto rounded-3xl overflow-hidden shadow-2xl border border-slate-200 bg-slate-900 select-none text-white">
      {/* Top HUD */}
      <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base text-yellow-400">Ludo Star Duel</span>
            <span className="text-xs bg-yellow-500/20 text-yellow-300 font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">
              BOARD CLASSIC
            </span>
          </div>
          <div className="text-xs text-emerald-400 font-mono font-bold flex items-center gap-1">
            <span>🪙</span>
            <span>+{coinsEarned} Earned</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode Switch */}
          <div className="bg-slate-800 p-0.5 rounded-xl flex items-center text-xs">
            <button
              onClick={() => {
                setMode('vsAI');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors ${
                mode === 'vsAI' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" /> vs Bot
            </button>
            <button
              onClick={() => {
                setMode('2P');
                resetGame();
              }}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 font-semibold transition-colors ${
                mode === '2P' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> 2 Players
            </button>
          </div>

          <button
            onClick={resetGame}
            title="Restart Game"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMuted(sound.toggleMute())}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Board Area */}
      <div className="p-4 sm:p-6 flex flex-col md:flex-row items-center justify-center gap-6 bg-slate-950 min-h-[460px]">
        {/* Interactive Stylized Ludo Track */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 bg-slate-900 rounded-3xl p-3 border-2 border-slate-700 shadow-2xl grid grid-cols-2 grid-rows-2 gap-2">
          {/* Red Base (Player 1) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-rose-900/60 to-rose-950/80 border-2 border-rose-500/50 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-rose-300">
              <span>RED {mode === 'vsAI' ? '(YOU)' : '(P1)'}</span>
              {turn === 'red' && <span className="animate-pulse text-amber-300">YOUR TURN</span>}
            </div>
            <div className="flex items-center justify-center gap-3">
              {tokens
                .filter((t) => t.color === 'red')
                .map((t) => {
                  const canMove = hasRolled && turn === 'red' && (t.step === -1 ? diceVal === 6 : t.step + diceVal <= TRACK_TOTAL);
                  return (
                    <button
                      key={t.id}
                      onClick={() => moveToken(t)}
                      className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-xs font-black shadow-lg transition-all ${
                        t.step === -1
                          ? 'bg-rose-600 text-white ring-2 ring-rose-400'
                          : t.step === TRACK_TOTAL
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-500 text-white'
                      } ${canMove ? 'ring-4 ring-yellow-400 scale-110 animate-bounce' : 'opacity-85'}`}
                    >
                      <span>🔴</span>
                      <span className="text-[9px]">
                        {t.step === -1 ? 'BASE' : t.step === TRACK_TOTAL ? 'HOME' : `${t.step}/28`}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Green Base (Player 2 or AI) */}
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900/60 to-emerald-950/80 border-2 border-emerald-500/50 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-300">
              <span>GREEN {mode === 'vsAI' ? '(BOT)' : '(P2)'}</span>
              {turn === 'green' && <span className="animate-pulse text-amber-300">ACTIVE</span>}
            </div>
            <div className="flex items-center justify-center gap-3">
              {tokens
                .filter((t) => t.color === 'green')
                .map((t) => {
                  const canMove = hasRolled && turn === 'green' && (t.step === -1 ? diceVal === 6 : t.step + diceVal <= TRACK_TOTAL);
                  return (
                    <button
                      key={t.id}
                      onClick={() => mode === '2P' && moveToken(t)}
                      className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center text-xs font-black shadow-lg transition-all ${
                        t.step === -1
                          ? 'bg-emerald-600 text-white ring-2 ring-emerald-400'
                          : t.step === TRACK_TOTAL
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-500 text-white'
                      } ${canMove && mode === '2P' ? 'ring-4 ring-yellow-400 scale-110 animate-bounce' : 'opacity-85'}`}
                    >
                      <span>🟢</span>
                      <span className="text-[9px]">
                        {t.step === -1 ? 'BASE' : t.step === TRACK_TOTAL ? 'HOME' : `${t.step}/28`}
                      </span>
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Center Track Board Info */}
          <div className="col-span-2 rounded-2xl bg-slate-950/90 border border-slate-800 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Track Progress</span>
              <span className="text-amber-400 font-bold">Goal: Reach 28 Steps (HOME)</span>
            </div>

            {/* Visual Step Progress Indicators */}
            <div className="space-y-2 py-1">
              <div>
                <div className="flex justify-between text-[10px] text-rose-300 font-bold mb-1">
                  <span>Red Tokens</span>
                  <span>{tokens.filter((t) => t.color === 'red' && t.step === TRACK_TOTAL).length}/2 Home</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  {tokens
                    .filter((t) => t.color === 'red')
                    .map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-rose-500 h-full transition-all duration-300 border-r border-slate-900"
                        style={{ width: `${Math.max(0, (t.step / TRACK_TOTAL) * 50)}%` }}
                      />
                    ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[10px] text-emerald-300 font-bold mb-1">
                  <span>Green Tokens</span>
                  <span>{tokens.filter((t) => t.color === 'green' && t.step === TRACK_TOTAL).length}/2 Home</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  {tokens
                    .filter((t) => t.color === 'green')
                    .map((t, idx) => (
                      <div
                        key={idx}
                        className="bg-emerald-500 h-full transition-all duration-300 border-r border-slate-900"
                        style={{ width: `${Math.max(0, (t.step / TRACK_TOTAL) * 50)}%` }}
                      />
                    ))}
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 text-center">
              Roll <span className="text-yellow-400 font-bold font-mono">6</span> to deploy a token onto the track!
            </div>
          </div>
        </div>

        {/* Dice & Control Panel */}
        <div className="flex flex-col items-center justify-center p-6 bg-slate-900/90 border border-slate-800 rounded-3xl min-w-[240px] text-center">
          <div className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-2">
            Current Turn
          </div>

          <div
            className={`px-4 py-1.5 rounded-full text-xs font-black uppercase mb-4 ${
              turn === 'red'
                ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30'
                : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
            }`}
          >
            {turn === 'red' ? '🔴 RED PLAYER' : '🟢 GREEN PLAYER'}
          </div>

          {/* 3D-styled Interactive Dice */}
          <div
            onClick={!(turn === 'green' && mode === 'vsAI') ? handleRollDice : undefined}
            className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-white via-slate-100 to-slate-300 text-slate-950 font-black text-4xl flex items-center justify-center shadow-2xl border-4 border-slate-300 transition-all select-none ${
              isRolling ? 'rotate-180 scale-95' : 'hover:scale-105 active:scale-95'
            } ${
              !hasRolled && !(turn === 'green' && mode === 'vsAI')
                ? 'cursor-pointer ring-4 ring-yellow-400 shadow-yellow-400/30 animate-pulse'
                : 'opacity-90'
            }`}
          >
            {diceVal}
          </div>

          {/* Roll Button */}
          <button
            onClick={handleRollDice}
            disabled={isRolling || hasRolled || (turn === 'green' && mode === 'vsAI') || !!winner}
            className={`mt-5 px-8 py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider shadow-xl transition-all ${
              !hasRolled && !(turn === 'green' && mode === 'vsAI')
                ? 'bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-slate-950 shadow-yellow-500/30 hover:scale-105 active:scale-95 cursor-pointer'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isRolling ? 'Rolling...' : hasRolled ? 'Tap Your Token' : 'ROLL DICE'}
          </button>

          <p className="text-xs text-slate-400 mt-3 max-w-[200px]">
            {hasRolled
              ? 'Tap a glowing token on the board to move!'
              : turn === 'green' && mode === 'vsAI'
              ? 'Bot is rolling dice...'
              : 'Tap dice or button to roll'}
          </p>
        </div>
      </div>

      {/* Victory Overlay Modal */}
      {winner && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 backdrop-blur-md">
          <div className="w-20 h-20 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center mb-4 shadow-2xl shadow-amber-500/40">
            <Trophy className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-white mb-1">
            {winner === 'red' ? 'RED PLAYER WINS!' : 'GREEN PLAYER WINS!'}
          </h2>
          <p className="text-sm text-slate-300 max-w-sm mb-4">
            Outstanding moves! All tokens successfully reached home safely.
          </p>

          <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold px-4 py-2 rounded-xl mb-6 text-sm flex items-center gap-2">
            <span>🪙</span>
            <span>+{coinsEarned} Total TS Game Zone Coins Earned!</span>
          </div>

          <button
            onClick={resetGame}
            className="px-8 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm uppercase rounded-xl shadow-lg shadow-blue-600/40 transition-all hover:scale-105"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};
