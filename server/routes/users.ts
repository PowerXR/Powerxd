import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get All Users (Admin Only)
router.get("/", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (err: any) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: err.message || "Failed to fetch users" });
  }
});

// Delete User (Admin Only)
router.delete("/:id", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Successfully deleted user" });
  } catch (err: any) {
    console.error("Error deleting user:", err);
    res.status(500).json({ error: err.message || "Failed to delete user" });
  }
});

// Register User
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: "โปรดกรอกข้อมูลให้ครบถ้วน" });
    }

    const lowerUsername = username.toLowerCase();
    const lowerEmail = email.toLowerCase();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { username: lowerUsername },
          { email: lowerEmail }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: "ชื่อผู้ใช้งานหรืออีเมลนี้ได้รับการลงทะเบียนไปแล้ว" });
    }

    const newUser = await prisma.user.create({
      data: {
        id: "usr-" + Date.now(),
        username: lowerUsername,
        email: lowerEmail,
        password: password, // For simplicity and backwards compat with seeded credentials
        balance: 0,
        role: "user",
        pendingBalance: 0,
        withdrawableBalance: 0,
        avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`
      }
    });

    res.status(201).json(newUser);
  } catch (err: any) {
    console.error("Error registering user:", err);
    res.status(500).json({ error: err.message || "Failed to register user" });
  }
});

// Login User
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "โปรดกรอกชื่อผู้ใช้และรหัสผ่าน" });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() }
    });

    if (!user || user.password !== password) {
      return res.status(400).json({ error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    res.json(user);
  } catch (err: any) {
    console.error("Error logging in:", err);
    res.status(500).json({ error: err.message || "Failed to login" });
  }
});

// Discord Auth Simulation
router.post("/discord-login", async (req, res) => {
  try {
    const { discordUsername, discordId, avatarUrl } = req.body;
    if (!discordUsername || !discordId) {
      return res.status(400).json({ error: "Discord info missing" });
    }

    let user = await prisma.user.findFirst({
      where: { discordId: discordId }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: "usr-dc-" + discordId,
          username: `${discordUsername}_dc`.toLowerCase(),
          email: `${discordUsername}@discord.com`.toLowerCase(),
          balance: 0.00,
          role: "user",
          discordId,
          pendingBalance: 0,
          withdrawableBalance: 0,
          avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1614680376593-902f74fa0d41?auto=format&fit=crop&w=40&q=80"
        }
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { avatarUrl: avatarUrl || user.avatarUrl }
      });
    }

    res.json(user);
  } catch (err: any) {
    console.error("Error in discord-login:", err);
    res.status(500).json({ error: err.message || "Failed to login via Discord" });
  }
});

// Get Current User Profile
router.get("/me/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }
    });
    if (!user) {
      return res.status(404).json({ error: "ไม่พบผู้ใช้ในระบบ" });
    }
    res.json(user);
  } catch (err: any) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({ error: err.message || "Failed to fetch profile" });
  }
});

// Update Profile
router.post("/profile/update", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    if (!userId) {
      return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้นี้ในระบบ" });
    }

    const { username, email, avatarUrl, currentPassword, newPassword } = req.body;

    const dataToUpdate: any = {};

    // Validate username uniqueness if changed
    if (username && username.toLowerCase() !== user.username.toLowerCase()) {
      const exists = await prisma.user.findUnique({
        where: { username: username.toLowerCase() }
      });
      if (exists) {
        return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีผู้ใช้งานแล้ว" });
      }
      dataToUpdate.username = username.toLowerCase();
    }

    // Validate email uniqueness if changed
    if (email && email.toLowerCase() !== user.email.toLowerCase()) {
      const exists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() }
      });
      if (exists) {
        return res.status(400).json({ error: "อีเมลนี้มีผู้ใช้งานแล้ว" });
      }
      dataToUpdate.email = email.toLowerCase();
    }

    if (avatarUrl !== undefined) {
      dataToUpdate.avatarUrl = avatarUrl;
    }

    // Handle Password Change
    if (newPassword) {
      if (user.password && user.password !== currentPassword) {
        return res.status(400).json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
      }
      dataToUpdate.password = newPassword;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: dataToUpdate
    });

    res.json({ message: "อัปเดตโปรไฟล์สำเร็จ", user: updatedUser });
  } catch (err: any) {
    console.error("Error updating profile:", err);
    res.status(500).json({ error: err.message || "Failed to update profile" });
  }
});

export default router;
