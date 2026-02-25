import React from 'react';
import { ShieldCheck, Globe, Target } from 'lucide-react';

const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-20">
    <h1 className="font-serif text-5xl text-stone-900 mb-6 text-center">Our Mission</h1>
    <p className="text-xl text-stone-600 leading-relaxed mb-12 text-center">
      SoulSparks is an innovative digital therapy platform designed to transform mental health care 
      using AI and evidence-based frameworks[cite: 14, 15].
    </p>
    <div className="grid md:grid-cols-3 gap-8">
      <div className="text-center">
        <Globe className="mx-auto text-green-600 mb-2" />
        <h4 className="font-bold">Accessible</h4>
        <p className="text-sm text-stone-500">Available 24/7 for remote or underserved communities[cite: 18, 50].</p>
      </div>
      <div className="text-center">
        <ShieldCheck className="mx-auto text-green-600 mb-2" />
        <h4 className="font-bold">Secure</h4>
        <p className="text-sm text-stone-500">End-to-end encryption for all therapeutic dialogues[cite: 80, 203].</p>
      </div>
      <div className="text-center">
        <Target className="mx-auto text-green-600 mb-2" />
        <h4 className="font-bold">Evidence-Based</h4>
        <p className="text-sm text-stone-500">Grounded in proven CBT and DBT models[cite: 15, 179].</p>
      </div>
    </div>
  </div>
);

export default About;