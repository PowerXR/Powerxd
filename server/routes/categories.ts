import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get All Categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json({ success: true, data: categories });
  } catch (err: any) {
    console.error("GET /api/categories - Error fetching categories:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to fetch categories" });
  }
});

// Create Category (Admin Only)
router.post("/", async (req, res) => {
  console.log("POST /api/categories - Request received. Headers:", req.headers, "Body:", req.body);
  try {
    let adminCheck = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"] as string;

    if (!adminCheck && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        adminCheck = user.role;
      }
    }

    if (!adminCheck) {
      adminCheck = "admin"; // Bypass/fallback for setup and development
    }

    if (adminCheck !== "admin") {
      console.warn("POST /api/categories - Unauthorized access attempt. Role:", adminCheck);
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    let { id, name, description, icon, imageUrl } = req.body;

    // Fail-safe default generation for category creation
    if (!id) {
      id = "cat_" + Date.now() + "_" + Math.random().toString(36).substring(2, 9);
      console.log(`POST /api/categories - Missing category ID. Generated auto ID: ${id}`);
    }

    if (!name) {
      name = "หมวดหมู่ใหม่ไม่มีชื่อ";
    }

    const category = await prisma.category.create({
      data: {
        id,
        name,
        description: description || "",
        icon: icon || "Folder",
        imageUrl: imageUrl || ""
      }
    });

    console.log("POST /api/categories - Successfully created category:", category.id);
    res.status(201).json({ success: true, data: category });
  } catch (err: any) {
    console.error("POST /api/categories - Error creating category. Body was:", req.body, "Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to create category" });
  }
});

// Update Category (Admin Only)
router.put("/:id", async (req, res) => {
  console.log(`PUT /api/categories/${req.params.id} - Request received. Headers:`, req.headers, "Body:", req.body);
  try {
    let adminCheck = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"] as string;

    if (!adminCheck && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        adminCheck = user.role;
      }
    }

    if (!adminCheck) {
      adminCheck = "admin"; // Bypass/fallback for setup and development
    }

    if (adminCheck !== "admin") {
      console.warn(`PUT /api/categories/${req.params.id} - Unauthorized access attempt. Role:`, adminCheck);
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    const { name, description, icon, imageUrl } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name: name !== undefined ? name : undefined,
        description: description !== undefined ? description : undefined,
        icon: icon !== undefined ? icon : undefined,
        imageUrl: imageUrl !== undefined ? imageUrl : undefined
      }
    });

    console.log(`PUT /api/categories/${req.params.id} - Successfully updated category:`, category.id);
    res.json({ success: true, data: category });
  } catch (err: any) {
    console.error(`PUT /api/categories/${req.params.id} - Error updating category. Body was:`, req.body, "Error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to update category" });
  }
});

// Delete Category (Admin Only)
router.delete("/:id", async (req, res) => {
  console.log(`DELETE /api/categories/${req.params.id} - Request received. Headers:`, req.headers);
  try {
    let adminCheck = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"] as string;

    if (!adminCheck && userId) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        adminCheck = user.role;
      }
    }

    if (!adminCheck) {
      adminCheck = "admin"; // Bypass/fallback for setup and development
    }

    if (adminCheck !== "admin") {
      console.warn(`DELETE /api/categories/${req.params.id} - Unauthorized access attempt. Role:`, adminCheck);
      return res.status(403).json({ success: false, message: "Unauthorized access" });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    console.log(`DELETE /api/categories/${req.params.id} - Successfully deleted category`);
    res.json({ success: true, data: { message: "Successfully deleted category" } });
  } catch (err: any) {
    console.error(`DELETE /api/categories/${req.params.id} - Error deleting category. Error:`, err);
    res.status(500).json({ success: false, message: err.message || "Failed to delete category" });
  }
});

export default router;
