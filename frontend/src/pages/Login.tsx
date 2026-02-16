import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router';
import { Wrench } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login(email, password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (error: any) {
      const message = error.response?.data?.detail || 'Invalid credentials';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-[400px] px-6">
        {/* Logo and Title */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white mb-4 shadow-sm">
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
            Spanner
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Internal ABM Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
          <h2 className="text-lg font-medium text-neutral-900 mb-6">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm py-2 px-3 placeholder-neutral-400"
                placeholder="you@company.com"
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-neutral-700 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm py-2 px-3 placeholder-neutral-400"
                placeholder="••••••••"
              />
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-neutral-600"
                >
                  Remember me
                </label>
              </div>
              <div className="text-sm">
                <a
                  href="#"
                  className="font-medium text-neutral-900 hover:text-neutral-700 hover:underline decoration-neutral-400 underline-offset-2"
                >
                  Forgot password?
                </a>
              </div>
            </div>

            {/* Sign In Button */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex w-full justify-center rounded-md border border-transparent bg-neutral-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>

        {/* IT Support */}
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-400">
            Having trouble accessing Spanner? <br />
            Contact{' '}
            <a href="#" className="underline hover:text-neutral-600">
              IT Support
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
