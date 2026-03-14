import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  CheckSquare, GraduationCap, MessageSquare, Upload, Target, BarChart2,
  ArrowRight, ChevronRight, Zap, Shield, Clock, Brain, Star, Sparkles,
  Calendar, FileText, Bell,
} from 'lucide-react';

/* ────────────────────────────────────────────
   LANDING PAGE — Cluely-inspired SaaS design
   ──────────────────────────────────────────── */

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white text-[#19191D] font-['Inter',system-ui,sans-serif] antialiased overflow-x-hidden overflow-y-auto">
      <Nav onSignup={() => navigate('/signup')} onLogin={() => navigate('/login')} />
      <Hero onGetStarted={() => navigate('/signup')} onLearnMore={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} />
      <LogoBar />
      <Features />
      <HowItWorks />
      <AISection onTry={() => navigate('/signup')} />
      <Stats />
      <Testimonials />
      <FinalCTA onGetStarted={() => navigate('/signup')} />
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════ */

function Nav({ onSignup, onLogin }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-[#E8ECF0]/60">
      <div className="max-w-[1200px] mx-auto px-6 h-[64px] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-[30px] h-[30px] bg-[#4F46E5] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 16 16" className="w-[14px] h-[14px] fill-white"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg>
          </div>
          <span className="text-[17px] font-bold tracking-[-0.4px]">Trackit</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-[13.5px] font-medium text-[#475569]">
          <a href="#features" className="hover:text-[#19191D] transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-[#19191D] transition-colors">How It Works</a>
          <a href="#ai" className="hover:text-[#19191D] transition-colors flex items-center gap-1.5">
            AI Assistant
            <span className="text-[9px] font-bold bg-[#4F46E5] text-white px-1.5 py-[1px] rounded-full tracking-wide">NEW</span>
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onLogin}
            className="text-[13px] font-semibold text-[#475569] hover:text-[#19191D] bg-transparent border-none cursor-pointer transition-colors hidden sm:block"
          >
            Log in
          </button>
          <button
            onClick={onSignup}
            className="text-[13px] font-semibold text-white bg-[#19191D] hover:bg-[#2d2d33] px-4 py-2 rounded-lg border-none cursor-pointer transition-all shadow-sm"
          >
            Get Started Free
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ═══════════════════════════════════════════
   HERO SECTION
   ═══════════════════════════════════════════ */

function Hero({ onGetStarted, onLearnMore }) {
  return (
    <section className="relative pt-[140px] md:pt-[160px] pb-[80px] md:pb-[100px] overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#EEF2FF] via-[#F5F3FF]/40 to-white" />
      {/* Shimmer overlay */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle,rgba(79,70,229,0.08)_0%,transparent_70%)] pointer-events-none" />
      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, #4F46E5 1px, transparent 1px)', backgroundSize: '32px 32px' }} />

      <div className="relative max-w-[1200px] mx-auto px-6 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 bg-white border border-[#E8ECF0] rounded-full px-4 py-1.5 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#4F46E5]" />
          <span className="text-[12px] font-semibold text-[#475569]">AI-Powered Student Planner</span>
        </div>

        {/* Headline */}
        <h1 className="text-[42px] md:text-[64px] lg:text-[72px] font-bold leading-[1.05] tracking-[-2px] md:tracking-[-3px] max-w-[800px] mx-auto mb-5">
          <span className="bg-gradient-to-b from-[#19191D] to-[#3d3d4a] bg-clip-text text-transparent">
            Never Miss a{' '}
          </span>
          <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
            Deadline
          </span>
          <span className="bg-gradient-to-b from-[#19191D] to-[#3d3d4a] bg-clip-text text-transparent">
            {' '}Again
          </span>
        </h1>

        {/* Subheadline */}
        <p className="text-[17px] md:text-[19px] text-[#475569] max-w-[560px] mx-auto mb-8 leading-relaxed font-light">
          Trackit organises your assignments, exams, and study schedule with AI — so you can focus on what matters most.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-7 py-3.5 rounded-xl text-[15px] font-semibold border-none cursor-pointer transition-all shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)] hover:-translate-y-[1px]"
          >
            Start for Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onLearnMore}
            className="inline-flex items-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#19191D] px-6 py-3.5 rounded-xl text-[15px] font-semibold border border-[#E8ECF0] cursor-pointer transition-all shadow-sm"
          >
            See How It Works
            <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
          </button>
        </div>

        {/* Hero Image — App Preview */}
        <div className="relative max-w-[900px] mx-auto">
          <div className="absolute -inset-4 bg-gradient-to-b from-[#4F46E5]/5 to-transparent rounded-[28px] blur-xl" />
          <div className="relative bg-white rounded-[20px] border border-[#E8ECF0] shadow-[0_20px_60px_rgba(15,23,42,0.1)] overflow-hidden">
            {/* Mock app header */}
            <div className="h-[44px] bg-[#F8FAFC] border-b border-[#E8ECF0] flex items-center px-4 gap-2">
              <div className="w-3 h-3 rounded-full bg-[#EF4444]/60" />
              <div className="w-3 h-3 rounded-full bg-[#F59E0B]/60" />
              <div className="w-3 h-3 rounded-full bg-[#22C55E]/60" />
              <div className="flex-1 flex justify-center">
                <div className="bg-white rounded-md px-12 py-1 text-[11px] text-[#94A3B8] border border-[#E8ECF0]">trackit.app</div>
              </div>
            </div>
            {/* Mock app content */}
            <div className="flex min-h-[360px] md:min-h-[440px]">
              {/* Sidebar mock */}
              <div className="hidden md:flex flex-col w-[200px] bg-[#FAFBFC] border-r border-[#E8ECF0] p-4">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-6 h-6 bg-[#4F46E5] rounded-md flex items-center justify-center">
                    <svg viewBox="0 0 16 16" className="w-3 h-3 fill-white"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg>
                  </div>
                  <span className="text-[13px] font-bold text-[#19191D]">Trackit</span>
                </div>
                {['Dashboard', 'My Tasks', 'Exams', 'AI Chat', 'Focus Plan', 'Analytics'].map((item, i) => (
                  <div key={item} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium mb-0.5 ${i === 0 ? 'bg-[#EEF2FF] text-[#4F46E5]' : 'text-[#64748B]'}`}>
                    <div className={`w-3.5 h-3.5 rounded ${i === 0 ? 'bg-[#4F46E5]/20' : 'bg-[#E2E8F0]'}`} />
                    {item}
                  </div>
                ))}
              </div>
              {/* Main content mock */}
              <div className="flex-1 p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <div className="text-[16px] font-bold text-[#19191D] mb-0.5">Good morning, Student</div>
                    <div className="text-[11px] text-[#94A3B8]">Friday, 14 March · 3 tasks due this week</div>
                  </div>
                  <div className="bg-[#4F46E5] text-white text-[11px] font-semibold px-3 py-1.5 rounded-lg">+ Add Task</div>
                </div>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ n: '5', l: 'Active Tasks' }, { n: '3', l: 'Due This Week' }, { n: '2', l: 'Exams Coming' }].map((s, i) => (
                    <div key={i} className="bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                      <div className="text-[20px] font-bold text-[#19191D]">{s.n}</div>
                      <div className="text-[10px] text-[#94A3B8] font-medium">{s.l}</div>
                    </div>
                  ))}
                </div>
                {/* Task rows */}
                <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#F1F5F9]">
                  {[
                    { t: 'Data Structures Assignment', d: '2 days', s: 'in_progress', c: '#4F46E5' },
                    { t: 'Linear Algebra Problem Set', d: 'Tomorrow', s: 'stuck', c: '#EF4444' },
                    { t: 'Physics Lab Report', d: '5 days', s: 'not_started', c: '#94A3B8' },
                  ].map((task, i) => (
                    <div key={i} className={`flex items-center gap-3 py-2.5 px-2 ${i < 2 ? 'border-b border-[#E8ECF0]/60' : ''}`}>
                      <div className={`w-3 h-3 rounded-full border-2`} style={{ borderColor: task.c }} />
                      <div className="flex-1">
                        <div className="text-[12px] font-semibold text-[#19191D]">{task.t}</div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: `${task.c}15`, color: task.c }}>{task.d}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   LOGO BAR — University/Trust signals
   ═══════════════════════════════════════════ */

function LogoBar() {
  return (
    <section className="py-10 border-y border-[#F1F5F9]">
      <div className="max-w-[1200px] mx-auto px-6 text-center">
        <p className="text-[11.5px] font-semibold text-[#94A3B8] uppercase tracking-[0.1em] mb-5">
          Trusted by students at leading universities
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 opacity-40">
          {['Oxford', 'Imperial', 'UCL', 'Manchester', 'Edinburgh', 'KCL'].map(uni => (
            <span key={uni} className="text-[15px] md:text-[17px] font-bold text-[#19191D] tracking-[-0.3px]">{uni}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FEATURES SECTION
   ═══════════════════════════════════════════ */

function Features() {
  const features = [
    {
      icon: CheckSquare,
      title: 'Smart Task Management',
      description: 'Track assignments with due dates, grade weights, and effort estimates. Break tasks into subtasks and monitor progress in real time.',
      gradient: 'from-[#4F46E5] to-[#6366F1]',
    },
    {
      icon: GraduationCap,
      title: 'Exam Countdown',
      description: 'Never be caught off guard. Track exam dates, confidence levels, and preparation progress with built-in revision subtasks.',
      gradient: 'from-[#7C3AED] to-[#8B5CF6]',
    },
    {
      icon: Brain,
      title: 'AI Study Assistant',
      description: 'Chat with an AI that knows your entire workload. Get personalised study advice, priority recommendations, and help when you\'re stuck.',
      gradient: 'from-[#2563EB] to-[#3B82F6]',
    },
    {
      icon: Upload,
      title: 'Timetable Upload',
      description: 'Upload your class schedule or exam timetable as a PDF or image. AI parses it instantly and imports everything automatically.',
      gradient: 'from-[#059669] to-[#10B981]',
    },
    {
      icon: Target,
      title: 'Focus Plan',
      description: 'Get a daily study schedule based on your deadlines and class timetable. Tasks are assigned to your actual free time windows.',
      gradient: 'from-[#D97706] to-[#F59E0B]',
    },
    {
      icon: BarChart2,
      title: 'Analytics & Insights',
      description: 'Track your productivity trends, completion rates, and workload distribution. See where your time goes and optimise your study habits.',
      gradient: 'from-[#DC2626] to-[#EF4444]',
    },
  ];

  return (
    <section id="features" className="py-[80px] md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#EEF2FF] rounded-full px-4 py-1.5 mb-4">
            <Zap className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-[12px] font-semibold text-[#4F46E5]">Features</span>
          </div>
          <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.5px] mb-4">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">ace your semester</span>
          </h2>
          <p className="text-[16px] text-[#64748B] max-w-[500px] mx-auto font-light">
            Six powerful tools, one unified platform. Built specifically for how students actually work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => (
            <div
              key={i}
              className="group bg-white border border-[#E8ECF0] rounded-2xl p-6 hover:border-[#C7D2FE] hover:shadow-[0_8px_32px_rgba(79,70,229,0.08)] transition-all duration-300 cursor-default"
            >
              <div className={`w-[44px] h-[44px] rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-sm group-hover:scale-105 transition-transform duration-300`}>
                <f.icon className="w-5 h-5 text-white" strokeWidth={1.8} />
              </div>
              <h3 className="text-[16px] font-bold tracking-[-0.3px] mb-2">{f.title}</h3>
              <p className="text-[13.5px] text-[#64748B] leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   HOW IT WORKS
   ═══════════════════════════════════════════ */

function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Add your deadlines',
      description: 'Input your assignments, exams, and deadlines — or upload your timetable and let AI do it for you.',
      icon: FileText,
    },
    {
      number: '02',
      title: 'Get your plan',
      description: 'Trackit analyses your workload, priorities, and free time to build a personalised daily study schedule.',
      icon: Calendar,
    },
    {
      number: '03',
      title: 'Stay on track',
      description: 'Get smart reminders, AI advice when you\'re stuck, and real-time analytics to keep you ahead of every deadline.',
      icon: Bell,
    },
  ];

  return (
    <section id="how-it-works" className="py-[80px] md:py-[100px] bg-[#F8FAFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-[#E8ECF0] rounded-full px-4 py-1.5 mb-4 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-[12px] font-semibold text-[#4F46E5]">How It Works</span>
          </div>
          <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.5px] mb-4">
            From chaos to clarity in{' '}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">3 steps</span>
          </h2>
          <p className="text-[16px] text-[#64748B] max-w-[460px] mx-auto font-light">
            Set up in under 2 minutes. No learning curve.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 relative">
          {/* Connection lines (desktop only) */}
          <div className="hidden md:block absolute top-[60px] left-[33%] right-[33%] h-[2px]">
            <div className="w-full h-full bg-gradient-to-r from-[#C7D2FE] via-[#4F46E5]/30 to-[#C7D2FE] rounded-full" />
          </div>

          {steps.map((s, i) => (
            <div key={i} className="relative text-center">
              <div className="inline-flex items-center justify-center w-[72px] h-[72px] rounded-2xl bg-white border border-[#E8ECF0] shadow-sm mb-5 relative z-10">
                <s.icon className="w-7 h-7 text-[#4F46E5]" strokeWidth={1.6} />
              </div>
              <div className="text-[11px] font-bold text-[#4F46E5] tracking-[0.1em] uppercase mb-2">{s.number}</div>
              <h3 className="text-[18px] font-bold tracking-[-0.3px] mb-2">{s.title}</h3>
              <p className="text-[13.5px] text-[#64748B] leading-relaxed max-w-[300px] mx-auto">{s.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   AI SECTION — Highlight feature
   ═══════════════════════════════════════════ */

function AISection({ onTry }) {
  return (
    <section id="ai" className="py-[80px] md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="relative bg-gradient-to-br from-[#19191D] to-[#2d2d3d] rounded-[24px] overflow-hidden p-8 md:p-14">
          {/* Background effects */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(circle,rgba(79,70,229,0.15)_0%,transparent_70%)] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[radial-gradient(circle,rgba(124,58,237,0.1)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 mb-5 border border-white/10">
                <Brain className="w-3.5 h-3.5 text-[#A78BFA]" />
                <span className="text-[12px] font-semibold text-[#C4B5FD]">AI-Powered</span>
              </div>
              <h2 className="text-[30px] md:text-[38px] font-bold text-white tracking-[-1px] leading-[1.1] mb-4">
                Your personal study assistant that{' '}
                <span className="bg-gradient-to-r from-[#A78BFA] to-[#818CF8] bg-clip-text text-transparent">
                  knows your workload
                </span>
              </h2>
              <p className="text-[15px] text-[#94A3B8] leading-relaxed mb-7">
                Ask anything about your schedule, get advice on stuck tasks, or let it prioritise your week. It sees all your deadlines, exams, and progress in real time.
              </p>
              <button
                onClick={onTry}
                className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-6 py-3 rounded-xl text-[14px] font-semibold border-none cursor-pointer transition-all shadow-lg"
              >
                Try AI Chat
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Chat mock */}
            <div className="bg-[#0F111A] rounded-2xl border border-white/10 p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/5">
                <div className="w-6 h-6 rounded-full bg-[#4F46E5] flex items-center justify-center">
                  <MessageSquare className="w-3 h-3 text-white" />
                </div>
                <span className="text-[13px] font-semibold text-white">AI Study Assistant</span>
                <div className="ml-auto flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
                  <span className="text-[10px] text-[#5B6682]">Online</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-end">
                  <div className="bg-[#4F46E5] text-white text-[12.5px] px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] leading-relaxed">
                    What should I focus on today? I'm feeling overwhelmed.
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#1A1D2E] text-[#C4D0E6] text-[12.5px] px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[85%] leading-relaxed border border-white/5">
                    I'd prioritise your <strong className="text-white">Linear Algebra Problem Set</strong> — it's due tomorrow and worth 15% of your grade. After that, spend 1 hour on your Data Structures assignment. You've got this!
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-[#4F46E5] text-white text-[12.5px] px-4 py-2.5 rounded-2xl rounded-br-md max-w-[85%] leading-relaxed">
                    I'm stuck on the eigenvalue proofs. Any tips?
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-[#1A1D2E] text-[#C4D0E6] text-[12.5px] px-4 py-2.5 rounded-2xl rounded-bl-md max-w-[85%] leading-relaxed border border-white/5">
                    Break it into subtasks: 1) Review the theorem definitions, 2) Work through the 2×2 examples first, 3) Then generalise. Want me to add these as subtasks?
                  </div>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 bg-[#161929] rounded-xl px-4 py-2.5 border border-white/5">
                <span className="text-[12.5px] text-[#5B6682] flex-1">Ask about your tasks, exams, or schedule...</span>
                <div className="w-7 h-7 rounded-lg bg-[#4F46E5] flex items-center justify-center">
                  <ArrowRight className="w-3.5 h-3.5 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════ */

function Stats() {
  const stats = [
    { value: '10K+', label: 'Tasks Tracked', icon: CheckSquare },
    { value: '95%', label: 'On-Time Completion', icon: Clock },
    { value: '2min', label: 'Setup Time', icon: Zap },
    { value: '4.9★', label: 'Student Rating', icon: Star },
  ];

  return (
    <section className="py-[60px] border-y border-[#F1F5F9] bg-[#FAFBFC]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <s.icon className="w-5 h-5 text-[#4F46E5] mx-auto mb-3" strokeWidth={1.6} />
              <div className="text-[32px] md:text-[38px] font-bold tracking-[-1px] bg-gradient-to-b from-[#19191D] to-[#475569] bg-clip-text text-transparent">{s.value}</div>
              <div className="text-[13px] text-[#94A3B8] font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   TESTIMONIALS
   ═══════════════════════════════════════════ */

function Testimonials() {
  const reviews = [
    {
      quote: "Trackit completely changed how I manage my coursework. The AI chat is like having a personal tutor who knows exactly what I need to do next.",
      name: 'Sarah K.',
      role: 'Computer Science, Year 3',
      avatar: 'SK',
    },
    {
      quote: "The timetable upload feature is genius. I just photographed my schedule and everything was imported in seconds. No more manual entry.",
      name: 'James M.',
      role: 'Engineering, Year 2',
      avatar: 'JM',
    },
    {
      quote: "I went from missing 3-4 deadlines a semester to zero. The focus plan tells me exactly what to study and when. Absolute game changer.",
      name: 'Priya T.',
      role: 'Medicine, Year 4',
      avatar: 'PT',
    },
  ];

  return (
    <section className="py-[80px] md:py-[100px]">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#EEF2FF] rounded-full px-4 py-1.5 mb-4">
            <Star className="w-3.5 h-3.5 text-[#4F46E5]" />
            <span className="text-[12px] font-semibold text-[#4F46E5]">Testimonials</span>
          </div>
          <h2 className="text-[32px] md:text-[42px] font-bold tracking-[-1.5px] mb-4">
            Loved by students{' '}
            <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">everywhere</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {reviews.map((r, i) => (
            <div key={i} className="bg-white border border-[#E8ECF0] rounded-2xl p-6 hover:shadow-[0_8px_32px_rgba(15,23,42,0.06)] transition-all duration-300">
              {/* Stars */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                ))}
              </div>
              <p className="text-[14px] text-[#334155] leading-relaxed mb-5 italic">"{r.quote}"</p>
              <div className="flex items-center gap-3 pt-4 border-t border-[#F1F5F9]">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#4F46E5] to-[#7C3AED] flex items-center justify-center text-[11px] font-bold text-white">
                  {r.avatar}
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#19191D]">{r.name}</div>
                  <div className="text-[11.5px] text-[#94A3B8]">{r.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FINAL CTA
   ═══════════════════════════════════════════ */

function FinalCTA({ onGetStarted }) {
  return (
    <section className="py-[80px] md:py-[100px] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#EEF2FF] via-[#F5F3FF] to-[#EEF2FF]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle,rgba(79,70,229,0.08)_0%,transparent_70%)] pointer-events-none" />

      <div className="relative max-w-[600px] mx-auto px-6 text-center">
        <h2 className="text-[32px] md:text-[46px] font-bold tracking-[-1.5px] leading-[1.1] mb-5">
          <span className="bg-gradient-to-b from-[#19191D] to-[#3d3d4a] bg-clip-text text-transparent">
            Stop stressing about deadlines.{' '}
          </span>
          <span className="bg-gradient-to-r from-[#4F46E5] to-[#7C3AED] bg-clip-text text-transparent">
            Start tracking them.
          </span>
        </h2>
        <p className="text-[16px] text-[#64748B] mb-8 font-light leading-relaxed">
          Join thousands of students who use Trackit to stay organised, study smarter, and never miss a deadline again. Free forever.
        </p>
        <button
          onClick={onGetStarted}
          className="inline-flex items-center gap-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white px-8 py-4 rounded-xl text-[16px] font-semibold border-none cursor-pointer transition-all shadow-[0_4px_16px_rgba(79,70,229,0.3)] hover:shadow-[0_6px_24px_rgba(79,70,229,0.4)] hover:-translate-y-[1px]"
        >
          Get Started — It's Free
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-[12px] text-[#94A3B8] mt-4">No credit card required · Set up in 2 minutes</p>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="bg-[#19191D] text-white py-12">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-[#4F46E5] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 fill-white"><path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z"/></svg>
              </div>
              <span className="text-[15px] font-bold">Trackit</span>
            </div>
            <p className="text-[12.5px] text-[#64748B] leading-relaxed max-w-[200px]">
              The AI-powered deadline tracker built for students.
            </p>
          </div>

          {/* Links */}
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] mb-3">Product</div>
            <div className="space-y-2">
              {['Features', 'AI Chat', 'Focus Plan', 'Analytics'].map(l => (
                <a key={l} href="#features" className="block text-[13px] text-[#94A3B8] hover:text-white transition-colors no-underline">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] mb-3">Resources</div>
            <div className="space-y-2">
              {['How It Works', 'Student Guide', 'FAQ', 'Blog'].map(l => (
                <a key={l} href="#how-it-works" className="block text-[13px] text-[#94A3B8] hover:text-white transition-colors no-underline">{l}</a>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[#64748B] mb-3">Legal</div>
            <div className="space-y-2">
              {['Privacy Policy', 'Terms of Service', 'Contact Us'].map(l => (
                <a key={l} href="#" className="block text-[13px] text-[#94A3B8] hover:text-white transition-colors no-underline">{l}</a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span className="text-[11.5px] text-[#64748B]">All systems operational</span>
          </div>
          <div className="text-[11.5px] text-[#64748B]">
            &copy; {new Date().getFullYear()} Trackit. Built with purpose for students.
          </div>
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-[#64748B]" />
            <span className="text-[11.5px] text-[#64748B]">Secured by Supabase</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
