import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Brain, Shield, Compass, CheckCircle, ArrowRight } from 'lucide-react';
import Button from '../components/common/Button';

const infoData = {
  'cbt': {
    title: 'Cognitive Behavioral Therapy',
    icon: Brain,
    badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    description: 'CBT is a highly effective, evidence-based psychological treatment. It operates on the principle that our thoughts, feelings, and behaviors are deeply interconnected. By identifying and reframing negative thought loops, you can actively change how you feel.',
    benefits: [
      'Identify cognitive distortions (software bugs in your brain)',
      'Challenge irrational automatic thoughts',
      'Develop balanced, reality-based perspectives',
      'Break the cycle of anxiety and depression'
    ],
    actionText: 'Enter CBT Workshop',
    actionRoute: '/modules/cbt'
  },
  'dbt': {
    title: 'Dialectical Behavior Therapy',
    icon: Compass,
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    description: 'Originally developed for intense emotional instability, DBT teaches you how to live in the moment, develop healthy ways to cope with stress, regulate your emotions, and improve your relationships with others.',
    benefits: [
      'Master T.I.P.P. crisis survival skills',
      'Practice Radical Acceptance of painful realities',
      'Build distress tolerance without making things worse',
      'Enhance interpersonal effectiveness'
    ],
    actionText: 'Enter DBT Workshop',
    actionRoute: '/modules/dbt'
  },
  'safe-haven': {
    title: 'Your Private Safe Haven',
    icon: Shield,
    badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    description: 'Your mental health journey is deeply personal. SoulSpark provides a military-grade encrypted sanctuary where you can safely log your moods, reflect in your journal, and speak with our empathetic AI without fear of judgment.',
    benefits: [
      'End-to-end encrypted personal journaling',
      '24/7 empathetic AI therapy chat',
      'Daily mood and hydration tracking',
      'HIPAA and GDPR compliant data storage'
    ],
    actionText: 'Open Your Journal',
    actionRoute: '/journal'
  }
};

const LearnMore = () => {
  const { topic } = useParams();
  const navigate = useNavigate();
  const content = infoData[topic];

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (!content) {
    return <div className="p-20 text-center text-stone-500">Topic not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 animate-fade-in">
      <button 
        onClick={() => navigate('/')} 
        className="inline-flex items-center gap-2 text-stone-500 dark:text-zinc-400 hover:text-stone-800 dark:hover:text-zinc-100 mb-12 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </button>

      <div className="bg-white dark:bg-zinc-900 rounded-[3rem] p-8 md:p-16 shadow-xl shadow-stone-200/50 dark:shadow-none border border-stone-100 dark:border-zinc-800 relative overflow-hidden">
        {/* Decorative Background Blur */}
        <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none ${content.badge.split(' ')[0]}`} />

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10">
          <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mb-8 ${content.badge}`}>
            <content.icon className="w-10 h-10" />
          </div>

          <h1 className="font-serif text-4xl md:text-6xl text-stone-900 dark:text-zinc-100 mb-6 leading-tight">
            {content.title}
          </h1>
          
          <p className="text-lg md:text-xl text-stone-600 dark:text-zinc-400 leading-relaxed mb-12">
            {content.description}
          </p>

          <h3 className="text-sm font-bold text-stone-900 dark:text-zinc-100 uppercase tracking-widest mb-6">Core Benefits</h3>
          
          <div className="grid sm:grid-cols-2 gap-4 mb-16">
            {content.benefits.map((benefit, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * idx }}
                className="flex items-start gap-3 p-4 rounded-2xl bg-stone-50 dark:bg-zinc-800/50 border border-stone-100 dark:border-zinc-800/80"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
                <span className="text-stone-700 dark:text-zinc-300 font-medium">{benefit}</span>
              </motion.div>
            ))}
          </div>

          <div className="pt-8 border-t border-stone-100 dark:border-zinc-800 flex justify-end">
            <Button onClick={() => navigate(content.actionRoute)} className="flex items-center gap-2 px-8 py-4 text-lg">
              {content.actionText} <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LearnMore;