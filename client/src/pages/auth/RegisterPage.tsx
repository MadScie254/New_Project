import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import { Loader2 } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    pin: '',
    confirmPin: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'phone') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/[^\d+]/g, '') }));
    } else if (name === 'pin' || name === 'confirmPin') {
      setFormData(prev => ({ ...prev, [name]: value.replace(/\D/g, '').slice(0, 4) }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.name.length < 3) {
      setError('Name must be at least 3 characters');
      return;
    }

    if (formData.phone.length < 9) {
      setError('Please enter a valid phone number');
      return;
    }

    if (formData.pin.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setError('PINs do not match');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', { 
        name: formData.name,
        phone: formData.phone, 
        pin: formData.pin 
      });
      
      // Store temp token or phone for OTP page
      sessionStorage.setItem('temp_reg_phone', formData.phone);
      
      // If backend gave OTP directly (development mode)
      if (response.data.otp) {
        console.log('Dev OTP:', response.data.otp);
      }
      
      navigate('/otp'); // Assuming we'll build this next
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      {/* Top Banner */}
      <div className="bg-primary py-4 px-6 shadow-md flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-md flex items-center justify-center">
            <span className="text-primary font-bold text-lg tracking-tighter">C</span>
          </div>
          <span className="font-bold text-xl text-primary-foreground tracking-tight">Chama OS</span>
        </div>
        <Link to="/login" className="text-primary-foreground/90 text-sm font-medium hover:text-white transition-colors">
          Log In
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border p-6 md:p-8">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-foreground">Create Account</h2>
            <p className="text-muted-foreground text-sm mt-1">Join Chama OS to manage your investments</p>
          </div>

          {error && (
            <div className="mb-6 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-foreground">Full Name (as per ID)</label>
              <input
                id="name"
                name="name"
                type="text"
                placeholder="e.g. Wanjiku Kamau"
                value={formData.name}
                onChange={handleChange}
                className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-foreground">Phone Number</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                  +254
                </span>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="712345678"
                  value={formData.phone.replace(/^(\+?254|0)/, '')}
                  onChange={handleChange}
                  className="w-full h-10 pl-12 pr-3 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="pin" className="text-sm font-medium text-foreground">4-Digit PIN</label>
                <input
                  id="pin"
                  name="pin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={formData.pin}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-center tracking-[0.5em] text-lg font-bold ring-offset-background placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="confirmPin" className="text-sm font-medium text-foreground">Confirm PIN</label>
                <input
                  id="confirmPin"
                  name="confirmPin"
                  type="password"
                  inputMode="numeric"
                  placeholder="••••"
                  value={formData.confirmPin}
                  onChange={handleChange}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 py-2 text-center tracking-[0.5em] text-lg font-bold ring-offset-background placeholder:text-muted-foreground placeholder:tracking-normal placeholder:font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || formData.pin.length !== 4 || formData.pin !== formData.confirmPin}
              className="w-full h-10 mt-4 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            
            <p className="text-xs text-center text-muted-foreground pt-4">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
