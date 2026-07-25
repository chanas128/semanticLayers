-- =============================================================
--  Script 1 (PostgreSQL): SemanticLayerDemo — נתוני הדגמה
--  טבלאות: Customers, Products, Orders, OrderItems
--  להרצה ב-Neon SQL Editor
-- =============================================================

-- =============================================================
--  Drop existing tables (if re-running)
-- =============================================================
DROP TABLE IF EXISTS "OrderItems";
DROP TABLE IF EXISTS "Orders";
DROP TABLE IF EXISTS "Products";
DROP TABLE IF EXISTS "Customers";

-- =============================================================
--  Tables
-- =============================================================

CREATE TABLE "Customers" (
    "Id"        SERIAL          PRIMARY KEY,
    "FullName"  VARCHAR(100)    NOT NULL,
    "Email"     VARCHAR(150)    NOT NULL UNIQUE,
    "City"      VARCHAR(60)     NOT NULL,
    "JoinDate"  DATE            NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE "Products" (
    "Id"            SERIAL          PRIMARY KEY,
    "Name"          VARCHAR(100)    NOT NULL,
    "Category"      VARCHAR(60)     NOT NULL,
    "Price"         DECIMAL(10,2)   NOT NULL CHECK ("Price" >= 0),
    "StockQuantity" INT             NOT NULL DEFAULT 0 CHECK ("StockQuantity" >= 0)
);

CREATE TABLE "Orders" (
    "Id"          SERIAL        PRIMARY KEY,
    "CustomerId"  INT           NOT NULL,
    "OrderDate"   TIMESTAMP     NOT NULL DEFAULT NOW(),
    "Status"      VARCHAR(30)   NOT NULL DEFAULT 'Pending'
        CHECK ("Status" IN ('Pending','Shipped','Completed','Cancelled')),
    CONSTRAINT "FK_Orders_Customers" FOREIGN KEY ("CustomerId") REFERENCES "Customers"("Id")
);

CREATE TABLE "OrderItems" (
    "Id"        SERIAL          PRIMARY KEY,
    "OrderId"   INT             NOT NULL,
    "ProductId" INT             NOT NULL,
    "Quantity"  INT             NOT NULL CHECK ("Quantity" > 0),
    "UnitPrice" DECIMAL(10,2)   NOT NULL CHECK ("UnitPrice" >= 0),
    CONSTRAINT "FK_OrderItems_Orders"   FOREIGN KEY ("OrderId")   REFERENCES "Orders"("Id"),
    CONSTRAINT "FK_OrderItems_Products" FOREIGN KEY ("ProductId") REFERENCES "Products"("Id")
);

-- =============================================================
--  Indexes
-- =============================================================
CREATE INDEX "IX_Orders_CustomerId"     ON "Orders"("CustomerId");
CREATE INDEX "IX_OrderItems_OrderId"    ON "OrderItems"("OrderId");
CREATE INDEX "IX_OrderItems_ProductId"  ON "OrderItems"("ProductId");

-- =============================================================
--  Sample Data
-- =============================================================

-- Customers (20 records)
INSERT INTO "Customers" ("FullName", "Email", "City", "JoinDate") VALUES
('ישראל ישראלי',    'israel@example.com',  'תל אביב',    '2023-01-15'),
('רחל כהן',         'rachel@example.com',  'ירושלים',    '2023-02-20'),
('דוד לוי',         'david@example.com',   'חיפה',       '2023-03-05'),
('שרה מזרחי',       'sarah@example.com',   'באר שבע',    '2023-04-10'),
('משה גולדברג',     'moshe@example.com',   'ראשון לציון','2023-05-22'),
('מירה פרץ',        'mira@example.com',    'פתח תקווה',  '2023-06-14'),
('יעקב שמעוני',     'yaakov@example.com',  'נתניה',      '2023-07-01'),
('אסתר אברהם',      'esther@example.com',  'אשדוד',      '2023-08-18'),
('חיים בן-דוד',     'chaim@example.com',   'רמת גן',     '2023-09-09'),
('לאה פרידמן',      'leah@example.com',    'הרצליה',     '2023-10-30'),
('אבי רוזן',        'avi@example.com',     'כפר סבא',    '2024-01-05'),
('נועה שפירא',      'noa@example.com',     'מודיעין',    '2024-02-14'),
('עמית הרצוג',      'amit@example.com',    'גבעתיים',    '2024-03-20'),
('יפה בורוכוב',     'yafa@example.com',    'חולון',      '2024-04-11'),
('בנימין אלון',     'binyamin@example.com','בת ים',      '2024-05-07'),
('תמר זיו',         'tamar@example.com',   'לוד',        '2024-06-22'),
('עידו שטרן',       'ido@example.com',     'רחובות',     '2024-07-03'),
('גלית נחמן',       'galit@example.com',   'נס ציונה',   '2024-08-16'),
('רועי ברק',        'roi@example.com',     'יבנה',       '2024-09-25'),
('שלי קפלן',        'sheli@example.com',   'קריית אתא',  '2024-10-12');

-- Products (15 records)
INSERT INTO "Products" ("Name", "Category", "Price", "StockQuantity") VALUES
('לפטופ ProBook 15',      'מחשבים',       3200.00, 45),
('עכבר אלחוטי MX',       'אביזרי מחשב',   85.00, 200),
('מסך 27 IPS',            'מסכים',        1150.00, 30),
('מקלדת מכנית RGB',      'אביזרי מחשב',   320.00, 80),
('טאבלט ProPad 11',       'טאבלטים',      1800.00, 55),
('אוזניות Noise-Cancel',  'אודיו',         650.00, 90),
('ראוטר WiFi 6',          'רשת',           420.00, 40),
('כונן SSD 1TB',          'אחסון',         380.00, 150),
('מצלמת אב-בית 4K',      'מצלמות',        890.00, 25),
('כיסא גיימינג Ergo',    'ריהוט',        1250.00, 20),
('שולחן עמידה חשמלי',    'ריהוט',        2800.00, 12),
('רמקול Bluetooth 360',  'אודיו',         350.00, 110),
('מטען מהיר 65W',         'אביזרי מחשב',    95.00, 300),
('ממיר HDMI 4-ב-1',      'אביזרי מחשב',   145.00, 75),
('UPS 1000VA',            'אחסון מתח',     720.00, 18);

-- Orders (30 records)
INSERT INTO "Orders" ("CustomerId", "OrderDate", "Status") VALUES
(1,  '2024-01-10 09:15:00', 'Completed'),
(2,  '2024-01-18 11:30:00', 'Completed'),
(3,  '2024-02-05 14:45:00', 'Shipped'),
(4,  '2024-02-20 10:00:00', 'Completed'),
(5,  '2024-03-08 16:20:00', 'Cancelled'),
(6,  '2024-03-15 08:50:00', 'Completed'),
(7,  '2024-04-01 13:10:00', 'Completed'),
(8,  '2024-04-22 15:30:00', 'Shipped'),
(9,  '2024-05-10 09:00:00', 'Pending'),
(10, '2024-05-28 11:45:00', 'Completed'),
(1,  '2024-06-03 14:00:00', 'Completed'),
(11, '2024-06-17 10:30:00', 'Shipped'),
(12, '2024-07-01 12:00:00', 'Completed'),
(13, '2024-07-14 16:45:00', 'Pending'),
(14, '2024-08-05 09:20:00', 'Completed'),
(15, '2024-08-19 13:50:00', 'Cancelled'),
(2,  '2024-09-02 11:00:00', 'Completed'),
(16, '2024-09-16 15:15:00', 'Shipped'),
(17, '2024-10-01 08:30:00', 'Pending'),
(18, '2024-10-20 14:00:00', 'Completed'),
(3,  '2024-11-04 10:45:00', 'Completed'),
(19, '2024-11-18 12:30:00', 'Shipped'),
(20, '2024-12-02 09:00:00', 'Pending'),
(4,  '2024-12-15 16:00:00', 'Completed'),
(5,  '2025-01-08 11:20:00', 'Completed'),
(6,  '2025-01-22 14:40:00', 'Shipped'),
(7,  '2025-02-05 10:00:00', 'Pending'),
(8,  '2025-02-19 13:30:00', 'Completed'),
(9,  '2025-03-10 09:15:00', 'Cancelled'),
(10, '2025-03-25 15:00:00', 'Completed');

-- OrderItems (50+ records)
INSERT INTO "OrderItems" ("OrderId", "ProductId", "Quantity", "UnitPrice") VALUES
(1, 1, 1, 3200.00),(1, 2, 2, 85.00),
(2, 3, 1, 1150.00),(2, 4, 1, 320.00),
(3, 5, 1, 1800.00),(3, 6, 1, 650.00),
(4, 7, 1, 420.00),(4, 8, 2, 380.00),
(5, 9, 1, 890.00),
(6, 10, 1, 1250.00),(6, 11, 1, 2800.00),
(7, 12, 2, 350.00),(7, 13, 3, 95.00),
(8, 1, 1, 3200.00),(8, 14, 1, 145.00),
(9, 2, 5, 85.00),
(10, 3, 2, 1150.00),(10, 6, 1, 650.00),
(11, 4, 1, 320.00),(11, 8, 1, 380.00),
(12, 5, 2, 1800.00),
(13, 15, 1, 720.00),(13, 7, 1, 420.00),
(14, 1, 1, 3200.00),(14, 4, 1, 320.00),
(15, 9, 1, 890.00),(15, 12, 1, 350.00),
(16, 2, 3, 85.00),(16, 13, 5, 95.00),
(17, 3, 1, 1150.00),(17, 10, 1, 1250.00),
(18, 6, 2, 650.00),
(19, 8, 3, 380.00),(19, 14, 2, 145.00),
(20, 11, 1, 2800.00),
(21, 1, 1, 3200.00),(21, 5, 1, 1800.00),
(22, 7, 2, 420.00),(22, 15, 1, 720.00),
(23, 4, 1, 320.00),(23, 12, 1, 350.00),
(24, 2, 4, 85.00),(24, 13, 2, 95.00),
(25, 3, 1, 1150.00),(25, 6, 1, 650.00),
(26, 9, 1, 890.00),(26, 8, 2, 380.00),
(27, 1, 1, 3200.00),
(28, 10, 1, 1250.00),(28, 11, 1, 2800.00),
(29, 5, 1, 1800.00),
(30, 7, 1, 420.00),(30, 4, 2, 320.00);

-- =============================================================

--  Verify
-- =============================================================
SELECT 'Customers' AS "table", COUNT(*) AS "rows" FROM "Customers"
UNION ALL
SELECT 'Products', COUNT(*) FROM "Products"
UNION ALL
SELECT 'Orders', COUNT(*) FROM "Orders"
UNION ALL
SELECT 'OrderItems', COUNT(*) FROM "OrderItems";
