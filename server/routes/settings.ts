import { Router } from "express";
import { prisma, defaultSettings, sanitizeSettings, stringifySettings } from "../db.js";

const router = Router();

// Helper to parse date consistently with +07:00 (Thai) timezone
const parseTargetTime = (timeStr: string): Date => {
  if (!timeStr) return new Date();
  if (timeStr.includes("Z") || timeStr.includes("+") || /-\d{2}:\d{2}$/.test(timeStr)) {
    return new Date(timeStr);
  }
  return new Date(timeStr + "+07:00");
};

// Get Store Settings
router.get("/", async (req, res) => {
  try {
    let settings = await prisma.settings.findUnique({ where: { id: "settings" } });
    if (!settings) {
      settings = await prisma.settings.create({
        data: {
          ...defaultSettings,
          banners: JSON.stringify(defaultSettings.banners),
          portfolios: JSON.stringify(defaultSettings.portfolios),
          artisans: JSON.stringify(defaultSettings.artisans),
          landmarks: JSON.stringify(defaultSettings.landmarks),
          recommendProductIds: JSON.stringify(defaultSettings.recommendProductIds)
        } as any
      });
    }

    // Check if auto-open time has passed and maintenance is active
    if (settings.maintenanceActive && settings.maintenanceAutoOpenTime) {
      try {
        const autoOpenDate = parseTargetTime(settings.maintenanceAutoOpenTime);
        const currentDate = new Date();
        // Allow a 15-second grace period for clock skew between client and server
        if (!isNaN(autoOpenDate.getTime()) && (currentDate.getTime() + 15000) >= autoOpenDate.getTime()) {
          console.log(`Auto-open scheduled time reached: ${settings.maintenanceAutoOpenTime}. Automatically opening the website.`);
          settings = await prisma.settings.update({
            where: { id: "settings" },
            data: {
              maintenanceActive: false,
              maintenanceAutoOpenTime: ""
            }
          });
        }
      } catch (err) {
        console.error("Error checking auto-open settings:", err);
      }
    }

    res.json({ ...sanitizeSettings(settings), serverTime: Date.now() });
  } catch (err: any) {
    console.error("Error fetching settings:", err);
    res.status(500).json({ error: err.message || "Failed to fetch settings" });
  }
});

// Auto-open endpoint when countdown completes
router.post("/auto-open", async (req, res) => {
  try {
    console.log("Auto-open triggered by client. Automatically opening the website.");
    const settings = await prisma.settings.update({
      where: { id: "settings" },
      data: {
        maintenanceActive: false,
        maintenanceAutoOpenTime: ""
      }
    });
    res.json({ success: true, settings: sanitizeSettings(settings) });
  } catch (err: any) {
    console.error("Error in auto-open endpoint:", err);
    res.status(500).json({ error: err.message || "Failed to auto-open settings" });
  }
});

// Update Store Settings (Admin)
router.put("/", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const { id, serverTime, ...updatedData } = req.body;
    const stringifiedData = stringifySettings(updatedData);

    const settings = await prisma.settings.upsert({
      where: { id: "settings" },
      create: {
        id: "settings",
        ...stringifySettings(defaultSettings),
        ...stringifiedData
      },
      update: stringifiedData
    });

    res.json({ message: "Successfully updated settings", settings: sanitizeSettings(settings) });
  } catch (err: any) {
    console.error("Error updating settings:", err);
    res.status(500).json({ error: err.message || "Failed to update settings" });
  }
});

export default router;
