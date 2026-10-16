import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Lock, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { PASSWORD_HINT, validatePassword } from '../utils/password';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Supabase sends the user here with a recovery token in the URL hash.
  // The JS client picks it up automatically via onAuthStateChange.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // User arrived via the reset link — the session is set automatically.
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const passwordError = validatePassword(password);
    if (passwordError) return setError(passwordError);
    if (password !== confirm) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 transition-colors duration-300">
      <div className="max-w-[420px] w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-primary/10 mb-5 shadow-sm">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2.5">New Password</h1>
          <p className="text-[#64748B] text-[15px] font-medium">Choose a new password for your account</p>
        </div>

        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border/50">
          {success ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-[20px] font-bold text-[#0F172A] mb-3">Password updated!</h2>
              <p className="text-[14px] text-[#64748B] leading-relaxed">Redirecting you to sign in…</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="resetpassword-new-password" className="text-[13px] font-bold text-[#334155] ml-1 uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#5E6E84] group-focus-within:text-primary transition-colors">
                    <Lock className="w-[18px] h-[18px]" />
                  </div>
                  <input id="resetpassword-new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={PASSWORD_HINT}
                    className="block w-full pl-12 pr-12 py-3.5 bg-white border-[1.5px] border-border rounded-rs text-[#0F172A] text-[14px] font-medium placeholder:text-[#5E6E84] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-[#5E6E84] hover:text-primary transition-colors bg-transparent border-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="resetpassword-confirm-password" className="text-[13px] font-bold text-[#334155] ml-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#5E6E84] group-focus-within:text-primary transition-colors">
                    <Lock className="w-[18px] h-[18px]" />
                  </div>
                  <input id="resetpassword-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your password"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-border rounded-rs text-[#0F172A] text-[14px] font-medium placeholder:text-[#5E6E84] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white text-[15px] font-bold rounded-rs shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
