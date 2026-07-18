# Hướng dẫn deploy BoConcept lên Railway (chi tiết từng bước)

App này là **Node.js + Express + MySQL + EJS**. Railway host được cả web (Node) lẫn MySQL
trong 1 project → phù hợp hơn Vercel (Vercel serverless không host MySQL, không chạy cron).

> File `railway.json` ở gốc repo đã cấu hình sẵn: chạy `npm start`, health check `/health`,
> tự restart khi lỗi. Bạn chỉ cần làm theo các bước dưới.

---

## ⭐ Điều QUAN TRỌNG NHẤT phải nhớ

Một project Railway có **2 service riêng biệt**:

| Service | Icon | Vai trò | Biến cần đặt ở đây |
|---|---|---|---|
| **boconcept** | GitHub (mèo) | Web/API (chạy `node index.js`) | **TẤT CẢ biến `DB_*`, `JWT_SECRET`…** |
| **MySQL** | Cá heo 🐬 | Database | Railway tự sinh (`MYSQLHOST`…), **KHÔNG đụng vào** |

❌ **Lỗi phổ biến nhất:** đặt biến `DB_*` vào service **MySQL** → web không đọc được →
báo `connect ECONNREFUSED 127.0.0.1:3306`. Biến `DB_*` **BẮT BUỘC** nằm trên service **boconcept**.

---

## Bước 1 — Đẩy code lên GitHub

Railway deploy từ repo GitHub. (Repo này đã có sẵn remote `HieuNM2809/boconcept`.)

```bash
git add .
git commit -m "chore: railway deploy"
git push origin main
```

---

## Bước 2 — Tạo project trên Railway

1. Vào https://railway.app → đăng nhập bằng **GitHub**.
2. **New Project → Deploy from GitHub repo** → chọn repo `boconcept`.
3. Railway tự nhận diện Node (Nixpacks) và build theo `railway.json`.
4. Lần deploy đầu **sẽ Failed** vì chưa có MySQL — **bình thường**, làm tiếp Bước 3.

---

## Bước 3 — Thêm database MySQL

1. Trong project → nút **New** (hoặc **Create**) → **Database → Add MySQL**.
2. Đợi service MySQL chuyển trạng thái **Online** (chấm xanh).
3. Railway tự sinh các biến trên service MySQL: `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`,
   `MYSQLPASSWORD`, `MYSQLDATABASE`, `MYSQL_PUBLIC_URL`… — **để nguyên, không sửa**.

---

## Bước 4 — Đặt biến môi trường cho service **boconcept** (KHÔNG phải MySQL)

1. Ở sơ đồ, bấm vào ô **boconcept** (icon GitHub) — **KHÔNG bấm ô MySQL cá heo**.
2. Mở tab **Variables**.
3. Bấm **Raw Editor** → dán nguyên khối dưới đây → **Save**:

```
DB_HOST=mysql.railway.internal
DB_PORT=3306
DB_NAME=railway
DB_USER=root
DB_PASS=<lấy từ MYSQLPASSWORD của service MySQL>
DB_DIALECT=mysql
JWT_SECRET=<chuỗi ngẫu nhiên dài, tự sinh>
TOKEN_EXPIRES_IN=24h
CORS_ORIGIN=*
BODY_LIMIT=1mb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300
ADMIN_USER=admin
ADMIN_PASS=<mật khẩu admin mạnh>
```

**Giải thích từng biến (lấy giá trị ở đâu):**

| Biến | Giá trị | Nguồn |
|---|---|---|
| `DB_HOST` | `mysql.railway.internal` | = `MYSQLHOST` của service MySQL. Đây là **host nội bộ**, chỉ 2 service Railway thấy nhau — nhanh & miễn phí. **Không** dùng host public ở đây. |
| `DB_PORT` | `3306` | = `MYSQLPORT` |
| `DB_NAME` | `railway` | = `MYSQLDATABASE` (Railway mặc định tên DB là `railway`). **Dễ quên — bắt buộc có.** |
| `DB_USER` | `root` | = `MYSQLUSER` |
| `DB_PASS` | (chuỗi Railway sinh) | = `MYSQLPASSWORD`. Copy từ tab Variables của service MySQL. |
| `DB_DIALECT` | `mysql` | Cố định (app dùng MySQL). |
| `JWT_SECRET` | (ngẫu nhiên) | Tự sinh, xem Bước 4b. |
| `TOKEN_EXPIRES_IN` | `24h` | Mặc định dự án. |

