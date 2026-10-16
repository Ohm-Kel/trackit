import { useState, useEffect } from 'react';
import { 
  BarChart2, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  Activity,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTasks } from '../hooks/useTasks';
import { apiJson } from '../api/http';

export default function Analytics() {
  const { session } = useAuth();
  const { data: tasks = [] } = useTasks();
  const [velocity, setVelocity] = useState([]);
  const [burnout, setBurnout] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (!session?.access_token) return;
        
        const [vel, burn] = await Promise.all([
          apiJson('/analytics/velocity'),
          apiJson('/analytics/burnout'),
        ]);
        setVelocity(vel);
        setBurnout(burn);
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [session]);

  const completedCount = tasks.filter(t => t.status === 'done').length;
  const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[28px] font-extrabold text-[#0F172A] tracking-tight mb-2">Advanced Analytics</h1>
        <p className="text-[#64748B] text-[15px] font-medium">Deep insights into your academic performance and study patterns</p>
      </div>

      {/* Primary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard 
          icon={TrendingUp} 
          title="Completion Rate" 
          value={`${completionRate}%`} 
          description={`${completedCount} tasks mastered`}
          color="primary"
        />
        <StatCard 
          icon={Activity} 
          title="Study Velocity" 
          value={velocity.at(-1)?.tasks || 0} 
          description="Tasks cleared this week"
          color="blue"
        />
        <StatCard 
          icon={AlertTriangle} 
          title="Burnout Risk" 
          value={burnout.length > 0 ? 'High' : 'Low'} 
          description={burnout.length > 0 ? `${burnout.length} danger zones detected` : 'Workload is balanced'}
          color={burnout.length > 0 ? 'red' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Study Velocity Chart (Simplified Visual) */}
        <ContentCard icon={BarChart2} title="Mastery Velocity" subtitle="Recent task completion output">
          <div className="h-64 flex items-end justify-between gap-4 mt-8 px-4">
            {velocity.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group">
                <div className="w-full relative">
                   <div 
                    className="w-full bg-primary/20 hover:bg-primary/40 transition-all rounded-t-lg relative group-hover:block"
                    style={{ height: `${(v.tasks / (Math.max(...velocity.map(v=>v.tasks)) || 1)) * 160}px` }}
                   >
                     <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#0F172A] text-white text-[10px] font-bold px-2 py-1 rounded hidden group-hover:block shrink-0 whitespace-nowrap">
                        {v.tasks} tasks
                     </div>
                   </div>
                </div>
                <div className="text-[10px] text-text-3 font-bold mt-3 transform -rotate-45 md:rotate-0 text-center uppercase tracking-wider">
                  {v.name.replace('Week of ', '')}
                </div>
              </div>
            ))}
          </div>
        </ContentCard>

        {/* Burnout Analysis */}
        <ContentCard icon={AlertTriangle} title="Burnout Zones" subtitle="Overlapping high-pressure deadlines">
          <div className="space-y-4 mt-6">
            {burnout.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-green-50/50 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                <p className="text-[14px] font-bold text-green-800">No Danger Zones Detected</p>
                <p className="text-[12px] text-green-600 mt-1">Your current schedule allows for plenty of focused deep work.</p>
              </div>
            ) : (
              burnout.map((zone, i) => (
                <div key={i} className="p-4 bg-red-50/50 border border-red-100 rounded-2xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[13px] font-bold text-red-900 leading-none">
                        Critical Cluster: {new Date(zone.start_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </h3>
                      <p className="text-[11px] text-red-700 mt-2 font-medium">3+ items due within 48 hours</p>
                    </div>
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">{zone.task_count} Tasks</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {zone.tasks.map((t, ti) => (
                      <span key={ti} className="text-[10px] font-semibold bg-white border border-red-200 text-red-800 px-2 py-1 rounded-lg">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </ContentCard>
      </div>
      
      {/* Smart Recommendations Section */}
      <div className="mt-8 p-6 bg-[#0F172A] rounded-[32px] text-white relative overflow-hidden group">
        <Sparkles className="absolute top-[-20px] right-[-20px] w-48 h-48 text-white/5 group-hover:scale-110 transition-transform duration-700" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-xl font-bold mb-1">AI Recommendation</h2>
            <p className="text-white/70 text-[14px]">
              {burnout.length > 0 
                ? "Your workload is peaking. We recommend postponing non-critical tasks and using the 'Focus Plan' to tackle one priority at a time."
                : "You're in a great flow state! This is the perfect time to start researching your future assignments to stay ahead of the curve."}
            </p>
          </div>
          <button className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-rs font-bold text-[14px] transition-all border-none cursor-pointer flex items-center gap-2">
            View Focus Plan <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, description, color }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
  };

  return (
    <div className="bg-white p-6 rounded-[24px] border border-border/50 shadow-sm hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-2xl ${colors[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <h2 className="text-[13px] font-bold text-text-3 uppercase tracking-wider mb-1">{title}</h2>
      <div className="text-[28px] font-extrabold text-[#0F172A] leading-tight mb-2">{value}</div>
      <p className="text-[13px] text-text-3 font-medium">{description}</p>
    </div>
  );
}

function ContentCard({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="bg-white p-6 rounded-[32px] border border-border/50 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-bg rounded-xl">
          <Icon className="w-5 h-5 text-text-2" />
        </div>
        <div>
          <h2 className="text-[16px] font-extrabold text-[#0F172A]">{title}</h2>
          <p className="text-[12px] text-text-3 font-medium">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
