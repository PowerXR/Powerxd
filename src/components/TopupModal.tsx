import React, { useState } from "react";
import { AppSettings, User } from "../types";
import { X, QrCode, Heart, Gift, HelpCircle, ArrowRight, CloudLightning, Copy, Check, Upload, Banknote, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TopupModalProps {
  user: User | null;
  settings: AppSettings;
  onClose: () => void;
  onTopupSuccess: (amount: number, newBalance: number) => void;
}

export default function TopupModal({
  user,
  settings,
  onClose,
  onTopupSuccess
}: TopupModalProps) {
  const [activeTab, setActiveTab] = useState<"qr" | "angpao">("qr");
  
  // QR state
  const [copied, setCopied] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrSuccessMessage, setQrSuccessMessage] = useState("");
  const [qrError, setQrError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [slipStatus, setSlipStatus] = useState("");

  // Angpao state
  const [angpaoLink, setAngpaoLink] = useState("");
  const [angpaoLoading, setAngpaoLoading] = useState(false);
  const [angpaoError, setAngpaoError] = useState("");

  const activeColor = "text-[#8E6D4E]";
  const borderActive = "border-[#8E6D4E]";
  const glowThemeBtn = "bg-[#8E6D4E] hover:bg-[#725437] text-white font-medium transition-all duration-300 shadow-md shadow-[#8E6D4E]/10 hover:shadow-[#8E6D4E]/20";

  const [copiedBank, setCopiedBank] = useState(false);

  const handleCopyBank = () => {
    const accNum = settings.bankAccountNumber || "105-1-91583-2";
    navigator.clipboard.writeText(accNum.replace(/[^0-9]/g, ""));
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2000);
  };

  // Shared file verification function
  const verifyFile = async (file: File) => {
    setQrLoading(true);
    setQrSuccessMessage("");
    setQrError("");
    setSlipStatus("กำลังสแกนรูปสลิปและแกะรหัส QR Code...");
    try {
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
      });

      setSlipStatus("กำลังเช็คสลิปการโอนของท่าน โปรดอย่าปิดหน้านี้ !!!");
      const resp = await fetch("/api/payments/verify-slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify({
          slipRef: "REF-" + Math.floor(100000 + Math.random() * 900000),
          slipImage: base64Data
        })
      });
      const text = await resp.text();
      if (!text || text.trim().startsWith("<")) {
        setSlipStatus("");
        setQrError("เซิร์ฟเวอร์ตอบสนองไม่พึงประสงค์ (รูปแบบ HTML) กรุณาลองใหม่อีกครั้ง");
        return;
      }
      const data = JSON.parse(text);
      if (resp.ok && data.success) {
        setSlipStatus("");
        setQrSuccessMessage(data.message || `ระบบตรวจสอบสลิปสำเร็จ! ยอดจำนวน +${data.amount} บาทเติมเข้าสู่เว็ปเรียบร้อยแล้ว`);
        setSelectedFile(null);
        onTopupSuccess(data.amount, data.newBalance);
      } else {
        setSlipStatus("");
        setQrError(data.error || "ตรวจสอบสลิปไม่สำเร็จ กรุณาเช็คว่าเป็นภาพสลิปจริง หรือลองอัปโหลดอีกครั้ง");
      }
    } catch (e: any) {
      console.error(e);
      setSlipStatus("");
      setQrError("เกิดข้อผิดพลาดในการเชื่อมต่อเครือข่ายเซิร์ฟเวอร์สำรอง: " + (e.message || e));
    } finally {
      setQrLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      verifyFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      verifyFile(file);
    }
  };

  const handleVerifySlipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFile) {
      verifyFile(selectedFile);
    } else {
      setQrError("กรุณาเลือกไฟล์รูปภาพใบสลิปของธนาคารก่อนกดยืนยัน");
    }
  };

  // Simulating the convenient mock slip button
  const handleSimulateQuickSlipDeposit = async () => {
    setQrLoading(true);
    setQrSuccessMessage("");
    setQrError("");
    setSlipStatus("กำลังอัปโหลดสลิปจำลอง 450฿ เข้าสู่เซิร์ฟเวอร์กลุ่มวิสาหกิจ...");
    try {
      const resp = await fetch("/api/payments/verify-slip", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify({
          isSimulation: true,
          amount: 450.00,
          slipRef: "SIM-QR-SLIP-" + Math.floor(100000 + Math.random() * 900000)
        })
      });
      const text = await resp.text();
      if (!text || text.trim().startsWith("<")) {
        setSlipStatus("");
        setQrError("เซิร์ฟเวอร์ส่งการตอบรับที่ผิดพลาด (รูปแบบ HTML)");
        return;
      }
      const data = JSON.parse(text);
      if (resp.ok && data.success) {
        setSlipStatus("");
        setQrSuccessMessage(data.message || `ระบบจำลองสลิปออมสินใจสำเร็จ! เพิ่มแล้ว: +450.00 บาทเครดิตร่ววิถีเพื่ออุดหนุนหัตถศิลป์`);
        onTopupSuccess(data.amount, data.newBalance);
      }
    } catch (err) {
      console.error(err);
      setSlipStatus("");
    } finally {
      setQrLoading(false);
    }
  };

  // Truemoney campaign Angpao verification
  const handleAngpaoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!angpaoLink) return;

    setAngpaoLoading(true);
    setAngpaoError("");
    try {
      const resp = await fetch("/api/payments/verify-angpao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Id": user?.id || ""
        },
        body: JSON.stringify({ link: angpaoLink })
      });
      const text = await resp.text();
      if (!text || text.trim().startsWith("<")) {
        setAngpaoError("เซิร์ฟเวอร์ส่งการตอบกลับไม่ถูกต้อง (รูปแบบ HTML)");
        return;
      }
      const data = JSON.parse(text);
      if (!resp.ok) {
        setAngpaoError(data.error || "ไม่สามารถกู้ข้อมูลหรือตรวจสอบคูปองซองได้");
      } else if (data.success) {
        onTopupSuccess(data.amount, data.newBalance);
        setAngpaoLink("");
      }
    } catch (e) {
      setAngpaoError("เครือข่ายขัดข้อง กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAngpaoLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-950/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg max-h-[92vh] md:max-h-[85vh] flex flex-col rounded-3xl bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/15 p-5 sm:p-7 shadow-2xl z-10 overflow-hidden text-[#4E3B2C] dark:text-stone-200"
      >
        {/* Header bar */}
        <div className="flex items-center justify-between pb-3 border-b border-[#8E6D4E]/10 relative flex-shrink-0">
          <div className="flex items-center gap-2">
            <Heart size={18} className="text-[#8E6D4E] fill-current" />
            <h3 className="font-serif font-bold text-[#4E3B2C] dark:text-[#EAE3DA] text-base">ระบบสนับสนุนมงคลศิลป์ชุมชน</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-[#8E6D4E] transition-all cursor-pointer hover:rotate-90 duration-250"
            title="ปิดหน้าต่างนี้"
          >
            <X size={16} />
          </button>
        </div>

        {/* Horizontal Navigation tabs */}
        <div className="flex border border-[#8E6D4E]/10 p-1 bg-white dark:bg-[#151210] rounded-2xl my-4 gap-1 flex-shrink-0">
          <button
            onClick={() => { setActiveTab("qr"); setQrSuccessMessage(""); }}
            className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "qr" ? "bg-[#8E6D4E] text-white shadow-sm" : "hover:text-[#8E6D4E] text-stone-400"
            }`}
          >
            <Banknote size={13} />
            <span>โอนผ่านบัญชีธนาคาร</span>
          </button>
          <button
            onClick={() => { setActiveTab("angpao"); setQrSuccessMessage(""); }}
            className={`flex-grow flex items-center justify-center gap-1.5 py-2 px-3 text-[11px] font-bold rounded-xl transition-all cursor-pointer ${
              activeTab === "angpao" ? "bg-[#8E6D4E] text-white shadow-sm" : "hover:text-[#8E6D4E] text-stone-400"
            }`}
          >
            <Gift size={13} />
            <span>ร่วมแชร์ถวายซองอั่งเปา</span>
          </button>
        </div>

        {/* Tab contents */}
        <div className="space-y-4 overflow-y-auto flex-1 pr-1 scrollbar-thin">
          
          {/* TAB 1: QR Payment with Slip Verification */}
          {activeTab === "qr" && (
            <div className="space-y-4">
              
               {/* Instructions box */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 space-y-2 text-stone-600 dark:text-stone-300">
                <span className="text-[10px] text-[#8E6D4E] uppercase font-black flex items-center gap-1 font-serif">
                  <ShieldCheck size={12} className="text-[#8E6D4E]" />
                  <span>ขั้นตอนการสแกนสลิป (รับยอดทันที)</span>
                </span>
                <ol className="text-[10.5px] space-y-1.5 pl-4 list-decimal leading-relaxed font-light">
                  <li>คัดลอกเลขบัญชีธนาคาร <strong>กสิกรไทย</strong> ของบัญชีทางเทศบาลที่กำหนดใว้</li>
                  <li>เมื่อผู้ใช้ทำการโอนแล้ว โปรดแนบรูปสลิปการโอนของท่าน เพื่อให้ระบบตรวจสอบและเติมเงินให้โดยอัตโนมัติ</li>
                  <li>หากผู้ใช้แนบสลิปแล้วไม่ผ่านหรือติดปัญหาอะไรโปรดแจ้งทางเทศบาลเพื่อทำการเติมเงินให้โดยเร็ว!!!</li>
                </ol>
              </div>

              {/* Bank Selector Card */}
              <div className="space-y-2">
                <label className="text-[10px] text-stone-400 uppercase font-bold block font-serif">เลขบัญชีรับโอนสัญญากลุ่ม</label>
                <div className="flex items-center gap-2.5 w-full bg-white dark:bg-[#151210] p-2.5 rounded-2xl border border-[#8E6D4E]/15">
                  <div className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-lg bg-emerald-600 text-white">
                    <Check size={11} strokeWidth={4} />
                  </div>
                  
                  {/* Bank card button */}
                  <button
                    type="button"
                    onClick={handleCopyBank}
                    className="flex-grow flex items-center justify-between p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#1C1815] border border-[#8E6D4E]/20 hover:bg-stone-50 transition-all group cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full border border-emerald-500/30 bg-white flex items-center justify-center shrink-0 shadow-sm">
                        <svg viewBox="0 0 100 100" className="w-5 h-5 stroke-[#138044] stroke-[13] fill-none" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M50 15 L50 85" />
                          <path d="M25 45 L50 25 L75 45" />
                          <path d="M25 65 L50 45 L75 65" />
                        </svg>
                      </div>

                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-[#4E3B2C] dark:text-stone-100 tracking-wider font-mono">
                            {settings.bankAccountNumber || "105-1-91583-2"}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-extrabold flex-shrink-0">
                            {copiedBank ? "ก็อปแล้ว" : "คัดลอก"}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                          {settings.bankAccountName || "กลุ่มวิสาหกิจชุมชนน้ำน้อย Thanakrit Chokumnerd"}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 hidden sm:block">
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        {settings.bankName || "กสิกรไทย"}
                      </span>
                      <span className="text-[8px] text-stone-400 block mt-0.5">โอนบัญชีนี้เท่านั้น</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Slip uploader */}
              <form onSubmit={handleVerifySlipSubmit} className="space-y-3">
                <label className="text-[10px] text-stone-400 uppercase font-bold block font-serif">แนบรูปสลิปเพื่อตรวจสอบยอด</label>
                
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={`border border-dashed rounded-2xl p-4 text-center cursor-pointer transition-colors relative ${
                    isDragOver ? "border-[#8E6D4E] bg-[#8E6D4E]/5" : "border-[#8E6D4E]/20 bg-white dark:bg-[#151210] hover:bg-stone-50/50"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={18} className="text-[#8E6D4E]" />
                    <span className="text-xs font-bold text-[#4E3B2C] dark:text-stone-200">
                      {selectedFile ? selectedFile.name : "ลากรูปสลิปมาวางที่นี่ หรือแตะเพื่ออัปโหลด"}
                    </span>
                    <span className="text-[9px] text-stone-500">รูปแบบไฟล์ .PNG, .JPG (จำแนกสลิปอัจฉริยะ)</span>
                  </div>
                </div>

                {slipStatus && (
                  <div className="p-3.5 rounded-xl bg-[#8E6D4E]/10 border border-[#8E6D4E]/20 text-[#8E6D4E] text-[11px] font-bold flex items-center gap-2 justify-center animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8E6D4E] animate-ping"></span>
                    <span>{slipStatus}</span>
                  </div>
                )}

                <div className="flex gap-2 justify-between">
                  <button
                    type="submit"
                    disabled={qrLoading || !selectedFile}
                    className={`w-full py-3 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                      !selectedFile ? "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed" : glowThemeBtn
                    }`}
                  >
                    {qrLoading ? "กำลังเช็คยอดกองทุน..." : "ยืนยันนำส่งรูปภาพสลิป"}
                  </button>
                </div>
              </form>

              {qrSuccessMessage && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs text-center font-bold">
                  {qrSuccessMessage}
                </div>
              )}

              {qrError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-bold leading-relaxed">
                  {qrError}
                </div>
              )}

            </div>
          )}

          {/* TAB 2: Truemoney Gift Angpao Link Input */}
          {activeTab === "angpao" && (
            <div className="space-y-4">
              
              {/* Instructions */}
              <div className="p-4 rounded-2xl bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 space-y-2 text-stone-600 dark:text-stone-300">
                <span className="text-[10px] text-[#8E6D4E] uppercase font-black flex items-center gap-1 font-serif">
                  <Gift size={12} className="text-[#8E6D4E]" />
                  <span>วิธีร่วมสนับสนุนด้วยซ่องอั่งเปา (TrueMoney)</span>
                </span>
                <ol className="text-[10.5px] space-y-1.5 pl-4 list-decimal leading-relaxed font-light">
                  <li>เปิดแอปพลิเคชัน <strong>TrueMoney Wallet</strong> แล้วเลือกเมนู <strong>"ส่งซองของขวัญ"</strong></li>
                  <li>ระบุจำนวนทรัพย์ที่ต้องการสนับสนุน แล้วตั้งสัดส่วนผู้รับเป็น <strong>1 คน เสมอ</strong></li>
                  <li>คัดลอกลิงก์ซองของขวัญที่รับสิทธิ์ นำมาวางที่กรอบด้านล่างเพื่อแปลงเป็นขวัญถุงในระบบเว็ปไซต์</li>
                </ol>
              </div>

              {/* Link Form */}
              <form onSubmit={handleAngpaoSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-stone-450 uppercase font-bold flex items-center justify-between">
                    <span>ลิงก์ซองของขวัญของท่าน</span>
                    <span className="text-[#8E6D4E] font-bold lowercase text-[9px]">* http://gift.truemoney.com/...</span>
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://gift.truemoney.com/campaign/?v=xxxxxx"
                    disabled={angpaoLoading}
                    value={angpaoLink}
                    onChange={(e) => setAngpaoLink(e.target.value)}
                    className="w-full bg-white dark:bg-[#151210] border border-[#8E6D4E]/15 rounded-xl px-3.5 py-2.5 text-xs text-[#4E3B2C] dark:text-stone-200 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8E6D4E]"
                  />
                </div>

                {angpaoError && (
                  <p className="text-[10px] text-red-500 font-bold">{angpaoError}</p>
                )}

                {/* Demonstration tip helpful for simulator */}
                <div className="bg-[#FAF7F2] dark:bg-[#1E1A16] border border-[#8E6D4E]/10 p-3 rounded-xl text-[10.5px] text-stone-500 leading-normal font-light">
                  💡 <strong>คำแนะนำในการจำลอง:</strong> คุณสามารถป้อนคำว่า <code className="bg-white/90 dark:bg-stone-800 px-1.5 py-0.5 rounded text-[#8E6D4E] font-mono select-all">vip-gift</code> ลงในช่องด้านบนเพื่อรับแต้มจำลองสนับสนุนทันที 500.00 บาท หรือคละข้อความอื่นๆ เพื่อรับสุ่ม 100 บาทสำเร็จค่ะ
                </div>

                <button
                  type="submit"
                  disabled={angpaoLoading || !angpaoLink}
                  className={`w-full py-3.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    !angpaoLink ? "bg-stone-200 dark:bg-stone-800 text-stone-400 cursor-not-allowed" : glowThemeBtn
                  }`}
                >
                  {angpaoLoading ? "กำลังตรวจสอบเงื่อนไขซองซอฟต์แวร์พิเศษ..." : "ยืนยันรหัสซองมงคลสมทบออโต้"}
                </button>
              </form>

            </div>
          )}

        </div>

      </motion.div>
    </div>
  );
}
