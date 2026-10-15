import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, ArrowRight, ArrowLeft, CheckSquare, GraduationCap, MessageSquare, Upload, Target, BarChart2 } from 'lucide-react';

const TOUR_KEY = 'trackit_onboarding_done';

const steps = [
  {
    title: 'Welcome to Trackit!',
    description: 'Your personal student deadline tracker. Let us give you a quick tour of the key features.',
    icon: '🚀',
    path: '/',
  },
  {
    title: 'Track Your Tasks',
    description: 'Add assignments and coursework with due dates, effort estimates, and grade weights. Break them into subtasks for better progress tracking.',
    Icon: CheckSquare,
    path: '/tasks',
  },
  {
    title: 'Exam Countdown',
    description: 'Keep tabs on upcoming exams with confidence levels, preparation tracking, and revision subtasks.',
    Icon: GraduationCap,
    path: '/exams',
  },
  {
    title: 'Upload Your Timetable',
    description: 'Upload your class schedule or exam timetable as a PDF or image. Our AI will parse it and import everything automatically.',
    Icon: Upload,
    path: '/upload',
  },
  {
    title: 'AI Study Assistant',
    description: 'Chat with an AI that knows your tasks and deadlines. Get personalised study advice, help with stuck tasks, and priority recommendations.',
    Icon: MessageSquare,
    path: '/chat',
  },
  {
    title: 'Focus Plan',
    description: 'Get a daily study schedule based on your deadlines and class timetable. Tasks are automatically assigned to your free time windows.',
    Icon: Target,
    path: '/focus',
  },
  {
    title: 'Analytics',
    description: 'Track your productivity with completion trends, workload distribution, and grade weight analysis.',
    Icon: BarChart2,
    path: '/analytics',
  },
  {
    title: "You're all set!",
    description: "Start by adding your first task or uploading your timetable. You can always access Settings to customise notifications and your profile.",
    icon: '🎉',
    path: '/',
  },
];

export default function OnboardingTour() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Start the tour the first time the user reaches the dashboard.
    const done = localStorage.getItem(TOUR_KEY);
    if (!done && location.pathname === '/') {
      // Small delay so dashboard loads first
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  if (!show) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;
  const isFirst = step === 0;

  function next() {
    if (isLast) {
      finish();
      return;
    }
    const nextStep = step + 1;
    setStep(nextStep);
    if (steps[nextStep].path !== location.pathname) {
      navigate(steps[nextStep].path);
    }
  }

  function prev() {
    if (isFirst) return;
    const prevStep = step - 1;
    setStep(prevStep);
    if (steps[prevStep].path !== location.pathname) {
      navigate(steps[prevStep].path);
    }
  }

  function finish() {
    localStorage.setItem(TOUR_KEY, 'true');
    setShow(false);
    navigate('/');
  }

  function skip() {
    localStorage.setItem(TOUR_KEY, 'true');
    setShow(false);
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-[100] animate-[fadeIn_0.3s_ease]" />

      {/* Tour Card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div className="bg-white rounded-r shadow-md max-w-[420px] w-full animate-[scaleIn_0.25s_ease] overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-bg">
            <div
              className="h-full bg-primary transition-[width] duration-300 rounded-full"
              style={{ width: `${((step + 1) / steps.length) * 100}%` }}
            />
          </div>

          <div className="p-6 pb-5">
            {/* Step indicator */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-semibold text-text-3 tracking-[0.05em] uppercase">
                Step {step + 1} of {steps.length}
              </span>
              <button
                onClick={skip}
                className="text-text-3 hover:text-text-1 bg-transparent border-none cursor-pointer p-1 -mr-1 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Icon */}
            <div className="mb-4">
              {current.icon ? (
                <div className="text-[40px]">{current.icon}</div>
              ) : (
                <div className="w-[48px] h-[48px] rounded-[14px] bg-primary-light flex items-center justify-center">
                  <current.Icon className="w-6 h-6 text-primary" />
                </div>
              )}
            </div>

            {/* Content */}
            <h2 className="text-[18px] font-bold text-text-1 mb-2 tracking-[-0.2px]">{current.title}</h2>
            <p className="text-[13px] text-text-2 leading-relaxed mb-6">{current.description}</p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div>
                {!isFirst && (
                  <button
                    onClick={prev}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-[12.5px] font-semibold text-text-2 bg-transparent border border-border rounded-rs cursor-pointer hover:border-primary hover:text-primary transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                )}
                {isFirst && (
                  <button
                    onClick={skip}
                    className="text-[12.5px] font-semibold text-text-3 hover:text-text-1 bg-transparent border-none cursor-pointer transition-colors"
                  >
                    Skip tour
                  </button>
                )}
              </div>
              <button
                onClick={next}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary-hover text-white rounded-rs text-[12.5px] font-semibold border-none cursor-pointer transition-colors shadow-xs"
              >
                {isLast ? 'Get Started' : 'Next'}
                {!isLast && <ArrowRight className="w-3.5 h-3.5" />}
              </button>
            </div>

            {/* Dot indicators */}
            <div className="flex justify-center gap-1.5 mt-5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                    i === step ? 'bg-primary w-4' : i < step ? 'bg-primary-mid' : 'bg-border'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
