import React, { useState } from 'react';
import { Shield, Mail, CheckCircle2, HeartHandshake, Info, FileText } from 'lucide-react';

export const AboutPage: React.FC<{ onExplore: () => void }> = ({ onExplore }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">About NovaPlay Games</h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-xl mx-auto">
          Delivering instant, high-quality, and accessible browser gaming experiences to millions of players worldwide.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-slate-700 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3 font-display">Our Mission</h2>
          <p>
            NovaPlay was founded on a simple principle: high-fidelity gaming shouldn't require complex installations, heavy downloads, or expensive hardware. We curate and build optimized HTML5 browser titles that run effortlessly across desktop computers, smartphones, and tablets.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="font-bold text-slate-900 text-base mb-1">Instant Loading</div>
            <p className="text-xs text-slate-600">Zero wait times. Games start immediately in your browser with optimized canvas rendering.</p>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="font-bold text-slate-900 text-base mb-1">True Cross-Device</div>
            <p className="text-xs text-slate-600">Responsive touch controls and keyboard navigation tailored for iOS, Android, and laptops.</p>
          </div>
          <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100">
            <div className="font-bold text-slate-900 text-base mb-1">Safe & Family Friendly</div>
            <p className="text-xs text-slate-600">Curated libraries verified for technical safety, privacy adherence, and positive gameplay.</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-3 font-display">Commitment to Playability</h2>
          <p>
            Unlike portals that display static mockups or non-functional placeholders, every single game on NovaPlay is verified for real playable interactivity. If a game has a Play button, it is genuinely playable.
          </p>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={onExplore}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs"
          >
            Explore Game Library
          </button>
        </div>
      </div>
    </div>
  );
};

export const ContactPage: React.FC = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', subject: 'Game Feedback', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.email && formData.message) {
      setSubmitted(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Contact Us</h1>
        <p className="text-sm text-slate-600 mt-1">Have feedback, partnership inquiries, or found a bug? We'd love to hear from you.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-xl font-bold text-slate-900">Message Received!</h3>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Thank you for contacting NovaPlay. Our developer support team usually responds within 24 business hours.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setFormData({ name: '', email: '', subject: 'Game Feedback', message: '' });
              }}
              className="mt-4 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-lg"
            >
              Send Another Message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Your Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
              <select
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              >
                <option value="Game Feedback">Game Feedback</option>
                <option value="Bug Report">Technical Bug Report</option>
                <option value="Developer Submission">Game Developer Submission</option>
                <option value="Partnership / Business">Partnership & Business</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Message</label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Write your questions or suggestions here..."
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-600/20 text-xs transition-colors"
            >
              Submit Inbound Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export const PrivacyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-1">Effective Date: March 2026</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">1. Information We Collect</h2>
          <p>
            NovaPlay is designed with privacy-first gameplay. We do not require visitors to register or provide personal credentials to play free online games. When you play games on our site, gameplay highscores and favorited games are stored locally in your web browser (HTML5 LocalStorage) unless you choose to create a registered account.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">2. Cookies and Storage</h2>
          <p>
            We utilize essential browser local storage strictly to remember sound mute preferences, high scores, and recently played titles. We do not engage in unauthorized third-party cross-site behavioral tracking.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">3. Child Privacy & COPPA Compliance</h2>
          <p>
            We are dedicated to safeguarding children's privacy online. Games marked in our Kids and Educational categories contain no behavioral profiling mechanisms and adhere to strict COPPA privacy safeguards.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">4. Third-Party Game Embeds</h2>
          <p>
            When games are loaded via authorized partner embeds, they run in secure, sandboxed iframes restricting script execution to approved game functionalities only.
          </p>
        </section>
      </div>
    </div>
  );
};

export const TermsPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Terms of Service</h1>
        <p className="text-xs text-slate-500 mt-1">Last Updated: March 2026</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">1. Acceptance of Terms</h2>
          <p>
            By accessing or playing games on NovaPlay, you agree to be bound by these Terms of Service. If you do not agree with any portion of these terms, please discontinue using the service.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">2. Permitted Use</h2>
          <p>
            NovaPlay provides online browser entertainment for personal, non-commercial use. Users agree not to reverse engineer, scrape, DDoS, or attempt to circumvent security measures of our game servers.
          </p>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">3. Intellectual Property</h2>
          <p>
            All game titles, code, assets, audio clips, and trademarks published on NovaPlay are protected by copyright laws. Games are either original productions of NovaPlay or distributed under explicit authorization from developer partners.
          </p>
        </section>
      </div>
    </div>
  );
};

export const ResponsibleGamingPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 font-display">Responsible Gaming</h1>
        <p className="text-xs text-slate-500 mt-1">Promoting healthy screen habits and positive play.</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-10 shadow-sm space-y-6 text-slate-700 text-sm leading-relaxed">
        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">Healthy Play Guidelines</h2>
          <p>
            Gaming should be a fun, relaxing, and mentally stimulating hobby. To ensure gaming remains a positive experience, we encourage all players to observe healthy habits:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1.5 text-xs text-slate-600">
            <li>Take regular breaks every 45 to 60 minutes of continuous screen time.</li>
            <li>Maintain proper ergonomic posture and eye-to-screen distance.</li>
            <li>Balance gaming with physical exercise, outdoor activities, and social time.</li>
            <li>Never allow gaming to replace adequate sleep or academic/work obligations.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-bold text-slate-900 mb-2">Parental Guidance</h2>
          <p>
            Parents and guardians can explore our dedicated "Kids" and "Educational" categories, which feature age-appropriate math challenges, word quests, and logic puzzles. We recommend supervising young children's online activity and setting daily screen-time limits.
          </p>
        </section>
      </div>
    </div>
  );
};
