import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
import { Loader2 } from 'lucide-react';

const OTPPage: React.FC = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const navigate = useNavigate();
  const { checkAuth } = useAuthStore();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // We stored the phone in session storage during registration
  const phone = sessionStorage.getItem('temp_reg_phone');

  useEffect(() => {
    if (!phone) {
      navigate('/register');
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, phone, navigate]);

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    // Take just the last character if multiple are typed
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace if current is empty
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await api.post('/auth/verify-otp', { 
        phone, 
        otp: otpString 
      });
      
      // If OTP verified successfully, we can clean up session storage
      sessionStorage.removeItem('temp_reg_phone');
      
      // Navigate to login as we need to fetch user profile & real token
      // or we might already be logged in from register response
      await checkAuth();
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please try again.');
      // Clear OTP
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    // Implementation would call an API endpoint to resend OTP
    setCountdown(60);
    // Add real API call here
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-border p-6 md:p-8">
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-4">
            <span className="text-primary text-2xl font-bold">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Verify Your Account</h2>
          <p className="text-muted-foreground text-sm mt-2">
            We've sent a 6-digit verification code to<br/>
            <span className="font-semibold text-foreground">{phone}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="flex justify-center gap-2 sm:gap-3 mb-8">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => inputRefs.current[index] = el}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 rounded-md border border-input bg-background text-center text-xl font-bold focus:border-primary focus:ring-2 focus:ring-primary focus:ring-opacity-50 transition-all"
                autoFocus={index === 0}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isLoading || otp.join('').length !== 6}
            className="w-full h-11 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 transition-colors shadow-sm"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Didn't receive the code?{' '}
            {countdown > 0 ? (
              <span className="font-medium text-foreground">
                Resend in {countdown}s
              </span>
            ) : (
              <button 
                onClick={handleResend}
                className="font-medium text-primary hover:underline focus:outline-none"
              >
                Resend OTP
              </button>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OTPPage;
