import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Leaf, ArrowRight, Activity, Brain, Heart, Sparkles, 
  Shield, Compass, LayoutDashboard, MessageSquare, BookOpen, Quote, Sun
} from 'lucide-react';
import { useNavigate } from 'react-router-dom'; 
import Button from '../components/common/Button';

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const buttonInteraction = {
  hover: { scale: 1.03, y: -2, transition: { type: "spring", stiffness: 400, damping: 10 } },
  tap: { scale: 0.97 }
};

// --- MINDFULNESS QUOTES ---
const dailyQuotes = [
  "Peace comes from within. Do not seek it without.",
  "You don't have to control your thoughts. You just have to stop letting them control you.",
  "Every moment is a fresh beginning.",
  "Breath is the bridge which connects life to consciousness.",
  "There is a crack in everything, that's how the light gets in."
];

const Home = ({ session }) => {
  const navigate = useNavigate(); 
  const [quote, setQuote] = useState('');
  const [greeting, setGreeting] = useState('');

  // Setup dynamic greeting and quote on load
  useEffect(() => {
    setQuote(dailyQuotes[Math.floor(Math.random() * dailyQuotes.length)]);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // ==========================================
  // VIEW 1: PREMIUM LOGGED-IN SANCTUARY (BENTO GRID)
  // ==========================================
  if (session) {
    const userName = session.user?.user_metadata?.full_name?.split(' ')[0] || 'there';

    return (
      <div className="bg-stone-50 dark:bg-zinc-950 min-h-screen pt-8 pb-24 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
        <motion.div 
          variants={staggerContainer} 
          initial="hidden" 
          animate="visible" 
          className="max-w-6xl mx-auto space-y-6"
        >
          {/* HERO BANNER - Spans full width */}
          <motion.div variants={fadeUp} className="relative overflow-hidden rounded-[2.5rem] bg-emerald-900 dark:bg-emerald-950 p-8 md:p-12 shadow-xl shadow-emerald-900/10 text-emerald-50">
            <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
              <Leaf className="w-64 h-64 transform rotate-12" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-800/50 border border-emerald-700 text-emerald-200 text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-md">
                <Sun className="w-4 h-4" /> {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
              
              <h1 className="font-serif text-5xl md:text-6xl mb-4 tracking-tight leading-tight">
                {greeting}, <br/><span className="text-emerald-300 italic">{userName}.</span>
              </h1>
              
              <div className="flex items-start gap-3 mt-8 text-emerald-200/80 italic font-serif text-xl">
                <Quote className="w-6 h-6 shrink-0 text-emerald-500/50 fill-current opacity-50 rotate-180" />
                <p>"{quote}"</p>
              </div>
            </div>
          </motion.div>

          {/* BENTO GRID ROW 1 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* PRIMARY ACTION: AI CHAT (Spans 8 cols) */}
            <motion.div 
              variants={fadeUp} whileHover={{ y: -5 }} onClick={() => navigate('/chat')}
              className="md:col-span-8 relative overflow-hidden rounded-[2.5rem] p-8 md:p-10 cursor-pointer group border border-teal-100 dark:border-teal-900/30 bg-gradient-to-br from-white to-teal-50 dark:from-zinc-900 dark:to-teal-950/20 shadow-sm hover:shadow-xl transition-all"
            >
              <div className="absolute top-8 right-8 w-16 h-16 bg-teal-100 dark:bg-teal-900/50 text-teal-600 dark:text-teal-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <MessageSquare className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-serif text-stone-900 dark:text-zinc-100 mb-3 group-hover:text-teal-700 dark:group-hover:text-teal-300 transition-colors">SoulSpark AI Session</h2>
              <p className="text-stone-500 dark:text-zinc-400 max-w-sm mb-8 text-lg">Your private, empathetic companion is ready to listen. Start a conversation or review past insights.</p>
              <div className="inline-flex items-center gap-2 font-bold text-sm tracking-widest text-teal-700 dark:text-teal-400 uppercase">
                Begin Session <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </div>
            </motion.div>

            {/* SECONDARY ACTION: JOURNAL (Spans 4 cols) */}
            <motion.div 
              variants={fadeUp} whileHover={{ y: -5 }} onClick={() => navigate('/journal')}
              className="md:col-span-4 rounded-[2.5rem] p-8 md:p-10 cursor-pointer group border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-xl flex items-center justify-center mb-6 group-hover:rotate-6 transition-transform">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-serif text-stone-900 dark:text-zinc-100 mb-2">Private Journal</h3>
                <p className="text-stone-500 dark:text-zinc-400 text-sm">Capture your thoughts and untangle your mind.</p>
              </div>
              <div className="mt-8 flex justify-end">
                <div className="w-10 h-10 rounded-full bg-stone-100 dark:bg-zinc-800 flex items-center justify-center text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400 group-hover:bg-amber-50 dark:group-hover:bg-amber-900/30 transition-colors">
                  <ArrowRight className="w-5 h-5 -rotate-45" />
                </div>
              </div>
            </motion.div>
          </div>

          {/* BENTO GRID ROW 2 */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* WELLNESS DASHBOARD (Spans 4 cols) */}
            <motion.div 
              variants={fadeUp} whileHover={{ y: -5 }} onClick={() => navigate('/dashboard')}
              className="md:col-span-4 rounded-[2.5rem] p-8 cursor-pointer group border border-indigo-100 dark:border-indigo-900/30 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center justify-center"
            >
              <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-serif text-stone-900 dark:text-zinc-100 mb-2">My Wellness</h3>
              <p className="text-stone-500 dark:text-zinc-400 text-sm">Track mood, hydration, and analyze your growth.</p>
            </motion.div>

            {/* CLINICAL PATHWAYS (Spans 8 cols) */}
            <motion.div 
              variants={fadeUp} 
              className="md:col-span-8 rounded-[2.5rem] p-8 border border-stone-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
            >
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h3 className="text-xl font-serif text-stone-900 dark:text-zinc-100">Therapeutic Pathways</h3>
                  <p className="text-stone-500 dark:text-zinc-400 text-sm">Pick up where you left off.</p>
                </div>
                <button onClick={() => navigate('/modules')} className="text-sm font-bold text-emerald-600 dark:text-emerald-500 hover:underline">View All</button>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                {[
                  { name: 'CBT', desc: 'Reframing', icon: Brain, bg: 'bg-blue-50 dark:bg-blue-900/20', color: 'text-blue-600 dark:text-blue-400', route: '/modules/cbt' },
                  { name: 'DBT', desc: 'Acceptance', icon: Compass, bg: 'bg-purple-50 dark:bg-purple-900/20', color: 'text-purple-600 dark:text-purple-400', route: '/modules/dbt' },
                  { name: 'ACT', desc: 'Commitment', icon: Leaf, bg: 'bg-green-50 dark:bg-green-900/20', color: 'text-green-600 dark:text-green-400', route: '/modules/act' },
                ].map((mod) => (
                  <div key={mod.name} onClick={() => navigate(mod.route)} className="p-4 rounded-2xl border border-stone-100 dark:border-zinc-800 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-md cursor-pointer transition-all group flex flex-col items-center text-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${mod.bg} ${mod.color}`}>
                      <mod.icon className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-stone-800 dark:text-zinc-200 mb-1">{mod.name}</span>
                    <span className="text-xs text-stone-500 dark:text-zinc-500">{mod.desc}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

        </motion.div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: LOGGED-OUT MARKETING PAGE
  // ==========================================
  return (
    <div className="bg-stone-50 dark:bg-zinc-950 selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-300">
      
      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-24 pb-36">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80" 
            alt="Morning light sanctuary"
            className="w-full h-full object-cover opacity-[0.25] dark:opacity-10" 
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-50/50 via-transparent to-stone-50 dark:from-zinc-950/80 dark:via-zinc-950/50 dark:to-zinc-950" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-stone-200 dark:border-zinc-800 shadow-sm mb-10">
            <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span className="text-sm font-medium text-stone-600 dark:text-zinc-300 tracking-wide">A sanctuary for your mind</span>
          </motion.div>
          
          <motion.h1 variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} className="font-serif text-6xl md:text-8xl text-stone-900 dark:text-zinc-100 mb-8 leading-[1.1] max-w-5xl">
            Illuminate Your Path to <span className="italic text-emerald-700 dark:text-emerald-400">Inner Peace</span>
          </motion.h1>
          
          <motion.p variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }} className="text-xl md:text-2xl text-stone-600 dark:text-zinc-400 mb-12 max-w-3xl leading-relaxed">
            SoulSpark combines evidence-based therapies like CBT and DBT with compassionate AI support to help you grow, heal, and find balance.
          </motion.p>
          
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-6">
            <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap">
              <Button variant="sage" onClick={() => navigate('/auth')} className="group px-10 py-5 text-xl shadow-lg">
                Start Your Journey
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>
            
            <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap">
              <Button variant="secondary" onClick={() => navigate('/modules')} className="px-10 py-5 text-xl bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm shadow-sm dark:border-zinc-800 dark:text-zinc-200">
                Explore Our Approach
              </Button>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.5 }} className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
            {[{ label: 'Daily Check-ins', value: '10k+', icon: Activity }, { label: 'Therapeutic Tools', value: '50+', icon: Brain }, { label: 'User Rating', value: '4.9/5', icon: Heart }].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center p-8 bg-white/70 dark:bg-zinc-900/50 backdrop-blur-xl rounded-[2rem] border border-stone-100 dark:border-zinc-800 hover:bg-white/95 dark:hover:bg-zinc-900/90 transition-all shadow-sm hover:shadow-xl">
                <stat.icon className="w-7 h-7 text-stone-400 dark:text-zinc-500 mb-3" />
                <span className="text-4xl font-serif text-stone-800 dark:text-zinc-100 mb-1">{stat.value}</span>
                <span className="text-xs text-stone-500 dark:text-zinc-500 uppercase tracking-[0.2em] font-bold">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* --- WELLNESS SECTION --- */}
      <section className="relative bg-white dark:bg-zinc-950 py-28 border-y border-stone-100 dark:border-zinc-900 overflow-hidden transition-colors duration-300">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80" 
            alt="Sunlight forest"
            className="w-full h-full object-cover opacity-[0.10] dark:opacity-5" 
          />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-white dark:from-zinc-950 dark:to-zinc-950 opacity-90" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-5xl text-stone-900 dark:text-zinc-100 mb-5 tracking-tight">
              Wellness Guided by Science
            </motion.h2>
            <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }} className="text-stone-500 dark:text-zinc-400 text-lg max-w-xl mx-auto italic">
              Refined techniques for a modern world.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { id: "cbt", title: "CBT Modules", desc: "Structured exercises to help reframe thought patterns and behaviors.", icon: Sparkles, color: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
              { id: "safe-haven", title: "Safe Haven", desc: "Encrypted journaling and AI support available 24/7 for total privacy.", icon: Shield, color: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" },
              { id: "dbt", title: "DBT Skills", desc: "Master emotional regulation through guided mindfulness and distress tolerance.", icon: Compass, color: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" }
            ].map((item, idx) => (
              <motion.div 
                key={idx} 
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -12, boxShadow: "0 30px 60px -12px rgba(0,0,0,0.15)" }} 
                className="p-10 rounded-[2.5rem] border border-stone-100 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-lg text-left group transition-all"
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 transition-all shadow-sm ${item.color}`}>
                  <item.icon className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-3xl text-stone-900 dark:text-zinc-100 mb-4">{item.title}</h3>
                <p className="text-stone-600 dark:text-zinc-400 text-lg leading-relaxed mb-8">{item.desc}</p>
                <button 
                  onClick={() => navigate(`/learn/${item.id}`)}
                  className="text-sm font-bold text-stone-400 dark:text-zinc-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-2 tracking-widest cursor-pointer"
                >
                  LEARN MORE <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FINAL CTA --- */}
      <section className="relative py-40 overflow-hidden bg-stone-950">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80" 
            alt="Peaceful misty lake"
            className="w-full h-full object-cover opacity-40" 
          />
          <div className="absolute inset-0 bg-stone-950/70 backdrop-blur-[2px]" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 flex flex-col items-center text-center">
          <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="font-serif text-5xl md:text-7xl text-white mb-12 leading-[1.15]">
            Ready to reclaim your <br/><span className="italic text-emerald-300">peace of mind?</span>
          </motion.h2>
          
          <motion.div variants={buttonInteraction} whileHover="hover" whileTap="tap" initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <Button 
              variant="sage" 
              onClick={() => navigate('/auth')} 
              className="px-16 py-6 text-2xl shadow-[0_0_40px_rgba(16,185,129,0.2)] border border-emerald-500/30"
            >
              Join SoulSpark Today
            </Button>
          </motion.div>
        </div>
      </section>

    </div>
  );
};

export default Home;