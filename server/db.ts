import { PrismaClient } from "@prisma/client";

export const prisma = new PrismaClient();

export const defaultSettings = {
  id: "settings",
  siteName: "ร้านค้าชุมชนน้ำน้อย",
  siteSubtitle: "ตลาดสินค้าดิจิทัลและผลิตภัณฑ์ชุมชนระดับพรีเมียม",
  primaryColor: "#ef4444",
  themeMode: "dark",
  contactFacebook: "https://facebook.com",
  contactDiscord: "https://discord.gg",
  contactLine: "https://line.me",
  truewalletPhone: "0888888888",
  bankAccountNumber: "1051915832",
  bankAccountName: "ธนกฤต ชูกำเนิด",
  bankName: "ธนาคารไทยพาณิชย์",
  qrSlipToken: "",
  botCfTurnstileKey: "",
  discordClientId: "",
  discordClientSecret: "",
  banners: [],
  allowAngpao: false,
  allowQr: true,
  siteLogoUrl: "",
  siteBackgroundUrl: "",
  announcementActive: false,
  announcementTitle: "",
  announcementBody: "",
  announcementImageUrl: "",
  announcementBarActive: false,
  announcementBarText: "",
  announcementBarBgColor: "#ef4444",
  announcementBarTextColor: "#ffffff",
  announcementBarSpeed: 10,
  announcementBarStyle: "default",
  announcementBarPrefix: "🔥",
  announcementFloatActive: false,
  announcementFloatText: "",
  announcementFloatStyle: "default",
  announcementFloatIcon: "Bell",
  announcementFloatPosition: "bottom-right",
  maintenanceActive: false,
  maintenanceTitle: "",
  maintenanceMessage: "",
  maintenanceEstimatedTime: "",
  maintenanceAutoOpenTime: "",
  aboutUsTitle: "",
  aboutUsBody: "",
  aboutUsImageUrl: "",
  portfolios: [],
  artisans: [],
  landmarks: [],
  recommendActive: false,
  recommendTitle: "",
  recommendSubtitle: "",
  recommendProductIds: [],
  seasonalEffect: "none",
  recentOrdersActive: false,
  recentOrdersStyle: "default",
  recentOrdersSpeed: "normal"
};

export async function ensureSettingsSeeded() {
  try {
    const existing = await prisma.settings.findUnique({ where: { id: "settings" } });
    if (!existing) {
      await prisma.settings.create({
        data: {
          ...defaultSettings,
          banners: JSON.stringify(defaultSettings.banners),
          portfolios: JSON.stringify(defaultSettings.portfolios),
          artisans: JSON.stringify(defaultSettings.artisans),
          landmarks: JSON.stringify(defaultSettings.landmarks),
          recommendProductIds: JSON.stringify(defaultSettings.recommendProductIds)
        } as any
      });
      console.log("Settings table successfully seeded with defaults!");
    }
  } catch (error) {
    console.error("Error seeding default settings:", error);
  }
}
