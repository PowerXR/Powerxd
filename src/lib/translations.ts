// Translation dictionaries for Thai, English, and Chinese
export type Language = "th" | "en" | "zh";

export const translations = {
  th: {
    // Nav
    home: "หน้าแรก",
    aboutUs: "เกี่ยวกับเรา",
    portfolios: "ผลงานมรดก",
    artisans: "ช่างฝีมือ",
    products: "ผลิตภัณฑ์สินค้า",
    contactUs: "ติดต่อเรา",
    mapTitle: "แผนที่นำเที่ยววัฒนธรรมตำบลน้ำน้อย",
    mapSub: "เลือกพิกัดสถานที่ท่องเที่ยวและจุดเรียนรู้ภูมิปัญญาเพื่อดูรายละเอียดเชิงลึกและทิศทาง",

    // Header & User Menu
    login: "เข้าสู่ระบบ",
    register: "สมัครผู้ร่วมทาง",
    logout: "ออกจากระบบ",
    support: "สนับสนุนเติมเงิน",
    adminDashboard: "ระบบสารสนเทศหลังบ้าน",
    purchaseHistory: "ประวัติการสั่งซื้อทั้งหมด",
    rolePanel: "แผงควบคุมบทบาท",
    adminRole: "🛡️ ผู้ปกครองตำบล (แอดมิน)",
    memberRole: "👤 สมาชิกชุมชน",
    balance: "เครดิตสะสม",
    supportBtn: "สนับสนุน",

    // Main titles
    artisansTitle: "บรมครูช่างฝีมือผู้รักษามรดก",
    artisansSub: "บุคคลสำคัญปราชญ์ชาวบ้านผู้สืบทอดจิตวิญญาณแห่งลุ่มน้ำและผืนดินตำบลน้ำน้อย",
    portfoliosTitle: "คลังภาพผลงานหัตถศิลป์มงคล",
    portfoliosSub: "ความภาคภูมิใจและอัตลักษณ์ทางวัฒนธรรมที่ถูกถ่ายทอดผ่านงานฝีมืออันประณีต",
    productsTitle: "ผลิตภัณฑ์มงคลและผ้าบาติกชุมชน",
    productsSub: "สนับสนุนฝีมือชุมชนเพื่อการพัฒนาและรักษารากเหง้าวัฒนธรรมวิถีชีวิตชาวน้ำน้อยอย่างยั่งยืน",
    aboutUsTitle: "วิถีหัตถศิลป์ ชุมชนตำบลน้ำน้อย",
    aboutUsBody: "ตำบลน้ำน้อย อำเภอหาดใหญ่ จังหวัดสงขลา เป็นดินแดนที่มีประวัติศาสตร์และภูมิปัญญาพื้นบ้านที่สืบทอดกันมาหลายชั่วอายุคน โดยเฉพาะกลุ่มงานหัตถศิลป์ทอผ้าบาติกเขียนลายโบราณ และการจักสานใบลานที่มีความโดดเด่นเป็นเอกลักษณ์ ผลิตภัณฑ์ทุกชิ้นของเราไม่ได้เป็นเพียงสินค้าทั่วไป แต่เป็นตัวแทนความภาคภูมิใจ ความประณีต และการรักษามรดกทางวัฒนธรรมท้องถิ่นให้อยู่คู่วิถีไทยสืบไป",

    // Map markers translations
    categoryAdmin: "🏛️ สถานที่ราชการ",
    categoryCraft: "✨ งานหัตถกรรม/ฝีมือ",
    categoryTemple: "🙏 โบราณสถาน/วัด",
    categoryNature: "🌳 แหล่งธรรมชาติ",
    categoryMarket: "🛒 ร้านค้าชุมชน",
    phoneContact: "📞 โทรติดต่อ:",
    directionBtn: "🧭 นำทาง (Google Maps)",
    noImg: "ไม่มีรูปภาพ",

    // Products & Actions
    buyNow: "สั่งซื้อทันที",
    viewDetails: "ดูรายละเอียด",
    categoryAll: "ทั้งหมด",
    stock: "คงเหลือ",
    items: "ชิ้น",
    price: "ราคา",
    noProducts: "ไม่พบสินค้าในหมวดหมู่นี้",
    couponCode: "รหัสคูปองส่วนลด",
    applyCoupon: "ใช้งานคูปอง",
    successBuy: "การสั่งซื้อสำเร็จ",
    insufficientFunds: "เครดิตของคุณไม่เพียงพอ กรุณาสนับสนุนเติมเงินก่อนทำรายการค่ะ",
    quantity: "จำนวนที่ต้องการสั่งซื้อ",
    totalPrice: "ราคารวมทั้งหมด",

    // Footer
    footerRights: "สงวนลิขสิทธิ์ข้อมูลสาธารณประโยชน์เชิงวัฒนธรรม วิสาหกิจรวมกลุ่มตำบลน้ำน้อย",
    footerAddress: "ตำบลน้ำน้อย อำเภอหาดใหญ่ จังหวัดสงขลา ประเทศไทย",

    // UI Buttons
    close: "ปิดหน้าต่าง",
    save: "บันทึกข้อมูล",
    cancel: "ยกเลิก",

    // Artisans section in products list
    meetArtisans: "🏛️ หัตถกรรมผู้ทรงภูมิปัญญาตำบลน้ำน้อย",
    artisansSectionTitle: "ทำความรู้จักกับ",
    artisansSectionHighlight: "ช่างฝีมือชุมชน",
    artisansSectionBio: "เราเล็งเห็นคุณค่าของการสืบทอดมรดกทางวัฒนธรรมและร่วมเคียงคู่กับภูมิปัญญาชาวบ้านตำบลน้ำน้อย อำเภอหาดใหญ่ จังหวัดสงขลา ผลิตภัณฑ์ OTOP และอาหารทุกชิ้นที่โชว์บนเว็ปไซต์นี้รังสรรค์ด้วยประณีตศิลป์แห่งวิถีชาวใต้จากฝีมือของศิลปินชุมชนน้ำน้อยตัวจริง เสียงจริง ทุกๆ ชิ้นงานล้วนใส่หัวใจและจิตวิญญาณแห่งความเป็นไทยร่วมสมัยไว้ครบถ้วน",
    sustainDirect: "สนับสนุนความยั่งยืน กระจายรายได้สู่ชุมชนโดยตรง 100%",
    featuredArtisanTag: "★ FEATURED ARTISAN / ปราชญ์ผู้สร้างสรรค์",
    featuredArtisanName: "กลุ่มทอและเขียนลายบาติกบ้านน้ำน้อย",
    featuredArtisanQuote: "การเขียนเทียนลงบนผืนผ้าบาติกคือการบันทึกธรรมชาติรอบตัวเรา ลายคลื่นของแม่น้ำน้ำน้อยอันหล่อเลี้ยงชีวิต คือหัวใจที่เราคราฟต์ลงบนผ้าครามธรรมชาติผืนทองนี้ด้วยใจภักดิ์",
    curatedArtistryTag: "✨ หัตถกรรมคัดสรรระดับพรีเมียม (CURATED ARTISTRY)",
    curatedArtistryTitle: "เลือกสรรผลงานศิลปะอันล้ำค่า",
    searchPlaceholder: "ค้นหาผลงานและภูมิปัญญาล้ำค่า...",
    allProductsTab: "ผลงานทั้งหมด",
    allProductsDesc: "เลือกชมทุกชิ้นงาน",
    countItems: "ชิ้นงาน",
    noCuratedProducts: "ไม่พบผลงานศิลป์ในหมวดหมู่นี้ หรือการค้นหาไม่พบข้อมูลผลิตภัณฑ์ใดๆ",
    communityCraft: "งานชุมชน",
    preOrder: "สั่งพรีออเดอร์",
    readyToShip: "พร้อมส่ง",
    contributionVal: "มูลค่าสนับสนุน",
    baht: "บาท",
    viewDetailsBtn: "ชมรายละเอียด",

    // Alerts and notifications
    loginWelcome: "ยินดีต้อนรับกลับคุณ {username}!",
    loginSuccessMsg: "เข้าสู่ระบบด้วยบทบาท {role} สำเร็จเรียบร้อย มุ่งสู่การเลือกซื้อคีย์ไอเท็ม",
    roleAdmin: "🛡️ ผู้ดูแลร้าน",
    roleMember: "👤 สมาชิกปกติ",
    logoutSuccess: "ออกจากระบบเรียบร้อย",
    logoutMsg: "หวังว่าคุณจะกลับมาใช้บริการร้านเราอีกในเร็วๆ นี้!",
    errorTitle: "ขัดข้อง!",
    errorHtmlResp: "เซิร์ฟเวอร์ส่งการตอบสนองที่ไม่ถูกต้อง (HTML)",
    errorPost: "เกิดความผิดพลาดในการส่งถ่ายข้อมูลซื้อ",
    purchaseFailed: "รายการล้มเหลว!",
    purchaseFailedDesc: "ไม่สามารถทำรายการได้",
    purchaseSuccess: "ชำระเงินสำเร็จ!",
    purchaseSuccessMsg: "คุณได้สั่งซื้อและตัดยอดเงิน {amount} บาท คงเหลือคงคลังปรับลดแล้ว รายการสต็อกที่รับจัดส่ง:",
    topupSuccessTitle: "เติมเครดิตเสร็จสมบูรณ์! 🎉",
    topupSuccessMsg: "ขอบคุณที่เติมเงินกับร้านค้า ยอดโอนส่งตรวจ +${amount} ฿ ได้รับการเพิ่มเข้ากระเป๋าตังเรียบร้อย ยอดคงเหลือปัจจุบัน: ${newBalance} ฿",
    copiedNotify: "คัดลอกรหัสสินค้าไปใช้เสร็จสมบูรณ์!",

    // Portfolio and Artisans additions
    emptyPortfolios: "ยังไม่มีข้อมูลแฟ้มผลงานศิลปหัตถกรรมในขณะนี้",
    emptyArtisans: "ยังไม่มีข้อมูลในทำเนียบช่างฝีมือขณะนี้",
    statsSystem: "ระบบวิสาหกิจและภูมิปัญญาสัมมาชีพ",
    statsQuestion: "ต้องการร่วมสัมผัสและสืบสานวิถีชุมชนน้ำน้อยด้วยตนเอง?",
    statsBody: "ตำบลน้ำน้อย อำเภอหาดใหญ่ เปิดต้อนรับการศึกษาดูงานจากโรงเรียน สถาบันอุดมศึกษา และนักท่องเที่ยวเชิงอนุรักษ์ทุกท่าน โดยกลุ่มทอผ้าบาติกและจักสานใบลานของเราจัดคลาสเวิร์กชอปสาธิตฟรีโดยไม่มีค่าใช้จ่ายเพิ่มเติม",
    statsReserveBtn: "จองคิวศึกษาดูงานฟรี",
    statsLocBtn: "แชร์พิกัดนำทางตำบล"
  },
  en: {
    // Nav
    home: "Home",
    aboutUs: "About Us",
    portfolios: "Heritage Works",
    artisans: "Artisans",
    products: "Shop Products",
    contactUs: "Contact",
    mapTitle: "Nam Noi Cultural Tourism Interactive Map",
    mapSub: "Select location coordinates and local wisdom learning points to explore detailed history and directions.",

    // Header & User Menu
    login: "Log In",
    register: "Register",
    logout: "Log Out",
    support: "Top up Credits",
    adminDashboard: "Admin Information System",
    purchaseHistory: "All Purchase History",
    rolePanel: "Account Role Control",
    adminRole: "🛡️ Admin User",
    memberRole: "👤 Regular Member",
    balance: "Total Credits",
    supportBtn: "Support",

    // Main titles
    artisansTitle: "Master Artisans & Wisdom Keepers",
    artisansSub: "Local sages and master craftspersons keeping the spirit and soil of Nam Noi alive.",
    portfoliosTitle: "Auspicious Crafts Portfolio",
    portfoliosSub: "Local pride and cultural identity conveyed through extremely fine craftsmanship.",
    productsTitle: "Blessed Local Crafts & Batik Shop",
    productsSub: "Support our local community to preserve roots and foster sustainable livelihood in Nam Noi.",
    aboutUsTitle: "Socio-Cultural Ways of Nam Noi Community",
    aboutUsBody: "Nam Noi subdistrict, Hat Yai district, Songkhla province, is a land of rich history and local wisdom inherited over generations. Particularly renowned for ancient batik drawing patterns and palm-leaf weaving. Every item is not just a standard product, but a symbol of pride, precision, and cultural preservation keeping local heritage alive.",

    // Map markers translations
    categoryAdmin: "🏛️ Government / Admin",
    categoryCraft: "✨ Crafts & Sages Workshop",
    categoryTemple: "🙏 Temples & Historic Sites",
    categoryNature: "🌳 Natural Sights",
    categoryMarket: "🛒 Community Markets",
    phoneContact: "📞 Contact Phone:",
    directionBtn: "🧭 Navigate (Google Maps)",
    noImg: "No image",

    // Products & Actions
    buyNow: "Purchase Now",
    viewDetails: "View Details",
    categoryAll: "All Categories",
    stock: "In Stock",
    items: "items",
    price: "Price",
    noProducts: "No products found in this category",
    couponCode: "Coupon discount code",
    applyCoupon: "Apply Discount",
    successBuy: "Purchase Completed Successfully",
    insufficientFunds: "Insufficient funds. Please support/top-up credits before continuing.",
    quantity: "Quantity to buy",
    totalPrice: "Grand Total",

    // Footer
    footerRights: "All Rights Reserved. Public Cultural Benefit, Nam Noi Community Enterprise Group.",
    footerAddress: "Nam Noi Subdistrict, Hat Yai, Songkhla, Thailand",

    // UI Buttons
    close: "Close Window",
    save: "Save Changes",
    cancel: "Cancel",

    // Artisans section in products list
    meetArtisans: "🏛️ Wise Craftsmen of Nam Noi Subdistrict",
    artisansSectionTitle: "Meet Our",
    artisansSectionHighlight: "Local Artisans",
    artisansSectionBio: "We cherish the inheritance of local cultural heritage, partnering with local sages of Nam Noi Subdistrict, Hat Yai District, Songkhla. Every OTOP craft and delicacy listed here is painstakingly crafted by local community artists. Every piece carries our heart, dedication, and contemporary local spirit.",
    sustainDirect: "Support Sustainability - 100% direct community income distribution",
    featuredArtisanTag: "★ FEATURED ARTISAN / Local Wisdom",
    featuredArtisanName: "Nam Noi Batik Drawing & Weaving Guild",
    featuredArtisanQuote: "Drawing hot wax on batik cloth is recording the natural rhythm around us. The river waves of Nam Noi are the heartbeat we lovingly capture on this natural indigo craft.",
    curatedArtistryTag: "✨ CURATED ARTISTRY / Premium Selects",
    curatedArtistryTitle: "Discover Valuable Cultural Handcrafts",
    searchPlaceholder: "Search fine crafts & local products...",
    allProductsTab: "All Masterpieces",
    allProductsDesc: "Browse entire collection",
    countItems: "masterpieces",
    noCuratedProducts: "No masterpieces found matching your search query or selected category.",
    communityCraft: "Community Craft",
    preOrder: "Pre-order",
    readyToShip: "Ready to ship",
    contributionVal: "Contribution",
    baht: "฿",
    viewDetailsBtn: "View Details",

    // Alerts and notifications
    loginWelcome: "Welcome back, {username}!",
    loginSuccessMsg: "Logged in as {role} successfully. Happy heritage shopping!",
    roleAdmin: "🛡️ Administrator",
    roleMember: "👤 Community Member",
    logoutSuccess: "Logged Out Successfully",
    logoutMsg: "Thank you for visiting! We hope to see you back soon.",
    errorTitle: "System Error!",
    errorHtmlResp: "Server sent invalid HTML response",
    errorPost: "Failed to transmit purchase transaction data.",
    purchaseFailed: "Purchase Failed!",
    purchaseFailedDesc: "Unable to process payment order.",
    purchaseSuccess: "Purchase Successful!",
    purchaseSuccessMsg: "Successfully purchased and debited {amount} ฿. Store stock updated. Your delivery code packages:",
    topupSuccessTitle: "Top-up Completed Successfully! 🎉",
    topupSuccessMsg: "Thank you for supporting our community! Your pending deposit +{amount} ฿ was credited. Current wallet balance: {balance} ฿",
    copiedNotify: "Product code copied successfully!",

    // Portfolio and Artisans additions
    emptyPortfolios: "No portfolio items available at this moment.",
    emptyArtisans: "No artisans listed on the registry at this moment.",
    statsSystem: "Community Enterprise & Local Wisdom System",
    statsQuestion: "Want to experience and preserve the Nam Noi way of life yourself?",
    statsBody: "Nam Noi Subdistrict, Hat Yai District welcomes study tours, educational institutions, and eco-tourists. Our local batik and palm weaving guilds organize free demonstration workshops.",
    statsReserveBtn: "Book Free Study Tour",
    statsLocBtn: "Share Subdistrict Coordinates"
  },
  zh: {
    // Nav
    home: "首页",
    aboutUs: "关于我们",
    portfolios: "非遗作品",
    artisans: "手艺大师",
    products: "文创特色商城",
    contactUs: "联系我们",
    mapTitle: "喃内区文化与智慧旅游交互地图",
    mapSub: "选择地图上的文化坐标和非遗智慧学习点，获取深度历史底蕴和导航路线。",

    // Header & User Menu
    login: "登录",
    register: "注册",
    logout: "退出登录",
    support: "支持充值",
    adminDashboard: "后台管理系统",
    purchaseHistory: "我的订单记录",
    rolePanel: "账户角色面板",
    adminRole: "🛡️ 系统超级管理员",
    memberRole: "👤 社区普通会员",
    balance: "账户额度",
    supportBtn: "支持充值",

    // Main titles
    artisansTitle: "非物质文化遗产传承人",
    artisansSub: "致力于传承宋卡府喃内区非遗文化、融汇自然与匠心之魂的民间贤达。",
    portfoliosTitle: "吉祥文创非遗作品集",
    portfoliosSub: "通过极致精细的手工技艺，传递当地对文化身份的自豪感与独特色彩。",
    productsTitle: "吉祥文创与非遗手绘巴迪克",
    productsSub: "支持手艺人以促进社区的可持续发展，悉心守护喃内人世代相传的文化根基。",
    aboutUsTitle: "喃内社区的非遗匠心传承",
    aboutUsBody: "泰国宋卡府合艾郡喃内区是一片拥有深厚历史积淀和民俗智慧的福地。尤其是这里古老的巴迪克蜡染技术和手编扇、蒲草编织品，独具地域艺术魅力。这里的每一件作品都不只是普通商品，更是传承人的骄傲与温度，以及永不褪色的文化记忆。",

    // Map markers translations
    categoryAdmin: "🏛️ 政府及市政机构",
    categoryCraft: "✨ 匠人手工作坊",
    categoryTemple: "🙏 古刹名胜与寺庙",
    categoryNature: "🌳 绿色生态景区",
    categoryMarket: "🛒 社区特色市集",
    phoneContact: "📞 联系电话:",
    directionBtn: "🧭 开启地图导航 (Google 地图)",
    noImg: "无预览图",

    // Products & Actions
    buyNow: "立即订购",
    viewDetails: "查看详情",
    categoryAll: "全部分类",
    stock: "剩余库存",
    items: "件",
    price: "价格",
    noProducts: "此分类下暂无任何商品",
    couponCode: "请输入优惠券代码",
    applyCoupon: "使用优惠券",
    successBuy: "商品订购成功",
    insufficientFunds: "您的信用点数不足。请先支持并充值账户以完成订购。",
    quantity: "购买数量",
    totalPrice: "总计价格",

    // Footer
    footerRights: "版权所有 © 喃内区文化发展公共福利及社区企业联盟",
    footerAddress: "泰国宋卡府合艾郡喃内区",

    // UI Buttons
    close: "关闭窗口",
    save: "保存更改",
    cancel: "取消",

    // Artisans section in products list
    meetArtisans: "🏛️ 喃内区德艺双馨手工艺传承人",
    artisansSectionTitle: "了解我们的",
    artisansSectionHighlight: "非遗传承人",
    artisansSectionBio: "我们珍视宋卡府合艾郡喃内区地方传统文化遗产的保护，与非遗传承人和民间匠人携手共进。此处的每一款手工艺品和特色美食皆由喃内社区匠人倾注心血制成，蕴含传统神韵与现代审美的碰撞。",
    sustainDirect: "支持可持续发展，100% 的收入直达手艺人家庭",
    featuredArtisanTag: "★ FEATURED ARTISAN / 喃内非遗之光",
    featuredArtisanName: "喃内手工巴迪克与织造行会",
    featuredArtisanQuote: "蜡染染布是在记录我们身边大自然的节律。喃内母亲河的水波，便是我们倾注热忱、悉心绣刻在天然靛蓝画卷之上的艺术脉搏。",
    curatedArtistryTag: "✨ CURATED ARTISTRY / 精品文创推荐",
    curatedArtistryTitle: "探索富有历史温度的手工艺珍品",
    searchPlaceholder: "搜索手工艺文创与特色商品...",
    allProductsTab: "全部匠心之作",
    allProductsDesc: "浏览完整典藏",
    countItems: "件非遗作品",
    noCuratedProducts: "未找到符合您搜索条件或该分类下的非遗作品。",
    communityCraft: "社区非遗手作",
    preOrder: "预售定制",
    readyToShip: "现货直发",
    contributionVal: "认购价值",
    baht: "泰铢",
    viewDetailsBtn: "查看详情",

    // Alerts and notifications
    loginWelcome: "欢迎回来，{username}！",
    loginSuccessMsg: "成功登录，当前角色为：{role}。祝您购物愉快！",
    roleAdmin: "🛡️ 超级管理员",
    roleMember: "👤 社区普通会员",
    logoutSuccess: "成功退出登录",
    logoutMsg: "感谢您的光临！期待您再次回访。",
    errorTitle: "系统发生故障！",
    errorHtmlResp: "服务器返回了无效的 HTML 响应",
    errorPost: "无法向服务器提交交易信息。",
    purchaseFailed: "交易购买失败！",
    purchaseFailedDesc: "无法处理此购物订单。",
    purchaseSuccess: "交易支付成功！",
    purchaseSuccessMsg: "成功扣除 {amount} 泰铢。仓库库存已更新。您的取货验证码：",
    topupSuccessTitle: "账户信用点数充值成功！ 🎉",
    topupSuccessMsg: "感谢您对喃内手工艺人的大力支持！已成功注入 +{amount} 泰铢。当前账户总信用点数: {balance} 泰铢",
    copiedNotify: "产品兑换凭证码已成功复制！",

    // Portfolio and Artisans additions
    emptyPortfolios: "暂无特色文化手工艺作品资料。",
    emptyArtisans: "暂无德艺双馨手工艺传承人信息。",
    statsSystem: "社区文化企业与本土非遗传承体系",
    statsQuestion: "想要亲身体验并延续喃内区非遗文化传承吗？",
    statsBody: "合艾郡喃内区诚挚欢迎各大学校、科研机构及生态环保旅行团队前来考察与研学。我们的蜡染手绘和棕榈叶手工编织工会提供免费的现场技艺演示与实操体验课程。",
    statsReserveBtn: "免费预约研学考察/体验课程",
    statsLocBtn: "获取社区地理导航坐标"
  }
};

export function getTranslation(lang: Language, key: keyof typeof translations["th"]): string {
  const dict = translations[lang] || translations["th"];
  return dict[key] || translations["th"][key] || String(key);
}
