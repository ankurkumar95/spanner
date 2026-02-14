import React from 'react';

const LoginPage: React.FC = () => {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-full max-w-[400px] px-6">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-black text-white mb-4 shadow-sm">
            <span className="material-symbols-outlined text-2xl">build</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Spanner</h1>
          <p className="mt-2 text-sm text-neutral-500">Internal ABM Platform</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8">
          <h2 className="text-lg font-medium text-neutral-900 mb-6">Sign in to your account</h2>
          <form action="#" className="space-y-5" method="POST">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="email">Email address</label>
              <input
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm py-2 px-3 placeholder-neutral-400"
                id="email"
                name="email"
                placeholder="you@company.com"
                required
                type="email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5" htmlFor="password">Password</label>
              <input
                className="block w-full rounded-md border-neutral-300 shadow-sm focus:border-neutral-500 focus:ring-neutral-500 sm:text-sm py-2 px-3 placeholder-neutral-400"
                id="password"
                name="password"
                placeholder="••••••••"
                required
                type="password"
              />
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  className="h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-500"
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                />
                <label className="ml-2 block text-sm text-neutral-600" htmlFor="remember-me">Remember me</label>
              </div>
              <div className="text-sm">
                <a className="font-medium text-neutral-900 hover:text-neutral-700 hover:underline decoration-neutral-400 underline-offset-2" href="#">Forgot password?</a>
              </div>
            </div>
            <div>
              <button
                className="flex w-full justify-center rounded-md border border-transparent bg-neutral-900 py-2.5 px-4 text-sm font-medium text-white shadow-sm hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-500 focus:ring-offset-2 transition-colors duration-200"
                type="submit"
              >
                Sign in
              </button>
            </div>
          </form>
        </div>
        <div className="mt-8 text-center">
          <p className="text-xs text-neutral-400">
            Having trouble accessing Spanner? <br /> Contact <a className="underline hover:text-neutral-600" href="#">IT Support</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
