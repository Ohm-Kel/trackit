import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, Chrome, AlertCircle, Loader2 } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      // Clear any stale OAuth params before starting a new flow
      if (window.location.search || window.location.hash) {
        window.history.replaceState({}, document.title, window.location.origin + window.location.pathname);
      }
      const { error } = await signInWithGoogle();
      if (error) throw error;
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4 transition-colors duration-300">
      <div className="max-w-[420px] w-full animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center mb-6">
            <img src="/logo.png" alt="Trackit Logo" className="w-[180px] h-auto object-contain mix-blend-multiply" />
          </div>
          <h1 className="text-[32px] font-extrabold text-[#0F172A] tracking-tight mb-2.5">Welcome Back</h1>
          <p className="text-[#64748B] text-[15px] font-medium">Sign in to continue your progress</p>
        </div>

        <div className="bg-white rounded-[24px] p-8 md:p-10 shadow-[0_20px_50px_rgba(0,0,0,0.04)] border border-border/50">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm animate-shake">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="login-email-address" className="text-[13px] font-bold text-[#334155] ml-1 uppercase tracking-wider">Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#5E6E84] group-focus-within:text-primary transition-colors">
                  <Mail className="w-[18px] h-[18px]" />
                </div>
                <input id="login-email-address"
                  type="email"
                  required
                  placeholder="name@example.com"
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-border rounded-rs text-[#0F172A] text-[14px] font-medium placeholder:text-[#5E6E84] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label htmlFor="login-password" className="text-[13px] font-bold text-[#334155] uppercase tracking-wider">Password</label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-primary hover:text-primary-hover transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4.5 flex items-center pointer-events-none text-[#5E6E84] group-focus-within:text-primary transition-colors">
                  <Lock className="w-[18px] h-[18px]" />
                </div>
                <input id="login-password"
                  type="password"
                  required
                  placeholder="••••••••"
                  className="block w-full pl-12 pr-4 py-3.5 bg-white border-[1.5px] border-border rounded-rs text-[#0F172A] text-[14px] font-medium placeholder:text-[#5E6E84] focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-4 bg-primary hover:bg-primary-hover disabled:bg-primary/50 text-white text-[15px] font-bold rounded-rs shadow-lg shadow-primary/20 transform active:scale-[0.98] transition-all"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> Sign In</>}
            </button>
          </form>

          <div className="relative my-9">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#F1F5F9]" />
            </div>
            <div className="relative flex justify-center text-[12px]">
              <span className="px-5 bg-white text-[#5E6E84] font-bold uppercase tracking-widest">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3.5 py-3.5 bg-white border-[1.5px] border-border hover:bg-[#F8FAFC] hover:border-[#CBD5E1] text-[#334155] font-bold text-[14px] rounded-rs shadow-sm transition-all group"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>

          <p className="mt-10 text-center text-[14px] text-[#64748B]">
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-extrabold text-primary hover:text-primary-hover decoration-primary/30 decoration-2">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
