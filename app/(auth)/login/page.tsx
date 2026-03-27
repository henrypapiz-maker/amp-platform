"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

const demoAccounts = [
  { label: "Admin", email: "henry@aliofoundry.com", password: "admin123", role: "admin" },
  { label: "Analyst", email: "angus@aliofoundry.com", password: "analyst123", role: "analyst" },
  { label: "Viewer", email: "client@example.com", password: "viewer123", role: "viewer" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/dashboard");
      router.refresh();
    }
  }

  function handleDemoLogin(account: typeof demoAccounts[0]) {
    setEmail(account.email);
    setPassword(account.password);
  }

  return (
    <div className="min-h-screen bg-stone-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-white tracking-tight">
            AMP
          </h1>
          <p className="text-stone-400 mt-2 text-sm tracking-widest uppercase">
            Acquisition Management Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-stone-800 border border-stone-700 rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-900 border border-stone-600 rounded-md px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-300 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-900 border border-stone-600 rounded-md px-3 py-2.5 text-white placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-stone-700">
            <p className="text-stone-400 text-xs uppercase tracking-wider mb-3">
              Demo Accounts
            </p>
            <div className="space-y-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  onClick={() => handleDemoLogin(account)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-stone-900 hover:bg-stone-700 border border-stone-700 transition-colors group"
                >
                  <span className="text-stone-300 text-sm">{account.email}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-stone-700 text-stone-400 group-hover:bg-amber-600/20 group-hover:text-amber-400 transition-colors">
                    {account.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-stone-500 text-xs mt-6">
          Alio Foundry &middot; AMP v1.0
        </p>
      </div>
    </div>
  );
}
