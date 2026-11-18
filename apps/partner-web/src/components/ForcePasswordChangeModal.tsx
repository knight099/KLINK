import { FormError, LanguageSwitch, SignInDialog, useLanguage, type FormFailure } from '@klink/ui';
import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';

export const ForcePasswordChangeModal: React.FC = () => {
  const { t } = useLanguage();
  const { user, changePassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<FormFailure | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Only render if user is logged in and mustChangePassword is true
  if (!user || !user.mustChangePassword) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError({ fallback: 'Min 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setError({ fallback: 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await changePassword(newPassword);
    } catch (err: any) {
      setError({ message: err.message, status: err.status, fallback: 'Failed to update password' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SignInDialog titleId="klink-password-title">

      <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 border border-stone-200 flex items-center justify-center mx-auto">
        <KeyRound className="w-5 h-5 text-stone-700" />
      </div>

      <div className="text-center space-y-1">
        <h2 id="klink-password-title" className="text-sm sm:text-base font-semibold tracking-tight text-stone-900">
          {t('Set a new password')}
        </h2>
        <p className="text-xs text-stone-500 max-w-xs mx-auto">
          {t('Replace your temporary password to continue.')}
        </p>
      </div>

      <LanguageSwitch />
      {error && <FormError failure={error} />}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="klink-password-new" className="block text-xs font-medium text-stone-700 mb-1">
            {t('New password')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              minLength={6}
              id="klink-password-new"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t('Min 6 characters')}
              className="klink-field w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="klink-password-confirm" className="block text-xs font-medium text-stone-700 mb-1">
            {t('Confirm new password')}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="password"
              required
              minLength={6}
              id="klink-password-confirm"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t('Confirm new password')}
              className="klink-field w-full pl-9 pr-3 py-2 text-xs border border-stone-200 rounded-lg focus:border-stone-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="klink-primary w-full flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isSubmitting ? t('Saving password…') : t('Save password')}</span>
          </button>
        </div>
      </form>

    </SignInDialog>
  );
};

