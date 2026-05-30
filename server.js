const path = require("path");
const express = require("express");
const mysql = require("mysql2/promise");
require("dotenv").config();

const app = express();
const port = Number(process.env.PORT || 8094);

const pool = mysql.createPool({
  host: process.env.DB_HOST || "127.0.0.1",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "camp_user",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "camp_reservations",
  waitForConnections: true,
  connectionLimit: 10,
  dateStrings: true,
  namedPlaceholders: true
});

async function ensureSchema() {
  await pool.execute(`CREATE TABLE IF NOT EXISTS reservations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    customer_name VARCHAR(80) NOT NULL,
    display_name VARCHAR(20) NOT NULL,
    phone VARCHAR(40) NOT NULL,
    deposit_name VARCHAR(80) NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    people INT UNSIGNED NOT NULL,
    equipment TEXT NOT NULL,
    message TEXT NULL,
    status ENUM('pending','confirmed','canceled') NOT NULL DEFAULT 'pending',
    payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid',
    deposit_amount INT UNSIGNED NOT NULL DEFAULT 0,
    paid_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_reservation_dates (start_date, end_date),
    INDEX idx_reservation_status (status),
    INDEX idx_payment_status (payment_status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`);

  const [columns] = await pool.execute("SHOW COLUMNS FROM reservations");
  const existing = new Set(columns.map((column) => column.Field));
  const migrations = [
    ["deposit_name", "ALTER TABLE reservations ADD COLUMN deposit_name VARCHAR(80) NULL AFTER phone"],
    ["payment_status", "ALTER TABLE reservations ADD COLUMN payment_status ENUM('unpaid','paid','refunded') NOT NULL DEFAULT 'unpaid' AFTER status"],
    ["deposit_amount", "ALTER TABLE reservations ADD COLUMN deposit_amount INT UNSIGNED NOT NULL DEFAULT 0 AFTER payment_status"],
    ["paid_at", "ALTER TABLE reservations ADD COLUMN paid_at DATETIME NULL AFTER deposit_amount"]
  ];

  for (const [column, sql] of migrations) {
    if (!existing.has(column)) await pool.execute(sql);
  }
}

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/assets", express.static(path.join(__dirname, "assets")));

function isDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""));
}

function publicReservation(row) {
  return {
    id: row.id,
    name: row.name,
    startDate: row.start_date,
    endDate: row.end_date,
    people: row.people,
    equipment: row.equipment ? JSON.parse(row.equipment) : [],
    status: row.status,
    paymentStatus: row.payment_status || "unpaid",
    message: row.message,
    createdAt: row.created_at
  };
}

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_KEY;
  const provided = req.get("x-admin-key") || req.query.adminKey;
  if (!expected || provided !== expected) return res.status(401).json({ error: "관리자 비밀번호가 필요합니다." });
  next();
}

app.get("/api/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true });
  } catch {
    res.status(500).json({ ok: false, error: "데이터베이스 연결 실패" });
  }
});

app.get("/api/reservations", async (req, res) => {
  const month = String(req.query.month || "");
  let where = "WHERE status IN ('pending', 'confirmed')";
  const params = {};
  if (/^\d{4}-\d{2}$/.test(month)) {
    params.monthStart = `${month}-01`;
    params.monthEnd = `${month}-31`;
    where += " AND start_date <= :monthEnd AND end_date >= :monthStart";
  }
  const [rows] = await pool.execute(
    `SELECT id, display_name AS name, start_date, end_date, people, equipment, status, payment_status, message, created_at
     FROM reservations ${where} ORDER BY start_date ASC, created_at ASC`,
    params
  );
  res.json(rows.map(publicReservation));
});

