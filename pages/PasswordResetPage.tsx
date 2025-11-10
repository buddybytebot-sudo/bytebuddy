
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ByteBuddyLogo } from '../components/ui/Icons';

const PasswordResetPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    
    // Mock functionality
    await new Promise(res => setTimeout(res, 1000));
    
    if (email) {
        setMessage('If an account with that email exists, a password reset link has been sent.');
    } else {
        setError('Please enter a valid email.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full space-y-8 p-10 bg-card rounded-2xl shadow-2xl">
        <div className="text-center">
            <ByteBuddyLogo className="w-20 h-20 mx-auto" />
            <h2 className="mt-6 text-3xl font-extrabold font-sora text-text-primary">
                Reset Your Password
            </h2>
            <p className="mt-2 text-sm text-text-secondary">
                Enter your email to receive a reset link.
            </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email address"
            required
            className="w-full px-3 py-2 border border-gray-700 bg-background rounded-md placeholder-gray-500 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
          />
          
          {error && <p className="text-sm text-red-500">{error}</p>}
          {message && <p className="text-sm text-green-500">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary to-secondary hover:opacity-90 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary focus:ring-offset-background"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="text-center text-sm">
          <Link to="/auth" className="font-medium text-primary hover:text-secondary">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PasswordResetPage;
