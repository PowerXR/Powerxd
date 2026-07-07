import { Router } from "express";
import { prisma, sanitizeTransaction } from "../db.js";

const router = Router();

// Get All or User Transactions
router.get("/", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;

    if (!userId) {
      return res.status(401).json({ error: "โปรดล็อกอินก่อนเรียกดูรายการธุรกรรม" });
    }

    let txs: any[] = [];
    if (role === "admin") {
      txs = await prisma.transaction.findMany({
        orderBy: { date: "desc" }
      });
    } else {
      // Find both transactions owned by this user AND those where the user is the seller!
      // This is necessary because sellers need to view orders for products they sold.
      txs = await prisma.transaction.findMany({
        where: {
          OR: [
            { userId: userId },
            {
              details: {
                contains: `"sellerId":"${userId}"` // Match within JSON or text fields
              }
            }
          ]
        },
        orderBy: { date: "desc" }
      });
    }

    const formatted = txs.map((t) => sanitizeTransaction(t));

    res.json(formatted);
  } catch (err: any) {
    console.error("Error fetching transactions:", err);
    res.status(500).json({ error: err.message || "Failed to fetch transactions" });
  }
});

// Update Shipping Tracking (Admin or Seller)
router.put("/:id/tracking", async (req, res) => {
  try {
    const role = req.headers["x-user-role"] as string;
    const userId = req.headers["x-user-id"] as string;
    const { trackingNumber, trackingCarrier, orderStatus, note } = req.body;

    const tx = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!tx) {
      return res.status(404).json({ error: "ไม่พบข้อมูลรหัสธุรกรรมนี้" });
    }

    const sanitizedTx = sanitizeTransaction(tx);
    const statusUpdates = sanitizedTx.statusUpdates || [];
    const updatedStatus = orderStatus || tx.orderStatus || "preparing";

    statusUpdates.push({
      status: updatedStatus,
      date: new Date().toISOString(),
      note: note || `สถานะเปลี่ยนเป็น ${updatedStatus} - อัปเดตข้อมูลผู้จัดส่งเรียบร้อยแล้ว`
    });

    const updatedTx = await prisma.transaction.update({
      where: { id: tx.id },
      data: {
        trackingNumber: trackingNumber || tx.trackingNumber,
        trackingCarrier: trackingCarrier || tx.trackingCarrier,
        orderStatus: updatedStatus,
        statusUpdates: JSON.stringify(statusUpdates)
      }
    });

    res.json({
      success: true,
      message: "อัปเดตข้อมูลการจัดส่งสำเร็จ",
      transaction: sanitizeTransaction(updatedTx)
    });
  } catch (err: any) {
    console.error("Error updating transaction tracking:", err);
    res.status(500).json({ error: err.message || "Failed to update tracking" });
  }
});

export default router;
