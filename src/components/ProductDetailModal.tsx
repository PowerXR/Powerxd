import React, { useState, useEffect } from "react";
import { Product, AppSettings, Coupon, Review, User } from "../types";
import { X, Calendar, MessageSquare, ShieldAlert, Star, AlertCircle, ShoppingCart, Ticket, Sparkles, Check, Heart, Feather } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ProductDetailModalProps {
  product: Product;
  user: User | null;
  settings: AppSettings;
  reviews: Review[];
  onClose: () => void;
  onPurchase: (
    productId: string, 
    quantity: number, 
    couponCode: string,
    shippingDetails?: { name: string; phone: string; address: string; zip: string; method: string; fee: number }
  ) => Promise<any>;
}

export default function ProductDetailModal({
  product,
  user,
  settings,
  reviews,
  onClose,
  onPurchase
}: ProductDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "reviews">("details");
  const [quantity, setQuantity] = useState<number>(1);
  const [couponInput, setCouponInput] = useState<string>("");
  const [couponApplied, setCouponApplied] = useState<Coupon | null>(null);
  const [couponError, setCouponError] = useState<string>("");
  const [verifyLoading, setVerifyLoading] = useState<boolean>(false);
  const [purchaseLoading, setPurchaseLoading] = useState<boolean>(false);

  // Shopee-like shipping form states
  const [shippingName, setShippingName] = useState<string>(user?.username || "");
  const [shippingPhone, setShippingPhone] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState<string>("");
  const [shippingZip, setShippingZip] = useState<string>("");
  const [shippingMethod, setShippingMethod] = useState<"standard" | "express" | "economy">("standard");

  const shippingFees = {
    standard: 45,
    express: 80,
    economy: 30
  };

  const currentShippingFee = shippingFees[shippingMethod];

  // Filter reviews for this product
  const productReviews = reviews.filter((r) => r.productId === product.id);

  // Recalculate price
  const isOutOfStock = product.stock.length < 1;
  const maxStock = product.stock.length;
  const unitPrice = product.price;
  const originalTotalPrice = unitPrice * quantity;

  let finalTotalPrice = originalTotalPrice;
  if (couponApplied) {
    if (couponApplied.discountPercent > 0) {
      finalTotalPrice = parseFloat((originalTotalPrice * (1 - couponApplied.discountPercent / 100)).toFixed(2));
    } else if (couponApplied.discountBaht > 0) {
      finalTotalPrice = Math.max(0, originalTotalPrice - couponApplied.discountBaht);
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setVerifyLoading(true);
    setCouponError("");
    setCouponApplied(null);

    try {
      const res = await fetch(`/api/coupons/verify?code=${encodeURIComponent(couponInput)}`);
      const text = await res.text();
      if (!text || text.trim().startsWith("<")) {
        setCouponError("รูปแบบรหัสส่วนลดไม่ถูกต้อง");
        return;
      }
      const data = JSON.parse(text);
      if (!res.ok || !data.success) {
        setCouponError(data.error || "รหัสส่วนลดไม่ถูกต้องหรือพ้นการใช้งานแล้ว");
      } else {
        setCouponApplied(data);
      }
    } catch (e) {
      setCouponError("ไม่สามารถสื่อสารกับเซิร์ฟเวอร์");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handlePurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อนอุดหนุนสินค้าสิ่งวิเศษของชุมชน");
      return;
    }
    if (isOutOfStock) return;
    if (quantity > maxStock) {
      alert("ความต้องการซื้อเกินจำนวนที่มีในคลังขณะนี้");
      return;
    }

    if (!shippingName.trim() || !shippingPhone.trim() || !shippingAddress.trim() || !shippingZip.trim()) {
      alert("⚠️ กรุณากรอกข้อมูลจัดส่งและระบุเบอร์ติดต่อให้ครบถ้วนก่อนส่งใบสั่งซื้อนะคะ (ระบบจัดส่ง Shopee Delivery)");
      return;
    }

    const shippingDetails = {
      name: shippingName,
      phone: shippingPhone,
      address: shippingAddress,
      zip: shippingZip,
      method: shippingMethod,
      fee: currentShippingFee
    };

    setPurchaseLoading(true);
    try {
      const data = await onPurchase(product.id, quantity, couponApplied?.code || "", shippingDetails);
      if (data && data.success) {
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPurchaseLoading(false);
    }
  };

  const activeColor = "text-[#8E6D4E]";
  const themeButton = "bg-[#8E6D4E] hover:bg-[#725437] text-white shadow-md shadow-[#8E6D4E]/15 disabled:opacity-50";
  const themeBorder = "border-[#8E6D4E]/25";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl max-h-[92vh] md:max-h-[85vh] flex flex-col rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/15 p-4 sm:p-7 shadow-2xl z-10 overflow-hidden text-[#4E3B2C] dark:text-stone-200"
      >
        
        {/* Header toolbar - Fixed at top */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#8E6D4E]/10 relative z-10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-[#8E6D4E]/10 text-[#8E6D4E] border border-[#8E6D4E]/20">
              หัตถศิลป์ล้ำค่าชุมชนน้ำน้อย
            </span>
            <span className="text-xs text-stone-500">คงเหลือในคลัง: {product.stock.length} ชิ้น</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-[#8E6D4E] transition-all cursor-pointer hover:rotate-90 duration-250"
            title="ปิดหน้าต่างนี้"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal body Content split layout - Scrollable internally */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 pt-4 sm:pt-5 relative z-10 overflow-y-auto flex-1 pr-1.5 scrollbar-thin">
          
          {/* LEFT: Product thumbnail with warning notice */}
          <div className="md:col-span-12 lg:col-span-5 flex flex-col gap-4">
            <div className="aspect-[4/3] bg-white dark:bg-stone-900 rounded-2xl overflow-hidden border border-[#8E6D4E]/10 relative shadow-sm">
              <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
            </div>

            {/* Warn Notice banner exactly as requested in mockup */}
            <div className="p-4 rounded-2xl border border-[#8E6D4E]/25 bg-[#FCFAF7] dark:bg-[#201C18] text-[#8E6D4E] flex gap-2.5 items-start">
              <Feather size={16} className="mt-0.5 flex-shrink-0 text-[#8E6D4E]" />
              <div>
                <h5 className="text-[11px] font-bold uppercase text-[#8E6D4E] mb-0.5">การรับรองงานฝีมือแท้ 100%</h5>
                <p className="text-[10px] leading-relaxed text-stone-500 dark:text-stone-400">
                  ผลิตภัณฑ์ชิ้นนี้เขียนลายและถักทอด้วยมือจากช่างท้องถิ่นน้ำน้อย หากพบตำหนิชำรุดจากการผลิตใดๆ ชุมชนยินดีเปลี่ยนชิ้นใหม่ในเงื่อนไข 7 วัน เพื่อพิทักษ์ความพึงพอใจของท่านผู้มีอุปการคุณสูงสุด
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Ordering parameters and Details */}
          <div className="md:col-span-12 lg:col-span-7 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-serif font-bold text-[#4E3B2C] dark:text-[#EAE3DA] sm:text-2xl leading-snug">{product.name}</h2>
              
              {/* Nav Tabs specs or reviews */}
              <div className="flex gap-4 border-b border-[#8E6D4E]/10 mt-4 mb-4">
                <button 
                  onClick={() => setActiveTab("details")}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer ${
                    activeTab === "details" ? `${activeColor} border-[#8E6D4E]` : 'text-stone-400 border-transparent hover:text-[#8E6D4E]'
                  }`}
                >
                  รายละเอียดผลิตภัณฑ์
                </button>
                <button 
                  onClick={() => setActiveTab("reviews")}
                  className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 cursor-pointer flex items-center gap-1.5 ${
                    activeTab === "reviews" ? `${activeColor} border-[#8E6D4E]` : 'text-stone-400 border-transparent hover:text-[#8E6D4E]'
                  }`}
                >
                  <span>รีวิวการใช้สอบคุณหลวง ({productReviews.length})</span>
                  <div className="flex items-center text-amber-550 text-[10px]">
                    <Star size={10} className="fill-current text-amber-500" />
                    <span className="ml-0.5 text-stone-600 dark:text-stone-300">{productReviews.length > 0 ? (productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length).toFixed(1) : "5.0"}</span>
                  </div>
                </button>
              </div>

              {/* Tab content renderer */}
              <div className="max-h-52 overflow-y-auto pr-2 mb-4">
                {activeTab === "details" ? (
                  <div className="text-xs text-stone-600 dark:text-stone-300 space-y-3 mt-1 leading-relaxed whitespace-pre-line font-light">
                    {product.details ? (
                      <div className="markdown-body">
                        {product.details}
                      </div>
                    ) : (
                      <div>
                        <p className="text-stone-500">{product.description}</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1 text-stone-400">
                          <li>สิทธิประโยชน์ร่วมทอดกฐินและส่งเสริมสัมมาชีพรายย่อยประจำปี</li>
                          <li>หีบห่อด้วยวัสดุธรรมชาติรักสิ่งแวดล้อมเพื่อลดขยะพลาสติก</li>
                          <li>ยินดีเปลี่ยนรหัสจัดส่งหรือตรวจสอบสินค้าได้อย่างสะดวกรวดเร็วทางหน้าประวัติ</li>
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 mt-1">
                    {productReviews.length === 0 ? (
                      <div className="text-center py-6 text-stone-400 text-xs font-light">ขณะนี้ยังไม่มีรีวิวเพิ่มเติมสำหรับการสั่งสินค้ารอบนี้ อุดหนุนแล้วมาเขียนรีวิวท่านแรกได้เลยค่ะ!</div>
                    ) : (
                      productReviews.map((rev) => (
                        <div key={rev.id} className="p-4 rounded-2xl bg-white dark:bg-[#151210] border border-[#8E6D4E]/10 space-y-1.5 shadow-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-[#4E3B2C] dark:text-slate-200">{rev.username}</span>
                            <div className="flex text-amber-500">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={10} className={i < rev.rating ? "fill-current" : "opacity-25"} />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 font-light">{rev.comment}</p>
                          <span className="text-[9px] text-stone-400 block">{new Date(rev.date).toLocaleDateString("th-TH")}</span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Buying footer section */}
            <div className="pt-4 border-t border-[#8E6D4E]/10">
              <form onSubmit={handlePurchaseSubmit} className="space-y-3.5">
                
                {/* Coupon Code section */}
                <div className="bg-white dark:bg-[#151210] p-3 rounded-2xl border border-[#8E6D4E]/15 flex flex-col gap-2.5 shadow-inner">
                  <div className="flex items-center justify-between">
                    <span className="text-[#4E3B2C] dark:text-stone-300 text-xs font-bold flex items-center gap-1">
                      <Ticket size={14} className="text-[#8E6D4E]" />
                      <span>กรอกรหัสส่วนลดพิเศษชุมชน (Coupon Code)</span>
                    </span>
                    {couponApplied && (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg animate-pulse">
                        <Check size={10} />
                        ลด {couponApplied.discountPercent > 0 ? `${couponApplied.discountPercent}%` : `${couponApplied.discountBaht} ฿`}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="รหัสลดพิเศษ เช่น SUPPORTNAMNOI, MUNICIPAL100..."
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      disabled={purchaseLoading}
                      className="flex-1 bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/15 text-xs rounded-xl px-3.5 py-2.5 text-[#4E3B2C] dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E] focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={verifyLoading || purchaseLoading}
                      className="bg-stone-100 dark:bg-stone-800 border border-[#8E6D4E]/20 hover:bg-[#8E6D4E]/10 disabled:opacity-50 text-[#715437] dark:text-stone-300 text-xs font-bold px-4 rounded-xl transition-colors cursor-pointer"
                    >
                      {verifyLoading ? "ตรวจบิล..." : "ใช้รหัส"}
                    </button>
                  </div>
                  {couponError && <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>}
                </div>

                {/* Shopee-like shipping form section */}
                <div className="bg-[#FAF7F2]/60 dark:bg-[#1C1815]/60 p-4 rounded-2xl border border-[#8E6D4E]/15 space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-[#8E6D4E] font-bold pb-1.5 border-b border-[#8E6D4E]/10">
                    <span className="text-base">🚚</span>
                    <h4 className="font-serif text-sm">ข้อมูลที่อยู่จัดส่งสินค้าชุมชน (Shopee Delivery Service)</h4>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">ชื่อ-นามสกุล ผู้รับสินค้า *</label>
                      <input 
                        type="text"
                        required
                        placeholder="เช่น นายแสนดี พรมิ่งมงคล"
                        value={shippingName}
                        onChange={(e) => setShippingName(e.target.value)}
                        className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl p-2.5 text-[#4E3B2C] dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">เบอร์โทรศัพท์ติดต่อ *</label>
                      <input 
                        type="tel"
                        required
                        placeholder="เช่น 081-234-5678"
                        value={shippingPhone}
                        onChange={(e) => setShippingPhone(e.target.value)}
                        className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl p-2.5 text-[#4E3B2C] dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] text-stone-500 font-bold mb-1">ที่อยู่นำส่งโดยละเอียด (เลขที่รหัส, ถนน, ซอย, ตำบล/อำเภอ, จังหวัด) *</label>
                    <textarea 
                      required
                      rows={2}
                      placeholder="เช่น 99/9 หมู่ 2 ต.ปาดังเบซาร์ อ.สะเดา จ.สงขลา"
                      value={shippingAddress}
                      onChange={(e) => setShippingAddress(e.target.value)}
                      className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl p-2.5 text-[#4E3B2C] dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] text-stone-500 font-bold mb-1">รหัสไปรษณีย์ *</label>
                      <input 
                        type="text"
                        required
                        placeholder="เช่น 90110"
                        value={shippingZip}
                        onChange={(e) => setShippingZip(e.target.value)}
                        className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl p-2.5 text-[#4E3B2C] dark:text-stone-100 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-[#8E6D4E] font-bold mb-1">ตัวเลือกช่องทางส่งพัสดุ *</label>
                      <select
                        value={shippingMethod}
                        onChange={(e) => setShippingMethod(e.target.value as any)}
                        className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl p-2.5 text-[#4E3B2C] dark:text-stone-100 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E] font-semibold"
                      >
                        <option value="standard">🚚 Standard Delivery (+45.00 ฿)</option>
                        <option value="express">⚡ Express Delivery (+80.00 ฿)</option>
                        <option value="economy">🍃 Economy Saving (+30.00 ฿)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Pricing & buy actions bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-stone-450 block font-serif text-slate-400">มูลค่าสนับสนุนรวมค่าจัดส่งสุทธิ</span>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-serif font-black text-[#8E6D4E] tracking-tight">
                        {(finalTotalPrice + currentShippingFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[#8E6D4E] text-xs">บาท (THB)</span>
                      {couponApplied && (
                        <span className="text-xs text-stone-400 line-through">
                          {(originalTotalPrice + currentShippingFee).toFixed(2)} บาท
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-stone-450 text-stone-400 font-light">
                      (ค่าสินค้า {finalTotalPrice.toFixed(2)} ฿ + พัสดุ {currentShippingFee.toFixed(2)} ฿)
                    </p>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    {/* Quantity selectors */}
                    {!isOutOfStock && (
                      <div className="bg-white dark:bg-[#151210] p-1.5 rounded-2xl border border-[#8E6D4E]/15 flex items-center justify-between gap-3 shadow-sm select-none">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-7 h-7 bg-stone-100 dark:bg-stone-800 hover:bg-[#8E6D4E]/10 rounded-lg text-stone-600 dark:text-stone-200 font-bold flex items-center justify-center cursor-pointer p-0 select-none"
                        >
                          -
                        </button>
                        <span className="text-sm font-black text-[#4E3B2C] dark:text-stone-100 w-4 text-center">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                          className="w-7 h-7 bg-stone-100 dark:bg-stone-800 hover:bg-[#8E6D4E]/10 rounded-lg text-stone-600 dark:text-stone-200 font-bold flex items-center justify-center cursor-pointer p-0 select-none"
                        >
                          +
                        </button>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isOutOfStock || purchaseLoading}
                      className={`flex-1 sm:px-8 py-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] ${
                        isOutOfStock ? "bg-stone-200 dark:bg-stone-800 text-stone-400 dark:text-stone-500 cursor-not-allowed" : themeButton
                      }`}
                    >
                      <ShoppingCart size={15} />
                      <span>{isOutOfStock ? "สินค้าหมด" : "สนับสนุนซื้อสินค้านี้"}</span>
                    </button>
                  </div>
                </div>

              </form>
            </div>
          </div>
          
        </div>

      </motion.div>
    </div>
  );
}
