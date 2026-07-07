import { Router } from "express";
import { prisma } from "../db.js";
import { broadcastPurchase } from "../sse.js";

const router = Router();

// Get All Products
router.get("/", async (req, res) => {
  try {
    const products = await prisma.product.findMany();
    // Ensure stock and boxItems are properly structured arrays in response
    const formatted = products.map((p) => ({
      ...p,
      stock: typeof p.stock === "string" ? JSON.parse(p.stock) : (p.stock || []),
      boxItems: typeof p.boxItems === "string" ? JSON.parse(p.boxItems) : (p.boxItems || [])
    }));
    res.json(formatted);
  } catch (err: any) {
    console.error("Error fetching products:", err);
    res.status(500).json({ error: err.message || "Failed to fetch products" });
  }
});

// Create Product (Admin Only)
router.post("/", async (req, res) => {
  try {
    const adminCheck = req.headers["x-user-role"];
    if (adminCheck !== "admin") {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    const {
      id,
      categoryId,
      name,
      price,
      description,
      imageUrl,
      stock,
      details,
      type,
      videoUrl,
      boxItems,
      sellerId,
      sellerName,
      sellerType
    } = req.body;

    if (!id || !categoryId || !name || price === undefined) {
      return res.status(400).json({ error: "Missing required product fields" });
    }

    const product = await prisma.product.create({
      data: {
        id,
        categoryId,
        name,
        price: Number(price),
        description: description || "",
        imageUrl: imageUrl || "",
        stock: Array.isArray(stock) ? stock : [],
        timesSold: 0,
        details: details || "",
        type: type || "normal",
        videoUrl: videoUrl || "",
        boxItems: Array.isArray(boxItems) ? boxItems : [],
        sellerId: sellerId || null,
        sellerName: sellerName || null,
        sellerType: sellerType || null
      }
    });

    res.status(201).json(product);
  } catch (err: any) {
    console.error("Error creating product:", err);
    res.status(500).json({ error: err.message || "Failed to create product" });
  }
});

// Update Product (Admin or Seller)
router.put("/:id", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"] as string;

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "ไม่พบสินค้าชิ้นนี้" });
    }

    // Authorization check: must be admin, or the seller who owns the product
    if (userRole !== "admin" && existingProduct.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขสินค้านี้" });
    }

    const {
      categoryId,
      name,
      price,
      description,
      imageUrl,
      stock,
      details,
      type,
      videoUrl,
      boxItems,
      sellerId,
      sellerName,
      sellerType
    } = req.body;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        categoryId,
        name,
        price: price !== undefined ? Number(price) : undefined,
        description,
        imageUrl,
        stock: Array.isArray(stock) ? stock : undefined,
        details,
        type,
        videoUrl,
        boxItems: Array.isArray(boxItems) ? boxItems : undefined,
        sellerId,
        sellerName,
        sellerType
      }
    });

    res.json(updated);
  } catch (err: any) {
    console.error("Error updating product:", err);
    res.status(500).json({ error: err.message || "Failed to update product" });
  }
});

// Delete Product (Admin or Seller)
router.delete("/:id", async (req, res) => {
  try {
    const userRole = req.headers["x-user-role"];
    const userId = req.headers["x-user-id"] as string;

    const existingProduct = await prisma.product.findUnique({
      where: { id: req.params.id }
    });

    if (!existingProduct) {
      return res.status(404).json({ error: "ไม่พบสินค้าชิ้นนี้" });
    }

    // Authorization check: must be admin, or the seller who owns the product
    if (userRole !== "admin" && existingProduct.sellerId !== userId) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบสินค้านี้" });
    }

    await prisma.product.delete({
      where: { id: req.params.id }
    });

    res.json({ message: "Successfully deleted product" });
  } catch (err: any) {
    console.error("Error deleting product:", err);
    res.status(500).json({ error: err.message || "Failed to delete product" });
  }
});

