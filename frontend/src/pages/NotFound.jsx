import { Link } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="text-center max-w-[460px] animate-fade-in px-6">
        <div className="relative mb-10">
          <div className="text-[120px] font-black text-primary/5 leading-none select-none tracking-[-8px]">
            404
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center transform rotate-12 transition-transform hover:rotate-0 duration-500">
              <span className="text-4xl">🔎</span>
            </div>
          </div>
        </div>

        <h1 className="text-[28px] md:text-[32px] font-extrabold text-[#0F172A] mb-3 tracking-tight">
          Oops! Page not found
        </h1>
        <p className="text-[15px] text-[#64748B] mb-10 leading-relaxed font-medium">
          The page you're looking for seems to have vanished into thin air. Don't worry, your deadlines are still safe!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-primary hover:bg-primary-hover text-white px-7 py-3.5 rounded-rs text-[14px] font-bold no-underline transition-all shadow-lg shadow-primary/20 transform active:scale-[0.98]"
          >
            <Home className="w-[18px] h-[18px]" />
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white border border-border text-[#475569] hover:bg-bg px-7 py-3.5 rounded-rs text-[14px] font-bold transition-all shadow-sm"
          >
            <ArrowLeft className="w-[18px] h-[18px]" />
            Go Back
          </button>
        </div>

        <div className="mt-16 text-[12px] text-[#5E6E84] font-semibold uppercase tracking-widest opacity-50">
          Trackit · AI Deadline Master
        </div>
      </div>
    </div>
  );
}
