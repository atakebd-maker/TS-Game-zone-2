import React, { useState } from 'react';
import { AlertCircle, RefreshCw, ShieldCheck, Loader2 } from 'lucide-react';

interface Props {
  embedUrl: string;
  title: string;
  onBack?: () => void;
}

export const ExternalEmbedPlayer: React.FC<Props> = ({ embedUrl, title }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Validate trusted domain patterns
  const isAuthorized = (() => {
    try {
      const parsed = new URL(embedUrl);
      const allowedHosts = [
        'html5.gamedistribution.com',
        'games.gamepix.com',
        'itch.io',
        'crazygames.com',
        'poki.com',
        'y8.com',
        'archive.org',
        'github.io',
      ];
      return allowedHosts.some((host) => parsed.hostname.endsWith(host) || parsed.hostname === host);
    } catch {
      return false;
    }
  })();

  const handleReload = () => {
    setIsLoading(true);
    setHasError(false);
    setReloadKey((k) => k + 1);
  };

  if (!isAuthorized) {
    return (
      <div className="w-full max-w-3xl mx-auto rounded-2xl bg-amber-50 border border-amber-200 p-8 text-center text-amber-900">
        <AlertCircle className="w-10 h-10 text-amber-600 mx-auto mb-3" />
        <h3 className="text-xl font-bold mb-2">Embed Domain Verification Alert</h3>
        <p className="text-sm text-amber-800 max-w-md mx-auto mb-4 leading-relaxed">
          For your protection, embedding is restricted to verified, authorized HTML5 game hosts.
          The URL <code>{embedUrl}</code> is not in the trusted domain whitelist.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full max-w-4xl mx-auto aspect-[16/10] min-h-[460px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-200 shadow-2xl">
      {isLoading && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900 text-white p-6">
          <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
          <div className="text-base font-bold">Connecting Secure Sandbox...</div>
          <div className="text-xs text-slate-400 mt-1">Loading authorized game assets</div>
        </div>
      )}

      {hasError ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
          <AlertCircle className="w-10 h-10 text-rose-500 mb-3" />
          <h4 className="text-xl font-bold mb-1">Failed to Load Game Embed</h4>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            The external game server is temporarily unreachable or blocked in this sandbox environment.
          </p>
          <button
            onClick={handleReload}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Retry Connection
          </button>
        </div>
      ) : (
        <iframe
          key={reloadKey}
          src={embedUrl}
          title={title}
          allow="autoplay; fullscreen; gamepad; focus-without-user-activation *"
          sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-forms"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className="w-full h-full border-0 block"
        />
      )}
    </div>
  );
};
