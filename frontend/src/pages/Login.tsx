import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { KeyRound, Mail, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post('/api/auth/login', { email, password });
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        navigate('/dashboard');
      } else {
        setError(response.data.error?.message || 'Login failed');
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error?.message ||
          'Failed to connect to authentication service'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillSeedCredentials = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-100/80 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Subtle Ambient Background Gradients */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-100/60 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-blue-600 flex items-center justify-center font-extrabold text-2xl text-white shadow-xl shadow-brand-500/20 mx-auto mb-3">
            AQ
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Asqure CRM</h1>
          <p className="text-sm text-slate-500 mt-1">POS Billing & Business Management Platform</p>
        </div>

        {/* Login Form Box */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-xl shadow-slate-200/50">
          <h2 className="text-lg font-bold text-slate-900 mb-6">Sign in to your account</h2>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-rose-700 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
                  Password
                </label>
                <a href="#forgot" className="text-xs text-brand-600 font-semibold hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 bg-slate-50 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-xs text-slate-600 font-medium">Remember this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-brand-600/25 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> Signing in...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Quick Seed Credentials Quick Select */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2 font-semibold">Quick Seed Login Accounts:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Super Admin', email: 'admin@example.com' },
                { name: 'Sales', email: 'sales@example.com' },
                { name: 'Accounts', email: 'accounts@example.com' },
                { name: 'Support', email: 'support@example.com' },
              ].map((acc) => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillSeedCredentials(acc.email)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-2.5 py-1 rounded-lg transition border border-slate-200"
                >
                  {acc.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
