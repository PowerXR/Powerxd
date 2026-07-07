import { Router } from "express";
import { prisma, defaultSettings } from "../db.js";

const router = Router();

// GET Source code generator endpoint for PHP PDO system
router.get("/files", async (req, res) => {
  try {
    const dbSettings = await prisma.settings.findUnique({ where: { id: "settings" } });
    const currentSettings = dbSettings || defaultSettings;

    const configPhp = `<?php
/**
 * PHP (PDO) Premium E-commerce Configuration
 * Generated on: ${new Date().toISOString()}
 * Auto-synced with Live Admin Dashboard Settings
 */

define('DB_HOST', '127.0.0.1');
define('DB_PORT', '3306');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'nana');

// Store Settings
define('SITE_NAME', '${(currentSettings.siteName || "ร้านค้าชุมชนน้ำน้อย").replace(/'/g, "\\'")}');
define('SITE_SUBTITLE', '${(currentSettings.siteSubtitle || "").replace(/'/g, "\\'")}');
define('PRIMARY_COLOR', '${currentSettings.primaryColor || "#ef4444"}');
define('THEME_MODE', '${currentSettings.themeMode || "dark"}');

// Payment Options
define('ALLOW_QR', ${currentSettings.allowQr ? 'true' : 'false'});
define('ALLOW_ANGPAO', ${currentSettings.allowAngpao ? 'true' : 'false'});
define('TRUEWALLET_PHONE', '${currentSettings.truewalletPhone || "0888888888"}');
define('BANK_ACCOUNT_NAME', '${(currentSettings.bankAccountName || "").replace(/'/g, "\\'")}');
define('BANK_ACCOUNT_NUMBER', '${currentSettings.bankAccountNumber || ""}');
define('BANK_NAME', '${(currentSettings.bankName || "").replace(/'/g, "\\'")}');

// Discord Config
define('DISCORD_CLIENT_ID', '${currentSettings.discordClientId || ""}');
define('DISCORD_CLIENT_SECRET', '${currentSettings.discordClientSecret || ""}');

try {
    $pdo = new PDO("mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8", DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    die("Database Connection Failed: " . $e->getMessage());
}
`;

    const indexPhp = `<?php
require_once 'config.php';
session_start();

$user = isset($_SESSION['user']) ? $_SESSION['user'] : null;

// Fetch Categories
$stmt = $pdo->query("SELECT * FROM categories");
$categories = $stmt->fetchAll();

// Fetch Latest Products
$stmt = $pdo->query("SELECT * FROM products ORDER BY id DESC LIMIT 8");
$products = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="th" data-bs-theme="<?php echo THEME_MODE; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo SITE_NAME; ?> - <?php echo SITE_SUBTITLE; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body style="background-color: #0c0d12; color: #fff;">
    <nav class="navbar navbar-expand-lg bg-dark border-bottom border-secondary py-3">
        <div class="container">
            <a class="navbar-brand fw-bold text-danger" href="#"><?php echo SITE_NAME; ?></a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav me-auto">
                    <li class="nav-item">
                        <a class="nav-link active" href="#">หน้าแรก</a>
                    </li>
                    <li class="nav-item">
                        <a class="nav-link" href="topup.php">เติมเงิน</a>
                    </li>
                </ul>
                <div class="d-flex">
                    <?php if ($user): ?>
                        <span class="navbar-text me-3 text-light">ยินดีต้อนรับ, <strong><?php echo htmlspecialchars($user['username']); ?></strong> (คงเหลือ <?php echo number_format($user['balance'], 2); ?> ฿)</span>
                        <a href="logout.php" class="btn btn-outline-danger btn-sm">ออกจากระบบ</a>
                    <?php else: ?>
                        <a href="login.php" class="btn btn-danger btn-sm">เข้าสู่ระบบ</a>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </nav>

    <!-- Categories section -->
    <div class="container my-5">
        <h3 class="fw-bold mb-4 text-center">หมวดหมู่ทั้งหมด</h3>
        <div class="row g-3">
            <?php foreach ($categories as $cat): ?>
            <div class="col-md-3">
                <div class="card bg-dark border-secondary text-center p-3 h-100">
                    <div class="card-body">
                        <h5 class="card-title fw-bold text-danger"><?php echo htmlspecialchars($cat['name']); ?></h5>
                        <p class="card-text text-secondary small"><?php echo htmlspecialchars($cat['description']); ?></p>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>

    <!-- Products section -->
    <div class="container my-5">
        <h3 class="fw-bold mb-4 text-center">สินค้าแนะนำประจำสัปดาห์</h3>
        <div class="row g-4">
            <?php foreach ($products as $prod): ?>
            <div class="col-md-3">
                <div class="card bg-dark border-secondary h-100">
                    <img src="<?php echo htmlspecialchars($prod['imageUrl']); ?>" class="card-img-top p-3 rounded" alt="product" style="height: 180px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title fw-bold"><?php echo htmlspecialchars($prod['name']); ?></h5>
                        <p class="text-danger fw-bold fs-5 mb-2"><?php echo number_format($prod['price'], 2); ?> ฿</p>
                        <p class="card-text text-secondary small text-truncate"><?php echo htmlspecialchars($prod['description']); ?></p>
                        <a href="product.php?id=<?php echo $prod['id']; ?>" class="btn btn-danger btn-sm w-100">ดูรายละเอียด</a>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>
    </div>
</body>
</html>`;

    const productPhp = `<?php
require_once 'config.php';
session_start();

$id = isset($_GET['id']) ? $_GET['id'] : '';
$stmt = $pdo->prepare("SELECT * FROM products WHERE id = ?");
$stmt->execute([$id]);
$product = $stmt->fetch();

if (!$product) {
    header("Location: index.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="th" data-bs-theme="<?php echo THEME_MODE; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($product['name']); ?> | <?php echo SITE_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body style="background-color: #0c0d12; color: #fff;">
    <div class="container my-5">
        <div class="row g-5">
            <div class="col-md-6">
                <img src="<?php echo htmlspecialchars($product['imageUrl']); ?>" class="img-fluid rounded border border-secondary" alt="product" style="width: 100%; max-height: 400px; object-fit: cover;">
            </div>
            <div class="col-md-6">
                <a href="index.php" class="btn btn-outline-secondary mb-3"><i class="bi bi-arrow-left"></i> ย้อนกลับ</a>
                <h2 class="fw-bold mb-3"><?php echo htmlspecialchars($product['name']); ?></h2>
                <h3 class="text-danger fw-bold mb-4"><?php echo number_format($product['price'], 2); ?> ฿</h3>
                <p class="text-secondary"><?php echo nl2br(htmlspecialchars($product['description'])); ?></p>
                <hr class="border-secondary my-4">
                
                <form action="purchase_process.php" method="POST">
                    <input type="hidden" name="product_id" value="<?php echo $product['id']; ?>">
                    <button type="submit" class="btn btn-danger btn-lg w-100"><i class="bi bi-cart-plus"></i> สั่งซื้อสินค้านี้ทันที</button>
                </form>
            </div>
        </div>
    </div>
</body>
</html>`;

    const topupPhp = `<?php
require_once 'config.php';
session_start();

$user = isset($_SESSION['user']) ? $_SESSION['user'] : null;
if (!$user) {
    header("Location: login.php");
    exit();
}
?>
<!DOCTYPE html>
<html lang="th" data-bs-theme="<?php echo THEME_MODE; ?>">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>เติมเงินอัตโนมัติ | <?php echo SITE_NAME; ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/sweetalert2@11/dist/sweetalert2.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
</head>
<body style="background-color: #0c0d12; color: #fff;">
    <div class="container my-5">
        <div class="row justify-content-center">
            <div class="col-md-8">
                <a href="index.php" class="btn btn-outline-secondary mb-4"><i class="bi bi-arrow-left"></i> กลับไปร้านค้า</a>
                <h2 class="fw-bold mb-4 text-center"><i class="bi bi-wallet2 text-danger"></i> เมนูเติมเงินอัตโนมัติ</h2>
                
                <div class="row g-4">
                    <!-- QR Code Upload & Scan -->
                    <?php if (ALLOW_QR): ?>
                    <div class="col-md-6">
                        <div class="card bg-dark border-secondary p-4 text-center h-100">
                            <h4><i class="bi bi-qr-code-scan text-danger fs-2"></i></h4>
                            <h5 class="fw-bold mt-2">สแกน QR Code ตรวจสลิป</h5>
                            <p class="text-secondary small">โอนชำระเงินโดยสแกน QR และเซฟสลิป นำรูปอัปโหลดเพื่อเช็คยอดอัตโนมัติ 100%</p>
                            
                            <form action="api_slip_verify.php" method="POST" enctype="multipart/form-data">
                                <div class="mb-3">
                                    <input type="file" name="slip_image" class="form-control" required>
                                </div>
                                <button type="submit" class="btn btn-danger w-100">ยืนยันตรวจสอบสลิป</button>
                            </form>
                        </div>
                    </div>
                    <?php endif; ?>

                    <!-- Truemoney Angpao Gift Link -->
                    <?php if (ALLOW_ANGPAO): ?>
                    <div class="col-md-6">
                        <div class="card bg-dark border-secondary p-4 text-center h-100">
                            <h4><i class="bi bi-gift text-danger fs-2"></i></h4>
                            <h5 class="fw-bold mt-2">เติมผ่านซองอั่งเปา TrueMoney</h5>
                            <p class="text-secondary small">เติมความง่ายเพียงสร้างลิ้งก์ส่งซองอั่งเปาในวอลเล็ท จากนั้นนำลิงก์มาวางเพื่อเติมเงินทันที</p>
                            
                            <form action="api_angpao_verify.php" method="POST">
                                <div class="mb-3">
                                    <input type="url" name="angpao_link" class="form-control" placeholder="https://gift.truemoney.com/campaign/?v=..." required>
                                </div>
                                <button type="submit" class="btn btn-warning w-100">ตรวจสอบซองของขวัญ</button>
                            </form>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>`;

    const instructionsText = `### วิธีการติดตั้งระบบ PHP (PDO) พรีเมียมของคุณหลังดาวน์โหลด

1. **สร้างฐานข้อมูล**: สร้างฐานข้อมูล MySQL / MariaDB ใหม่ผ่าน phpMyAdmin หรือแผงโดเมนของคุณ
2. **แก้ไขไฟล์ config.php**:
   - ปรับเปลี่ยนค่า \`DB_HOST\`, \`DB_USER\`, \`DB_PASS\` และ \`DB_NAME\` ให้ตรงกับโฮสติ้งจริงที่คุณสร้างไว้
   - หากต้องการเพิ่มระบบล็อกอินดิสคอร์ด กรุณาแก้ไข \`DISCORD_CLIENT_ID\` และ \`DISCORD_CLIENT_SECRET\` ที่ได้จากเดสบอร์ดดิสคอร์ดเดฟเวลลอปเปอร์
3. **โครงสร้างฐานข้อมูล (SQL Tables)**:
   - นำไฟล์ SQL โครงสร้างตารางด้านล่างไปอัปโหลด (Import) เข้าฐานข้อมูล MySQL ของคุณเพื่อเริ่มระบบทันที!

\`\`\`sql
CREATE TABLE IF NOT EXISTS categories (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Folder',
  imageUrl VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(50) PRIMARY KEY,
  category_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  imageUrl VARCHAR(255),
  stock_data JSON, -- เก็บรหัสสินค้าหรือไอดีในฟังก์ชันอาเรย์
  timesSold INT DEFAULT 0,
  details TEXT,
  type VARCHAR(20) DEFAULT 'normal'
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 0.00,
  role VARCHAR(20) DEFAULT 'user',
  discord_id VARCHAR(100),
  avatar_url VARCHAR(255),
  password_hash VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS coupons (
  code VARCHAR(50) PRIMARY KEY,
  discount_percent INT DEFAULT 0,
  discount_baht INT DEFAULT 0,
  uses_left INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS transactions (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  username VARCHAR(100),
  type VARCHAR(50),
  amount DECIMAL(10, 2),
  details TEXT,
  status VARCHAR(20) DEFAULT 'success',
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reviews (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  username VARCHAR(100),
  rating INT NOT NULL,
  product_id VARCHAR(50),
  product_name VARCHAR(100),
  comment TEXT,
  date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
\`\`\``;

    return res.json({
      success: true,
      files: [
        { name: "config.php", mode: "php", content: configPhp },
        { name: "index.php", mode: "php", content: indexPhp },
        { name: "product.php", mode: "php", content: productPhp },
        { name: "topup.php", mode: "php", content: topupPhp }
      ],
      instructions: instructionsText
    });
  } catch (err: any) {
    console.error("Error generating PHP exporter files:", err);
    res.status(500).json({ error: err.message || "Failed to generate exporter files" });
  }
});

export default router;
