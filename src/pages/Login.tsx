import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { user, login, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  if (user) {
    return <Navigate to="/" />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#102dc8] via-[#2844d4] to-[#102dc8] animate-gradient"
        style={{
          backgroundSize: '400% 400%',
          animation: 'gradient 15s ease infinite',
        }}
      />

      {/* Gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/10" />

      <div className="relative z-10 flex flex-col items-center">
        <img 
          src="https://i.imghippo.com/files/TkS6932euM.png" 
          alt="Logo"
          className="w-48 h-48 object-contain mb-6"
        />

        <div className="bg-white/95 backdrop-blur-sm p-8 rounded-lg shadow-xl w-full max-w-md">
          <div className="flex flex-col items-center justify-center gap-3 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#102dc8]/10 flex items-center justify-center">
              <Clock className="w-10 h-10 text-[#102dc8]" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900">PDSL Hour Tracker</h1>
              <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#102dc8] focus:outline-none focus:ring-1 focus:ring-[#102dc8] bg-white/50"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#102dc8] focus:outline-none focus:ring-1 focus:ring-[#102dc8] bg-white/50"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#102dc8] text-white py-2.5 px-4 rounded-md hover:bg-[#102dc8]/90 focus:outline-none focus:ring-2 focus:ring-[#102dc8] focus:ring-offset-2 disabled:opacity-50 transition-colors font-medium"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};