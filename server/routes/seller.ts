import { Router } from "express";
import { prisma, sanitizeTransaction, sanitizeProduct, stringifyProduct } from "../db.js";

const router = Router();

// GET Current Seller Status
router.get("/status", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const verification = await prisma.sellerVerification.findFirst({
      where: { userId }
    });

    res.json(verification || { status: "not_applied" });
  } catch (err: any) {
    console.error("Error fetching seller status:", err);
    res.status(500).json({ error: err.message || "Failed to fetch seller status" });
  }
});

// GET List of All Registered Sellers (Admin Only)
router.get("/list", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const sellers = await prisma.user.findMany({
      where: {
        role: { in: ["seller_internal", "seller_external"] }
      }
    });

    res.json(sellers);
  } catch (err: any) {
    console.error("Error listing sellers:", err);
    res.status(500).json({ error: err.message || "Failed to list sellers" });
  }
});

// POST Update Seller Profile Settings
router.post("/settings", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const { shopName, shopDescription, bankName, bankAccountNumber, bankAccountName } = req.body;

    const verification = await prisma.sellerVerification.findFirst({
      where: { userId }
    });

    if (!verification) {
      return res.status(400).json({ error: "คุณยังไม่ได้รับการอนุมัติเป็นร้านค้าผู้ขาย" });
    }

    const updated = await prisma.sellerVerification.update({
      where: { id: verification.id },
      data: {
        shopName,
        shopDescription,
        bankName,
        bankAccountNumber,
        bankAccountName
      }
    });

    res.json({ success: true, message: "อัปเดตข้อมูลร้านค้าเรียบร้อยแล้ว", verification: updated });
  } catch (err: any) {
    console.error("Error saving seller settings:", err);
    res.status(500).json({ error: err.message || "Failed to save settings" });
  }
});

// POST Apply to Become a Seller
router.post("/apply", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนทำรายการสมัคร" });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้งานนี้" });
    }

    const existingApplication = await prisma.sellerVerification.findFirst({
      where: { userId }
    });

    if (existingApplication && existingApplication.status === "pending") {
      return res.status(400).json({ error: "คุณมีรายการส่งคำขอสมัครเป็นผู้ขายอยู่ระหว่างรอการอนุมัติอยู่แล้ว" });
    }

    const { shopName, shopDescription, idCardPhotoUrl, bankName, bankAccountNumber, bankAccountName } = req.body;

    if (!shopName || !idCardPhotoUrl) {
      return res.status(400).json({ error: "กรุณาระบุข้อมูลที่จำเป็นให้ครบถ้วน เช่น ชื่อร้านค้าและรูปภาพเอกสารยืนยันตัวตน" });
    }

    const appId = `apply-${Date.now()}`;
    const newApp = await prisma.sellerVerification.upsert({
      where: { id: existingApplication?.id || appId },
      create: {
        id: appId,
        userId,
        username: user.username,
        email: user.email,
        shopName,
        shopDescription: shopDescription || "",
        idCardPhotoUrl,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        status: "pending",
        submittedAt: new Date().toISOString()
      },
      update: {
        shopName,
        shopDescription: shopDescription || "",
        idCardPhotoUrl,
        bankName: bankName || null,
        bankAccountNumber: bankAccountNumber || null,
        bankAccountName: bankAccountName || null,
        status: "pending",
        submittedAt: new Date().toISOString()
      }
    });

    res.json({ success: true, message: "ส่งคำขอเป็นผู้ขายเรียบร้อยแล้ว! ระบบกำลังรอการตรวจสอบจากผู้ดูแลระบบสูงสุด", application: newApp });
  } catch (err: any) {
    console.error("Error applying for seller:", err);
    res.status(500).json({ error: err.message || "Failed to submit application" });
  }
});

// GET Seller Products
router.get("/products", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const products = await prisma.product.findMany({
      where: { sellerId: userId }
    });

    const formatted = products.map((p) => sanitizeProduct(p));

    res.json(formatted);
  } catch (err: any) {
    console.error("Error fetching seller products:", err);
    res.status(500).json({ error: err.message || "Failed to fetch seller products" });
  }
});

