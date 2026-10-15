import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Mail, ArrowLeft, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh overflow-y-auto flex bg-[#F8FAFC] p-4 transition-colors duration-300">
      <div className="max-w-[420px] w-full m-auto animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-primary/10 mb-5 shadow-sm">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2.5">Reset Password</h1>
          <p className="text-[#64748B] text-[15px] font-medium">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border/50">
          {sent ? (
            <div className="text-center py-4 animate-scale-in">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-[20px] font-bold text-[#0F172A] mb-3">Check your email</h2>
              <p className="text-[14px] text-[#64748B] leading-relaxed mb-10">
                A password reset link has been sent to <br/><strong className="text-[#0F172A]">{email}</strong>.<br/> Check your inbox (and spam folder).
              </p>
              <Link
                to="/login"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#F8FAFC] border border-border text-[#475569] hover:bg-white hover:border-primary hover:text-primary font-bold text-[14px] rounded-rs transition-all group"
              >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="forgotpassword-email-address" className="text-[13px] font-bold text-[#334155] ml-1 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#5E6E84] group-focus-within:text-primary transition-colors">
                    <Mail className="w-[18px] h-[18px]" />
                  </div>
                  <input id="forgotpassword-email-address"
                    type="email"
                    required
                    placeholder="name@example.com"
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-border rounded-rs text-[#0F172A] text-[14px] font-medium placeholder:text-[#5E6E84] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white text-[15px] font-bold rounded-rs shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
              </button>

              <div className="pt-2">
                <Link
                  to="/login"
                  className="flex items-center justify-center gap-2 text-[14px] font-bold text-[#64748B] hover:text-primary transition-all group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Sign In
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