// Buy Product or Roll Box API
router.post("/:id/purchase", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const couponCode = req.query.coupon as string;

    if (!userId) {
      return res.status(403).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    const purchaseResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้นี้ในระบบ");
      }

      const product = await tx.product.findUnique({
        where: { id: req.params.id }
      });

      if (!product) {
        throw new Error("ไม่พบสินค้าชิ้นนี้");
      }

      const stockList: string[] = typeof product.stock === "string" ? JSON.parse(product.stock) : (product.stock as string[] || []);

      if (stockList.length < 1) {
        throw new Error("สินค้าชิ้นนี้หมดชั่วคราว");
      }

      // Apply Coupon if exists
      let priceToPay = product.price;
      let couponDetails = "";
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.trim() }
        });
        if (coupon && coupon.usesLeft > 0) {
          if (coupon.discountPercent > 0) {
            priceToPay = Math.max(0, parseFloat((priceToPay * (1 - coupon.discountPercent / 100)).toFixed(2)));
            couponDetails = `ใช้โค้ด ${coupon.code} (ลด ${coupon.discountPercent}%)`;
          } else if (coupon.discountBaht > 0) {
            priceToPay = Math.max(0, priceToPay - coupon.discountBaht);
            couponDetails = `ใช้โค้ด ${coupon.code} (ลด ${coupon.discountBaht} บาท)`;
          }
          // Deduct coupon uses
          await tx.coupon.update({
            where: { code: coupon.code },
            data: { usesLeft: coupon.usesLeft - 1 }
          });
        }
      }

      // Shipping fee addition like Shopee
      let shippingDetailsText = "";
      let shippingFee = 0;
      const shippingDetails = req.body.shippingDetails;
      if (shippingDetails) {
        const { name, phone, address, zip, method, fee } = shippingDetails;
        if (name && phone && address) {
          shippingFee = fee !== undefined ? Number(fee) : 45;
          shippingDetailsText = ` | จัดส่งถึงคุณ: ${name} โทร. ${phone} ที่อยู่: ${address}, ${zip} (${method} ค่าส่ง ${shippingFee}฿)`;
        }
      }

      const totalToPay = parseFloat((priceToPay + shippingFee).toFixed(2));

      if (user.balance < totalToPay) {
        throw new Error("ยอดเงินคงเหลือไม่เพียงพอสำหรับค่าสินค้าและค่าจัดส่งจัดสินค้าพิเศษ กรุณาเติมเงินก่อนเพื่อทำรายการนี้ค่ะ");
      }

      // Execute Purchase: Deduct user balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: parseFloat((user.balance - totalToPay).toFixed(2)) }
      });

      let rewardDetails = "";
      let alertTitle = "ซื้อสินค้าสำเร็จ!";

      const boxItemsList: any[] = typeof product.boxItems === "string" ? JSON.parse(product.boxItems) : (product.boxItems as any[] || []);

      if (product.type === "box" && boxItemsList.length > 0) {
        // Pick a random prize based on percentages
        const totalRate = boxItemsList.reduce((acc: number, item: any) => acc + item.rate, 0);
        const roll = Math.random() * totalRate;
        let selectedItem = boxItemsList[boxItemsList.length - 1]; // Fallback

        let currentSum = 0;
        for (const item of boxItemsList) {
          currentSum += item.rate;
          if (roll <= currentSum) {
            selectedItem = item;
            break;
          }
        }

        rewardDetails = `กล่องสุ่ม: ได้รับ [${selectedItem.name}] รายละเอียด: ${selectedItem.accountData}`;
        alertTitle = selectedItem.isJackpot ? "🎉 แจ็คพอตแตก! ยินดีด้วย!" : "สุ่มสำเร็จ!";

        // Keep token stock level
        stockList.shift();
      } else {
        // Normal product purchase: pop one stock item
        rewardDetails = stockList.shift() || "No detail";
      }

      // Update Product Stock and Times Sold
      await tx.product.update({
        where: { id: product.id },
        data: {
          stock: stockList,
          timesSold: product.timesSold + 1
        }
      });

      // Credit seller's pendingBalance if owned by community seller
      if (product.sellerId) {
        const seller = await tx.user.findUnique({
          where: { id: product.sellerId }
        });
        if (seller) {
          const currentPending = seller.pendingBalance || 0;
          await tx.user.update({
            where: { id: seller.id },
            data: { pendingBalance: parseFloat((currentPending + totalToPay).toFixed(2)) }
          });
        }
      }

      // Record Transaction
      const hasShipping = shippingDetails && shippingDetails.name;
      const txId = "tx-" + Date.now();

      const newTx = await tx.transaction.create({
        data: {
          id: txId,
          userId: user.id,
          username: user.username,
          type: product.type === "box" ? "purchase_box" : "purchase_product",
          amount: totalToPay,
          details: `${product.type === "box" ? "สุ่มกล่อง" : "ซื้อสินค้าจัดส่ง"} [${product.name}] - ${rewardDetails} ${couponDetails}${shippingDetailsText}`,
          status: "success",
          date: new Date().toISOString(),
          shippingDetails: hasShipping ? shippingDetails : null,
          orderStatus: hasShipping ? "preparing" : null,
          trackingNumber: "",
          trackingCarrier: "",
          statusUpdates: hasShipping ? [
            {
              status: "preparing",
              date: new Date().toISOString(),
              note: "ร้านค้าได้รับคำสั่งซื้อและกำลังเริ่มจัดเตรียมพัสดุของคุณ"
            }
          ] : null
        }
      });

      return {
        updatedUser,
        product,
        totalToPay,
        rewardDetails,
        alertTitle,
        newTx
      };
    });

    try {
      broadcastPurchase({
        ...purchaseResult.newTx,
        productId: purchaseResult.product.id,
        imageUrl: purchaseResult.product.imageUrl
      });
    } catch (e) {
      console.error("Error broadcasting purchase event:", e);
    }

    res.json({
      success: true,
      title: purchaseResult.alertTitle,
      productName: purchaseResult.product.name,
      paidAmount: purchaseResult.totalToPay,
      data: purchaseResult.rewardDetails,
      newBalance: purchaseResult.updatedUser.balance
    });
  } catch (err: any) {
    console.error("Error processing purchase:", err);
    res.status(500).json({ error: err.message || "Failed to process purchase" });
  }
});

