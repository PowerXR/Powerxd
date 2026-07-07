import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get All Coupons
router.get("/", async (req, res) => {
  try {
    const coupons = await prisma.coupon.findMany();
    res.json(coupons);
  } catch (err: any) {
    console.error("Error fetching coupons:", err);
    res.status(500).json({ error: err.message || "Failed to fetch coupons" });
  }
});

// Verify Coupon
router.get("/verify", async (req, res) => {
  try {
    const { code, price } = req.query;
    if (!code) {
      return res.status(400).json({ error: "โปรดกรอกรหัสคูปอง" });
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: (code as string).trim().toLowerCase() }
    });

    if (!coupon || coupon.usesLeft < 1) {
      return res.status(400).json({ error: "คูปองโค้ดนี้ไม่มีอยู่จริง หรือหมดอายุการใช้งานแล้วค่ะ" });
    }

    const originalPrice = parseFloat(price as string) || 0;
    let discountAmount = 0;
    let finalPrice = originalPrice;

    if (coupon.discountPercent > 0) {
      discountAmount = parseFloat((originalPrice * (coupon.discountPercent / 100)).toFixed(2));
      finalPrice = Math.max(0, originalPrice - discountAmount);
    } else if (coupon.discountBaht > 0) {
      discountAmount = coupon.discountBaht;
      finalPrice = Math.max(0, originalPrice - discountAmount);
    }

    res.json({
      success: true,
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      discountBaht: coupon.discountBaht,
      discountAmount,
      finalPrice,
      message: `ใช้โค้ดลดราคาสำเร็จ! (ลดไป -${discountAmount} บาท)`
    });
  } catch (err: any) {
    console.error("Error verifying coupon:", err);
    res.status(500).json({ error: err.message || "Failed to verify coupon" });
  }
});

// Create/Update Coupon (Admin Only)
router.post("/", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { code, discountPercent, discountBaht, usesLeft } = req.body;
    if (!code) {
      return res.status(400).json({ error: "Missing required coupon code" });
    }

    const lowerCode = code.trim().toLowerCase();

    const coupon = await prisma.coupon.upsert({
      where: { code: lowerCode },
      create: {
        code: lowerCode,
        discountPercent: Number(discountPercent) || 0,
        discountBaht: Number(discountBaht) || 0,
        usesLeft: Number(usesLeft) || 1
      },
      update: {
        discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined,
        discountBaht: discountBaht !== undefined ? Number(discountBaht) : undefined,
        usesLeft: usesLeft !== undefined ? Number(usesLeft) : undefined
      }
    });

    res.json(coupon);
  } catch (err: any) {
    console.error("Error creating/updating coupon:", err);
    res.status(500).json({ error: err.message || "Failed to save coupon" });
  }
});

// Delete Coupon (Admin Only)
router.delete("/:code", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await prisma.coupon.delete({
      where: { code: req.params.code.trim().toLowerCase() }
    });

    res.json({ message: "Successfully deleted coupon" });
  } catch (err: any) {
    console.error("Error deleting coupon:", err);
    res.status(500).json({ error: err.message || "Failed to delete coupon" });
  }
});

export default router;
