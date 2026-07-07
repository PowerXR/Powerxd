import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// GET List of Seller Verification Requests (Admin Only)
router.get("/verifications", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const list = await prisma.sellerVerification.findMany({
      orderBy: { submittedAt: "desc" }
    });
    res.json(list);
  } catch (err: any) {
    console.error("Error fetching verifications:", err);
    res.status(500).json({ error: err.message || "Failed to fetch verifications" });
  }
});

// POST Review/Approve/Reject Seller Verification (Admin Only)
router.post("/verifications/:id/review", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { status, adminNotes } = req.body; // status: 'approved' | 'rejected'
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "สถานะการตรวจสอบไม่ถูกต้อง" });
    }

    const application = await prisma.sellerVerification.findUnique({
      where: { id: req.params.id }
    });

    if (!application) {
      return res.status(404).json({ error: "ไม่พบข้อมูลใบสมัครที่ระบุ" });
    }

    const updatedApp = await prisma.sellerVerification.update({
      where: { id: application.id },
      data: {
        status,
        adminNotes: adminNotes || "",
        reviewedAt: new Date().toISOString()
      }
    });

    // If approved, update user's role to seller_external (or seller_internal based on selection)
    if (status === "approved") {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: "seller_external" }
      });
    }

    res.json({ success: true, message: "ดำเนินการตรวจสอบและบันทึกผลการประเมินร้านค้าสำเร็จแล้ว", application: updatedApp });
  } catch (err: any) {
    console.error("Error reviewing seller verification:", err);
    res.status(500).json({ error: err.message || "Failed to review seller application" });
  }
});

// GET List of All Withdrawal Requests (Admin Only)
router.get("/withdrawals", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const list = await prisma.withdrawal.findMany({
      orderBy: { submittedAt: "desc" }
    });
    res.json(list);
  } catch (err: any) {
    console.error("Error fetching withdrawals:", err);
    res.status(500).json({ error: err.message || "Failed to fetch withdrawals" });
  }
});

// POST Review/Approve/Reject Seller Withdrawal Request (Admin Only)
router.post("/withdrawals/:id/review", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const { status, adminNotes, slipUrl } = req.body; // status: 'approved' | 'rejected'
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "สถานะรายการถอนไม่ถูกต้อง" });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id: req.params.id }
    });

    if (!withdrawal) {
      return res.status(404).json({ error: "ไม่พบรายการถอนเงินที่ระบุ" });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id: withdrawal.id },
      data: {
        status,
        adminNotes: adminNotes || "",
        slipUrl: slipUrl || null,
        reviewedAt: new Date().toISOString()
      }
    });

    // If rejected, refund the locked withdrawable balance back to the seller!
    if (status === "rejected") {
      const seller = await prisma.user.findUnique({
        where: { id: withdrawal.userId }
      });
      if (seller) {
        const currentWithdrawable = seller.withdrawableBalance || 0;
        await prisma.user.update({
          where: { id: seller.id },
          data: {
            withdrawableBalance: parseFloat((currentWithdrawable + withdrawal.amount).toFixed(2))
          }
        });
      }
    }

    res.json({ success: true, message: "ปรับปรุงผลดำเนินการรายการเบิกถอนพรีเมียมเรียบร้อยแล้ว", withdrawal: updatedWithdrawal });
  } catch (err: any) {
    console.error("Error reviewing withdrawal request:", err);
    res.status(500).json({ error: err.message || "Failed to review withdrawal request" });
  }
});

