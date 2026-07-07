import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get All Reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await prisma.review.findMany({
      orderBy: { date: "desc" }
    });
    res.json(reviews);
  } catch (err: any) {
    console.error("Error fetching reviews:", err);
    res.status(500).json({ error: err.message || "Failed to fetch reviews" });
  }
});

// Create Review
router.post("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนทำการให้คะแนนรีวิว" });
    }

    const { productId, rating, comment } = req.body;
    if (!productId || rating === undefined) {
      return res.status(400).json({ error: "ข้อมูลสำหรับให้รีวิวไม่ครบถ้วน (ต้องการรหัสสินค้าและคะแนน)" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้นี้ในระบบ" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId }
    });
    if (!product) {
      return res.status(404).json({ error: "ไม่พบสินค้าเพื่อเพิ่มรีวิว" });
    }

    const review = await prisma.review.create({
      data: {
        id: "rev-" + Date.now(),
        userId: user.id,
        username: user.username,
        rating: Number(rating),
        productId: product.id,
        productName: product.name,
        comment: comment || "",
        date: new Date().toISOString()
      }
    });

    res.status(201).json(review);
  } catch (err: any) {
    console.error("Error creating review:", err);
    res.status(500).json({ error: err.message || "Failed to create review" });
  }
});

export default router;