> **Vì sao phải đổi tên `MYSQLHOST` → `DB_HOST`?** Vì code đọc `process.env.DB_HOST`
> (xem `config/mysql.js`), **không** đọc `MYSQLHOST`. Nên phải tạo biến `DB_*` trỏ tới đúng giá trị.

### Bước 4b — Sinh `JWT_SECRET` ngẫu nhiên

Chạy trên máy bạn (có Node):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Copy kết quả dán vào `JWT_SECRET`.

### ✅ Cách kiểm tra đã đặt đúng service

- **Đúng:** panel Variables ghi tiêu đề **boconcept** + icon GitHub.
- **Sai:** ghi **MySQL** + icon cá heo → xoá biến ở đó, làm lại trên boconcept.
- Trên service boconcept **không** nên thấy các dòng `MYSQLHOST/MYSQLPASSWORD` (đó là của MySQL).

Lưu xong Railway **tự redeploy**.

---

## ⚠️ Nâng cấp một database ĐÃ CÓ DỮ LIỆU (bắt buộc đọc)

`doc/schema.sql` chỉ dùng `CREATE TABLE IF NOT EXISTS`, nên trên database đã có
sẵn bảng cũ nó **KHÔNG thêm cột mới** vào những bảng đó. Chạy mỗi `schema.sql`
lên production sẽ tạo được bảng mới nhưng thiếu toàn bộ cột mới của `products`
và `categories` → Sequelize ném `Unknown column ... in 'field list'` → **500
trang chủ, trang danh sách, trang chi tiết và tìm kiếm**.

Thứ tự đúng, chạy **TRƯỚC khi deploy code mới**:

```bash
# 1) tạo các bảng mới
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p <MYSQLDATABASE> < doc/schema.sql

# 2) thêm cột mới vào bảng cũ  ← BƯỚC HAY BỊ QUÊN
mysql -h <MYSQLHOST> -P <MYSQLPORT> -u <MYSQLUSER> -p <MYSQLDATABASE> < doc/migrations/2026-07-19-site-rebuild.sql
```

Dùng **`MYSQL_PUBLIC_URL`** của service MySQL (host `*.proxy.rlwy.net`) để chạy
từ máy cá nhân — `mysql.railway.internal` chỉ các service bên trong Railway thấy.

File migration **an toàn khi chạy lại nhiều lần**: mỗi thao tác đều kiểm tra
`information_schema` trước, cột đã có thì bỏ qua.

> **KHÔNG chạy `doc/seed.sql` trên production.** Nó có
> `ON DUPLICATE KEY UPDATE image = VALUES(image)` — sẽ ghi đè ảnh thật đã upload
> bằng ảnh placeholder của picsum.

## Bước 5 — Nạp schema + seed vào MySQL (chỉ làm 1 lần)

DB Railway lúc mới tạo **trống rỗng** — chưa có bảng nào. Phải nạp `doc/schema.sql` + `doc/seed.sql`.
Vì host nội bộ không truy cập được từ máy bạn, phải dùng **URL public**.

1. Vào service **MySQL** → tab **Variables** → copy `MYSQL_PUBLIC_URL`
   (dạng `mysql://root:<pass>@<host>.proxy.rlwy.net:<port>/railway`).
