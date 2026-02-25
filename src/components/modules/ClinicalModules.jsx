import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Users, Leaf, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import Button from '../common/Button';

const ClinicalModules = () => {
  const modules = [
    {
      id: 'cbt',
      title: 'Cognitive Behavioral Therapy',
      path: '/modules/cbt',
      icon: Brain,
      color: 'bg-blue-50 text-blue-700',
      description: 'Identify and challenge negative thought spirals to reframe your mindset.',
      tools: ['Thought Record', 'Cognitive Restructuring', 'Behavioral Activation']
    },
    {
      id: 'dbt',
      title: 'Dialectical Behavior Therapy',
      path: '/modules/dbt',
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      description: 'Build resilience, manage intense emotions, and improve relationships.',
      tools: ['TIPP Skills', 'Radical Acceptance', 'Mindfulness Square']
    },
    {
      id: 'act',
      title: 'Acceptance & Commitment',
      path: '/modules/act',
      icon: Leaf,
      color: 'bg-emerald-50 text-emerald-700',
      description: 'Accept what is out of your personal control and commit to action.',
      tools: ['Values Clarification', 'Cognitive Defusion', 'The Observing Self']
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }} 
      className="grid md:grid-cols-3 gap-8"
    >
      {modules.map((module) => (
        <Card 
          key={module.id} 
          className="relative flex flex-col h-full transition-all border-none shadow-md bg-white/90 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1"
        >
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${module.color}`}>
            <module.icon className="w-7 h-7" />
          </div>
          <h3 className="text-2xl font-serif text-stone-900 mb-3 font-medium">{module.title}</h3>
          <p className="text-stone-600 mb-6 leading-relaxed text-base flex-grow">{module.description}</p>
          
          <div className="mb-6 space-y-2">
            {module.tools.map(tool => (
              <div key={tool} className="text-xs text-stone-500 flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-stone-300" /> {tool}
              </div>
            ))}
          </div>

          <Link to={module.path} className="mt-auto">
            <Button variant="sage" className="w-full py-3 font-bold tracking-wide flex items-center justify-center gap-2 group">
              Enter Workshop
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </Card>
      ))}
    </motion.div>
  );
};

export default ClinicalModules;