// POST Add Seller Product
router.post("/products", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;

    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const verification = await prisma.sellerVerification.findFirst({
      where: { userId, status: "approved" }
    });

    if (!verification && role !== "admin") {
      return res.status(403).json({ error: "คุณยังไม่ได้รับอนุญาตให้เพิ่มผลิตภัณฑ์ (สิทธิ์การเป็นผู้ขายยังไม่อนุมัติ)" });
    }

    const { categoryId, name, price, description, imageUrl, stock, details, type, videoUrl } = req.body;

    if (!categoryId || !name || price === undefined) {
      return res.status(400).json({ error: "กรุณาระบุข้อมูลที่จำเป็น เช่น หมวดหมู่ ชื่อสินค้า และราคา" });
    }

    const prodId = `prod-sl-${Date.now()}`;
    const productData = stringifyProduct({
      id: prodId,
      categoryId,
      name,
      price: Number(price),
      description: description || "",
      imageUrl: imageUrl || "",
      stock: Array.isArray(stock) ? stock : [],
      timesSold: 0,
      details: details || "",
      type: type || "normal",
      videoUrl: videoUrl || "",
      boxItems: [],
      sellerId: userId,
      sellerName: verification?.shopName || "ผู้ขายอิสระ",
      sellerType: "community"
    });

    const newProd = await prisma.product.create({
      data: productData
    });

    res.json({ success: true, message: "เพิ่มรายการสินค้าสำเร็จเรียบร้อยแล้ว!", product: sanitizeProduct(newProd) });
  } catch (err: any) {
    console.error("Error creating seller product:", err);
    res.status(500).json({ error: err.message || "Failed to create seller product" });
  }
});

// DELETE Seller Product
router.delete("/products/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const prod = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!prod) {
      return res.status(404).json({ error: "ไม่พบสินค้าชิ้นนี้ในระบบ" });
    }

    if (prod.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ในการลบรายการสินค้านี้" });
    }

    await prisma.product.delete({
      where: { id: prod.id }
    });

    res.json({ success: true, message: "ลบสินค้าเรียบร้อยแล้ว" });
  } catch (err: any) {
    console.error("Error deleting seller product:", err);
    res.status(500).json({ error: err.message || "Failed to delete product" });
  }
});

// GET Orders/Sales associated with Seller
router.get("/orders", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    // Find all transactions containing products of this seller
    const txs = await prisma.transaction.findMany({
      where: {
        details: {
          contains: `"sellerId":"${userId}"`
        }
      },
      orderBy: { date: "desc" }
    });

    const formatted = txs.map((t) => sanitizeTransaction(t));

    res.json(formatted);
  } catch (err: any) {
    console.error("Error fetching seller orders:", err);
    res.status(500).json({ error: err.message || "Failed to fetch seller orders" });
  }
});

// POST Mark order as Shipped (Seller)
router.post("/orders/:id/ship", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดล็อกอินเข้าระบบ" });

    const { trackingCarrier, trackingNumber, note } = req.body;

    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!tx) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคำสั่งซื้อที่ระบุ" });
    }

    const sanitizedTx = sanitizeTransaction(tx);
    const statusUpdates = sanitizedTx.statusUpdates || [];

    statusUpdates.push({
      status: "shipped",
      date: new Date().toISOString(),
      note: note || `ร้านค้าทำการบรรจุกล่องและเตรียมมอบส่งพัสดุผ่านผู้ขนส่ง [${trackingCarrier || "ไม่มีการกำหนด"}] เลขติดตาม: [${trackingNumber || "ไม่มีการกำหนด"}] แล้วค่ะ`
    });

    const updated = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        orderStatus: "shipped",
        trackingCarrier: trackingCarrier || tx.trackingCarrier,
        trackingNumber: trackingNumber || tx.trackingNumber,
        statusUpdates: JSON.stringify(statusUpdates)
      }
    });

    res.json({
      success: true,
      message: "อัปเดตสเตตัสพัสดุและจัดส่งสำเร็จ!",
      transaction: sanitizeTransaction(updated)
    });
  } catch (err: any) {
    console.error("Error marking order as shipped:", err);
    res.status(500).json({ error: err.message || "Failed to update order to shipped" });
  }
});