// GET Dashboard General Stats (Admin Only)
router.get("/stats", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const transactions = await prisma.transaction.findMany();

    // Calculate income
    const totalRevenue = transactions
      .filter((tx: any) => (tx.type === "topup_qr" || tx.type === "topup_angpao") && tx.status === "success")
      .reduce((acc: number, tx: any) => acc + tx.amount, 0);

    const qrRevenue = transactions
      .filter((tx: any) => tx.type === "topup_qr" && tx.status === "success")
      .reduce((acc: number, tx: any) => acc + tx.amount, 0);

    const angpaoRevenue = transactions
      .filter((tx: any) => tx.type === "topup_angpao" && tx.status === "success")
      .reduce((acc: number, tx: any) => acc + tx.amount, 0);

    // Items sold count
    const itemsSold = transactions
      .filter((tx: any) => tx.type.startsWith("purchase_") && tx.status === "success")
      .length;

    const userCount = await prisma.user.count();
    const productCount = await prisma.product.count();
    const categoryCount = await prisma.category.count();
    const reviewCount = await prisma.review.count();

    res.json({
      revenue: {
        total: totalRevenue,
        qr: qrRevenue,
        angpao: angpaoRevenue
      },
      counts: {
        users: userCount,
        products: productCount,
        categories: categoryCount,
        transactions: transactions.length,
        reviews: reviewCount,
        itemsSold
      }
    });
  } catch (err: any) {
    console.error("Error generating admin dashboard stats:", err);
    res.status(500).json({ error: err.message || "Failed to generate dashboard statistics" });
  }
});

// GET Full Database Backup Export (Admin Only)
router.get("/backup", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const data = {
      settings: await prisma.settings.findMany(),
      categories: await prisma.category.findMany(),
      products: await prisma.product.findMany(),
      users: await prisma.user.findMany(),
      coupons: await prisma.coupon.findMany(),
      transactions: await prisma.transaction.findMany(),
      reviews: await prisma.review.findMany(),
      conversations: await prisma.conversation.findMany(),
      messages: await prisma.message.findMany(),
      notifications: await prisma.notification.findMany(),
      sellerVerifications: await prisma.sellerVerification.findMany(),
      withdrawals: await prisma.withdrawal.findMany()
    };

    res.json(data);
  } catch (err: any) {
    console.error("Error generating database backup:", err);
    res.status(500).json({ error: err.message || "Failed to export database backup" });
  }
});

// POST Database Restore Import (Admin Only)
router.post("/restore", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") return res.status(403).json({ error: "Unauthorized" });

    const backupData = req.body;
    if (!backupData || typeof backupData !== "object") {
      return res.status(400).json({ error: "ข้อมูลสำรองไม่ถูกต้อง" });
    }

    // Direct structural checks
    if (!backupData.categories || !backupData.products || !backupData.users) {
      return res.status(400).json({ error: "ข้อมูลสำรองไม่ถูกต้อง (ขาดโครงสร้างหลัก เช่น users, products, categories)" });
    }

    console.log("Beginning bulk restoration of database tables...");

    // Helper function to safely bulk restore a model
    const restoreTable = async (model: any, list: any[]) => {
      if (Array.isArray(list)) {
        await model.deleteMany();
        for (const item of list) {
          // Normalize json fields
          const cleanItem = { ...item };
          // Keep JSON structures unmodified if already object/array, stringify if needed
          await model.create({ data: cleanItem });
        }
      }
    };

    // Restore tables in dependencies order
    if (backupData.settings) await restoreTable(prisma.settings, backupData.settings);
    if (backupData.categories) await restoreTable(prisma.category, backupData.categories);
    if (backupData.users) await restoreTable(prisma.user, backupData.users);
    if (backupData.products) await restoreTable(prisma.product, backupData.products);
    if (backupData.coupons) await restoreTable(prisma.coupon, backupData.coupons);
    if (backupData.transactions) await restoreTable(prisma.transaction, backupData.transactions);
    if (backupData.reviews) await restoreTable(prisma.review, backupData.reviews);
    if (backupData.conversations) await restoreTable(prisma.conversation, backupData.conversations);
    if (backupData.messages) await restoreTable(prisma.message, backupData.messages);
    if (backupData.notifications) await restoreTable(prisma.notification, backupData.notifications);
    if (backupData.sellerVerifications) await restoreTable(prisma.sellerVerification, backupData.sellerVerifications);
    if (backupData.withdrawals) await restoreTable(prisma.withdrawal, backupData.withdrawals);

    const latestSettings = await prisma.settings.findUnique({ where: { id: "settings" } });

    res.json({ message: "กู้คืนระบบตารางทั้งหมดสำเร็จแล้ว!", settings: latestSettings });
  } catch (err: any) {
    console.error("Error restoring database backup:", err);
    res.status(500).json({ error: err.message || "Failed to restore database backup" });
  }
});

export default router;
