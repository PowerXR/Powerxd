import { Router } from "express";
import { prisma } from "../db.js";
import { broadcastChatEvent } from "../sse.js";

const router = Router();

// Helper to resolve sender/receiver profile details
async function getUserProfile(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });
    if (!user) return { username: "ผู้ใช้ทั่วไป", avatarUrl: "" };
    return {
      username: user.username,
      avatarUrl: user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.username}`
    };
  } catch (err) {
    return { username: "ผู้ใช้ทั่วไป", avatarUrl: "" };
  }
}

// GET Conversations for active user
router.get("/conversations", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งานแชท" });

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { customerId: userId },
          { sellerId: userId }
        ]
      }
    });

    const populated = await Promise.all(
      conversations.map(async (c) => {
        const customer = await prisma.user.findUnique({ where: { id: c.customerId } });
        const seller = await prisma.user.findUnique({ where: { id: c.sellerId } });
        const verification = await prisma.sellerVerification.findFirst({ where: { userId: c.sellerId } });

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: c.id,
            senderId: { not: userId },
            isRead: false
          }
        });

        return {
          ...c,
          customerName: customer?.username || "ลูกค้าในระบบ",
          customerAvatar: customer?.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${customer?.username || "customer"}`,
          shopName: verification?.shopName || seller?.username || "ร้านค้าชุมชนน้ำน้อย",
          shopLogo: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(verification?.shopName || seller?.username || "Shop")}&backgroundColor=16A34A`,
          unreadCount
        };
      })
    );

    // Sort by latest message
    populated.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    res.json(populated);
  } catch (err: any) {
    console.error("Error fetching conversations:", err);
    res.status(500).json({ error: err.message || "Failed to fetch conversations" });
  }
});

// POST Create or Open existing conversation
router.post("/conversations", async (req, res) => {
  try {
    const customerId = req.headers["x-user-id"] as string;
    if (!customerId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const { sellerId, shopId } = req.body;
    if (!sellerId) return res.status(400).json({ error: "ระบุรหัสผู้ขายหรือร้านค้า" });

    if (customerId === sellerId) {
      return res.status(400).json({ error: "ไม่สามารถเปิดห้องแชทกับตนเองได้" });
    }

    let conv = await prisma.conversation.findFirst({
      where: {
        customerId,
        sellerId
      }
    });

    if (!conv) {
      const convId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      conv = await prisma.conversation.create({
        data: {
          id: convId,
          customerId,
          sellerId,
          shopId: shopId || sellerId,
          lastMessage: "เริ่มเปิดห้องสนทนาใหม่เพื่อปรึกษาผลิตภัณฑ์",
          lastMessageAt: new Date().toISOString(),
          status: "active",
          createdAt: new Date().toISOString()
        }
      });

      broadcastChatEvent({ type: "new_conversation", conversation: conv });
    } else {
      // Re-activate if it was closed
      if (conv.status === "closed") {
        conv = await prisma.conversation.update({
          where: { id: conv.id },
          data: {
            status: "active",
            lastMessageAt: new Date().toISOString()
          }
        });
        broadcastChatEvent({ type: "conversation_status_updated", conversationId: conv.id, status: "active" });
      }
    }

    res.json(conv);
  } catch (err: any) {
    console.error("Error creating conversation:", err);
    res.status(500).json({ error: err.message || "Failed to create conversation" });
  }
});

// GET Messages in a specific conversation
router.get("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });
    if (!conv) return res.status(404).json({ error: "ไม่พบห้องสนทนานี้" });

    if (role !== "admin" && conv.customerId !== userId && conv.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงห้องสนทนานี้" });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId: conv.id },
      orderBy: { createdAt: "asc" }
    });

    const formatted = messages.map((m) => ({
      ...m,
      productInfo: typeof m.productInfo === "string" ? JSON.parse(m.productInfo) : m.productInfo,
      orderInfo: typeof m.orderInfo === "string" ? JSON.parse(m.orderInfo) : m.orderInfo,
      locationInfo: typeof m.locationInfo === "string" ? JSON.parse(m.locationInfo) : m.locationInfo
    }));

    res.json(formatted);
  } catch (err: any) {
    console.error("Error fetching messages:", err);
    res.status(500).json({ error: err.message || "Failed to fetch messages" });
  }
});

// POST Send new message
router.post("/conversations/:id/messages", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });
    if (!conv) return res.status(404).json({ error: "ไม่พบห้องสนทนานี้" });

    if (role !== "admin" && conv.customerId !== userId && conv.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ส่งข้อความในห้องสนทนานี้" });
    }

    if (conv.status === "blocked" && role !== "admin") {
      return res.status(403).json({ error: "ห้องแชทนี้ถูกระงับ/บล็อกไว้ชั่วคราวเนื่องจากทำผิดเงื่อนไข" });
    }

    const {
      message,
      messageType,
      image,
      replyToId,
      replyToMessage,
      productInfo,
      orderInfo,
      locationInfo
    } = req.body;

    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const newMsg = await prisma.message.create({
      data: {
        id: msgId,
        conversationId: conv.id,
        senderId: userId,
        message: message || "",
        messageType: messageType || "text",
        image: image || null,
        isRead: false,
        createdAt: new Date().toISOString(),
        replyToId: replyToId || null,
        replyToMessage: replyToMessage || null,
        productInfo: productInfo ? productInfo : null,
        orderInfo: orderInfo ? orderInfo : null,
        locationInfo: locationInfo ? locationInfo : null
      }
    });

    let previewText = message || "";
    if (messageType === "image") previewText = "📸 ส่งรูปภาพ";
    else if (messageType === "product") previewText = "📦 แนะนำสินค้า";
    else if (messageType === "order") previewText = "🧾 ข้อมูลคำสั่งซื้อ";
    else if (messageType === "paymentSlip") previewText = "💵 แนบสลิปการโอนเงิน";
    else if (messageType === "location") previewText = "📍 แชร์พิกัดตำแหน่ง";

    // Update conversation last message state
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessage: previewText,
        lastMessageAt: newMsg.createdAt,
        status: conv.status === "closed" ? "active" : undefined
      }
    });

    if (conv.status === "closed") {
      broadcastChatEvent({ type: "conversation_status_updated", conversationId: conv.id, status: "active" });
    }

    const formattedMsg = {
      ...newMsg,
      productInfo,
      orderInfo,
      locationInfo
    };

    broadcastChatEvent({ type: "chat_message", message: formattedMsg });

    // Generate notification for recipient
    const recipientId = userId === conv.customerId ? conv.sellerId : conv.customerId;
    const senderProfile = await getUserProfile(userId);

    const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const notif = await prisma.notification.create({
      data: {
        id: notifId,
        userId: recipientId,
        title: `ข้อความใหม่จาก ${senderProfile.username}`,
        body: previewText,
        isRead: false,
        createdAt: newMsg.createdAt
      }
    });

    broadcastChatEvent({ type: "notification", notification: notif });

    res.json(formattedMsg);
  } catch (err: any) {
    console.error("Error sending message:", err);
    res.status(500).json({ error: err.message || "Failed to send message" });
  }
});

// POST Mark messages as read
router.post("/conversations/:id/read", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });
    if (!conv) return res.status(404).json({ error: "ไม่พบห้องสนทนานี้" });

    const updateResult = await prisma.message.updateMany({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        isRead: false
      },
      data: {
        isRead: true
      }
    });

    if (updateResult.count > 0) {
      broadcastChatEvent({ type: "messages_read", conversationId: conv.id, readerId: userId });
    }

    res.json({ success: true, count: updateResult.count });
  } catch (err: any) {
    console.error("Error marking messages as read:", err);
    res.status(500).json({ error: err.message || "Failed to mark messages as read" });
  }
});

// POST Update typing status
router.post("/conversations/:id/typing", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { isTyping } = req.body;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });
    if (!conv) return res.status(404).json({ error: "ไม่พบห้องสนทนานี้" });

    const isSeller = userId === conv.sellerId;

    await prisma.conversation.update({
      where: { id: conv.id },
      data: isSeller ? { isTypingSeller: !!isTyping } : { isTypingCustomer: !!isTyping }
    });

    broadcastChatEvent({
      type: "typing_status_updated",
      conversationId: conv.id,
      userId,
      isTyping: !!isTyping
    });

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error updating typing status:", err);
    res.status(500).json({ error: err.message || "Failed to update typing status" });
  }
});

// DELETE Soft delete message
router.delete("/messages/:id", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const msg = await prisma.message.findUnique({
      where: { id: req.params.id }
    });
    if (!msg) return res.status(404).json({ error: "ไม่พบข้อความนี้" });

    if (role !== "admin" && msg.senderId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบข้อความนี้" });
    }

    const updated = await prisma.message.update({
      where: { id: msg.id },
      data: {
        message: "ข้อความนี้ถูกลบไปแล้ว",
        messageType: "text",
        image: null,
        productInfo: null,
        orderInfo: null,
        locationInfo: null
      }
    });

    broadcastChatEvent({ type: "message_deleted", messageId: msg.id, conversationId: msg.conversationId });
    res.json({ success: true, message: updated });
  } catch (err: any) {
    console.error("Error deleting message:", err);
    res.status(500).json({ error: err.message || "Failed to delete message" });
  }
});

// POST Update conversation status
router.post("/conversations/:id/status", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const role = req.headers["x-user-role"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบก่อนใช้งาน" });

    const conv = await prisma.conversation.findUnique({
      where: { id: req.params.id }
    });
    if (!conv) return res.status(404).json({ error: "ไม่พบห้องสนทนานี้" });

    if (role !== "admin" && conv.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ปรับสถานะการพูดคุยนี้" });
    }

    const { status } = req.body;
    if (!["active", "closed", "blocked"].includes(status)) {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
    }

    const updated = await prisma.conversation.update({
      where: { id: conv.id },
      data: { status }
    });

    broadcastChatEvent({ type: "conversation_status_updated", conversationId: conv.id, status });
    res.json({ success: true, conversation: updated });
  } catch (err: any) {
    console.error("Error updating conversation status:", err);
    res.status(500).json({ error: err.message || "Failed to update status" });
  }
});

// GET Notifications
router.get("/notifications", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบ" });

    const notifs = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
    res.json(notifs);
  } catch (err: any) {
    console.error("Error fetching notifications:", err);
    res.status(500).json({ error: err.message || "Failed to fetch notifications" });
  }
});

// POST Mark notifications read
router.post("/notifications/:id/read", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) return res.status(401).json({ error: "โปรดเข้าสู่ระบบ" });

    const id = req.params.id;
    if (id === "all") {
      await prisma.notification.updateMany({
        where: { userId },
        data: { isRead: true }
      });
    } else {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true }
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("Error reading notifications:", err);
    res.status(500).json({ error: err.message || "Failed to read notifications" });
  }
});

export default router;
