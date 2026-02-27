import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayCircle, Clock, X, Lock, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom'; // For redirecting free users
import { supabase } from '../../lib/supabaseClient';

// --- HELPER: Universal Link Fixer ---
const getEmbedUrl = (urlOrId) => {
  if (!urlOrId) return '';
  let cleanUrl = urlOrId.toString().trim();
  let videoId = cleanUrl;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = cleanUrl.match(regExp);
  if (match && match[2].length === 11) videoId = match[2];
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
};

const WellnessGallery = ({ session }) => {
  const navigate = useNavigate();
  const [wellnessItems, setWellnessItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);

  // --- PREMIUM CHECK ---
  const isPremiumUser = useMemo(() => {
    const user = session?.user;
    const tier = user?.clinical_tier || user?.user_metadata?.clinical_tier;
    const premiumBool = user?.is_premium || user?.user_metadata?.is_premium;
    return tier === 'premium' || premiumBool === true;
  }, [session]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'yoga', label: 'Yoga' },
    { id: 'pilates', label: 'Pilates' },
    { id: 'meditation', label: 'Meditation' },
    { id: 'breathing', label: 'Breathing' },
    { id: 'diet', label: 'Diet & Nutrition' }
  ];

  useEffect(() => {
    document.body.style.overflow = selectedVideo ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [selectedVideo]);

  useEffect(() => {
    const fetchWellness = async () => {
      setLoading(true);
      // Ensure your 'wellness_library' table has an 'is_premium' boolean column
      const { data, error } = await supabase.from('wellness_library').select('*');
      if (error) console.error("Supabase Error:", error);
      else setWellnessItems(data || []);
      setLoading(false);
    };
    fetchWellness();
  }, []);

  // --- HANDLER: Gated Play ---
  const handleVideoClick = (item) => {
    if (item.is_premium && !isPremiumUser) {
      if(window.confirm("This is a SoulSpark Pro masterclass. Would you like to upgrade your sanctuary?")) {
        navigate('/pricing');
      }
      return;
    }
    setSelectedVideo(item);
  };

  const filteredItems = filter === 'all' 
    ? wellnessItems 
    : wellnessItems.filter(item => item.category === filter);

  return (
    <>
      {/* Filter Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto mb-10">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${
              filter === cat.id ? 'bg-stone-800 text-white border-stone-800 shadow-md' : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </motion.div>

      {/* Video Grid */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full text-center py-32 text-stone-400 font-serif italic animate-pulse">Preparing your sanctuary...</div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map(item => (
            <motion.div 
              key={item.id} layout 
              whileHover={{ y: -5 }} 
              onClick={() => handleVideoClick(item)} 
              className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-6 shadow-sm border border-stone-100 group cursor-pointer hover:shadow-2xl transition-all relative overflow-hidden"
            >
              {/* VIDEO THUMBNAIL */}
              <div className="relative overflow-hidden rounded-[2rem] mb-6 aspect-video shadow-inner bg-stone-200">
                <img src={item.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                
                {/* OVERLAY: Play or Lock Icon */}
                <div className="absolute inset-0 bg-stone-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-[2px]">
                  {item.is_premium && !isPremiumUser ? (
                    <div className="bg-amber-500/80 backdrop-blur-md p-4 rounded-full"><Lock className="text-white w-10 h-10" /></div>
                  ) : (
                    <div className="bg-white/20 backdrop-blur-md p-4 rounded-full"><PlayCircle className="text-white w-12 h-12" /></div>
                  )}
                </div>

                {/* PREMIUM BADGE ON CARD */}
                {item.is_premium && (
                  <div className="absolute top-4 left-4 z-10 px-3 py-1 bg-amber-100/90 backdrop-blur-sm text-amber-700 text-[9px] font-black uppercase tracking-widest rounded-lg flex items-center gap-1 border border-amber-200">
                    <Crown className="w-3 h-3" /> Pro
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] uppercase tracking-[0.2em] font-black text-green-700 bg-green-100/50 px-3 py-1.5 rounded-lg">{item.category}</span>
                <div className="flex items-center gap-1.5 text-stone-400 text-xs font-medium"><Clock className="w-3.5 h-3.5" /> {item.duration}</div>
              </div>
              <h3 className={`font-serif text-xl mb-2 font-medium leading-tight ${item.is_premium && !isPremiumUser ? 'text-stone-400' : 'text-stone-900'}`}>{item.title}</h3>
              <p className="text-stone-400 text-sm italic">Guide: {item.instructor || 'SoulSpark AI'}</p>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full text-center py-20 text-stone-400 italic">No sanctuary logs found.</div>
        )}
      </motion.div>

      {/* Video Modal (Only renders if video is allowed) */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/90 backdrop-blur-md" onClick={() => setSelectedVideo(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} className="relative w-full max-w-5xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setSelectedVideo(null)} className="absolute top-6 right-6 z-20 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md"><X className="w-6 h-6" /></button>
              <iframe className="w-full h-full" src={getEmbedUrl(selectedVideo.video_url)} title={selectedVideo.title} frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen></iframe>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WellnessGallery;