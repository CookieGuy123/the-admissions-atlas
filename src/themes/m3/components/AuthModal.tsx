import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../../supabaseClient";
import { LogIn, UserPlus, X, Loader2, AlertTriangle, CheckCircle, Mail, Lock } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export default function AuthModal({ open, onClose, onAuthSuccess }: Props) {
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
    setLoading(true); setError(null); setSuccess(null);
    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({ email, password, options: { data: { role: "user" } } });
        if (signUpError) throw signUpError;
        setSuccess("Account created! Check your email.");
        setMode("login");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        onAuthSuccess();
      }
    } catch (err: any) { setError(err.message || "Auth failed."); }
    finally { setLoading(false); }
  };

  return (
    <div className="m3-dialog-overlay" onClick={onClose}>
      <div className="m3-dialog" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-container rounded-xl flex items-center justify-center">
              {mode === "login" ? <LogIn className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-on-surface">{mode === "login" ? "Sign in" : "Create account"}</h2>
              <p className="text-sm text-on-surface-variant">{mode === "login" ? "Welcome back" : "Join the Atlas"}</p>
            </div>
          </div>
          <button onClick={onClose} className="m3-btn-text p-2"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-5 pt-2 space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="m3-field w-full pl-9" placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant" />
              <input type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)} className="m3-field w-full pl-9" placeholder="At least 6 characters" />
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-error-container rounded-xl text-sm text-on-error-container">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 p-3 bg-success-container rounded-xl text-sm text-success">
              <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> {success}
            </div>
          )}

          <button type="submit" disabled={loading} className="m3-btn-filled w-full py-3">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === "login" ? "Sign in" : "Create account"}
          </button>

          <div className="text-center pt-1">
            <button type="button" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); setSuccess(null); }}
              className="m3-btn-text text-sm">
              {mode === "login" ? "No account? Create one" : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}