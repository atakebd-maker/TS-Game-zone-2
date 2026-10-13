import React from 'react';
import { Gamepad2, Shield, HeartHandshake, FileText, Mail, Info } from 'lucide-react';

interface Props {
  brandName: string;
  onNavigatePage: (page: 'about' | 'contact' | 'privacy' | 'terms' | 'responsible') => void;
  onNavigateHome: () => void;
}

export const Footer: React.FC<Props> = ({ brandName, onNavigatePage, onNavigateHome }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Brand Column */}
          <div className="md:col-span-1 space-y-3">
            <button
              onClick={onNavigateHome}
              className="flex items-center gap-2.5 text-white hover:text-blue-400 transition-colors font-extrabold text-lg tracking-tight font-display"
            >
              <img
                src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhkKI4twxct8O-2o4m_D8G6M-Ax82Ya3GW8qkVOllaZnl-zlv123S_m7fKUQcUcGqMvuWgamV12i7allJ7It4vHtNLnYTNC1jYLy505cchZbBlMbtDhE1maYaCQo-5sZL025qckIBlFd6tdd3GKONBOCATB8ep-kN5sp-yun2fUAc0g9vLAIE3JxpOGRXk/s96/1000047095.png"
                alt="TS Game Zone Logo"
                className="w-7 h-7 object-contain rounded-lg"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <span>{brandName || 'TS Game Zone'}</span>
            </button>
            <p className="text-slate-400 leading-relaxed text-xs">
              TS Game Zone provides 100% free online games and mobile games with instant browser play, zero downloads, and real in-game coin rewards.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Platform</div>
            <div>
              <button
                onClick={() => onNavigatePage('about')}
                className="hover:text-white transition-colors"
              >
                About Us
              </button>
            </div>
            <div>
              <button
                onClick={() => onNavigatePage('contact')}
                className="hover:text-white transition-colors"
              >
                Contact & Support
              </button>
            </div>
            <div>
              <button
                onClick={() => onNavigatePage('responsible')}
                className="hover:text-white transition-colors"
              >
                Responsible Gaming
              </button>
            </div>
          </div>

          {/* Legal Links */}
          <div className="space-y-2">
            <div className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Legal & Safety</div>
            <div>
              <button
                onClick={() => onNavigatePage('privacy')}
                className="hover:text-white transition-colors"
              >
                Privacy Policy
              </button>
            </div>
            <div>
              <button
                onClick={() => onNavigatePage('terms')}
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </button>
            </div>
            <div>
              <button
                onClick={() => onNavigatePage('responsible')}
                className="hover:text-white transition-colors"
              >
                Parental Guidelines
              </button>
            </div>
          </div>

          {/* Safety & Standards Note */}
          <div className="space-y-3">
            <div className="text-white font-semibold text-xs uppercase tracking-wider">Quality Assurance</div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every title in our catalog features a working HTML5 interactive engine or authorized embed. No downloads or installations required.
            </p>
            <div className="text-[11px] text-slate-500">
              Compatible with Chrome, Safari, Firefox, Edge, iOS & Android.
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} {brandName || 'TS Game Zone'}. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigatePage('privacy')} className="hover:text-slate-300 transition-colors">
              Privacy
            </button>
            <span>·</span>
            <button onClick={() => onNavigatePage('terms')} className="hover:text-slate-300 transition-colors">
              Terms
            </button>
            <span>·</span>
            <button onClick={() => onNavigatePage('responsible')} className="hover:text-slate-300 transition-colors">
              Responsible Play
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
