import React, { useState, useEffect } from 'react';
import { ShieldAlert, ArrowRight, Phone, MessageCircle, Wind } from 'lucide-react';
import Card from '../components/common/Card';

const CrisisSupport = ({ setView }) => {
  const [breathingStep, setBreathingStep] = useState('Inhale'); 
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setBreathingStep('Inhale (4s)');
      setScale(1.5);
      setTimeout(() => {
        setBreathingStep('Hold (7s)');
        setTimeout(() => {
            setBreathingStep('Exhale (8s)');
            setScale(1);
        }, 7000);
      }, 4000);
    }, 19000); 

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-orange-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <button 
          onClick={() => setView('home')} 
          className="mb-8 flex items-center text-stone-500 hover:text-stone-800"
        >
          <ArrowRight className="rotate-180 w-4 h-4 mr-2" /> Back to Safety
        </button>

        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-l-8 border-orange-400 mb-10">
          <div className="flex items-start gap-6">
            <div className="bg-orange-100 p-4 rounded-full hidden md:block">
              <ShieldAlert className="w-8 h-8 text-orange-600" />
            </div>
            <div>
              <h1 className="font-serif text-3xl md:text-4xl text-stone-900 mb-4">You are not alone.</h1>
              <p className="text-lg text-stone-700 leading-relaxed mb-6">
                If you are in immediate danger or feeling unsafe, please connect with a human immediately. This feeling is temporary, but your safety is permanent.
              </p>
              
              <div className="flex flex-col md:flex-row gap-4">
                <a 
                    href="tel:988" 
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-center py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2"
                >
                    <Phone className="w-5 h-5" /> Call 988 (Suicide & Crisis)
                </a>
                <button className="flex-1 bg-white border-2 border-stone-200 hover:bg-stone-50 text-stone-800 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                    <MessageCircle className="w-5 h-5" /> Text "HOME" to 741741
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="flex flex-col items-center justify-center text-center py-12">
            <h3 className="font-serif text-xl text-stone-800 mb-6">Breathe with me</h3>
            <div 
                className="w-48 h-48 rounded-full bg-green-200/50 flex items-center justify-center mb-6 transition-all duration-[4000ms] ease-in-out"
                style={{ transform: `scale(${scale})` }}
            >
                <div className="w-32 h-32 rounded-full bg-green-300/50 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Wind className="text-green-600 w-6 h-6" />
                    </div>
                </div>
            </div>
            <p className="text-2xl font-medium text-stone-600">{breathingStep}</p>
            <p className="text-sm text-stone-400 mt-2">4-7-8 Technique</p>
          </Card>

          <Card>
            <h3 className="font-serif text-xl text-stone-800 mb-4">Grounding: 5-4-3-2-1</h3>
            <p className="text-stone-600 mb-6 text-sm">Look around you and name:</p>
            <ul className="space-y-4">
                {[
                    { num: 5, text: 'Things you can see' },
                    { num: 4, text: 'Things you can touch' },
                    { num: 3, text: 'Things you can hear' },
                    { num: 2, text: 'Things you can smell' },
                    { num: 1, text: 'Thing you can taste' },
                ].map((item) => (
                    <li key={item.num} className="flex items-center gap-4 group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-stone-100 group-hover:bg-green-100 text-stone-500 group-hover:text-green-700 flex items-center justify-center font-bold transition-colors">
                            {item.num}
                        </div>
                        <span className="text-stone-700 group-hover:text-stone-900 transition-colors">{item.text}</span>
                    </li>
                ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CrisisSupport;