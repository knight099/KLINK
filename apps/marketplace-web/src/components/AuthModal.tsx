import { useLanguage, LanguageSwitch, SignInDialog, FormError, signInFailure, type FormFailure } from '@klink/ui';
import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import { getAppMode } from '../lib/api';
import { X, Eye, EyeOff } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { t } = useLanguage();
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    registerCustomer
  } = useAuth();
  const { activeDistrict, districts } = useDistrict();
  const appMode = getAppMode();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [districtId, setDistrictId] = useState(activeDistrict?.id || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<FormFailure | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const expectedRole = appMode === 'UNIFIED' ? undefined : appMode;
      await login(phone.trim(), password, expectedRole);
    } catch (err: any) {
      setError(signInFailure(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const targetDistrict = districtId || activeDistrict?.id || districts[0]?.id;
    if (!targetDistrict) {
      setError({ fallback: 'Please select a delivery district' });
      return;
    }
    setIsLoading(true);
    try {
      await registerCustomer({
        phone: phone.trim(),
        password,
        fullName: fullName.trim(),
        districtId: targetDistrict,
        addressLine: addressLine.trim() || undefined,
        landmark: landmark.trim() || undefined,
        pincode: pincode.trim() || undefined
      });
    } catch (err: any) {
      setError({ message: err?.message, status: err?.status, fallback: 'Unable to create an account. Check your details and try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SignInDialog titleId="klink-auth-title" onDismiss={() => setIsAuthModalOpen(false)}>
      {/* Close Button */}
      <button
        aria-label={t('Close')}
        onClick={() => setIsAuthModalOpen(false)}
        className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Header */}
      <div className="space-y-1 pr-8">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-xs">
            K
          </div>
          <div>
            <h3 id="klink-auth-title" className="font-semibold text-sm text-stone-900">
              {authModalMode === 'LOGIN' ? t('Sign In to KLINK') : t('Create Contractor / Buyer Account')}
            </h3>
            <p className="text-xs text-stone-500">
              {authModalMode === 'LOGIN'
                ? t('Access your site deliveries, saved addresses, and Bahi-Khata ledger')
                : t('Direct delivery of cement, TMT steel, sand, and bricks across Bihar')}
            </p>
          </div>
        </div>
      </div>

      <LanguageSwitch />

      {/* Tab Toggle */}
      <div className="flex p-0.5 bg-stone-100 rounded-lg border border-stone-200">
        <button
          type="button"
          onClick={() => {
            setAuthModalMode('LOGIN');
            setError(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authModalMode === 'LOGIN'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {t('Sign In')}
        </button>
        <button
          type="button"
          onClick={() => {
            setAuthModalMode('REGISTER');
            setError(null);
          }}
          className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
            authModalMode === 'REGISTER'
              ? 'bg-white text-stone-900 shadow-xs'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          {t('New Buyer Account')}
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <FormError failure={error} />
      )}

      {/* LOGIN FORM */}
      {authModalMode === 'LOGIN' && (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label htmlFor="klink-handleLoginSubmit-1" className="block text-xs font-semibold text-stone-700 mb-1">
              {t('Mobile Number')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                +91
              </span>
              <input
                id="klink-handleLoginSubmit-1"
                type="tel"
                placeholder={t('Enter 10-digit mobile number')}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                required
                className="klink-field w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div>
            <label htmlFor="klink-handleLoginSubmit-2" className="block text-xs font-semibold text-stone-700 mb-1">
              {t('Password')}
            </label>
            <div className="relative">
              <input
                id="klink-handleLoginSubmit-2"
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Enter your password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="klink-field w-full pl-3 pr-9 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <button
                type="button"
                aria-label={showPassword ? t('Hide password') : t('Show password')}
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || phone.length < 10 || !password}
            className="klink-primary w-full"
          >
            {isLoading ? t('Signing In...') : t('Sign In')}
          </button>

        </form>
      )}

      {/* REGISTER FORM */}
      {authModalMode === 'REGISTER' && (
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          <div>
            <label htmlFor="klink-handleRegisterSubmit-1" className="block text-xs font-semibold text-stone-700 mb-1">
              {t('Full Name / Firm Name')}
            </label>
            <input
              id="klink-handleRegisterSubmit-1"
              type="text"
              placeholder="e.g. Ramesh Chandra (Chandra Constructions)"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="klink-field w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="klink-handleRegisterSubmit-2" className="block text-xs font-semibold text-stone-700 mb-1">
                {t('10-Digit Mobile')}
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                  +91
                </span>
                <input
                  id="klink-handleRegisterSubmit-2"
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="klink-field w-full pl-9 pr-2 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label htmlFor="klink-handleRegisterSubmit-3" className="block text-xs font-semibold text-stone-700 mb-1">
                {t('Delivery District')}
              </label>
              <select
                id="klink-handleRegisterSubmit-3"
                value={districtId || activeDistrict?.id}
                onChange={(e) => setDistrictId(e.target.value)}
                className="klink-field w-full px-2.5 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
              >
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} {d.code === 'DARBHANGA' ? '(Active)' : '(Phase 2)'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="klink-handleRegisterSubmit-4" className="block text-xs font-semibold text-stone-700 mb-1">
              {t('Create Password')}
            </label>
            <input
              id="klink-handleRegisterSubmit-4"
              type="password"
              placeholder={t('Min 6 characters')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="klink-field w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label htmlFor="klink-handleRegisterSubmit-5" className="block text-xs font-semibold text-stone-700 mb-1">
              {t('Default Site Address (Optional)')}
            </label>
            <input
              id="klink-handleRegisterSubmit-5"
              type="text"
              placeholder="e.g. Near Shiv Mandir, Donar Chowk"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              className="klink-field w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="klink-handleRegisterSubmit-6" className="block text-xs font-semibold text-stone-700 mb-1">
                {t('Landmark')}
              </label>
              <input
                id="klink-handleRegisterSubmit-6"
                type="text"
                placeholder="e.g. Overbridge Bypass"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                className="klink-field w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label htmlFor="klink-handleRegisterSubmit-7" className="block text-xs font-semibold text-stone-700 mb-1">
                {t('PIN Code')}
              </label>
              <input
                id="klink-handleRegisterSubmit-7"
                type="text"
                placeholder="846004"
                value={pincode}
                onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                className="klink-field w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !fullName || phone.length < 10 || password.length < 6}
            className="klink-primary w-full"
          >
            {isLoading ? t('Creating Account...') : t('Create Account & Start Ordering')}
          </button>
        </form>
      )}
    </SignInDialog>
  );
};
