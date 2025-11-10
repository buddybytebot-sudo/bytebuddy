
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ByteBuddyLogo, EyeIcon, EyeSlashIcon } from '../components/ui/Icons';

type AuthMode = 'signIn' | 'signUp';

const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signUp') {
        if (password.length < 6) {
            setError('Password must be at least 6 characters long.');
            setLoading(false);
            return;
        }
        await signUp(name, username, password);
      } else {
        await signIn(username, password);
      }
      // No navigation needed, AuthContext state change will trigger re-render in App.tsx
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-card rounded-2xl shadow-2xl">
        <div className="text-center">
            <ByteBuddyLogo className="w-20 h-20 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold font-sora text-text-primary">
                {mode === 'signIn' ? 'Welcome Back' : 'Create Your Account'}
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
                to your AI Health Companion
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleAuth}>
          {mode === 'signUp' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              required
              className="w-full px-3 py-2 border border-gray-700 bg-background rounded-md placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            autoComplete="username"
            className="w-full px-3 py-2 border border-gray-700 bg-background rounded-md placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="relative">
            <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
                autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
                className="w-full px-3 py-2 border border-gray-700 bg-background rounded-md placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-200"
            >
                {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
          
          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
          >
            {loading ? 'Processing...' : (mode === 'signIn' ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <div className="text-center text-sm">
          <p className="text-text-secondary">
            {mode === 'signIn' ? "Don't have an account?" : 'Already have an account?'}
            <button
              onClick={() => { setMode(mode === 'signIn' ? 'signUp' : 'signIn'); setError(null); }}
              className="font-medium text-primary hover:text-secondary ml-1"
            >
              {mode === 'signIn' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
