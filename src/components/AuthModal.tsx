import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag, Lock, Mail, User, AlertCircle, ArrowRight, ShieldCheck, CheckCircle2, ExternalLink, HelpCircle } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen }) => {
  const { signInWithGoogle, signInWithEmail, signUpWithEmail, authError, clearError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isOperationNotAllowed, setIsOperationNotAllowed] = useState(false);
  const [showVercelHelp, setShowVercelHelp] = useState(false);

  if (!isOpen) return null;

  const projectId = firebaseConfig.projectId || 'deep-ship-gwgw1';
  const consoleProvidersUrl = `https://console.firebase.google.com/project/${projectId}/authentication/providers`;
  const consoleDomainsUrl = `https://console.firebase.google.com/project/${projectId}/authentication/settings`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsOperationNotAllowed(false);
    clearError();

    if (!email || !password) {
      setLocalError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      if (isSignUp) {
        if (!name.trim()) {
          setLocalError('Please enter your full name');
          setLoading(false);
          return;
        }
        await signUpWithEmail(email, password, name);
      } else {
        await signInWithEmail(email, password);
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('operation-not-allowed') || err.code === 'auth/operation-not-allowed') {
        setIsOperationNotAllowed(true);
        setLocalError('Email/Password provider is currently turned off in your Firebase project.');
      } else if (msg.includes('unauthorized-domain') || err.code === 'auth/unauthorized-domain') {
        setLocalError('This domain is not in your Firebase Authorized Domains list.');
        setShowVercelHelp(true);
      } else {
        setLocalError(msg || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setLocalError(null);
      setIsOperationNotAllowed(false);
      clearError();
      await signInWithGoogle();
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('unauthorized-domain') || err.code === 'auth/unauthorized-domain') {
        setLocalError('Your deployment domain is not authorized in Firebase.');
        setShowVercelHelp(true);
      } else {
        setLocalError(msg || 'Google sign in failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-8">
        {/* Header - ONLY LOGO IMAGE */}
        <div className="p-6 pb-4 border-b border-slate-100 bg-white">
          <div className="flex items-center justify-center py-1">
            <img src="/logo.svg" alt="Logo" className="w-12 h-12 object-contain drop-shadow-sm" />
          </div>

          <div className="mt-4 flex bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setIsSignUp(false); clearError(); setLocalError(null); setIsOperationNotAllowed(false); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                !isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsSignUp(true); clearError(); setLocalError(null); setIsOperationNotAllowed(false); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                isSignUp ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {/* Specific Operation Not Allowed Fix Card */}
          {isOperationNotAllowed && (
            <div className="p-3.5 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-start gap-2 font-bold text-amber-950">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Fix for "auth/operation-not-allowed":</span>
              </div>
              <p className="text-[11px] leading-relaxed text-amber-800">
                In Firebase, <strong>Email/Password</strong> authentication must be toggled ON in your Firebase Console. Alternatively, you can use <strong>Google Sign-In</strong> right now without any extra configuration!
              </p>
              <div className="pt-1 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                >
                  Sign In Instantly with Google →
                </button>
                <a
                  href={consoleProvidersUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-1.5 text-center bg-white hover:bg-amber-100/60 border border-amber-300 rounded-lg font-semibold text-amber-900 text-[11px] transition-colors flex items-center justify-center gap-1"
                >
                  <span>Enable Email/Password in Firebase Console</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {/* Vercel Domain Authorized Help */}
          {showVercelHelp && (
            <div className="p-3.5 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-start gap-2 font-bold text-blue-950">
                <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>Authorize your Vercel domain in Firebase:</span>
              </div>
              <p className="text-[11px] text-blue-800">
                Add your deployed domain (e.g. <code className="bg-white px-1 py-0.5 rounded border border-blue-200 font-mono">*.vercel.app</code>) under Firebase Console &gt; Authentication &gt; Settings &gt; Authorized domains.
              </p>
              <a
                href={consoleDomainsUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline text-[11px]"
              >
                <span>Open Firebase Authorized Domains Settings</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* General local error */}
          {(localError || authError) && !isOperationNotAllowed && !showVercelHelp && (
            <div className="p-3 text-xs bg-red-50 text-red-700 border border-red-200 rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{localError || authError}</span>
            </div>
          )}

          {/* Google Sign-in (Highlighted) */}
          <div className="space-y-1.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full py-2.5 px-4 bg-white hover:bg-slate-50 border-2 border-blue-600 rounded-xl font-bold text-sm text-slate-800 flex items-center justify-center gap-3 transition-colors shadow-xs hover:shadow-md disabled:opacity-60"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F1"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.17 0 9.99 0 12s.45 3.83 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <div className="text-center text-[10px] text-blue-600 font-semibold">
              ✓ Ready out of the box (Recommended)
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="h-px bg-slate-200 flex-1" />
            <span className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">Or email sign in</span>
            <div className="h-px bg-slate-200 flex-1" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isSignUp && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Manishankar Mandal"
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seller@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-900 placeholder:text-slate-400"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{isSignUp ? 'Create Workspace Account' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Vercel instructions note */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Firebase Project: {projectId}
            </span>
            <a
              href={consoleProvidersUrl}
              target="_blank"
              rel="noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>Firebase Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
