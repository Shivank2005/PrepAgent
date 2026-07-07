"use client";

import { useState, useEffect, useRef } from "react";
import { User, Bell, Shield, KeyRound, MonitorSmartphone, Eye, EyeOff, Copy, RefreshCw, CheckCircle2, Moon, Sun, Laptop, Loader2, Upload } from "lucide-react";
import { getUserData, setUserData, clearAuthToken } from "@/lib/store";
import { updateProfile, updatePassword, updatePreferences, deleteAccount, uploadAvatar } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("profile");
  
  // Profile State
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState<any>({});
  const [savingPrefs, setSavingPrefs] = useState(false);

  // API Key State
  const [showApiKey, setShowApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const u = getUserData();
    if (!u) {
      router.push("/login");
    } else {
      setUser(u);
      setDisplayName(u.name || "");
      setPreferences(u.preferences || {});
    }
  }, [router]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) return;
    setSavingProfile(true);
    setProfileMessage("");
    try {
      const updatedUser = await updateProfile(displayName);
      setUserData(updatedUser);
      setUser(updatedUser);
      setProfileMessage("Profile updated successfully.");
      setTimeout(() => setProfileMessage(""), 3000);
    } catch (e: any) {
      setProfileMessage(e.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadingAvatar(true);
      try {
        const res = await uploadAvatar(file);
        const newPrefs = res.preferences;
        setPreferences(newPrefs);
        
        const u = getUserData();
        if (u) {
          u.preferences = newPrefs;
          setUserData(u);
          setUser({ ...u });
        }
      } catch (err: any) {
        alert("Failed to upload image: " + err.message);
      } finally {
        setUploadingAvatar(false);
      }
    }
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword) return;
    setSavingPassword(true);
    setPasswordMessage("");
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordMessage("Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setTimeout(() => setPasswordMessage(""), 3000);
    } catch (e: any) {
      setPasswordMessage(e.message || "Failed to update password.");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("Are you sure you want to permanently delete your account and all data? This cannot be undone.")) {
      setIsDeleting(true);
      try {
        await deleteAccount();
        clearAuthToken();
        router.push("/login");
      } catch (e: any) {
        alert("Failed to delete account: " + e.message);
        setIsDeleting(false);
      }
    }
  };

  const handleTogglePref = async (key: string, defaultVal: boolean) => {
    const currentVal = preferences[key] !== undefined ? preferences[key] : defaultVal;
    const newVal = !currentVal;
    const newPrefs = { ...preferences, [key]: newVal };
    setPreferences(newPrefs);
    
    // Optimistic save
    try {
      const res = await updatePreferences(newPrefs);
      // Update local storage user object
      const u = getUserData();
      if (u) {
        u.preferences = res.preferences;
        setUserData(u);
      }
    } catch (e: any) {
      alert("Failed to save preference: " + e.message);
      // Rollback
      setPreferences({ ...preferences, [key]: currentVal });
    }
  };
  
  const handleThemeChange = async (theme: string) => {
    const newPrefs = { ...preferences, theme };
    setPreferences(newPrefs);
    try {
      const res = await updatePreferences(newPrefs);
      const u = getUserData();
      if (u) {
        u.preferences = res.preferences;
        setUserData(u);
      }
    } catch (e: any) {
      alert("Failed to save theme: " + e.message);
    }
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderToggle = (key: string, title: string, desc: string, defaultOn = false) => {
    const isOn = preferences[key] !== undefined ? preferences[key] : defaultOn;
    return (
      <div className="flex items-center justify-between py-5 border-b border-white/[0.05] last:border-0" key={key}>
        <div className="pr-8">
          <div className="font-bold text-white text-sm">{title}</div>
          <div className="text-[13px] text-[#777294] mt-1 leading-relaxed">{desc}</div>
        </div>
        <div 
          onClick={() => handleTogglePref(key, defaultOn)}
          className={`w-11 h-6 rounded-full flex items-center px-1 cursor-pointer transition-colors flex-shrink-0 ${isOn ? 'bg-accent' : 'bg-[#2d2c41]'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-transform ${isOn ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#060609] overflow-hidden">
      
      {/* Header & Horizontal Tabs */}
      <div className="bg-[#0a0a0f] border-b border-white/[0.05] flex-shrink-0">
        <div className="w-full max-w-6xl px-8 pt-10">
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
          <p className="text-sm text-[#777294] mb-8">Manage your account preferences, security, and integrations.</p>
          
          <div className="flex items-center gap-6 overflow-x-auto custom-scrollbar">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "account", label: "Security", icon: Shield },
              { id: "appearance", label: "Appearance", icon: MonitorSmartphone },
              { id: "api-keys", label: "API Keys", icon: KeyRound },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 pb-4 text-sm font-bold transition-all relative whitespace-nowrap ${
                  activeTab === tab.id 
                    ? "text-accent" 
                    : "text-[#777294] hover:text-white"
                }`}
              >
                <tab.icon size={16} className={activeTab === tab.id ? "text-accent" : "text-[#5c5875]"} />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#060609]">
        <div className="w-full max-w-6xl px-8 py-10 animate-fade-in">
          
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-8">
              
              {/* Avatar Section */}
              <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8 flex flex-col sm:flex-row sm:items-center gap-8">
                  <div className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center text-accent text-3xl font-bold border border-accent/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] flex-shrink-0 overflow-hidden">
                    {preferences?.avatar_url ? (
                      <img src={preferences.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name.substring(0, 2).toUpperCase() : "AK"
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-base mb-1">Avatar</h3>
                    <p className="text-[#777294] text-[13px] mb-4 max-w-md">This is your public display picture. It will be used on leaderboards and community posts.</p>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef} 
                      onChange={handleAvatarChange} 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="bg-[#181724] border border-[#2d2c41] hover:bg-[#2d2c41] text-white px-5 py-2.5 rounded-lg text-[13px] font-bold transition-colors flex items-center gap-2"
                    >
                      {uploadingAvatar ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploadingAvatar ? 'Uploading...' : 'Upload New Image'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <label className="block text-[12px] font-bold text-white uppercase tracking-wider mb-2">Display Name</label>
                    <p className="text-[#777294] text-[13px] mb-3 max-w-lg">Please enter your full name, or a display name you are comfortable with.</p>
                    <input 
                      type="text" 
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full max-w-md bg-[#12121a] border border-[#2d2c41] focus:border-accent focus:ring-1 focus:ring-accent rounded-lg px-4 py-2.5 text-white outline-none transition-all" 
                    />
                  </div>
                  <div className="h-px bg-white/[0.05] w-full" />
                  <div>
                    <label className="block text-[12px] font-bold text-white uppercase tracking-wider mb-2">Email Address</label>
                    <p className="text-[#777294] text-[13px] mb-3 max-w-lg">Your email is used for login and notifications. Contact support to change it.</p>
                    <input type="email" defaultValue={user?.email} disabled className="w-full max-w-md bg-[#060609] border border-[#2d2c41]/50 rounded-lg px-4 py-2.5 text-[#5c5875] outline-none cursor-not-allowed" />
                  </div>
                </div>
                
                <div className="bg-[#060609] border-t border-white/[0.05] p-4 px-6 md:px-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <p className={`text-[13px] font-medium ${profileMessage.includes("Failed") ? "text-[#ff6b6b]" : "text-[#4fd9b3]"}`}>
                    {profileMessage || "Please use 32 characters at maximum."}
                  </p>
                  <button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {savingProfile ? <Loader2 size={16} className="animate-spin" /> : null}
                    Save changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ACCOUNT SECURITY TAB */}
          {activeTab === "account" && (
            <div className="space-y-8">
              
              <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8 space-y-6">
                  <div>
                    <label className="block text-[12px] font-bold text-white uppercase tracking-wider mb-2">Change Password</label>
                    <p className="text-[#777294] text-[13px] mb-4 max-w-lg">Update your password to keep your account secure. Ensure it is at least 8 characters long.</p>
                    <div className="space-y-3 max-w-md">
                      <input 
                        type="password" 
                        placeholder="Current Password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full bg-[#12121a] border border-[#2d2c41] focus:border-accent rounded-lg px-4 py-2.5 text-white outline-none transition-all" 
                      />
                      <input 
                        type="password" 
                        placeholder="New Password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-[#12121a] border border-[#2d2c41] focus:border-accent rounded-lg px-4 py-2.5 text-white outline-none transition-all" 
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-[#060609] border-t border-white/[0.05] p-4 px-6 md:px-8 flex justify-between items-center">
                  <p className={`text-[13px] font-medium ${passwordMessage.includes("Failed") || passwordMessage.includes("Incorrect") ? "text-[#ff6b6b]" : "text-[#4fd9b3]"}`}>
                    {passwordMessage}
                  </p>
                  <button 
                    onClick={handleSavePassword}
                    disabled={savingPassword || !currentPassword || !newPassword}
                    className="bg-white hover:bg-gray-200 disabled:opacity-50 text-black font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {savingPassword ? <Loader2 size={16} className="animate-spin" /> : null}
                    Update Password
                  </button>
                </div>
              </div>

              <div className="bg-[#0a0a0f] border border-[#ff6b6b]/30 rounded-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-sm font-bold text-[#ff6b6b] mb-2">Delete Account</h3>
                  <p className="text-[13px] text-[#777294] mb-6 max-w-xl">Permanently remove your personal account and all of its contents from the PrepAgent platform. This action is not reversible.</p>
                  <button 
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                    className="bg-[#ff6b6b]/10 text-[#ff6b6b] border border-[#ff6b6b]/30 hover:bg-[#ff6b6b]/20 disabled:opacity-50 px-6 py-2.5 rounded-lg text-[13px] font-bold transition-colors"
                  >
                    {isDeleting ? "Deleting..." : "Delete Personal Account"}
                  </button>
                </div>
              </div>
            </div>
          )}



          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="space-y-8">
              <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8 space-y-8">
                  <div>
                    <label className="block text-[12px] font-bold text-white uppercase tracking-wider mb-2">Theme</label>
                    <p className="text-[#777294] text-[13px] mb-6 max-w-lg">Choose how PrepAgent looks to you. Select a single theme, or sync with your system.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl">
                      <button 
                        onClick={() => handleThemeChange("dark")}
                        className={`border-2 ${preferences.theme === 'dark' || !preferences.theme ? 'border-accent bg-[#12121a]' : 'border-transparent bg-[#060609] hover:border-[#2d2c41]'} rounded-lg p-5 flex flex-col items-center gap-3 transition-colors`}
                      >
                        <Moon size={24} className={preferences.theme === 'dark' || !preferences.theme ? 'text-accent' : 'text-[#777294]'} />
                        <span className={`text-[13px] font-bold ${preferences.theme === 'dark' || !preferences.theme ? 'text-white' : 'text-[#777294]'}`}>Dark</span>
                      </button>
                      <button 
                        onClick={() => handleThemeChange("light")}
                        className={`border-2 ${preferences.theme === 'light' ? 'border-accent bg-[#12121a]' : 'border-transparent bg-[#060609] hover:border-[#2d2c41]'} rounded-lg p-5 flex flex-col items-center gap-3 transition-colors`}
                      >
                        <Sun size={24} className={preferences.theme === 'light' ? 'text-accent' : 'text-[#777294]'} />
                        <span className={`text-[13px] font-bold ${preferences.theme === 'light' ? 'text-white' : 'text-[#777294]'}`}>Light</span>
                      </button>
                      <button 
                        onClick={() => handleThemeChange("system")}
                        className={`border-2 ${preferences.theme === 'system' ? 'border-accent bg-[#12121a]' : 'border-transparent bg-[#060609] hover:border-[#2d2c41]'} rounded-lg p-5 flex flex-col items-center gap-3 transition-colors`}
                      >
                        <Laptop size={24} className={preferences.theme === 'system' ? 'text-accent' : 'text-[#777294]'} />
                        <span className={`text-[13px] font-bold ${preferences.theme === 'system' ? 'text-white' : 'text-[#777294]'}`}>System</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* API KEYS TAB */}
          {activeTab === "api-keys" && (
            <div className="space-y-8">
              <div className="bg-[#0a0a0f] border border-white/[0.05] rounded-xl overflow-hidden">
                <div className="p-6 md:p-8">
                  <h3 className="text-sm font-bold text-white mb-2">Secret Key</h3>
                  <p className="text-[#777294] text-[13px] mb-6 max-w-lg">Do not share your API key with others, or expose it in the browser or other client-side code.</p>
                  
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
                    <div className="flex-1 flex items-center justify-between bg-[#060609] border border-[#2d2c41] rounded-lg px-4 py-3">
                      <code className="text-[13px] font-mono text-accent truncate pr-4">
                        {showApiKey ? "sk_live_51MabcXYZ123..." : "sk_live_••••••••••••••••••••••"}
                      </code>
                      <button onClick={() => setShowApiKey(!showApiKey)} className="text-[#777294] hover:text-white transition-colors">
                        {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <button onClick={handleCopy} className="flex items-center justify-center gap-2 bg-[#181724] border border-[#2d2c41] hover:bg-[#2d2c41] text-white px-6 py-3 rounded-lg transition-colors text-[13px] font-bold">
                      {copied ? <CheckCircle2 size={16} className="text-[#4fd9b3]" /> : <Copy size={16} />}
                      {copied ? 'Copied!' : 'Copy Key'}
                    </button>
                  </div>
                </div>
                <div className="bg-[#060609] border-t border-white/[0.05] p-4 px-6 md:px-8 flex justify-between items-center">
                  <p className="text-[#777294] text-[13px]">Rolling your key will invalidate the old one immediately.</p>
                  <button className="bg-transparent border border-[#ff6b6b]/50 text-[#ff6b6b] hover:bg-[#ff6b6b]/10 font-bold px-6 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2" onClick={() => alert("Mocked: Key Roll requested.")}>
                    <RefreshCw size={14} /> Roll Key
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