// Cart Checkout API for Multi-Product Purchases
router.post("/checkout", async (req, res) => {
  try {
    const userId = req.headers["x-user-id"] as string;
    const { items, shippingDetails, couponCode } = req.body;

    if (!userId) {
      return res.status(403).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    const checkoutResult = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("ไม่พบข้อมูลผู้ใช้นี้ในระบบ");
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        throw new Error("ไม่มีสินค้าในตะกร้าเพื่อทำการสั่งซื้อ");
      }

      // Validate all products in the cart first
      const validatedItems: { product: any; quantity: number; stockList: string[] }[] = [];
      let subtotal = 0;

      for (const cartItem of items) {
        const product = await tx.product.findUnique({
          where: { id: cartItem.productId }
        });
        if (!product) {
          throw new Error(`ไม่พบสินค้าที่มีรหัส ${cartItem.productId} ในระบบ`);
        }
        const quantity = Number(cartItem.quantity) || 1;
        const stockList: string[] = typeof product.stock === "string" ? JSON.parse(product.stock) : (product.stock as string[] || []);

        if (stockList.length < quantity) {
          throw new Error(`สินค้า [${product.name}] มีสินค้าคงเหลือไม่เพียงพอ (คงเหลือ ${stockList.length} ชิ้น)`);
        }

        validatedItems.push({ product, quantity, stockList });
        subtotal += product.price * quantity;
      }

      // Apply Coupon if exists
      let priceToPay = subtotal;
      let couponDetails = "";
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.trim() }
        });
        if (coupon && coupon.usesLeft > 0) {
          if (coupon.discountPercent > 0) {
            const discount = parseFloat((subtotal * (coupon.discountPercent / 100)).toFixed(2));
            priceToPay = Math.max(0, subtotal - discount);
            couponDetails = `ใช้โค้ด ${coupon.code} (ลด ${coupon.discountPercent}%)`;
          } else if (coupon.discountBaht > 0) {
            priceToPay = Math.max(0, subtotal - coupon.discountBaht);
            couponDetails = `ใช้โค้ด ${coupon.code} (ลด ${coupon.discountBaht} บาท)`;
          }
          // Deduct coupon uses
          await tx.coupon.update({
            where: { code: coupon.code },
            data: { usesLeft: coupon.usesLeft - 1 }
          });
        }
      }

      // Shipping fee
      let shippingFee = 0;
      let shippingDetailsText = "";
      if (shippingDetails && shippingDetails.name) {
        shippingFee = shippingDetails.fee !== undefined ? Number(shippingDetails.fee) : 45;
        shippingDetailsText = ` | จัดส่งถึงคุณ: ${shippingDetails.name} โทร. ${shippingDetails.phone} ที่อยู่: ${shippingDetails.address}, ${shippingDetails.zip} (${shippingDetails.method} ค่าส่ง ${shippingFee}฿)`;
      }

      const totalToPay = parseFloat((priceToPay + shippingFee).toFixed(2));

      if (user.balance < totalToPay) {
        throw new Error("ยอดเงินคงเหลือของคุณไม่เพียงพอสำหรับค่าสินค้าในตะกร้าและค่าจัดส่ง กรุณาเติมเงินก่อนทำรายการค่ะ");
      }

      // Deduct user balance
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: parseFloat((user.balance - totalToPay).toFixed(2)) }
      });

      // Process each item
      const purchasedSummary: string[] = [];
      const rewardsList: string[] = [];

      for (const { product, quantity, stockList } of validatedItems) {
        const itemRewards: string[] = [];
        for (let i = 0; i < quantity; i++) {
          itemRewards.push(stockList.shift() || "No detail");
        }

        // Update product stock and sold count in database
        await tx.product.update({
          where: { id: product.id },
          data: {
            stock: stockList,
            timesSold: product.timesSold + quantity
          }
        });

        const itemSubtotal = product.price * quantity;

        // Credit seller's pendingBalance
        if (product.sellerId) {
          const seller = await tx.user.findUnique({
            where: { id: product.sellerId }
          });
          if (seller) {
            const currentPending = seller.pendingBalance || 0;
            await tx.user.update({
              where: { id: seller.id },
              data: { pendingBalance: parseFloat((currentPending + itemSubtotal).toFixed(2)) }
            });
          }
        }

        purchasedSummary.push(`${product.name} (x${quantity})`);
        rewardsList.push(`${product.name} [x${quantity}]: ${itemRewards.join(", ")}`);
      }

      const hasShipping = shippingDetails && shippingDetails.name;
      const txId = "tx-" + Date.now();

      const newTx = await tx.transaction.create({
        data: {
          id: txId,
          userId: user.id,
          username: user.username,
          type: "purchase_product",
          amount: totalToPay,
          details: `ซื้อสินค้าจากตะกร้า: ${purchasedSummary.join(", ")} - รายละเอียดสินค้า: ${rewardsList.join(" | ")} ${couponDetails}${shippingDetailsText}`,
          status: "success",
          date: new Date().toISOString(),
          shippingDetails: hasShipping ? shippingDetails : null,
          orderStatus: hasShipping ? "preparing" : null,
          trackingNumber: "",
          trackingCarrier: "",
          statusUpdates: hasShipping ? [
            {
              status: "preparing",
              date: new Date().toISOString(),
              note: "ร้านค้าได้รับคำสั่งซื้อจากตะกร้าสินค้าเรียบร้อยแล้ว และกำลังเตรียมจัดส่งพัสดุของคุณ"
            }
          ] : null
        }
      });

      return {
        updatedUser,
        totalToPay,
        purchasedSummary,
        rewardsList,
        newTx,
        firstItem: validatedItems[0]
      };
    });

    try {
      broadcastPurchase({
        ...checkoutResult.newTx,
        productId: checkoutResult.firstItem?.product?.id,
        imageUrl: checkoutResult.firstItem?.product?.imageUrl
      });
    } catch (e) {
      console.error("Error broadcasting purchase event:", e);
    }

    res.json({
      success: true,
      title: "สั่งซื้อสินค้าจากตะกร้าสำเร็จ!",
      purchasedProducts: checkoutResult.purchasedSummary,
      paidAmount: checkoutResult.totalToPay,
      newBalance: checkoutResult.updatedUser.balance,
      data: checkoutResult.rewardsList.join("\n")
    });
  } catch (err: any) {
    console.error("Error processing cart checkout:", err);
    res.status(500).json({ error: err.message || "Failed to checkout cart" });
  }
});

export default router;
