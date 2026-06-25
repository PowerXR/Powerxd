import React, { useState, useEffect } from "react";
import { User, Transaction, AppSettings, Review } from "../types";
import { X, Calendar, DollarSign, Gift, Star, Clock, ShoppingBag, Eye, HeartHandshake, Truck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface HistoryModalProps {
  user: User;
  settings: AppSettings;
  onClose: () => void;
  onAddReview: (productId: string, rating: number, comment: string) => Promise<any>;
}

export default function HistoryModal({
  user,
  settings,
  onClose,
  onAddReview
}: HistoryModalProps) {
  const [txs, setTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Review Submitting states
  const [showReviewForm, setShowReviewForm] = useState<string | null>(null); // Transaction ID
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [reviewLoading, setReviewLoading] = useState(false);

  const fetchTxs = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions", {
        headers: {
          "X-User-Id": user.id,
          "X-User-Role": user.role
        }
      });
      const text = await res.text();
      if (text && !text.trim().startsWith("<")) {
        const data = JSON.parse(text);
        setTxs(data);
      } else {
        console.warn("Invalid non-JSON transactions data returned", text.slice(0, 100));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTxs();
  }, [user.id]);

  const handleReviewSubmit = async (e: React.FormEvent, tx: any) => {
    e.preventDefault();
    if (!reviewComment) return;

    // Map to updated products database
    let productId = "prod-3"; // Default Honey
    if (tx.details.includes("ผ้าบาติก")) productId = "prod-1";
    if (tx.details.includes("จักสาน")) productId = "prod-2";
    if (tx.details.includes("สปา") || tx.details.includes("สบู่")) productId = "prod-4";

    setReviewLoading(true);
    try {
      await onAddReview(productId, reviewRating, reviewComment);
      alert("บันทึกการรีวิวและมอบดวงดีให้กลุ่มวิสาหกิจน้ำน้อยประทับตราสำเร็จ! ขอบพระคุณอย่างยิ่งค่ะ");
      setShowReviewForm(null);
      setReviewComment("");
    } catch (err) {
      console.error(err);
    } finally {
      setReviewLoading(false);
    }
  };

  const activeColor = "text-[#8E6D4E]";
  const badgeColors = (type: string) => {
    if (type.startsWith("topup_")) return "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20";
    return "bg-[#8E6D4E]/10 text-[#8E6D4E] border border-[#8E6D4E]/20";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/15 p-5 sm:p-7 shadow-2xl z-10 flex flex-col max-h-[92vh] md:max-h-[85vh] text-[#4E3B2C] dark:text-stone-200"
      >
        {/* Title */}
        <div className="flex items-center justify-between pb-3.5 border-b border-[#8E6D4E]/10 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={16} className={activeColor} />
            <h3 className="font-serif font-bold text-[#4E3B2C] dark:text-[#EAE3DA] text-base">ประวัติสั่งอุดหนุนและสมทบทุนชุมชน</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-[#8E6D4E] transition-all cursor-pointer hover:rotate-90 duration-250"
            title="ปิดหน้าต่างนี้"
          >
            <X size={16} />
          </button>
        </div>

        {/* List scroll panel */}
        <div className="flex-1 overflow-y-auto my-4 space-y-3.5 pr-1">
          {loading ? (
            <p className="text-center py-12 text-stone-450 text-xs animate-pulse">กำลังเรียกดูบัญชีบัญชีส่วนบุคคล...</p>
          ) : txs.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#151210] rounded-2xl border border-[#8E6D4E]/15 shadow-sm">
              <p className="text-stone-400 text-xs font-light">คุณยังไม่มีสถิติสั่งอุดหนุนสินค้าในประวัติขณะนี้</p>
            </div>
          ) : (
            txs.map((tx, idx) => (
              <div 
                key={`${tx.id}-${idx}`} 
                className="p-4 rounded-2xl bg-white dark:bg-[#151210] border border-[#8E6D4E]/10 space-y-2.5 hover:border-[#8E6D4E]/25 transition-all shadow-sm"
              >
                {/* Upper bar */}
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold ${badgeColors(tx.type)}`}>
                    {tx.type === "topup_qr" ? "กองทุนโอนกสิกรไทย" : tx.type === "topup_angpao" ? "ซองอุปการะคลัง" : "สนับสนุนหัตถศิลป์"}
                  </span>
                  <span className="text-[10px] text-stone-400 font-medium">
                    {new Date(tx.date).toLocaleDateString("th-TH")} {new Date(tx.date).toLocaleTimeString("th-TH")}
                  </span>
                </div>

                {/* Spec */}
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs font-bold text-[#4E3B2C] dark:text-stone-200 leading-relaxed max-w-md">{tx.details}</p>
                    <span className="text-[9.5px] text-stone-400 block mt-1 font-mono uppercase">รหัสอ้างอิงธุรกรรม: #{tx.id}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-serif ${tx.type.startsWith("topup_") ? "text-emerald-600" : "text-[#8E6D4E]"}`}>
                      {tx.type.startsWith("topup_") ? "+" : "-"}{tx.amount.toLocaleString()} ฿
                    </span>
                    <span className="block text-[8px] text-emerald-600 uppercase font-bold mt-1">ได้รับการบรรจุเรียบร้อย</span>
                  </div>
                </div>

                {/* Gorgeous Package/Order Tracking Stepper */}
                {tx.orderStatus && (
                  <div className="mt-3 p-3 bg-stone-50 dark:bg-stone-900/40 rounded-xl border border-[#8E6D4E]/10 space-y-2.5">
                    {/* Carrier & Tracking number with copy utility */}
                    <div className="flex items-center justify-between border-b border-[#8E6D4E]/10 pb-2">
                      <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-[#4E3B2C] dark:text-[#EAE3DA]">
                        <Truck size={12} className="text-[#8E6D4E]" />
                        <span>สถานะการจัดส่งพัสดุ:</span>
                        <span className={`px-2 py-0.5 rounded text-[9.5px] ${
                          tx.orderStatus === 'preparing' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                          tx.orderStatus === 'shipped' ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20' :
                          tx.orderStatus === 'delivered' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                          'bg-red-500/10 text-red-600 border border-red-500/20'
                        }`}>
                          {tx.orderStatus === 'preparing' ? '📦 กำลังเตรียมจัดส่ง' :
                           tx.orderStatus === 'shipped' ? '🚚 ส่งแล้ว' :
                           tx.orderStatus === 'delivered' ? '✅ จัดส่งสำเร็จ' :
                           '❌ ยกเลิกคำสั่งซื้อ'}
                        </span>
                      </div>
                      
                      {tx.trackingNumber && (
                        <div className="flex items-center gap-1.5 text-[10px]">
                          <span className="text-stone-400">เลขพัสดุ ({tx.trackingCarrier || "Flash Express"}):</span>
                          <span className="font-mono font-bold text-[#4E3B2C] dark:text-[#EAE3DA] select-all">{tx.trackingNumber}</span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(tx.trackingNumber || "");
                              alert("คัดลอกเลขพัสดุเรียบร้อยแล้วค่ะ!");
                            }}
                            className="p-0.5 px-1.5 bg-[#8E6D4E]/10 hover:bg-[#8E6D4E]/20 text-[#8E6D4E] rounded text-[8.5px] font-bold cursor-pointer transition-all"
                          >
                            คัดลอก
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Stepper progress bar */}
                    {tx.orderStatus !== 'cancelled' && (
                      <div className="py-2.5 px-1">
                        <div className="flex items-center justify-between text-[9px] font-black text-stone-400 relative">
                          {/* Progress Line */}
                          <div className="absolute top-[9px] left-3 right-3 h-0.5 bg-stone-200 dark:bg-stone-850 -z-0" />
                          <div 
                            className="absolute top-[9px] left-3 h-0.5 bg-[#8E6D4E] transition-all duration-500 -z-0" 
                            style={{
                              width: tx.orderStatus === 'preparing' ? '15%' :
                                     tx.orderStatus === 'shipped' ? '50%' : '100%'
                            }}
                          />

                          {/* Step 1 */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              ['preparing', 'shipped', 'delivered'].includes(tx.orderStatus)
                                ? "bg-[#8E6D4E] text-white"
                                : "bg-stone-200 dark:bg-stone-850 text-stone-450"
                            }`}>
                              1
                            </div>
                            <span className={['preparing', 'shipped', 'delivered'].includes(tx.orderStatus) ? "text-[#8E6D4E] font-bold" : ""}>
                              รับออเดอร์
                            </span>
                          </div>

                          {/* Step 2 */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              ['shipped', 'delivered'].includes(tx.orderStatus)
                                ? "bg-[#8E6D4E] text-white"
                                : tx.orderStatus === 'preparing'
                                ? "bg-amber-500/25 border border-amber-500 text-amber-600 font-bold animate-pulse"
                                : "bg-stone-200 dark:bg-stone-850 text-stone-450"
                            }`}>
                              2
                            </div>
                            <span className={['shipped', 'delivered'].includes(tx.orderStatus) ? "text-[#8E6D4E] font-bold" : ""}>
                              เตรียมของ
                            </span>
                          </div>

                          {/* Step 3 */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              tx.orderStatus === 'delivered'
                                ? "bg-[#8E6D4E] text-white"
                                : tx.orderStatus === 'shipped'
                                ? "bg-blue-500/25 border border-blue-500 text-blue-600 font-bold animate-pulse"
                                : "bg-stone-200 dark:bg-stone-850 text-stone-450"
                            }`}>
                              3
                            </div>
                            <span className={tx.orderStatus === 'shipped' ? "text-blue-600 font-bold" : tx.orderStatus === 'delivered' ? "text-[#8E6D4E] font-bold" : ""}>
                              จัดส่งพัสดุ
                            </span>
                          </div>

                          {/* Step 4 */}
                          <div className="flex flex-col items-center gap-1.5 z-10">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold ${
                              tx.orderStatus === 'delivered'
                                ? "bg-emerald-600 text-white font-bold"
                                : "bg-stone-200 dark:bg-stone-850 text-stone-450"
                            }`}>
                              ✓
                            </div>
                            <span className={tx.orderStatus === 'delivered' ? "text-emerald-600 font-bold" : ""}>
                              สำเร็จแล้ว
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline Updates */}
                    {tx.statusUpdates && tx.statusUpdates.length > 0 && (
                      <div className="border-t border-[#8E6D4E]/10 pt-2 space-y-1.5">
                        <span className="text-[8.5px] font-bold uppercase tracking-wider text-stone-400 block">ประวัติการเดินทางของพัสดุ (Status Timeline):</span>
                        <div className="space-y-1.5 max-h-24 overflow-y-auto pr-1">
                          {tx.statusUpdates.map((update: any, idx: number) => (
                            <div key={idx} className="flex gap-2 text-[9.5px] leading-relaxed">
                              <span className="text-stone-450 dark:text-stone-500 font-mono flex-shrink-0">
                                {new Date(update.date).toLocaleString("th-TH", {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                              <span className="text-[#4E3B2C] dark:text-stone-300 font-medium">
                                - {update.note}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions: Write review if is purchase */}
                {tx.type.startsWith("purchase_") && (
                  <div className="flex justify-end pt-1 border-t border-[#8E6D4E]/10">
                    {showReviewForm === tx.id ? (
                      <form onSubmit={(e) => handleReviewSubmit(e, tx)} className="w-full space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] text-stone-450 font-bold">1. เลือกให้คะแนนความประณีตของชิ้นงาน</label>
                          <div className="flex text-amber-500 gap-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <button
                                key={i}
                                type="button"
                                onClick={() => setReviewRating(i + 1)}
                                className="cursor-pointer"
                              >
                                <Star size={13} className={i < reviewRating ? "fill-current text-amber-500" : "text-stone-300 opacity-30"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-450 font-bold block mb-1">2. เขียนความเห็นชื่นชมมงคลศิลปะชิ้นนี้</label>
                           <textarea
                            required
                            placeholder="ผ้าเขียนลายบาติกประณีตสวยงามมากเลยค่ะ สีครามธรรมชาติสว่างนวลตาตัดเย็บแล้วออกมางามสง่า อนาคตจะอุดหนุนใหม่แน่นอนค่ะ!"
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            rows={2}
                            className="w-full bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/15 rounded-xl px-2.5 py-1.5 text-xs text-[#4E3B2C] dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E]"
                          />
                        </div>
                        <div className="flex gap-2 justify-end">
                          <button 
                            type="button" 
                            onClick={() => setShowReviewForm(null)}
                            className="bg-stone-100 dark:bg-stone-850 py-1.5 px-3 rounded-lg text-[10px] text-stone-500 cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="submit"
                            disabled={reviewLoading}
                            className="bg-[#8E6D4E] hover:bg-[#725437] text-white font-bold py-1.5 px-4 rounded-lg text-[10px] cursor-pointer"
                          >
                            {reviewLoading ? "กำลังส่งบันทึก..." : "ส่งคำวิจารณ์และคำอวยพร"}
                          </button>
                        </div>
                      </form>
                    ) : (
                      <button
                        onClick={() => setShowReviewForm(tx.id)}
                        className="py-1 px-2.5 text-[10px] rounded-lg border border-[#8E6D4E]/15 hover:bg-[#8E6D4E]/10 transition-all text-[#715437] dark:text-stone-300 flex items-center gap-1 cursor-pointer"
                      >
                        <HeartHandshake size={11} className={activeColor} />
                        <span>เขียนรีวิวให้คะแนนชิ้นงานชาวบ้าน</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </motion.div>
    </div>
  );
}
