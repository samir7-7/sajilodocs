import React from "react";
import { ShieldCheck, Globe, Lock, CheckCircle2 } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-[#0F172A] flex overflow-hidden font-sans">
      {/* Left Side - Premium Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 overflow-hidden">
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Logo */}
        <div className="flex items-center gap-3 z-10">
          <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={28} />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">SajiloDocs</span>
        </div>

        {/* Hero Section */}
        <div className="z-10 max-w-lg">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Enterprise Grade Security
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-8 leading-[1.1] tracking-tight">
            Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Document Workflow</span>
          </h1>

          <div className="space-y-8">
            {[
              { icon: ShieldCheck, title: "Intelligent OCR", desc: "Military-grade extraction from any file format." },
              { icon: Globe, title: "Global Accessibility", desc: "Cloud-native synchronization across all devices." },
              { icon: Lock, title: "Zero-Knowledge Security", desc: "Your data is encrypted before it ever leaves your device." },
            ].map((item, i) => (
              <div key={i} className="group flex items-start gap-5 transition-all duration-300 hover:translate-x-2">
                <div className="p-3 bg-white/5 border border-white/10 rounded-2xl text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                  <item.icon size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-lg mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="z-10 flex items-center gap-8 text-white/40">
           <div className="flex -space-x-3">
             {[1,2,3,4].map(i => (
               <div key={i} className="h-10 w-10 rounded-full border-2 border-[#0F172A] bg-slate-800 flex items-center justify-center overflow-hidden">
                 <img src={`https://i.pravatar.cc/100?img=${i+10}`} alt="user" />
               </div>
             ))}
             <div className="h-10 w-10 rounded-full border-2 border-[#0F172A] bg-blue-600 flex items-center justify-center text-[10px] font-bold text-white">+2k</div>
           </div>
           <p className="text-xs font-medium">Trusted by <span className="text-white">50,000+</span> professionals worldwide</p>
        </div>
      </div>

      {/* Right Side - Premium Card Form */}
      <div className="flex-1 flex flex-col justify-center items-center py-12 px-6 bg-[#0F172A] relative">
        {/* Mobile Logo Only */}
        <div className="lg:hidden absolute top-8 flex items-center gap-2">
          <ShieldCheck className="text-blue-500" size={32} />
          <span className="text-2xl font-bold text-white">SajiloDocs</span>
        </div>

        <div className="w-full max-w-[440px] z-10">
          <div className="bg-white/5 border border-white/10 p-10 rounded-[32px] backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Subtle card glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="relative mb-10">
              <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
              <p className="mt-3 text-slate-400 leading-relaxed font-medium">{subtitle}</p>
            </div>
            
            {children}
          </div>
          
          {/* Footer links */}
          <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
              &copy; 2026 SajiloDocs. All privacy & legal policies apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
