import { useState } from "react";
import { Coins, Sun, Moon, LogOut, Settings, LayoutDashboard, UserPlus, LogIn, Menu, X, Compass, Palette, User as UserIcon, Globe } from "lucide-react";
import { User, AppSettings } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { Language, getTranslation } from "../lib/translations";

interface HeaderProps {
  user: User | null;
  settings: AppSettings;
  theme: "dark" | "light";
  toggleTheme: () => void;
  onOpenAuth: (type: "login" | "register") => void;
  onOpenTopup: () => void;
  onOpenAdmin: () => void;
  onOpenHistory: () => void;
  onOpenSellerDashboard: () => void;
  onLogout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

export default function Header({
  user,
  settings,
  theme,
  toggleTheme,
  onOpenAuth,
  onOpenTopup,
  onOpenAdmin,
  onOpenHistory,
  onOpenSellerDashboard,
  onLogout,
  lang,
  setLang
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const badgeBg = "bg-[#8E6D4E]/10 border-[#8E6D4E]/25 text-[#725437] dark:text-[#D1BEA8]";
  const glowButton = "bg-[#8E6D4E] hover:bg-[#725437] text-white font-medium transition-all duration-300 rounded-xl px-4 py-2 text-xs shadow-md shadow-[#8E6D4E]/10 hover:shadow-[#8E6D4E]/20";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#8E6D4E]/10 bg-[#FAF7F2]/95 dark:bg-[#141210]/95 backdrop-blur-md transition-colors duration-300" id="main-header">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo and Brand */}
        <div className="flex items-center gap-2">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2.5"
          >
            {settings.siteLogoUrl ? (
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-[#8E6D4E]/20 bg-[#FAF7F2] dark:bg-[#1E1916] flex items-center justify-center">
                <img src={settings.siteLogoUrl} alt="Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="p-1.5 rounded-xl border border-[#8E6D4E]/20 bg-[#FAF7F2] dark:bg-[#1E1916] text-[#8E6D4E]">
                <Palette className="h-5 w-5" />
              </div>
            )}
            <span className="text-xl font-bold font-serif tracking-tight text-[#4E3B2C] dark:text-[#EAE3DA]">
              {settings.siteName}
            </span>
          </motion.div>
        </div>

        {/* Center Menus (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#735A45] dark:text-[#C5B49E]">
          <a href="#homepage" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "home")}</a>
          <a href="#about-us-section" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "aboutUs")}</a>
          <a href="#portfolios-section" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "portfolios")}</a>
          <a href="#artisans-section" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "artisans")}</a>
          <a href="#recommended-products" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "products")}</a>
          <a href={settings.contactFacebook || "#"} target="_blank" rel="noreferrer" className="relative transition-colors hover:text-[#8E6D4E] after:absolute after:bottom-[-4px] after:left-0 after:h-[1.5px] after:w-0 hover:after:w-full after:bg-[#8E6D4E] after:transition-all after:duration-300">{getTranslation(lang, "contactUs")}</a>
        </nav>

        {/* Right Section Actions */}
        <div className="flex items-center gap-3">
          
          {/* Language Selector Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="p-2 rounded-xl text-[#735A45] hover:text-[#8E6D4E] hover:bg-[#8E6D4E]/5 dark:text-[#C5B49E] dark:hover:text-[#FAF7F2] transition-colors flex items-center gap-1.5 cursor-pointer text-xs font-bold"
              title="เปลี่ยนภาษา / Change Language"
            >
              <Globe size={15} />
              <span className="uppercase text-[10px]">
                {lang === "th" ? "TH 🇹🇭" : lang === "en" ? "EN 🇺🇸" : "ZH 🇨🇳"}
              </span>
            </button>

            <AnimatePresence>
              {langDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setLangDropdownOpen(false)}></div>
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-32 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1A16] border border-[#8E6D4E]/20 shadow-xl p-1 z-20"
                  >
                    <button 
                      onClick={() => { setLang("th"); setLangDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${lang === 'th' ? 'bg-[#8E6D4E]/10 text-[#8E6D4E]' : 'text-[#4E3B2C] dark:text-slate-200 hover:bg-[#8E6D4E]/5'}`}
                    >
                      <span>🇹🇭</span>
                      <span>ภาษาไทย</span>
                    </button>
                    <button 
                      onClick={() => { setLang("en"); setLangDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${lang === 'en' ? 'bg-[#8E6D4E]/10 text-[#8E6D4E]' : 'text-[#4E3B2C] dark:text-slate-200 hover:bg-[#8E6D4E]/5'}`}
                    >
                      <span>🇺🇸</span>
                      <span>English</span>
                    </button>
                    <button 
                      onClick={() => { setLang("zh"); setLangDropdownOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer ${lang === 'zh' ? 'bg-[#8E6D4E]/10 text-[#8E6D4E]' : 'text-[#4E3B2C] dark:text-slate-200 hover:bg-[#8E6D4E]/5'}`}
                    >
                      <span>🇨🇳</span>
                      <span>中文</span>
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Theme Toggler */}
          <button 
            id="theme-toggler"
            onClick={toggleTheme}
            className="p-2 rounded-xl text-[#735A45] hover:text-[#8E6D4E] hover:bg-[#8E6D4E]/5 dark:text-[#C5B49E] dark:hover:text-[#FAF7F2] transition-colors cursor-pointer"
            title={theme === "dark" ? "หน้าจอโหมดสว่าง" : "หน้าจอโหมดมืด"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            /* Logged in layout */
            <div className="flex items-center gap-3">
              {/* Balance Badge */}
              <motion.button 
                whileHover={{ scale: 1.02 }}
                onClick={onOpenTopup}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer ${badgeBg}`}
              >
                <Coins size={14} />
                <span>{user.balance.toFixed(2)} ฿</span>
                <span className="bg-[#8E6D4E] text-white px-1.5 py-0.5 rounded-lg text-[9px] uppercase font-bold">{getTranslation(lang, "supportBtn")}</span>
              </motion.button>

              {/* Account Dropdown */}
              <div className="relative">
                <button 
                  id="profile-dropdown-btn"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#FAF7F2] border border-[#8E6D4E]/20 text-[#4E3B2C] dark:bg-[#1E1A16] dark:text-[#ECE5DC] hover:border-[#8E6D4E]/40 transition-all text-sm cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-5 h-5 rounded-full object-cover" />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-[#8E6D4E]/10 flex items-center justify-center text-[10px] font-bold text-[#8E6D4E]">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="font-semibold max-w-[80px] truncate">{user.username}</span>
                  <span className="text-[10px] opacity-60">▼</span>
                </button>

                {/* Dropdown Box */}
                <AnimatePresence>
                  {dropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)}></div>
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-52 rounded-xl bg-[#FAF7F2] dark:bg-[#1E1A16] border border-[#8E6D4E]/20 shadow-xl p-1.5 z-20"
                      >
                        <div className="px-3 py-2 border-b border-[#8E6D4E]/10">
                          <p className="text-[10px] font-semibold text-[#8E6D4E]">{getTranslation(lang, "rolePanel")}</p>
                          <p className={`text-xs font-bold truncate ${user.role === 'admin' ? 'text-amber-700 dark:text-amber-400' : 'text-[#4E3B2C] dark:text-slate-200'}`}>
                            {user.role === 'admin' ? getTranslation(lang, "adminRole") : getTranslation(lang, "memberRole")}
                          </p>
                        </div>
                        
                        {user.role === 'admin' && (
                          <button 
                            onClick={() => { setDropdownOpen(false); onOpenAdmin(); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-[#8E6D4E]/5 rounded-lg transition-colors text-left cursor-pointer"
                          >
                            <LayoutDashboard size={14} />
                            <span>{getTranslation(lang, "adminDashboard")}</span>
                          </button>
                        )}

                        <button 
                          onClick={() => { setDropdownOpen(false); onOpenSellerDashboard(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:bg-[#8E6D4E]/5 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Settings size={14} />
                          <span>{user.role?.startsWith('seller') ? "แผงควบคุมร้านค้า" : "สมัครเป็นผู้ขาย"}</span>
                        </button>

                        <button 
                          onClick={() => { setDropdownOpen(false); onOpenHistory(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#4E3B2C] dark:text-slate-300 hover:bg-[#8E6D4E]/5 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <Coins size={14} />
                          <span>{getTranslation(lang, "purchaseHistory")}</span>
                        </button>

                        <button 
                          onClick={() => { setDropdownOpen(false); onLogout(); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-500/5 rounded-lg transition-colors text-left cursor-pointer"
                        >
                          <LogOut size={14} />
                          <span>{getTranslation(lang, "logout")}</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            /* Guest login actions */
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onOpenAuth("login")}
                className="px-5 py-2 rounded-full border border-stone-700/60 hover:border-[#8E6D4E]/60 text-[#C5B49E] hover:text-white text-xs font-semibold flex items-center gap-2 bg-[#1A1613]/40 hover:bg-[#8E6D4E]/10 transition-all duration-300 cursor-pointer"
              >
                <UserIcon size={13} className="text-[#C5B49E]" />
                <span>{getTranslation(lang, "login")}</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggler */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex md:hidden p-2 rounded-xl text-[#735A45] hover:text-[#8E6D4E] hover:bg-[#8E6D4E]/5 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-[#8E6D4E]/10 bg-[#FAF7F2] dark:bg-[#141210] px-4 py-3 space-y-3 font-medium text-[#735A45] dark:text-[#C5B49E] text-sm"
          >
            <a href="#homepage" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "home")}</a>
            <a href="#about-us-section" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "aboutUs")}</a>
            <a href="#portfolios-section" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "portfolios")}</a>
            <a href="#artisans-section" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "artisans")}</a>
            <a href="#recommended-products" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "products")}</a>
            <button 
              onClick={() => { setMobileMenuOpen(false); onOpenTopup(); }} 
              className="block w-full py-1.5 text-left hover:text-[#8E6D4E] cursor-pointer"
            >
              {getTranslation(lang, "support")}
            </button>
            <a href={settings.contactFacebook} target="_blank" rel="noreferrer" onClick={() => setMobileMenuOpen(false)} className="block py-1.5 hover:text-[#8E6D4E]">{getTranslation(lang, "contactUs")}</a>
            
            {!user && (
              <div className="pt-2 border-t border-[#8E6D4E]/10 flex gap-2">
                <button 
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth("login"); }}
                  className="flex-1 py-1.5 text-center text-xs font-bold rounded-xl bg-[#FAF7F2] border border-[#8E6D4E]/20 text-[#4E3B2C] dark:bg-[#1E1A16] dark:text-slate-200 transition-all"
                >
                  {getTranslation(lang, "login")}
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onOpenAuth("register"); }}
                  className="flex-1 py-1.5 text-center text-xs font-bold rounded-xl bg-[#8E6D4E] text-white hover:bg-[#725437] transition-all"
                >
                  {getTranslation(lang, "register")}
                </button>
              </div>
            )}

            {user && (
              <div className="pt-2 border-t border-[#8E6D4E]/10 space-y-2">
                {user.role === 'admin' && (
                  <button 
                    onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
                    className="w-full text-left py-1.5 hover:text-[#8E6D4E] cursor-pointer text-xs font-bold text-amber-700 dark:text-amber-400"
                  >
                    👑 {getTranslation(lang, "adminDashboard")}
                  </button>
                )}
                <button 
                  onClick={() => { setMobileMenuOpen(false); onOpenSellerDashboard(); }}
                  className="w-full text-left py-1.5 hover:text-[#8E6D4E] cursor-pointer text-xs font-bold text-teal-600 dark:text-teal-400"
                >
                  🏪 {user.role?.startsWith('seller') ? "แผงควบคุมร้านค้า" : "สมัครเป็นผู้ขาย"}
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onOpenHistory(); }}
                  className="w-full text-left py-1.5 hover:text-[#8E6D4E] cursor-pointer text-xs font-bold"
                >
                  📜 {getTranslation(lang, "purchaseHistory")}
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); onLogout(); }}
                  className="w-full text-left py-1.5 hover:text-red-500 text-red-600 text-xs font-bold"
                >
                  🚪 {getTranslation(lang, "logout")}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
