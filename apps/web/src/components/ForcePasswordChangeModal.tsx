import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { user, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only render if user is logged in and mustChangePassword is true
  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await changePassword(newPassword);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden p-6 space-y-4 animate-in zoom-in-95 duration-200 border border-stone-200">

        <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center mx-auto">
          <KeyRound className="w-5 h-5 text-stone-700" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-sm sm:text-base font-semibold tracking-tight text-stone-900">
            Set Your Confidential Store Password
          </h2>
          <p className="text-xs text-stone-500 max-w-xs mx-auto">
            Welcome, <strong>{user.name}</strong>. Your supplier account was initialized with a temporary password. For security, please enter a new confidential password to continue.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              New Confidential Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-type new password"
                className="w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-mono font-medium text-xs flex items-center justify-center space-x-2 shadow-2xs disabled:opacity-50 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Password...' : 'Save Password & Enter Yard OS'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

