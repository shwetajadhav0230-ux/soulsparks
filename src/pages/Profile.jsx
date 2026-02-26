import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Moon, Sun, LogOut, Save, ShieldCheck, ArrowLeft, Camera, Trash2, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // NEW: State to handle custom, in-page notifications instead of browser alerts
  const [feedback, setFeedback] = useState(null); 
  
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Helper function to show a message and automatically hide it after 3 seconds
  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 3000);
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    fetchUserData();
    
    const savedTheme = localStorage.getItem('soulspark-theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const fetchUserData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      setFullName(user.user_metadata?.full_name || '');
      setAvatarUrl(user.user_metadata?.avatar_url || null);
    }
  };

  // --- HANDLERS ---
  const handleUpdateProfile = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName }
      });
      if (error) throw error;
      showFeedback('success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      showFeedback('error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  // AVATAR UPLOAD HANDLER
  const handleAvatarUpload = async (event) => {
    try {
      setIsUploading(true);
      setFeedback(null);
      const file = event.target.files[0];
      if (!file) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      showFeedback('success', 'Profile photo updated!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      showFeedback('error', 'Error uploading photo. Check your storage bucket settings.');
    } finally {
      setIsUploading(false);
    }
  };

  // REMOVE AVATAR HANDLER
  const handleRemoveAvatar = async () => {
    try {
      setIsUploading(true);
      setFeedback(null);
      const { error } = await supabase.auth.updateUser({
        data: { avatar_url: null }
      });
      if (error) throw error;
      setAvatarUrl(null);
      showFeedback('success', 'Profile photo removed.');
    } catch (error) {
      console.error('Error removing avatar:', error);
      showFeedback('error', 'Error removing photo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/'); 
  };

  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('soulspark-theme', 'light');
      setIsDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('soulspark-theme', 'dark');
      setIsDarkMode(true);
    }
  };

  if (!user) return <div className="p-8 text-center text-stone-500 dark:text-stone-400">Loading profile...</div>;

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8 animate-fade-in pb-20">
      
      {/* HEADER WITH INLINE BACK BUTTON */}
      <div className="border-b border-stone-200 dark:border-stone-700 pb-6 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <Link 
            to="/" 
            title="Back to Home"
            className="p-2 -ml-2 rounded-full text-stone-400 hover:text-stone-800 hover:bg-stone-100 dark:hover:text-stone-100 dark:hover:bg-stone-800 transition-all group"
          >
            <ArrowLeft className="w-7 h-7 transition-transform group-hover:-translate-x-1" />
          </Link>
          
          <h1 className="text-3xl md:text-4xl font-serif text-stone-800 dark:text-stone-100 tracking-tight">
            Account Settings
          </h1>
        </div>
        <p className="text-stone-500 dark:text-stone-400 mt-2 md:ml-12 ml-11">
          Manage your personal details and app preferences.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* PROFILE DETAILS CARD */}
        <div className="p-6 md:p-8 rounded-3xl shadow-sm bg-white dark:bg-stone-800 transition-colors duration-300">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xl font-semibold flex items-center gap-2 text-stone-800 dark:text-stone-100">
              <User className="w-5 h-5 text-emerald-500" /> Personal Information
            </h3>
          </div>
          
          {/* CUSTOM FEEDBACK MESSAGE */}
          {feedback && (
            <div className={`mb-6 p-4 rounded-xl flex items-start gap-3 text-sm font-medium animate-fade-in ${
              feedback.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400' 
                : 'bg-rose-50 text-rose-800 border border-rose-100 dark:bg-rose-900/20 dark:border-rose-800/50 dark:text-rose-400'
            }`}>
              {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
              <p>{feedback.message}</p>
            </div>
          )}
          
          <div className="space-y-6">
            
            {/* AVATAR SECTION */}
            <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600 transition-colors">
              
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-stone-800 shadow-sm">
                  {isUploading ? (
                     <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                  ) : avatarUrl ? (
                    <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-medium text-stone-400 dark:text-stone-300">
                      {fullName?.charAt(0)?.toUpperCase() || user.email[0].toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-auto text-center sm:text-left">
                <p className="text-sm text-stone-500 dark:text-stone-400">JPG, GIF or PNG. 1MB max.</p>
                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleAvatarUpload} 
                    ref={fileInputRef} 
                    className="hidden" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-white dark:bg-stone-700 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-600 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-600 transition-colors"
                  >
                    <Upload className="w-4 h-4" /> Change Photo
                  </button>
                  
                  {avatarUrl && (
                    <button 
                      onClick={handleRemoveAvatar}
                      disabled={isUploading}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/20 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" /> Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* NAME & EMAIL */}
            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
                Display Name
              </label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your Name"
                className="w-full px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-stone-50 dark:bg-stone-700 text-stone-800 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors duration-300"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-600 dark:text-stone-300 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-100 dark:bg-stone-900 text-stone-500 dark:text-stone-400">
                <Mail className="w-4 h-4" />
                <span className="truncate">{user.email}</span>
                <ShieldCheck className="w-4 h-4 text-emerald-500 ml-auto" />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button 
                onClick={handleUpdateProfile} 
                disabled={isSaving}
                className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>

        {/* PREFERENCES CARD */}
        <div className="p-6 md:p-8 rounded-3xl shadow-sm bg-white dark:bg-stone-800 transition-colors duration-300">
          <h3 className="text-xl font-semibold flex items-center gap-2 text-stone-800 dark:text-stone-100 mb-6">
            <Moon className="w-5 h-5 text-indigo-500" /> App Preferences
          </h3>
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 dark:bg-stone-700/50 border border-stone-100 dark:border-stone-600 transition-colors duration-300">
            <div>
              <h4 className="font-medium text-stone-800 dark:text-stone-100">Dark Mode</h4>
              <p className="text-sm text-stone-500 dark:text-stone-400">Switch to a darker theme for night viewing.</p>
            </div>
            
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none ${isDarkMode ? 'bg-indigo-500' : 'bg-stone-300 dark:bg-stone-600'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform flex items-center justify-center ${isDarkMode ? 'translate-x-7' : 'translate-x-1'}`}>
                {isDarkMode ? <Moon className="w-3 h-3 text-indigo-500" /> : <Sun className="w-3 h-3 text-amber-500" />}
              </span>
            </button>
          </div>
        </div>

        {/* DANGER ZONE */}
        <div className="pt-6">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 text-rose-500 hover:text-rose-600 font-medium px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <LogOut className="w-5 h-5" /> Sign Out
          </button>
        </div>

      </div>
    </div>
  );
};

export default Profile;