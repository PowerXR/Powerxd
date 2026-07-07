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

import { parseJSON } from "./lib/json.js";
import {
  sanitizeSetting,
  sanitizeSettings,
  sanitizeProduct,
  sanitizeTransaction,
  sanitizeMessage,
  sanitizeReview,
  sanitizeConversation
} from "./lib/sanitize.js";

export {
  parseJSON,
  sanitizeSetting,
  sanitizeSettings,
  sanitizeProduct,
  sanitizeTransaction,
  sanitizeMessage,
  sanitizeReview,
  sanitizeConversation
};

export function stringifySettings(data: any) {
  if (!data) return data;
  const result = { ...data };
  if (result.banners !== undefined) result.banners = typeof result.banners === "string" ? result.banners : JSON.stringify(result.banners);
  if (result.portfolios !== undefined) result.portfolios = typeof result.portfolios === "string" ? result.portfolios : JSON.stringify(result.portfolios);
  if (result.artisans !== undefined) result.artisans = typeof result.artisans === "string" ? result.artisans : JSON.stringify(result.artisans);
  if (result.landmarks !== undefined) result.landmarks = typeof result.landmarks === "string" ? result.landmarks : JSON.stringify(result.landmarks);
  if (result.recommendProductIds !== undefined) result.recommendProductIds = typeof result.recommendProductIds === "string" ? result.recommendProductIds : JSON.stringify(result.recommendProductIds);
  return result;
}

export function stringifyProduct(data: any) {
  if (!data) return data;
  const result = { ...data };
  if (result.stock !== undefined) result.stock = typeof result.stock === "string" ? result.stock : JSON.stringify(result.stock);
  if (result.boxItems !== undefined) result.boxItems = typeof result.boxItems === "string" ? result.boxItems : JSON.stringify(result.boxItems);
  return result;
}

export function stringifyTransaction(data: any) {
  if (!data) return data;
  const result = { ...data };
  if (result.shippingDetails !== undefined) result.shippingDetails = typeof result.shippingDetails === "string" ? result.shippingDetails : JSON.stringify(result.shippingDetails);
  if (result.statusUpdates !== undefined) result.statusUpdates = typeof result.statusUpdates === "string" ? result.statusUpdates : JSON.stringify(result.statusUpdates);
  return result;
}

export function stringifyMessage(data: any) {
  if (!data) return data;
  const result = { ...data };
  if (result.productInfo !== undefined) result.productInfo = typeof result.productInfo === "string" ? result.productInfo : JSON.stringify(result.productInfo);
  if (result.orderInfo !== undefined) result.orderInfo = typeof result.orderInfo === "string" ? result.orderInfo : JSON.stringify(result.orderInfo);
  if (result.locationInfo !== undefined) result.locationInfo = typeof result.locationInfo === "string" ? result.locationInfo : JSON.stringify(result.locationInfo);
  return result;
}


