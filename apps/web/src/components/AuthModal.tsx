import React, { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useDistrict } from '../lib/district-context';
import { X, Lock, Phone, User, MapPin, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    login,
    registerCustomer,
    isDemoMode
  } = useAuth();
  const { activeDistrict, districts } = useDistrict();

  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [districtId, setDistrictId] = useState(activeDistrict?.id || '');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(phone.trim(), password);
    } catch (err: any) {
      setError(err?.message || 'Invalid mobile number or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const targetDistrict = districtId || activeDistrict?.id || districts[0]?.id;
      if (!targetDistrict) {
        throw new Error('Please select a delivery district');
      }
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
      setError(err?.message || 'Registration failed. Check your phone number.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillQuickDemo = (demoPhone: string, demoPass: string) => {
    setPhone(demoPhone);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-xl border border-stone-200 animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute right-4 top-4 text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-stone-900 text-white flex items-center justify-center font-mono font-bold text-xs">
              K
            </div>
            <div>
              <h3 className="font-semibold text-sm text-stone-900">
                {authModalMode === 'LOGIN' ? 'Sign In to KLINK Exchange' : 'Create Contractor Account'}
              </h3>
              <p className="text-xs text-stone-500">
                {authModalMode === 'LOGIN'
                  ? 'Access site deliveries, rate cards, and dealer yard management'
                  : 'Direct delivery of cement, TMT, sand, and aggregates in Bihar'}
              </p>
            </div>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex p-0.5 bg-stone-100 rounded-lg border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('LOGIN');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authModalMode === 'LOGIN'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setAuthModalMode('REGISTER');
              setError(null);
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
              authModalMode === 'REGISTER'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            New Customer
          </button>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authModalMode === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                  +91
                </span>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  className="w-full pl-11 pr-3 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-3 pr-9 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || phone.length < 10 || !password}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? 'Signing In...' : 'Sign In to Portal'}
            </button>

            {/* Quick Demo Credentials Assistant */}
            <div className="pt-2 border-t border-stone-200">
              <span className="text-[10px] font-mono text-stone-400 uppercase tracking-wider block mb-1.5">
                Quick Test Credentials (Pre-seeded)
              </span>
              <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => fillQuickDemo('9123456789', 'customer123')}
                  className="p-1.5 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left cursor-pointer"
                >
                  <div className="font-semibold text-stone-800">Customer</div>
                  <div className="font-mono text-[9px] text-stone-500">Ravi Kumar</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('9876543210', 'supplier123')}
                  className="p-1.5 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left cursor-pointer"
                >
                  <div className="font-semibold text-stone-800">Dealer Yard</div>
                  <div className="font-mono text-[9px] text-stone-500">Gupta Materials</div>
                </button>
                <button
                  type="button"
                  onClick={() => fillQuickDemo('9999999999', 'admin123')}
                  className="p-1.5 rounded-md border border-stone-200 bg-stone-50 hover:bg-stone-100 text-left cursor-pointer"
                >
                  <div className="font-semibold text-stone-800">Admin</div>
                  <div className="font-mono text-[9px] text-stone-500">Platform Ops</div>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* REGISTER FORM */}
        {authModalMode === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Full Name / Firm Name
              </label>
              <input
                type="text"
                placeholder="e.g. Ramesh Chandra (Chandra Constructions)"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs font-medium border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  10-Digit Mobile
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-mono font-semibold text-stone-400">
                    +91
                  </span>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    className="w-full pl-9 pr-2 py-2 text-xs font-mono font-semibold text-stone-900 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Delivery District
                </label>
                <select
                  value={districtId || activeDistrict?.id}
                  onChange={(e) => setDistrictId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-medium border border-stone-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
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
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Default Site Address (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Near Shiv Mandir, Donar Chowk"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  placeholder="e.g. Overbridge Bypass"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  PIN Code
                </label>
                <input
                  type="text"
                  placeholder="846004"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.slice(0, 6))}
                  className="w-full px-3 py-2 text-xs font-mono border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !fullName || phone.length < 10 || password.length < 6}
              className="w-full py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-xs disabled:opacity-50 transition-all cursor-pointer mt-2"
            >
              {isLoading ? 'Creating Account...' : 'Create Account & Start Ordering'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

