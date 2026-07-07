import { parseJSON } from "./json.js";

export function sanitizeSetting(setting: any) {
  if (!setting) return setting;
  return {
    ...setting,
    portfolios: parseJSON(setting.portfolios, []),
    artisans: parseJSON(setting.artisans, []),
    landmarks: parseJSON(setting.landmarks, []),
    banners: parseJSON(setting.banners, []),
    recommendProductIds: parseJSON(setting.recommendProductIds, [])
  };
}

// Export both names to prevent any import mistakes
export const sanitizeSettings = sanitizeSetting;

export function sanitizeProduct(product: any) {
  if (!product) return product;
  return {
    ...product,
    stock: parseJSON(product.stock, []),
    boxItems: parseJSON(product.boxItems, [])
  };
}

export function sanitizeTransaction(transaction: any) {
  if (!transaction) return transaction;
  return {
    ...transaction,
    shippingDetails: parseJSON(transaction.shippingDetails, null),
    statusUpdates: parseJSON(transaction.statusUpdates, [])
  };
}

export function sanitizeMessage(message: any) {
  if (!message) return message;
  return {
    ...message,
    productInfo: parseJSON(message.productInfo, null),
    orderInfo: parseJSON(message.orderInfo, null),
    locationInfo: parseJSON(message.locationInfo, null)
  };
}

export function sanitizeReview(review: any) {
  if (!review) return review;
  return review;
}

export function sanitizeConversation(conversation: any) {
  if (!conversation) return conversation;
  return conversation;
}
