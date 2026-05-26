import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import { Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const bypassAuth = import.meta.env.VITE_BYPASS_AUTH === 'true';

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setPhone(val);
  };

  const normalizePhone = (raw: string) => {
    if (raw.startsWith('254') && raw.length >= 12) return raw;
    if (raw.startsWith('0')) return `254${raw.slice(1)}`;
    if (raw.length === 9) return `254${raw}`;
    return raw;
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only numbers, max 4
    const val = e.target.value.replace(/\D/g, '').slice(0, 4);
    setPin(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const normalizedPhone = normalizePhone(phone);
    if (normalizedPhone.length !== 12) {
      setError('Please enter a valid phone number');
      return;
    }

    if (pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { phone: normalizedPhone, pin });
      login(response.data.user, response.data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBypass = () => {
    login({ id: 'dev-user', phone: '254700000000', name: 'Dev User' }, 'dev-bypass');
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg overflow-hidden border border-border">
        {/* Header */}
        <div className="bg-primary p-6 text-center">
          <div className="w-12 h-12 bg-white rounded-xl mx-auto flex items-center justify-center mb-3 shadow-sm">
            <span className="text-primary font-bold text-2xl tracking-tighter">C</span>
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground tracking-tight">Chama OS</h1>
          <p className="text-primary-foreground/80 text-sm mt-1">Manage your chama with ease</p>
        </div>

        {/* Form */}
        <div className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-6 text-center">Welcome Back</h2>

          {error && (
            <div className="mb-4 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  +254
                </span>
                <input
                  id="phone"
                  type="tel"
                  placeholder="712345678"
                  value={phone.replace(/^(254|0)/, '')}
                  onChange={handlePhoneChange}
                  className="w-full h-10 pl-12 pr-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="pin" className="text-sm font-medium text-foreground">4-Digit PIN</label>
                <button type="button" className="text-xs text-primary font-medium hover:underline">Forgot PIN?</button>
              </div>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="••••"
                value={pin}
                onChange={handlePinChange}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-center tracking-[0.5em] text-lg font-bold ring-offset-background placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || pin.length !== 4 || normalizePhone(phone).length !== 12}
              className="w-full h-10 mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 text-center space-y-2">
          {bypassAuth && (
            <button
              type="button"
              onClick={handleBypass}
              className="w-full h-9 inline-flex items-center justify-center rounded-md border border-input bg-background text-xs font-medium text-foreground hover:bg-muted"
            >
              Skip login (dev)
            </button>
          )}
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
