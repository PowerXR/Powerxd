import { useState, useEffect } from "react";
import { AppSettings, Category, Product, User, Coupon, Transaction, Review } from "./types";
import { Language, getTranslation } from "./lib/translations";
import Header from "./components/Header";
import Banners from "./components/Banners";
import CategoriesAndProducts from "./components/CategoriesAndProducts";
import ProductDetailModal from "./components/ProductDetailModal";
import TopupModal from "./components/TopupModal";
import AdminPanel from "./components/AdminPanel";
import AuthModal from "./components/AuthModal";
import HistoryModal from "./components/HistoryModal";
import NamNoiMap from "./components/NamNoiMap";


// Icons
import { 
  Check, AlertCircle, AlertTriangle, ShieldCheck, Mail, Send, Disc, ExternalLink, Heart, ArrowUpRight, Copy, Code, LayoutDashboard
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // Store stateful models
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem("lang") as Language) || "th";
  });

  useEffect(() => {
    localStorage.setItem("lang", lang);
  }, [lang]);

  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");

  // Visual modal managers
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalType, setAuthModalType] = useState<"login" | "register">("login");
  const [topupModalOpen, setTopupModalOpen] = useState(false);
  const [adminPanelOpen, setAdminPanelOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [announcementOpen, setAnnouncementOpen] = useState(false);

  useEffect(() => {
    if (settings && settings.announcementActive) {
      const hasSeen = sessionStorage.getItem("hasSeenAnnouncement");
      if (!hasSeen) {
        setAnnouncementOpen(true);
      }
    }
  }, [settings]);

  // Simulated SweetAlert2 Popups
  const [swalAlert, setSwalAlert] = useState<{
    open: boolean;
    title: string;
    text: string;
    type: "success" | "error" | "warning";
    deliveredData?: string;
  } | null>(null);

  // Safe API response getter to prevent JSON parsing issues when server responds with HTML or redirects
  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) return null;
      const text = await res.text();
      if (!text || text.trim().startsWith("<")) {
        console.warn(`URL ${url} returned HTML or empty page instead of JSON:`, text.slice(0, 100));
        return null;
      }
      return JSON.parse(text);
    } catch (e) {
      console.error(`safeFetch failed for ${url}:`, e);
      return null;
    }
  };

  // Load backend variables
  const loadStoreData = async () => {
    const settingsData = await safeFetch("/api/settings");
    if (settingsData) setSettings(settingsData);
    
    const catData = await safeFetch("/api/categories");
    if (catData) setCategories(catData);

    const prodData = await safeFetch("/api/products");
    if (prodData) setProducts(prodData);

    const coupData = await safeFetch("/api/coupons", {
      headers: { "X-User-Role": user?.role || "user" }
    });
    if (coupData) setCoupons(coupData);

    const revData = await safeFetch("/api/reviews");
    if (revData) setReviews(revData);
  };

  useEffect(() => {
    loadStoreData();

    // Setup dark/light theme body background classes
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setThemeMode(savedTheme);
      document.documentElement.className = savedTheme;
    } else {
      document.documentElement.className = "dark";
    }
  }, []);

  // Update current user balance or attributes
  const refreshUserSession = async (userId: string) => {
    const data = await safeFetch(`/api/users/me/${userId}`);
    if (data) {
      setUser(data);
    }
  };

  const handleToggleTheme = () => {
    const next = themeMode === "dark" ? "light" : "dark";
    setThemeMode(next);
    localStorage.setItem("theme", next);
    document.documentElement.className = next;
  };

  const handleLoginSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    localStorage.setItem("userId", loggedInUser.id);
    
    // If there is an active announcement, show it upon login
    if (settings && settings.announcementActive) {
      sessionStorage.removeItem("hasSeenAnnouncement");
      setAnnouncementOpen(true);
    }

    // Simulate sweetalert login greet
    triggerSwal(
      getTranslation(lang, "loginWelcome").replace("{username}", loggedInUser.username),
      getTranslation(lang, "loginSuccessMsg").replace("{role}", loggedInUser.role === 'admin' ? getTranslation(lang, "roleAdmin") : getTranslation(lang, "roleMember")),
      "success"
    );
    loadStoreData();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("userId");
    triggerSwal(
      getTranslation(lang, "logoutSuccess"),
      getTranslation(lang, "logoutMsg"),
      "success"
    );
  };

  // Simulated SweetAlert notifier
  const triggerSwal = (title: string, text: string, type: "success" | "error" | "warning", deliveredData?: string) => {
    setSwalAlert({ open: true, title, text, type, deliveredData });
  };

  // Submit product purchase order
  const handlePurchaseProduct = async (
    productId: string, 
    quantity: number, 
    couponCode: string,
    shippingDetails?: { name: string; phone: string; address: string; zip: string; method: string; fee: number }
  ): Promise<any> => {
    if (!user) return;
    try {
      const resp = await fetch(`/api/products/${productId}/purchase?coupon=${encodeURIComponent(couponCode)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({ shippingDetails })
      });
      const text = await resp.text();
      if (!text || text.trim().startsWith("<")) {
        triggerSwal(
          getTranslation(lang, "errorTitle"),
          getTranslation(lang, "errorHtmlResp"),
          "error"
        );
        return { success: false };
      }
      const data = JSON.parse(text);

      if (!resp.ok) {
        triggerSwal(
          getTranslation(lang, "purchaseFailed"),
          data.error || getTranslation(lang, "purchaseFailedDesc"),
          "error"
        );
        return { success: false };
      }

      // Success! Update parameters
      refreshUserSession(user.id);
      loadStoreData(); // Refresh product inventory level

      // Show outcome SweetAlert delivery box
      triggerSwal(
        data.title || getTranslation(lang, "purchaseSuccess"), 
        getTranslation(lang, "purchaseSuccessMsg").replace("{amount}", String(data.paidAmount)),
        "success",
        data.data
      );

      return { success: true };
    } catch (e) {
      triggerSwal(
        getTranslation(lang, "errorTitle"),
        getTranslation(lang, "errorPost"),
        "error"
      );
      return { success: false };
    }
  };

  // Submit automated TrueMoney topup
  const handleTopupSuccess = (amount: number, newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
    setTopupModalOpen(false);
    triggerSwal(
      getTranslation(lang, "topupSuccessTitle"),
      getTranslation(lang, "topupSuccessMsg")
        .replace("{amount}", String(amount))
        .replace("{balance}", String(newBalance)),
      "success"
    );
    loadStoreData();
  };

  // Write catalog product review
  const handleAddReview = async (productId: string, rating: number, comment: string) => {
    if (!user) return;
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user.id
        },
        body: JSON.stringify({ productId, rating, comment })
      });
      if (res.ok) {
        loadStoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save modified Settings (Admin)
  const handleAdminUpdateSettings = async (nextSettings: AppSettings) => {
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": "admin"
        },
        body: JSON.stringify(nextSettings)
      });
      const text = await res.text();
      if (!text || text.trim().startsWith("<")) {
        console.warn("Update settings returned unexpected non-JSON response:", text.slice(0, 100));
        return;
      }
      const data = JSON.parse(text);
      if (res.ok) {
        setSettings(data.settings);
        if (data.settings && data.settings.announcementActive) {
          sessionStorage.removeItem("hasSeenAnnouncement");
          setAnnouncementOpen(true);
        }
        loadStoreData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic Brand Color Resolution Engine
  const getPrimaryColorHex = (color: string | undefined): string => {
    if (!color) return "#8E6D4E";
    if (color.startsWith("#")) return color;
    
    const presets: Record<string, string> = {
      amber: "#8E6D4E",
      crimson: "#EF4444",
      cyan: "#06B6D4",
      indigo: "#6366F1",
      emerald: "#10B981",
      rose: "#F43F5E",
      orange: "#F97316",
      violet: "#8B5CF6",
    };
    return presets[color.toLowerCase()] || presets.amber;
  };

  const primaryColorHex = getPrimaryColorHex(settings?.primaryColor);

  const getHoverColorHex = (hex: string): string => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    if (!result) return "#725437";
    
    const r = Math.max(0, Math.floor(parseInt(result[1], 16) * 0.8));
    const g = Math.max(0, Math.floor(parseInt(result[2], 16) * 0.8));
    const b = Math.max(0, Math.floor(parseInt(result[3], 16) * 0.8));
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  };

  const hoverColorHex = getHoverColorHex(primaryColorHex);

  const hexToRgbComponents = (hex: string) => {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 142, g: 109, b: 78 };
  };

  const rgb = hexToRgbComponents(primaryColorHex);

  const activeAccent = "text-[var(--primary-accent)] hover:text-[var(--primary-hover)]";
  const glowBorder = "border-[var(--primary-accent)]/20 shadow-[0_0_20px_var(--primary-accent-glow)]";

  return (
    <div 
      className={`min-h-screen transition-all duration-500 relative overflow-hidden ${
        themeMode === "dark" 
          ? "bg-[#0B0908] text-[#FAF5EF]" 
          : "bg-[#FCFAF7] text-[#2E2520]"
      }`} 
      style={settings?.siteBackgroundUrl ? {
        backgroundImage: `url(${settings.siteBackgroundUrl})`,
        backgroundSize: 'cover',
        backgroundAttachment: 'fixed',
        backgroundPosition: 'center'
      } : undefined}
      id="shop-app"
    >
      
      {/* If there is a custom background image, add a subtle, semi-transparent blur and dark/light overlay to keep text perfectly legible */}
      {settings?.siteBackgroundUrl && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#FCFAF7]/90 via-[#FCFAF7]/85 to-[#FCFAF7]/90 dark:from-[#0B0908]/92 dark:via-[#0B0908]/88 dark:to-[#0B0908]/92 backdrop-blur-[0.5px] pointer-events-none z-0" />
      )}

      {/* Decorative luxury radial background lights */}
      <div className="absolute top-[-10%] left-[5%] w-[45rem] h-[45rem] rounded-full bg-radial from-[#8E6D4E]/5 to-transparent pointer-events-none blur-3xl z-0" />
      <div className="absolute bottom-[20%] right-[5%] w-[40rem] h-[40rem] rounded-full bg-radial from-[#8E6D4E]/3 to-transparent pointer-events-none blur-3xl z-0" />

      {/* Inject custom styles dynamically to override color tokens across the app */}
      <style>{`
        :root {
          --primary-accent: ${primaryColorHex};
          --primary-hover: ${hoverColorHex};
          --primary-accent-glow: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15);
        }

        /* Continuous CSS Marquee for high-performance announcement bar */
        @keyframes marquee {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-loop {
          display: inline-flex;
          white-space: nowrap;
          animation: marquee 38s linear infinite;
        }
        .animate-marquee-loop:hover {
          animation-play-state: paused;
        }

        /* Slow decorative animation pulse */
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.35; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.08); }
        }
        .animate-ping-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        /* High-end rendering settings */
        body {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          text-rendering: optimizeLegibility;
        }

        /* Custom slow spin */
        @keyframes spin-slow {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 25s linear infinite;
        }

        /* Dynamically override Tailwind hardcoded color #8E6D4E in all generated classes */
        .bg-\\[\\#8E6D4E\\] { background-color: ${primaryColorHex} !important; }
        .hover\\:bg-\\[\\#725437\\]:hover { background-color: ${hoverColorHex} !important; }
        .text-\\[\\#8E6D4E\\] { color: ${primaryColorHex} !important; }
        .hover\\:text-\\[\\#8E6D4E\\]:hover { color: ${primaryColorHex} !important; }
        .after\\:bg-\\[\\#8E6D4E\\]::after { background-color: ${primaryColorHex} !important; }
        .border-\\[\\#8E6D4E\\] { border-color: ${primaryColorHex} !important; }
        
        /* Opacity variables for bg */
        .bg-\\[\\#8E6D4E\\]\\/5 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05) !important; }
        .bg-\\[\\#8E6D4E\\]\\/10 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important; }
        .bg-\\[\\#8E6D4E\\]\\/25 { background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important; }
        
        /* Opacity variables for border */
        .border-\\[\\#8E6D4E\\]\\/10 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important; }
        .border-\\[\\#8E6D4E\\]\\/15 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15) !important; }
        .border-\\[\\#8E6D4E\\]\\/20 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
        .border-\\[\\#8E6D4E\\]\\/25 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important; }
        .border-\\[\\#8E6D4E\\]\\/35 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35) !important; }
        .border-\\[\\#8E6D4E\\]\\/40 { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
        
        /* Hover borders */
        .hover\\:border-\\[\\#8E6D4E\\]\\/40:hover { border-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.4) !important; }
        
        /* Shadows */
        .shadow-\\[\\#8E6D4E\\]\\/10 { --tw-shadow-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.1) !important; }
        .hover\\:shadow-\\[\\#8E6D4E\\]\\/20:hover { --tw-shadow-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2) !important; }
        
        /* Selection styling */
        ::selection {
          background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25) !important;
          color: #ffffff !important;
        }
      `}</style>
      
      {settings && (
        <>
          {/* Top Persistent Announcement Marquee Bar */}
          {settings.announcementBarActive && settings.announcementBarText && (
            <div 
              style={{ 
                backgroundColor: settings.announcementBarBgColor || "#8E6D4E",
                color: settings.announcementBarTextColor || "#FFFFFF"
              }}
              className="w-full relative py-2.5 overflow-hidden border-b border-white/10 z-30 shadow-md flex items-center select-none"
            >
              <div className="flex w-full overflow-hidden text-xs font-bold font-sans">
                <div className="animate-marquee-loop gap-12 pr-12 flex">
                  <span>{settings.announcementBarText}</span>
                  <span>{settings.announcementBarText}</span>
                  <span>{settings.announcementBarText}</span>
                  <span>{settings.announcementBarText}</span>
                </div>
              </div>
            </div>
          )}

          {/* Header toolbar */}
          <Header 
            user={user}
            settings={settings}
            theme={themeMode}
            toggleTheme={handleToggleTheme}
            onOpenAuth={(type) => { setAuthModalType(type); setAuthModalOpen(true); }}
            onOpenTopup={() => setTopupModalOpen(true)}
            onOpenAdmin={() => setAdminPanelOpen(true)}
            onOpenHistory={() => setHistoryModalOpen(true)}
            onLogout={handleLogout}
            lang={lang}
            setLang={setLang}
          />

          {/* Banner Slider */}
          <Banners settings={settings} />

          {/* Homepage Beautiful Notice Board / Announcement Section */}
          {settings.announcementActive && (
            <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 sm:p-8 rounded-[2rem] border-2 border-[#8E6D4E]/30 bg-[#FAF7F2]/90 dark:bg-[#1C1815]/90 backdrop-blur-md relative overflow-hidden shadow-lg shadow-[#8E6D4E]/5 group"
              >
                {/* Decorative glowing gradient sphere */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-[#8E6D4E]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#8E6D4E]/10 transition-all duration-500" />
                
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center relative z-10">
                  {/* Left Side Icon with premium glow */}
                  <div className="flex-shrink-0 p-4 rounded-2xl bg-[#8E6D4E]/10 text-[#8E6D4E] border border-[#8E6D4E]/20 shadow-sm relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 bg-[#8E6D4E]/5 animate-ping-slow rounded-full pointer-events-none" />
                    <svg className="w-8 h-8 text-[#8E6D4E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>

                  {/* Middle Text Content */}
                  <div className="flex-1 space-y-2 text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#8E6D4E]/10 border border-[#8E6D4E]/20 text-[10px] tracking-widest uppercase font-black text-[#8E6D4E]">
                      {lang === "th" ? "📢 บอร์ดข่าวสารและประกาศประชาสัมพันธ์ร้านค้า" : lang === "zh" ? "📢 社区公告及资讯看板" : "📢 ANNOUNCEMENTS & INFORMATION"}
                    </div>
                    <h3 className="text-lg sm:text-xl font-serif font-black text-[#4E3B2C] dark:text-[#E2C7A9] tracking-tight">
                      {settings.announcementTitle || (lang === "th" ? "ยินดีต้อนรับสู่เว็บหัตถศิลป์ชุมชน" : lang === "zh" ? "欢迎来到喃内文创非遗社区" : "Welcome to Nam Noi Cultural Crafts")}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light leading-relaxed whitespace-pre-wrap">
                      {settings.announcementBody}
                    </p>
                  </div>

                  {/* Optional announcement image right-side with high-end framing */}
                  {settings.announcementImageUrl && (
                    <div className="w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden border border-[#8E6D4E]/20 bg-stone-900 shadow-sm flex-shrink-0">
                      <img 
                        src={settings.announcementImageUrl} 
                        alt="Announcement Info" 
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" 
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            </section>
          )}

          {/* Main Grid Categories And Product listing */}
          <CategoriesAndProducts 
            categories={categories}
            products={products}
            settings={settings}
            onSelectProduct={(p) => setSelectedProduct(p)}
            lang={lang}
          />

          {/* About Us Section */}
          <section id="about-us-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-[#FAF7F2] dark:bg-[#1A1613] p-8 sm:p-12 rounded-3xl border border-[#8E6D4E]/15 shadow-sm">
              <div className="lg:col-span-5 space-y-4">
                <div className="inline-flex items-center gap-1.5 text-[10px] text-[#8E6D4E] uppercase tracking-widest font-extrabold">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8E6D4E]"></span>
                  <span>{getTranslation(lang, "aboutUs")}</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-serif font-black text-[#4E3B2C] dark:text-[#E2C7A9] tracking-tight leading-tight">
                  {lang === "th" && settings.aboutUsTitle ? settings.aboutUsTitle : getTranslation(lang, "aboutUsTitle")}
                </h3>
                <div className="w-12 h-1 bg-[#8E6D4E] rounded"></div>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 font-light leading-relaxed whitespace-pre-wrap">
                  {lang === "th" && settings.aboutUsBody ? settings.aboutUsBody : getTranslation(lang, "aboutUsBody")}
                </p>
              </div>

              <div className="lg:col-span-7 flex justify-center">
                <div className="relative w-full max-w-lg aspect-[4/3] rounded-2xl overflow-hidden border border-[#8E6D4E]/20 bg-stone-900 shadow-md">
                  <img 
                    src={settings.aboutUsImageUrl || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=1200"} 
                    alt="About Us" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover hover:scale-103 transition-transform duration-700" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/40 to-transparent pointer-events-none" />
                </div>
              </div>
            </div>
          </section>

          {/* Portfolios Section */}
          <section id="portfolios-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="text-center space-y-2 mb-10">
              <span className="text-[10px] text-[#8E6D4E] uppercase tracking-widest font-extrabold">
                MASTERPIECE GALLERY
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-[#4E3B2C] dark:text-[#E2C7A9]">
                {getTranslation(lang, "portfoliosTitle")}
              </h3>
              <p className="text-xs text-stone-500 max-w-lg mx-auto font-light">
                {getTranslation(lang, "portfoliosSub")}
              </p>
              <div className="w-16 h-0.5 bg-[#8E6D4E] mx-auto mt-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(settings.portfolios || []).map((port) => (
                <div 
                  key={port.id} 
                  className="group bg-white dark:bg-[#1A1613] rounded-2xl overflow-hidden border border-[#8E6D4E]/10 hover:border-[#8E6D4E]/30 transition-all duration-300 hover:shadow-md flex flex-col"
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-stone-900 border-b border-[#8E6D4E]/10">
                    <img 
                      src={port.imageUrl || "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&q=80&w=800"} 
                      alt={port.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  <div className="p-5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-serif font-bold text-[#4E3B2C] dark:text-[#E2C7A9] text-base group-hover:text-[#8E6D4E] transition-colors">
                        {port.title}
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 font-light leading-relaxed whitespace-pre-wrap">
                        {port.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              {(settings.portfolios || []).length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-12 bg-[#FAF7F2]/50 dark:bg-[#161311] rounded-2xl border border-dashed border-[#8E6D4E]/20 text-stone-500 text-xs">
                  {getTranslation(lang, "emptyPortfolios")}
                </div>
              )}
            </div>
          </section>

          {/* Artisans Section */}
          <section id="artisans-section" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 scroll-mt-20">
            <div className="text-center space-y-2 mb-10">
              <span className="text-[10px] text-[#8E6D4E] uppercase tracking-widest font-extrabold">
                OUR CRAFTSMEN
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-semibold text-[#4E3B2C] dark:text-[#E2C7A9]">
                {getTranslation(lang, "artisansTitle")}
              </h3>
              <p className="text-xs text-stone-500 max-w-lg mx-auto font-light">
                {getTranslation(lang, "artisansSub")}
              </p>
              <div className="w-16 h-0.5 bg-[#8E6D4E] mx-auto mt-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {(settings.artisans || []).map((art) => (
                <div 
                  key={art.id} 
                  className="bg-[#FAF7F2] dark:bg-[#1C1815] p-6 rounded-2xl border border-[#8E6D4E]/10 hover:border-[#8E6D4E]/30 transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center sm:items-start"
                >
                  <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-[#8E6D4E]/30 shadow-sm flex-shrink-0 bg-stone-900">
                    <img 
                      src={art.imageUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400"} 
                      alt={art.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <div className="flex-grow text-center sm:text-left space-y-2 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                      <h4 className="font-serif font-bold text-[#4E3B2C] dark:text-[#E2C7A9] text-base truncate">
                        {art.name}
                      </h4>
                      <span className="inline-block text-[9px] bg-[#8E6D4E]/10 dark:bg-[#8E6D4E]/20 text-[#8E6D4E] dark:text-[#E2C7A9] font-bold px-2 py-0.5 rounded-full border border-[#8E6D4E]/15 self-center sm:self-auto whitespace-nowrap">
                        {art.expertise}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 dark:text-stone-400 font-light leading-relaxed whitespace-pre-wrap">
                      {art.bio}
                    </p>
                  </div>
                </div>
              ))}
              {(settings.artisans || []).length === 0 && (
                <div className="col-span-1 md:col-span-2 text-center py-12 bg-[#FAF7F2]/50 dark:bg-[#161311] rounded-2xl border border-dashed border-[#8E6D4E]/20 text-stone-500 text-xs">
                  {getTranslation(lang, "emptyArtisans")}
                </div>
              )}
            </div>
          </section>

          {/* Quick Stats banner for high professional presentation */}
          <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-10 rounded-3xl border border-[#8E6D4E]/20 bg-[#FAF7F2] dark:bg-[#1C1815] transition-all duration-300 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <span className="text-[10px] text-[#8E6D4E] uppercase tracking-widest font-extrabold flex items-center justify-center md:justify-start gap-1">
                  <ShieldCheck size={14} className="text-[#8E6D4E]" />
                  <span>{getTranslation(lang, "statsSystem")}</span>
                </span>
                <h4 className="text-xl font-serif font-semibold text-[#4E3B2C] dark:text-[#E2C7A9]">{getTranslation(lang, "statsQuestion")}</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed font-light">
                  {getTranslation(lang, "statsBody")}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a 
                  href={settings.contactFacebook}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#8E6D4E] hover:bg-[#725437] text-white font-bold text-xs px-5 py-3.5 rounded-xl transition-all hover:scale-[1.02] flex items-center gap-1.5 shadow"
                >
                  <Mail size={13} />
                  <span>{getTranslation(lang, "statsReserveBtn")}</span>
                </a>
                <a 
                  href="https://maps.google.com/?q=ตำบลน้ำน้อย+หาดใหญ่" 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-white dark:bg-[#151210] text-[#735A45] dark:text-stone-300 hover:text-[#8E6D4E] border border-[#8E6D4E]/35 text-xs font-bold px-5 py-3.5 rounded-xl transition-all flex items-center gap-1"
                >
                  <span>{getTranslation(lang, "statsLocBtn")}</span>
                  <ArrowUpRight size={13} />
                </a>
              </div>
            </div>
          </section>

          {/* Interactive Map of Nam Noi Subdistrict Municipality */}
          <NamNoiMap settings={settings} lang={lang} />

          {/* Footer of Shop */}
          <footer className="border-t border-[#8E6D4E]/15 bg-[#FAF7F2] dark:bg-[#141210] py-14 mt-20 text-[#4E3B2C] dark:text-stone-300">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                <div className="md:col-span-6 space-y-3">
                  <h3 className="text-lg font-serif font-bold tracking-wide text-[#8E6D4E]">{settings.siteName}</h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md leading-relaxed font-light">
                    {lang === "th" 
                      ? "แพลตฟอร์มเผยแพร่หัตถกร ช่างสิบหมู่ และหัตถศิลป์ OTOP ประจำเทศบาลตำบลน้ำน้อย อำเภอหาดใหญ่ จังหวัดสงขลา มุ่งสร้างสรรค์งานทำมือแท้ให้สอดรับกับการขยายตัวทางอาชีพอย่างยั่งยืน" 
                      : lang === "zh"
                        ? "宋卡府合艾郡喃内区市政厅非遗特色文创、手工艺与 OTOP 数字化推广平台，致力于保护传统手作、促进社区就业可持续增长。"
                        : "Digital promotion platform for Intangible Cultural Heritage crafts, Master Artisans, and OTOP works under the Nam Noi Subdistrict Municipality, Hat Yai, Songkhla."
                    }
                  </p>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8E6D4E]">
                    {lang === "th" ? "ลิงก์นำทาง" : lang === "zh" ? "导航" : "Navigation"}
                  </h4>
                  <ul className="text-xs space-y-2 text-stone-500 dark:text-stone-400 font-light">
                    <li><a href="#homepage" className="hover:text-[#8E6D4E]">{getTranslation(lang, "home")}</a></li>
                    <li><a href="#recommended-products" className="hover:text-[#8E6D4E]">{getTranslation(lang, "products")}</a></li>
                    <li><button onClick={() => { setAuthModalType("login"); setAuthModalOpen(true); }} className="hover:text-[#8E6D4E] text-left cursor-pointer">{getTranslation(lang, "login")}</button></li>
                  </ul>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <h4 className="text-xs uppercase tracking-wider font-semibold text-[#8E6D4E]">
                    {lang === "th" ? "ช่องทางสนับสนุน" : lang === "zh" ? "社交网络" : "Social Network"}
                  </h4>
                  <div className="flex items-center gap-3">
                    <a href={settings.contactFacebook} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#8E6D4E]/10 hover:bg-[#8E6D4E] text-[#8E6D4E] hover:text-white transition-all flex items-center justify-center text-xs font-bold shadow-sm">
                      FB
                    </a>
                    <a href={settings.contactDiscord} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#8E6D4E]/10 hover:bg-[#8E6D4E] text-[#8E6D4E] hover:text-white transition-all flex items-center justify-center text-xs font-bold shadow-sm">
                      <Disc size={14} />
                    </a>
                    <a href={settings.contactLine} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-[#8E6D4E]/10 hover:bg-[#8E6D4E] text-[#8E6D4E] hover:text-white transition-all flex items-center justify-center text-xs font-bold shadow-sm">
                      LN
                    </a>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-[#8E6D4E]/10 pt-8 gap-4 text-[11px] text-stone-400 dark:text-stone-500">
                <p>© 2026 {settings.siteName}. {getTranslation(lang, "footerRights")}</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="font-mono text-[10px]">
                    {lang === "th" ? "ระบบอุดหนุนแบบปลอดภัยสูง" : lang === "zh" ? "高安全赞助与结算系统" : "Secure Patronage & Checkout System"}
                  </span>
                </div>
              </div>
            </div>
          </footer>

          {/* --- ALL INTERACTIVE MODALS --- */}
          <AnimatePresence>
            {/* 1. Auth Login / Register Modal */}
            {authModalOpen && (
              <AuthModal 
                initialType={authModalType}
                settings={settings}
                onClose={() => setAuthModalOpen(false)}
                onLoginSuccess={handleLoginSuccess}
              />
            )}

            {/* 2. Topup Menu Bank Transfer QR Slip */}
            {topupModalOpen && (
              <TopupModal 
                user={user}
                settings={settings}
                onClose={() => { setQrSuccessMessage(""); setTopupModalOpen(false); }}
                onTopupSuccess={handleTopupSuccess}
              />
            )}

            {/* 3. Product Specification Details */}
            {selectedProduct && (
              <ProductDetailModal 
                product={selectedProduct}
                user={user}
                settings={settings}
                reviews={reviews}
                onClose={() => setSelectedProduct(null)}
                onPurchase={handlePurchaseProduct}
                lang={lang}
              />
            )}

            {/* 4. Executive Admin Control Panel */}
            {adminPanelOpen && user?.role === "admin" && (
              <AdminPanel 
                user={user}
                settings={settings}
                categories={categories}
                products={products}
                coupons={coupons}
                onClose={() => setAdminPanelOpen(false)}
                onUpdateSettings={handleAdminUpdateSettings}
                onRefreshData={loadStoreData}
              />
            )}

            {/* 5. Personal Transaction purchase history modal */}
            {historyModalOpen && user && (
              <HistoryModal 
                user={user}
                settings={settings}
                onClose={() => setHistoryModalOpen(false)}
                onAddReview={handleAddReview}
                lang={lang}
              />
            )}

            {/* 6. Announcement Welcome Popup Modal */}
            {announcementOpen && settings && settings.announcementActive && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  transition={{ type: "spring", damping: 25, stiffness: 120 }}
                  className="w-full max-w-lg rounded-[2.5rem] bg-gradient-to-b from-[#FCFAF7] to-[#F5F2EA] dark:from-[#1C1815] dark:to-[#12100E] border-2 border-[#8E6D4E]/30 overflow-hidden shadow-2xl relative"
                >
                  {/* Decorative corner accents */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#8E6D4E]/5 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-[#8E6D4E]/5 rounded-full blur-xl pointer-events-none" />

                  {/* Top Close Button */}
                  <button
                    onClick={() => {
                      sessionStorage.setItem("hasSeenAnnouncement", "true");
                      setAnnouncementOpen(false);
                    }}
                    className="absolute top-4 right-4 p-2.5 rounded-full bg-stone-500/10 hover:bg-[#8E6D4E]/15 text-[#4E3B2C] dark:text-stone-300 transition-colors cursor-pointer z-20"
                  >
                    <span className="sr-only">{getTranslation(lang, "close")}</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>

                  {/* Header Image if present */}
                  {settings.announcementImageUrl && (
                    <div className="w-full aspect-[21/9] bg-stone-100 dark:bg-stone-900/60 overflow-hidden relative border-b border-[#8E6D4E]/15">
                      <img 
                        src={settings.announcementImageUrl} 
                        alt="Announcement Banner" 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />
                    </div>
                  )}

                  {/* Text Contents */}
                  <div className="p-8 text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8E6D4E]/10 border border-[#8E6D4E]/20 text-[10px] tracking-widest uppercase font-black text-[#8E6D4E]">
                      {lang === "th" ? "📢 ข่าวสารและประกาศจากเทศบาล" : lang === "zh" ? "📢 市政厅公告与资讯" : "📢 MUNICIPAL NEWS & ANNOUNCEMENTS"}
                    </div>

                    <h3 className="text-2xl sm:text-3xl font-serif text-[#4E3B2C] dark:text-[#E2C7A9] tracking-tight leading-tight font-bold">
                      {settings.announcementTitle || (lang === "th" ? "ยินดีต้อนรับสู่ร้านค้าชุมชน" : lang === "zh" ? "欢迎来到喃内文创非遗社区" : "Welcome to Nam Noi Cultural Crafts")}
                    </h3>

                    <div className="text-xs sm:text-sm text-slate-600 dark:text-stone-300 leading-relaxed font-light whitespace-pre-wrap max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                      {settings.announcementBody}
                    </div>

                    {/* Bottom CTA / Confirm action */}
                    <div className="pt-4">
                      <button
                        onClick={() => {
                          sessionStorage.setItem("hasSeenAnnouncement", "true");
                          setAnnouncementOpen(false);
                        }}
                        className="w-full sm:w-auto px-10 py-3.5 rounded-2xl bg-[#8E6D4E] hover:bg-[#725437] text-white text-xs font-bold transition-all duration-300 shadow-lg shadow-[#8E6D4E]/15 cursor-pointer active:scale-95 hover:scale-[1.02]"
                      >
                        {lang === "th" ? "รับทราบและเข้าสู่เว็บไซต์" : lang === "zh" ? "确认并进入网站" : "Acknowledge and Enter Site"}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Simulated SweetAlert2 Popups screen */}
            {swalAlert?.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-3xl bg-[#16161A] border border-white/10 p-6 text-center space-y-4 shadow-2xl relative"
                >
                  {/* Swal Icon display based on type */}
                  <div className="flex justify-center">
                    {swalAlert.type === "success" ? (
                      <div className="w-14 h-14 rounded-full bg-emerald-500/10 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                        <Check size={26} className="animate-bounce" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center text-red-400">
                        <AlertTriangle size={26} className="animate-pulse" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">{swalAlert.title}</h4>
                    <p className="text-xs text-slate-400 leading-normal">{swalAlert.text}</p>
                  </div>

                  {/* Delivered Product / Key details zone (extremely useful for gamer stores) */}
                  {swalAlert.deliveredData && (
                    <div className="relative text-left rounded-xl bg-[#0A0A0B] p-3.5 border border-white/10 space-y-1 select-all selection:bg-red-500/20 font-mono text-[10.5px]">
                      <span className="text-[9.5px] uppercase font-bold text-slate-500 block mb-1">
                        {lang === "th" ? "รหัสสินค้าที่ได้รับจัดส่ง:" : lang === "zh" ? "已配送的产品兑换凭证码:" : "Delivered product redemption keys:"}
                      </span>
                      <pre className="text-amber-400 font-bold break-all whitespace-pre-line">{swalAlert.deliveredData}</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(swalAlert.deliveredData || "");
                          alert(getTranslation(lang, "copiedNotify"));
                        }}
                        className="absolute top-2.5 right-2.5 p-1 rounded-md bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all cursor-pointer"
                        title="Copy code"
                      >
                        <Copy size={11} />
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setSwalAlert(null)}
                    className="w-full py-2.5 bg-[#16161A] border border-white/10 hover:bg-[#1C1C22] text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {lang === "th" ? "ตกลง ยืนยัน" : lang === "zh" ? "确认" : "OK, Confirm"}
                  </button>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </>
      )}

    </div>
  );
}

// Global quick helper qr loader state helper
let setQrSuccessMessage = (val: string) => {};
