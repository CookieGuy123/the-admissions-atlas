import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { LogIn, UserPlus, X, Loader2, CheckCircle, AlertTriangle } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ open, onClose, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { role: "user" },
            emailRedirectTo: "https://theadmissionsatlas.zaaminkhan.com"
          }
        });
        if (signUpError) throw signUpError;
        setSuccess("Account created! Check your email to confirm, or try logging in.");
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-holo-gray-dark border border-holo-gray-border w-full max-w-md mx-4 relative" onClick={e => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-holo-blue-light text-black flex items-center justify-center">
              {mode === "login" ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-bold text-white uppercase tracking-tight">
              {mode === "login" ? "Sign In" : "Create Account"}
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-holo-blue-light uppercase block mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-black text-gray-200 border-b border-holo-gray-border px-3 py-2 text-sm font-sans focus:border-holo-blue-light outline-none"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="text-xs font-mono text-holo-blue-light uppercase block mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black text-gray-200 border-b border-holo-gray-border px-3 py-2 text-sm font-sans focus:border-holo-blue-light outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-950/40 border border-red-700/60 text-red-400 text-xs font-sans flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-teal-950/40 border border-teal-700/60 text-teal-400 text-xs font-sans flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-holo-blue-dark text-black uppercase font-mono font-bold text-xs py-2 hover:bg-holo-blue-light transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              className="text-xs text-holo-blue-light hover:text-white font-mono uppercase cursor-pointer"
            >
              {mode === "login" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}