2. Cách A — dùng script Node có sẵn `mysql2` trong project (khỏi cài `mysql` client):

   Tạo file `scripts/load-db.js`:
   ```js
   const fs = require('fs');
   const mysql = require('mysql2/promise');
   (async () => {
     const conn = await mysql.createConnection({
       uri: process.env.MYSQL_PUBLIC_URL,   // dán URL public vào biến môi trường khi chạy
       multipleStatements: true,
       charset: 'utf8mb4',
     });
     for (const f of ['doc/schema.sql', 'doc/seed.sql']) {
       await conn.query(fs.readFileSync(f, 'utf8'));
       console.log('Applied', f);
     }
     await conn.end();
     console.log('DONE');
   })().catch(e => { console.error(e.message); process.exit(1); });
   ```
   Chạy (thay URL public thật):
   ```bash
   MYSQL_PUBLIC_URL="mysql://root:xxx@yyy.proxy.rlwy.net:12345/railway" node scripts/load-db.js
   ```

3. Cách B — nếu máy có sẵn `mysql` client:
   ```bash
   mysql --default-character-set=utf8mb4 -h <PUBLIC_HOST> -P <PUBLIC_PORT> -u root -p<PASS> railway < doc/schema.sql
   mysql --default-character-set=utf8mb4 -h <PUBLIC_HOST> -P <PUBLIC_PORT> -u root -p<PASS> railway < doc/seed.sql
   ```

> ⚠️ Luôn dùng **`utf8mb4`**, nếu không tiếng Việt sẽ thành `?`/`�`.
> Kết quả đúng: tạo 9 bảng, seed 7 categories + 3 products + 1 api_client (`demo-client`).

---

## Bước 6 — Xác nhận deploy thành công

Vào service **boconcept** → tab **Deploy Logs**. Phải thấy:

```
> node index.js
Kết nối MySQL thành công
Server đang chạy tại http://localhost:3000
```

Nếu vẫn thấy `ECONNREFUSED 127.0.0.1:3306` → biến `DB_*` **chưa nằm trên service boconcept**
(quay lại Bước 4).

---

## Bước 7 — Bật domain công khai (lấy link web)

1. Service **boconcept** → **Settings → Networking → Generate Domain**.
2. Railway cấp link dạng `https://<tên>.up.railway.app` → **đây là link trang web của bạn**.

Kiểm tra:
- `https://<domain>/health` → trả `ok`
- `https://<domain>/` → trang chủ BoConcept (có sản phẩm)
- `https://<domain>/api/products` → JSON danh sách sản phẩm

---

## (Tuỳ chọn) Chạy cron jobs

`npm run schedule` cần process riêng. Thêm service thứ 2:
**New → GitHub Repo (cùng repo)** → **Settings → Deploy → Start Command** = `npm run schedule`,
rồi copy các biến `DB_*` y như service boconcept.

---

## Bảng lỗi thường gặp

| Log / triệu chứng | Nguyên nhân | Cách sửa |
|---|---|---|
| `connect ECONNREFUSED 127.0.0.1:3306` | Biến `DB_*` đặt sai service (trên MySQL) hoặc chưa đặt | Đặt `DB_*` trên service **boconcept** (Bước 4) |
| `ER_BAD_DB_ERROR: Unknown database` | Thiếu/sai `DB_NAME` | Đặt `DB_NAME=railway` |
| `Access denied for user` | Sai `DB_USER`/`DB_PASS` | Copy lại từ `MYSQLUSER`/`MYSQLPASSWORD` |
| Trang chủ `500` / trống | Chưa nạp schema/seed | Làm Bước 5 |
| Tiếng Việt thành `?`/`�` | Nạp SQL thiếu `utf8mb4` | Nạp lại với `--default-character-set=utf8mb4` |
| App restart liên tục | Thiếu `JWT_SECRET` hoặc DB chưa Online | Kiểm tra biến + trạng thái MySQL |
| `npm warn config production…` | Chỉ là cảnh báo | Bỏ qua, vô hại |

---

## ⚠️ Bảo mật

- **Không commit `.env`** lên GitHub (repo đã thêm `.env` vào `.gitignore`). Bí mật chỉ đặt trong
  tab Variables của Railway.
- Nếu mật khẩu DB từng bị lộ (dán vào chat, commit nhầm…): vào service MySQL → **Settings** đổi
  mật khẩu, rồi cập nhật lại `DB_PASS` trên boconcept.
- Cân nhắc tắt **public networking** của MySQL sau khi nạp xong schema (chỉ để mạng nội bộ).
