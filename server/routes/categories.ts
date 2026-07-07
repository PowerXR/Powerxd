import { Router } from "express";
import { prisma } from "../db.js";

const router = Router();

// Get All Categories
router.get("/", async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    res.json(categories);
  } catch (err: any) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ error: err.message || "Failed to fetch categories" });
  }
});

// Create Category (Admin Only)
router.post("/", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { id, name, description, icon, imageUrl } = req.body;
    if (!id || !name) {
      return res.status(400).json({ error: "Missing required fields: id and name" });
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

    res.status(201).json(category);
  } catch (err: any) {
    console.error("Error creating category:", err);
    res.status(500).json({ error: err.message || "Failed to create category" });
  }
});

// Update Category (Admin Only)
router.put("/:id", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { name, description, icon, imageUrl } = req.body;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        icon,
        imageUrl
      }
    });

    res.json(category);
  } catch (err: any) {
    console.error("Error updating category:", err);
    res.status(500).json({ error: err.message || "Failed to update category" });
  }
});

// Delete Category (Admin Only)
router.delete("/:id", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    await prisma.category.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Successfully deleted category" });
  } catch (err: any) {
    console.error("Error deleting category:", err);
    res.status(500).json({ error: err.message || "Failed to delete category" });
  }
});

export default router;
