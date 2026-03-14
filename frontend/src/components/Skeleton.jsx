/**
 * Reusable skeleton/shimmer loading placeholders.
 */

function Shimmer({ className = '' }) {
  return (
    <div className={`bg-bg rounded-rs animate-[pulse-soft_1.5s_ease-in-out_infinite] ${className}`} />
  );
}

export function TasksSkeleton() {
  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <Shimmer className="h-6 w-[140px] mb-2" />
          <Shimmer className="h-4 w-[200px]" />
        </div>
        <Shimmer className="h-9 w-[100px] rounded-rs" />
      </div>
      <div className="px-4 md:px-8 pb-9">
        <div className="flex items-center gap-2.5 mb-4.5">
          <Shimmer className="h-9 flex-1 min-w-[180px]" />
          <div className="flex gap-1.5">
            {[...Array(5)].map((_, i) => <Shimmer key={i} className="h-8 w-[72px] rounded-[20px]" />)}
          </div>
        </div>
        <div className="bg-white border border-border rounded-r shadow-xs overflow-hidden">
          <div className="py-2.5 px-4 bg-bg border-b border-border">
            <Shimmer className="h-3 w-full max-w-[400px]" />
          </div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center gap-3 py-3.5 px-4 border-b border-border">
              <Shimmer className="w-[17px] h-[17px] rounded-full shrink-0" />
              <div className="flex-1 min-w-0">
                <Shimmer className="h-4 w-[60%] mb-1.5" />
                <Shimmer className="h-3 w-[30%]" />
              </div>
              <Shimmer className="hidden md:block h-5 w-[70px] rounded-full" />
              <Shimmer className="hidden md:block h-4 w-[50px]" />
              <Shimmer className="hidden md:block h-5 w-[65px] rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ExamsSkeleton() {
  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <Shimmer className="h-6 w-[160px] mb-2" />
          <Shimmer className="h-4 w-[180px]" />
        </div>
        <Shimmer className="h-9 w-[100px] rounded-rs" />
      </div>
      <div className="px-4 md:px-8 pb-9">
        <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-r p-5 shadow-xs">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <Shimmer className="h-5 w-[160px] mb-2" />
                  <Shimmer className="h-3 w-[120px]" />
                </div>
                <div className="text-right">
                  <Shimmer className="h-8 w-[40px] mb-1" />
                  <Shimmer className="h-3 w-[50px]" />
                </div>
              </div>
              <Shimmer className="h-[5px] w-full rounded-[3px] my-3" />
              <div className="flex justify-between mb-3.5">
                <Shimmer className="h-3 w-[80px]" />
                <Shimmer className="h-3 w-[50px]" />
              </div>
              <Shimmer className="h-px w-full mb-3.5" />
              <div className="flex gap-1.5 mb-4">
                {[...Array(3)].map((_, j) => <Shimmer key={j} className="h-5 w-[60px] rounded-[12px]" />)}
              </div>
              <div className="flex gap-2 pt-4 border-t border-border">
                <Shimmer className="flex-1 h-8 rounded-rs" />
                <Shimmer className="flex-1 h-8 rounded-rs" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-full animate-[fadeIn_0.2s_ease]">
      <div className="pt-5 md:pt-7 px-4 md:px-8 pb-0 flex items-center justify-between mb-4 md:mb-6">
        <div>
          <Shimmer className="h-6 w-[220px] mb-2" />
          <Shimmer className="h-4 w-[180px]" />
        </div>
        <Shimmer className="h-9 w-[100px] rounded-rs" />
      </div>
      <div className="px-4 md:px-8 pb-9">
        <div className="grid grid-cols-3 gap-3 md:gap-3.5 mb-5">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-border rounded-r p-3 md:p-[18px] shadow-xs flex items-center gap-3">
              <Shimmer className="w-[38px] h-[38px] rounded-[10px] shrink-0" />
              <div>
                <Shimmer className="h-7 w-[40px] mb-1" />
                <Shimmer className="h-3 w-[70px]" />
              </div>
            </div>
          ))}
        </div>
        <Shimmer className="h-[120px] w-full rounded-r mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-[1fr_290px] gap-5">
          <div className="bg-white border border-border rounded-r shadow-xs p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className={`flex items-center gap-3 py-3 ${i < 2 ? 'border-b border-border' : ''}`}>
                <Shimmer className="w-4 h-4 rounded-full shrink-0" />
                <div className="flex-1">
                  <Shimmer className="h-4 w-[70%] mb-1" />
                  <Shimmer className="h-3 w-[40%]" />
                </div>
                <Shimmer className="h-5 w-[60px] rounded-full" />
              </div>
            ))}
          </div>
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-r p-4 shadow-xs">
                <Shimmer className="h-4 w-[70%] mb-2" />
                <Shimmer className="h-3 w-[50%] mb-3" />
                <Shimmer className="h-1 w-full rounded mb-2" />
                <Shimmer className="h-3 w-[60%]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
