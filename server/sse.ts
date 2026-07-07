import { Response } from "express";
import { prisma } from "./db.js";

export let sseClients: Response[] = [];

export function addClient(res: Response) {
  sseClients.push(res);
}

export function removeClient(res: Response) {
  sseClients = sseClients.filter((client) => client !== res);
}

export function broadcastChatEvent(data: any) {
  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (err) {
      // Disconnected clients handled gracefully
    }
  });
}

export async function broadcastPurchase(tx: any) {
  let maskedUsername = "ผู้ใช้ทั่วไป";
  if (tx.username) {
    const len = tx.username.length;
    if (len <= 2) {
      maskedUsername = tx.username[0] + "*";
    } else {
      maskedUsername = tx.username.slice(0, 2) + "*".repeat(Math.max(1, len - 4)) + tx.username.slice(-2);
    }
  }

  let cleanDetails = tx.details || "";
  if (cleanDetails.includes(" - ")) {
    cleanDetails = cleanDetails.split(" - ")[0];
  }

  // Try to resolve productId and imageUrl
  let productId = tx.productId || "";
  let imageUrl = "";

  try {
    if (!productId && cleanDetails) {
      const match = cleanDetails.match(/\[(.*?)\]/);
      if (match && match[1]) {
        const productName = match[1];
        const foundProd = await prisma.product.findFirst({
          where: { name: productName }
        });
        if (foundProd) {
          productId = foundProd.id;
          imageUrl = foundProd.imageUrl;
        }
      }
    } else if (productId) {
      const foundProd = await prisma.product.findUnique({
        where: { id: productId }
      });
      if (foundProd) {
        imageUrl = foundProd.imageUrl;
      }
    }
  } catch (err) {
    console.error("Error matching product for SSE broadcast:", err);
  }

  const payload = {
    id: tx.id,
    username: maskedUsername,
    type: tx.type,
    amount: tx.amount,
    details: cleanDetails,
    date: tx.date,
    status: tx.status,
    productId,
    imageUrl
  };

  sseClients.forEach((client) => {
    try {
      client.write(`data: ${JSON.stringify({ type: "purchase", data: payload })}\n\n`);
    } catch (e) {
      // Disconnected clients handled gracefully
    }
  });
}