app.get("/api/admin/reservations", requireAdmin, async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, customer_name AS name, phone, deposit_name, start_date, end_date, people, equipment,
            status, payment_status, deposit_amount, paid_at, message, created_at
     FROM reservations ORDER BY start_date DESC, created_at DESC`
  );
  res.json(rows.map((row) => ({
    ...publicReservation(row),
    phone: row.phone,
    depositName: row.deposit_name,
    depositAmount: row.deposit_amount,
    paidAt: row.paid_at
  })));
});

app.post("/api/reservations", async (req, res) => {
  const { name, phone, startDate, endDate, people, equipment = [], depositName = "", message = "" } = req.body || {};
  if (!name || String(name).trim().length < 2) return res.status(400).json({ error: "예약자 이름을 2글자 이상 입력해주세요." });
  if (!phone || String(phone).trim().length < 8) return res.status(400).json({ error: "연락 가능한 전화번호를 입력해주세요." });
  if (!isDate(startDate) || !isDate(endDate) || startDate > endDate) return res.status(400).json({ error: "예약 시작일과 종료일을 올바르게 선택해주세요." });

  const peopleNumber = Number(people);
  if (!Number.isInteger(peopleNumber) || peopleNumber < 1 || peopleNumber > 30) return res.status(400).json({ error: "인원은 1명부터 30명까지 입력할 수 있습니다." });

  const safeEquipment = Array.isArray(equipment) ? equipment.map((item) => String(item).slice(0, 40)).slice(0, 12) : [];
  const displayName = `${String(name).trim().slice(0, 1)}**`;
  const [result] = await pool.execute(
    `INSERT INTO reservations
       (customer_name, display_name, phone, deposit_name, start_date, end_date, people, equipment, message, status, payment_status)
     VALUES
       (:name, :displayName, :phone, :depositName, :startDate, :endDate, :people, :equipment, :message, 'pending', 'unpaid')`,
    {
      name: String(name).trim().slice(0, 80),
      displayName,
      phone: String(phone).trim().slice(0, 40),
      depositName: String(depositName || name).trim().slice(0, 80),
      startDate,
      endDate,
      people: peopleNumber,
      equipment: JSON.stringify(safeEquipment),
      message: String(message).trim().slice(0, 1000)
    }
  );
  res.status(201).json({ id: result.insertId, status: "pending", message: "예약 요청이 접수되었습니다. 입금 확인 후 관리자가 확정합니다." });
});

app.patch("/api/admin/reservations/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  const status = String(req.body?.status || "");
  const paymentStatus = String(req.body?.paymentStatus || "");
  const depositAmount = Math.max(0, Number(req.body?.depositAmount || 0));
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "올바른 예약 ID가 아닙니다." });
  if (!["pending", "confirmed", "canceled"].includes(status)) return res.status(400).json({ error: "상태는 pending, confirmed, canceled 중 하나여야 합니다." });
  if (!["unpaid", "paid", "refunded"].includes(paymentStatus)) return res.status(400).json({ error: "입금 상태는 unpaid, paid, refunded 중 하나여야 합니다." });
  await pool.execute(
    `UPDATE reservations
     SET status = :status,
         payment_status = :paymentStatus,
         deposit_amount = :depositAmount,
         paid_at = CASE
           WHEN :paymentStatus = 'paid' AND paid_at IS NULL THEN NOW()
           WHEN :paymentStatus != 'paid' THEN NULL
           ELSE paid_at
         END
     WHERE id = :id`,
    { id, status, paymentStatus, depositAmount }
  );
  res.json({ ok: true });
});

app.delete("/api/admin/reservations/:id", requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) return res.status(400).json({ error: "올바른 예약 ID가 아닙니다." });
  await pool.execute("UPDATE reservations SET status = 'canceled' WHERE id = :id", { id });
  res.json({ ok: true });
});

app.use((_req, res) => res.sendFile(path.join(__dirname, "public", "index.html")));

ensureSchema()
  .then(() => app.listen(port, "0.0.0.0", () => console.log(`Camp reservation server listening on port ${port}`)))
  .catch((error) => {
    console.error("Failed to initialize database schema", error);
    process.exit(1);
  });