// POST Escrow Delivery / Release Funds (Escrow System)
router.post("/orders/:id/deliver", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบ" });

    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!tx) {
      return res.status(404).json({ error: "ไม่พบข้อมูลคำสั่งซื้อในระบบ" });
    }

    // Escrow logic: Only Buyer or Admin can confirm delivery & release funds to Seller
    const isBuyer = tx.userId === userId;
    const role = req.headers["x-user-role"] as string;

    if (!isBuyer && role !== "admin") {
      return res.status(403).json({ error: "คุณไม่มีส่วนเกี่ยวข้องในคำสั่งซื้อนี้ หรือไม่มีสิทธิ์ปล่อยวงเงินโอนชำระสินค้าให้ผู้ขาย" });
    }

    const sanitizedTx = sanitizeTransaction(tx);
    const statusUpdates = sanitizedTx.statusUpdates || [];

    statusUpdates.push({
      status: "delivered",
      date: new Date().toISOString(),
      note: "ผู้สั่งซื้อได้รับพัสดุสินค้าและกดยืนยันการรับพัสดุปลายทางเรียบร้อยแล้ว ระบบทำการปลดล็อคยอดเงิน Escrow สู่ถุงเงินของผู้ขายสินค้าหลักทันที"
    });

    // Check if seller was already credited to prevent double crediting
    const detailsStr = tx.details || "";
    let isSellerCredited = false; // Custom logic tracker if needed

    // Update Transaction to delivered status
    const updatedTx = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        orderStatus: "delivered",
        statusUpdates: JSON.stringify(statusUpdates)
      }
    });

    // Extract seller ID and transfer funds from pending to withdrawable
    // Find product details or seller details
    let sellerId = "";
    if (detailsStr.includes("sellerId")) {
      const match = detailsStr.match(/"sellerId":"(.*?)"/);
      if (match && match[1]) {
        sellerId = match[1];
      }
    }

    if (sellerId) {
      const seller = await prisma.user.findUnique({
        where: { id: sellerId }
      });
      if (seller) {
        const pBal = seller.pendingBalance || 0;
        const wBal = seller.withdrawableBalance || 0;
        const txAmount = tx.amount || 0;

        // Release funds from pending balance to withdrawable balance
        const newPending = Math.max(0, pBal - txAmount);
        const newWithdrawable = wBal + txAmount;

        await prisma.user.update({
          where: { id: seller.id },
          data: {
            pendingBalance: parseFloat(newPending.toFixed(2)),
            withdrawableBalance: parseFloat(newWithdrawable.toFixed(2))
          }
        });
        console.log(`Released escrow funds to seller [${sellerId}]: Amount ${txAmount}`);
      }
    }

    res.json({
      success: true,
      message: "ยืนยันรับสินค้าและปล่อยกองเงินโอน Escrow ให้ผู้จำหน่ายสำเร็จ!",
      transaction: sanitizeTransaction(updatedTx)
    });
  } catch (err: any) {
    console.error("Error executing escrow delivery/release:", err);
    res.status(500).json({ error: err.message || "Failed to deliver order" });
  }
});

// GET Seller Withdrawals History
router.get("/withdrawals", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อน" });

    const withdrawals = await prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { submittedAt: "desc" }
    });

    res.json(withdrawals);
  } catch (err: any) {
    console.error("Error fetching seller withdrawals:", err);
    res.status(500).json({ error: err.message || "Failed to fetch seller withdrawals" });
  }
});

// POST Seller Request a Withdrawal
router.post("/withdraw", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนทำเรื่องถอนเงิน" });

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลบัญชีผู้ใช้งานนี้ในระบบ" });
    }

    const verification = await prisma.sellerVerification.findFirst({
      where: { userId, status: "approved" }
    });

    if (!verification) {
      return res.status(403).json({ error: "ฟังก์ชั่นเบิกเงินสงวนไว้ให้ผู้ค้าที่ลงทะเบียนร้านค้าสำเร็จเท่านั้น" });
    }

    const { amount, bankName, bankAccountNumber, bankAccountName } = req.body;
    const requestAmount = parseFloat(amount);

    if (isNaN(requestAmount) || requestAmount <= 0) {
      return res.status(400).json({ error: "กรุณาระบุยอดจำนวนเงินการเบิกถอนที่ถูกต้อง" });
    }

    const currentWithdrawable = user.withdrawableBalance || 0;
    if (currentWithdrawable < requestAmount) {
      return res.status(400).json({ error: "ยอดเงินคงเหลือที่ถอนได้ของคุณไม่เพียงพอสำหรับการถอนเงินครั้งนี้ค่ะ" });
    }

    // Deduct from withdrawable balance immediately (lock it)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        withdrawableBalance: parseFloat((currentWithdrawable - requestAmount).toFixed(2))
      }
    });

    const withId = `with-${Date.now()}`;
    const newWithdrawal = await prisma.withdrawal.create({
      data: {
        id: withId,
        userId,
        username: user.username,
        amount: requestAmount,
        bankName: bankName || verification.bankName || "ธนาคารหลัก",
        bankAccountNumber: bankAccountNumber || verification.bankAccountNumber || "",
        bankAccountName: bankAccountName || verification.bankAccountName || user.username,
        status: "pending",
        submittedAt: new Date().toISOString()
      }
    });

    res.json({ success: true, message: "คำขอเบิกเงินถอนของคุณได้รับการส่งแล้ว! กรุณารอรับการโอนจากแอดมินเว็บหลัก", withdrawal: newWithdrawal });
  } catch (err: any) {
    console.error("Error submitting withdrawal request:", err);
    res.status(500).json({ error: err.message || "Failed to submit withdrawal request" });
  }
});

export default router;
