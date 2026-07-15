# Deploy lên Railway (để có link web công khai)

App này là **Express + MySQL + EJS**. Railway chạy được cả Node lẫn MySQL trong 1 project,
nên phù hợp hơn Vercel (Vercel serverless không host MySQL, không chạy cron).

> File `railway.json` ở gốc repo đã cấu hình sẵn: chạy `npm start`, health check `/health`,
> tự restart khi lỗi. Bạn chỉ cần làm theo các bước dưới.

---

## 1. Đẩy code lên GitHub

Railway deploy từ một repo GitHub. Nếu chưa có remote:

```bash
git add .
git commit -m "chore: add railway deploy config"
# tạo repo trên github.com trước, rồi:
git remote add origin https://github.com/<user>/<repo>.git
git push -u origin main
```

## 2. Tạo project trên Railway

1. Vào https://railway.app → đăng nhập bằng GitHub.
2. **New Project → Deploy from GitHub repo** → chọn repo vừa push.
3. Railway tự phát hiện Node (Nixpacks) và build theo `railway.json`.
   Lần deploy đầu sẽ **fail** vì chưa có MySQL — bình thường, làm tiếp bước 3.

## 3. Thêm MySQL

1. Trong project → **New → Database → Add MySQL**.
2. Railway tạo service MySQL kèm sẵn các biến: `MYSQLHOST`, `MYSQLPORT`,
   `MYSQLUSER`, `MYSQLPASSWORD`, `MYSQLDATABASE`.

## 4. Cấu hình biến môi trường cho web service

Mở service Node (không phải MySQL) → tab **Variables** → thêm:

```
NODE_ENV=production
APP_ENV=production

# JWT — ĐỔI thành chuỗi ngẫu nhiên dài
JWT_SECRET=<chuoi-bi-mat-that-dai-ngau-nhien>
TOKEN_EXPIRES_IN=24h

# MySQL — tham chiếu sang service MySQL của Railway (dùng đúng cú pháp ${{...}})
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DIALECT=mysql
DB_NAME=${{MySQL.MYSQLDATABASE}}
DB_USER=${{MySQL.MYSQLUSER}}
DB_PASS=${{MySQL.MYSQLPASSWORD}}

# HTTP / bảo mật
CORS_ORIGIN=*
BODY_LIMIT=1mb
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX=300

# Admin (Basic Auth cho /admin) — ĐỔI mật khẩu
ADMIN_USER=admin
ADMIN_PASS=<mat-khau-admin-manh>
```

> **Redis không bắt buộc** — bỏ qua các biến `REDIS_*`. App chỉ log cảnh báo, không crash.
> Nếu sau này cần, thêm service Redis trên Railway rồi map `REDIS_HOST/REDIS_PORT/REDIS_PASSWORD`.

Railway sẽ tự **redeploy** sau khi lưu biến.

## 5. Nạp schema + seed vào MySQL

Schema/seed chỉ tự chạy khi dùng Docker local. Trên Railway phải nạp thủ công **một lần**.

1. Mở service MySQL → tab **Variables** → lấy `MYSQL_PUBLIC_URL`
   (hoặc host/port public ở tab **Connect**).
2. Từ máy bạn (cần cài `mysql` client), nạp lần lượt:

```bash
# thay bằng thông tin public từ Railway
mysql --default-character-set=utf8mb4 -h <PUBLIC_HOST> -P <PUBLIC_PORT> -u <USER> -p<PASS> railway < doc/schema.sql
mysql --default-character-set=utf8mb4 -h <PUBLIC_HOST> -P <PUBLIC_PORT> -u <USER> -p<PASS> railway < doc/seed.sql
```

> `<DB_NAME>` trên Railway thường là `railway`. Không để khoảng trắng giữa `-p` và mật khẩu.

## 6. Bật link công khai

Service Node → **Settings → Networking → Generate Domain**.
Railway cấp domain dạng `https://<ten>.up.railway.app` → **đây là link trang web của bạn**.

Kiểm tra:
- `https://<domain>/health` → phải trả `ok`
- `https://<domain>/` → trang chủ BoConcept
- `https://<domain>/api/products` → danh sách sản phẩm (JSON)

---

## (Tuỳ chọn) Chạy cron jobs

`npm run schedule` cần một process riêng. Thêm service thứ 2:
**New → Empty Service → Deploy from same repo**, đặt **Start Command** = `npm run schedule`,
và copy các biến DB giống service web.

## Sự cố thường gặp

| Triệu chứng | Nguyên nhân / cách xử lý |
|---|---|
| Deploy fail, log `Unable to connect to MySQL` | Biến `DB_*` sai hoặc chưa map `${{MySQL.*}}`. Kiểm tra tab Variables. |
| Trang trắng / `500` khi mở `/` | Chưa nạp `schema.sql`/`seed.sql` (bước 5). |
| Tiếng Việt bị lỗi ký tự | Nạp SQL thiếu `--default-character-set=utf8mb4`. Nạp lại. |
| App restart liên tục | Xem **Deploy Logs**; thường do thiếu `JWT_SECRET` hoặc DB chưa sẵn sàng. |
