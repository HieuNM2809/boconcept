# TÀI LIỆU BÀN GIAO SOURCE CODE
### Website nội thất **Huong Son International** (BoConcept-style, song ngữ VI/EN)

> Tài liệu này mô tả toàn bộ những gì cần để **nhận – cài đặt – vận hành – bàn giao** mã nguồn.
> Phần **DATABASE** (mục 5) được trình bày chi tiết theo yêu cầu.

---

## 1. Tổng quan

| Hạng mục | Giá trị |
|---|---|
| Loại dự án | Website thương mại điện tử nội thất, song ngữ **Tiếng Việt / English** |
| Ngôn ngữ | Node.js (JavaScript) |
| Framework | Express 4 |
| ORM / CSDL | Sequelize 6 / **MySQL 8** (charset `utf8mb4`, timezone `+07:00`) |
| Cache | Redis 7 (tùy chọn — chưa nằm trên đường đi request) |
| Giao diện | **EJS** server-side render (SSR) |
| Xác thực API | JWT (client_id/secret) |
| Xác thực Admin | Phiên đăng nhập (JWT trong cookie httpOnly) + vai trò |

Ứng dụng gồm **3 mặt** chạy trong cùng một tiến trình:
- **Web khách** (SSR EJS) tại `/` — trang chủ, danh mục, sản phẩm, tin tức, giới thiệu.
- **API JSON** tại `/api` — auth, categories, products.
- **Trang quản trị** tại `/admin` — quản lý toàn bộ nội dung + tài khoản.

Kiến trúc kiểu MVC (Laravel-style): `routes → middleware → Http/Requests (validate) → Controllers → Services → Models → lib`.

---

## 2. Yêu cầu môi trường

- **Node.js >= 18** và npm.
- **Docker Desktop** (khuyên dùng — đã có sẵn `docker-compose.yml` cho MySQL 8 + Redis 7).
  Hoặc tự cài **MySQL 8** + **Redis 7** rồi trỏ cấu hình trong `.env`.
- Cổng mặc định: **App** `3000` (đổi bằng `PORT`), **MySQL** `3306`, **Redis** `6379`.

---

## 3. Cài đặt & chạy nhanh

```bash
# 1) Cài thư viện
npm install

# 2) Tạo file cấu hình rồi sửa DB_*/JWT_SECRET
cp .env.example .env        # Windows Git Bash không có cp thì dùng: copy .env.example .env

# 3) Bật MySQL + Redis bằng Docker (LẦN ĐẦU tự chạy doc/schema.sql + doc/seed.sql)
docker compose up -d
docker compose down         # dừng (giữ dữ liệu) · down -v = xóa sạch dữ liệu và chạy lại schema/seed

# 4) Chạy ứng dụng
npm run dev                 # môi trường DEV (nodemon, tự reload) — http://localhost:3000
npm start                   # môi trường chạy thật
```

Các lệnh khác:
```bash
npm run schedule            # tiến trình cron (app/Console/Kernel.js) — PM2 app riêng
npm run pm2:start           # chạy bằng PM2 theo pm2-apps.json (app cluster + schedule)
npm test                    # chạy test (jest); test cần DB được bỏ qua mặc định
RUN_DB_TESTS=1 npm test     # chạy kèm test kết nối MySQL thật
node app/Console/Commands/example.command.js seed -n "X"   # mẫu lệnh CLI
```

- Kiểm tra sống: `GET /health` (trả 200 khi DB đã kết nối, 503 khi chưa).
- Trang chủ: `GET /` · Quản trị: `GET /admin` (chuyển tới `/admin/login`).

---

## 4. Biến cấu hình `.env`

| Biến | Bắt buộc | Ý nghĩa |
|---|:--:|---|
| `PORT` | | Cổng web (mặc định 3000) |
| `NODE_ENV` | | `development` / `production` |
| `JWT_SECRET` | ✅ | Khóa ký JWT (API **và** phiên đăng nhập admin). Đặt chuỗi ngẫu nhiên dài. |
| `TOKEN_EXPIRES_IN` | | Hạn token API (mặc định `24h`) |
| `ADMIN_SESSION_TTL` | | Hạn phiên đăng nhập admin (mặc định `7d`) |
| `DB_HOST` `DB_PORT` `DB_NAME` `DB_USER` `DB_PASS` | ✅ | Kết nối MySQL |
| `DB_POOL_*`, `DB_RETRY_MAX` | | Tinh chỉnh pool kết nối |
| `REDIS_HOST` `REDIS_PORT` `REDIS_PASSWORD` `REDIS_DB` | | Redis (tùy chọn) |
| `CORS_ORIGIN` | | Origin cho CORS (mặc định `*`) |
| `BODY_LIMIT` | | Giới hạn thân request (mặc định `25mb` — vì ảnh lưu base64) |
| `RATE_LIMIT_WINDOW_MS` `RATE_LIMIT_MAX` | | Giới hạn số request/IP |
| `ADMIN_USER` `ADMIN_PASS` | | Tài khoản admin **đầu tiên**, chỉ tạo tự động khi bảng `users` trống |
| `SITE_URL` | | URL công khai của site — dùng cho **SEO** (canonical, og:url, sitemap, hreflang). Để trống thì tự suy từ request. |

Mặc định Docker khớp với `.env.example`: user `root`/`root`, db `app_db`, cổng `3306`.

---

## 5. DATABASE (chi tiết)

### 5.1. Kết nối & quy ước chung
- Cấu hình: `config/mysql.js` (đọc `.env`), singleton Sequelize: `lib/database.js`.
- **Charset `utf8mb4`** được ép ở cả `config/mysql.js` và đầu các file `.sql` (`SET NAMES utf8mb4`) — **bắt buộc** để lưu tiếng Việt.
- **Timezone `+07:00`**.
- Quy ước cột dùng chung ở hầu hết bảng:
  - Song ngữ = **cột đôi**: `name_vi`/`name_en`, `title_vi`/`title_en`, `description_vi`/`description_en`…
  - `status` (TINYINT): `1` = hiện, `0` = ẩn.
  - `sort_order` (INT): thứ tự hiển thị.
  - `is_featured` (TINYINT): cờ "nổi bật" (lên trang chủ).
  - `created_at` / `updated_at` (DATETIME).
  - `deleted_at`: **xóa mềm (soft-delete)** — chỉ có ở `examples`, `categories`, `products` (Sequelize `paranoid`). Các bảng khác **xóa cứng**.
  - **Ảnh lưu ngay trong DB** dưới dạng **data URI base64** ở cột `MEDIUMTEXT` (`image`/`thumbnail`/`logo`/`icon`/`url`). Lý do: hạ tầng deploy (Railway) xóa filesystem mỗi lần redeploy nên không ghi ảnh ra ổ đĩa. Đây là lý do `BODY_LIMIT = 25mb`.

### 5.2. Cách KHỞI TẠO / CẬP NHẬT database

| Tình huống | Cách làm |
|---|---|
| **Docker volume trống** (cài mới) | `docker compose up -d` → MySQL **tự động** chạy `doc/schema.sql` rồi `doc/seed.sql` (mount vào `/docker-entrypoint-initdb.d`). |
| **Cài tay** (MySQL có sẵn) | `mysql -u root -p app_db < doc/schema.sql` rồi `mysql -u root -p app_db < doc/seed.sql` |
| **Áp lên DB đang chạy trong Docker** (volume KHÔNG bị xóa — `schema.sql` sẽ KHÔNG tự chạy lại) | `docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < doc/schema.sql` |
| **Reset sạch** | `docker compose down -v` (xóa volume) rồi `docker compose up -d` |

> ⚠️ **Windows / Git Bash**: luôn **đổ file** vào mysql (`mysql < file.sql`), **KHÔNG** gõ SQL tiếng Việt trực tiếp trên dòng lệnh — `argv` của Windows làm hỏng UTF-8 (thành `?`/`�`).

- `doc/schema.sql`: tạo bảng (dùng `CREATE TABLE IF NOT EXISTS` nên **chạy lại an toàn**). Cuối file có vài lệnh `ALTER … MODIFY` để nâng cấp cột trên DB cũ.
- `doc/seed.sql`: dữ liệu mẫu, tất cả `INSERT … ON DUPLICATE KEY UPDATE` nên **chạy lại an toàn (idempotent)**.

### 5.3. Danh sách bảng (16 bảng)

| # | Bảng | Mục đích | Cột chính | Xóa mềm | Quản lý ở |
|--:|---|---|---|:--:|---|
| 1 | **`api_clients`** | Client được phép gọi API (cấp JWT) | `service_name`, `client_id`, `client_secret`, `is_active` | | (seed) |
| 2 | **`users`** | Tài khoản đăng nhập **/admin** + vai trò | `username`(unique), `password`(scrypt), `full_name`, `email`, `phone`, `role`(`admin`/`staff`), `status`, `last_login_at` | | `/admin/staff` |
| 3 | **`examples`** | Bảng mẫu của scaffold (tham khảo, có thể bỏ) | `name`, `description`, `status` | ✅ | — |
| 4 | **`categories`** | Danh mục sản phẩm (cây tự tham chiếu) | `parent_id`→categories, `name_*`, `slug`, `title_*`, `description_*`, `image`, `is_featured` | ✅ | `/admin/categories` |
| 5 | **`products`** | Sản phẩm | `category_id`→categories, `name_*`, `price`(DECIMAL 15,2), `material_*`, `color_*`, `dimensions_*`, `weight`, `extra_*`, `shipping_*`, `thumbnail`, `is_featured`, `priority` | ✅ | `/admin/products` |
| 6 | **`product_variants`** | Biến thể (item con kiểu Shopee) | `product_id`→products, `name`, `sku`, `price`, `stock`, `image` | | (form sản phẩm) |
| 7 | **`product_images`** | Bộ sưu tập ảnh phụ của sản phẩm | `product_id`→products, `url`(base64), `sort_order` | | (form sản phẩm) |
| 8 | **`product_colors`** | Ô màu cho khách chọn ở trang chi tiết | `product_id`→products, `hex`(#RRGGBB), `name_*`, `image_index`(trỏ vị trí ảnh trong gallery) | | (form sản phẩm) |
| 9 | **`slides`** | Slideshow hero trang chủ | `image`, `title_*`, `badge_*`, `link` | | `/admin/slides` |
| 10 | **`partners`** | Đối tác hợp tác | `name`, `logo`, `link` | | `/admin/partners` |
| 11 | **`certificates`** | Giấy chứng nhận công ty | `image`, `title_*` | | `/admin/certificates` |
| 12 | **`features`** | Dải "Công năng" dưới slideshow (tối đa 4 hiện) | `icon`, `title_*`, `description_*` | | `/admin/features` |
| 13 | **`news`** | Tin tức / bài viết | `image`, `title_*`, `excerpt_*`, `body_*`, `author`, `published_at`, `cta_*`, `link`, `is_featured` | | `/admin/news` |
| 14 | **`pages`** | Trang nội dung tĩnh (vd `about`) | `slug`(unique), `title_*`, `excerpt_*`, `body_*`, `image` | | `/admin/pages` |
| 15 | **`gallery`** | Lưới ảnh "Style advice" trang chủ (8 khe) | `slot`(1..8), `image`, `alt_*`, `sort_order` | | `/admin/gallery` |
| 16 | **`settings`** | Cấu hình dạng key/value (công tắc khối, slogan…) | `key`(PK), `value` | | `/admin/slogan`, `/admin/features` |

> Ghi chú: nếu DB tồn tại bảng `staff` (0 dòng) thì đó là bảng **thừa, không dùng** — tài khoản nằm ở bảng `users`. Có thể `DROP TABLE staff;`.

### 5.4. Quan hệ (associations)
Khai báo tại `app/Models/index.model.js`:

```
categories (cây) ──┐  parent_id → categories.id  (ON DELETE SET NULL)
                   └─< categories (children)

categories 1 ──< products                (category_id, ON DELETE SET NULL)
products   1 ──< product_variants        (ON DELETE CASCADE)
products   1 ──< product_images          (ON DELETE CASCADE)
products   1 ──< product_colors          (ON DELETE CASCADE)
```
Các bảng còn lại (slides, partners, certificates, features, news, pages, gallery, settings, users, api_clients) **độc lập**, không khóa ngoại.

### 5.5. `doc/seed.sql` — dữ liệu mẫu nạp sẵn
Nạp: danh mục (cây), sản phẩm mẫu kèm thuộc tính lọc, biến thể, ảnh gallery, slideshow, đối tác, chứng nhận, dải công năng, 2 bài tin tức, 8 khe lưới ảnh, trang `about`, cấu hình khối công năng, **và tài khoản đăng nhập** (mục 6).
Tất cả dùng `ON DUPLICATE KEY UPDATE` → chạy lại **không** nhân đôi dữ liệu; riêng `users`/`pages`/`news` cố ý chỉ cập nhật `updated_at` để **không ghi đè** nội dung/mật khẩu admin đã tự sửa.

### 5.6. Migrations (`doc/migrations/`)
Chạy khi áp thay đổi lên **DB đã tồn tại** (schema.sql chỉ tự chạy khi volume trống). Mới nhất trước:

| File | Nội dung |
|---|---|
| `2026-08-04-user-profile.sql` | Thêm cột `email`, `phone` vào `users` |
| `2026-08-03-users.sql` | Tạo bảng `users` (đăng nhập admin + vai trò) |
| `2026-07-27-product-colors.sql` | Bảng `product_colors` |
| `2026-07-27-price-range.sql` | Cột lọc giá/khối lượng cho `products` |
| `2026-07-24-news-featured.sql` | Cờ `is_featured` cho `news` |
| `2026-07-20-*` , `2026-07-19-*` | Gallery nhiều ảnh, khối giới thiệu, dựng lại site… |

Áp một migration: `docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < doc/migrations/<tên-file>.sql`

> Lưu ý: MySQL **không** hỗ trợ `ADD COLUMN IF NOT EXISTS` — chạy lại migration đã áp sẽ báo "Duplicate column", bỏ qua là được.

### 5.7. Sao lưu & phục hồi
```bash
# Backup
docker exec boconcept-mysql mysqldump --default-character-set=utf8mb4 -uroot -proot app_db > backup.sql
# Restore
docker exec -i boconcept-mysql mysql --default-character-set=utf8mb4 -uroot -proot app_db < backup.sql
```

---

## 6. Tài khoản mặc định (⚠️ ĐỔI NGAY sau khi nhận bàn giao)

| Nơi | Tài khoản | Mật khẩu | Vai trò / ghi chú |
|---|---|---|---|
| Admin `/admin/login` | `admin` | `123456` | **admin** — toàn quyền + quản lý tài khoản |
| Admin `/admin/login` | `staff` | `123456` | **staff** — mọi chức năng khác, KHÔNG quản lý tài khoản |
| API `/api/auth/login` | `demo-client` | `demo-secret` | client mẫu để lấy JWT |

- Mật khẩu admin lưu dạng `scrypt$<salt>$<hash>` (băm bằng `app/Helpers/password.helper.js`). Đổi mật khẩu ngay tại **avatar góc trên → Tài khoản → Đổi mật khẩu**, hoặc admin đổi cho người khác tại `/admin/staff`.
- Đổi mật khẩu seed (nếu cần seed lại): `node -e "console.log(require('./app/Helpers/password.helper').hash('matkhaumoi'))"` rồi thay chuỗi trong `doc/seed.sql`.

---

## 7. Cấu trúc thư mục

```
index.js                     # điểm khởi động: view engine, middleware, mount routes, chờ MySQL
config/                      # đọc .env (mysql, redis, log)
lib/                         # singleton kết nối (database.js, redis.js)
routes/
  ├─ api.route.js            # /api (auth, categories, products)
  └─ web.route.js            # / (web khách) + /admin + robots.txt/sitemap.xml
app/
  ├─ Http/
  │   ├─ Controllers/        # controller web, admin.*, Api/*
  │   ├─ Middleware/         # locale (i18n), seo, auth, adminAuth, requireRole, ...
  │   └─ Requests/           # validate (express-validator)
  ├─ Services/Api/           # nghiệp vụ (class static): product, category, user, ...
  ├─ Models/                 # model Sequelize + index.model.js (khai báo quan hệ)
  ├─ Helpers/                # password, price, richtext, seo, ...
  ├─ Jobs/ · Console/        # cron/CLI
resources/lang/{vi,en}/      # chuỗi i18n (common, home, seo, ...) — auto-discover theo tên file
views/                       # EJS: trang khách + views/admin/* + partials/
public/                      # tài nguyên tĩnh phục vụ tại /static (css, js, images, icons)
doc/                         # schema.sql, seed.sql, migrations/, tài liệu
```

Luồng một request web: `web.route → navigation + locale + seo middleware → controller → service → model → render EJS`.

---

## 8. Phân quyền trang quản trị

- Toàn bộ `/admin/*` yêu cầu **đăng nhập** (`adminAuth.middleware.js`): phiên = JWT trong cookie httpOnly `admin_session`. Mỗi request nạp lại user từ DB nên **khóa/xóa/đổi vai trò có hiệu lực ngay**.
- **2 vai trò** (cột `users.role`):
  - `admin`: **mọi chức năng** + **quản lý tài khoản** tại `/admin/staff`.
  - `staff`: mọi chức năng quản trị **khác**, **không** vào được `/admin/staff` (chặn bằng `requireRole('admin')`, menu cũng ẩn link).
- **Tài khoản của tôi** `/admin/account` (mọi người): sửa hồ sơ (tên, email, điện thoại) + đổi mật khẩu. Mở bằng **avatar góc trên**.
- Chốt an toàn: không tự xóa mình; không hạ quyền/ẩn/xóa **admin cuối cùng đang hoạt động**.

---

## 9. API JSON (`/api`)

- `POST /api/auth/login` `{client_id, client_secret}` → trả JWT.
- `GET /api/categories`, `GET /api/categories/:id` — công khai (đọc).
- `GET /api/products`, `GET /api/products/:id`, `GET /api/products/featured` — công khai (đọc). Hỗ trợ `q`, `category_id`, `is_featured`, khoảng giá, `sort`, phân trang.
- **Ghi** (POST/PUT/DELETE) yêu cầu header `Authorization: Bearer <token>`.
- Định dạng trả về chuẩn: `{status, message, data, meta?}`.

---

## 10. SEO (đã tích hợp)

Áp dụng cho MỌI trang khách (khu `/admin` để `noindex`):
- Thẻ `<title>`, `<meta name="description">`, `<meta name="keywords">`, `robots`, `author`, `theme-color`, favicon.
- **Canonical** + **hreflang** VI/EN (song ngữ).
- **Open Graph** + **Twitter Card** (chia sẻ Facebook/Zalo/Twitter).
- **JSON-LD** (Google rich results): `WebSite`+`Organization` (trang chủ), `Product`+`BreadcrumbList` (sản phẩm), `BreadcrumbList` (danh mục), `Article` (tin tức).
- **`/robots.txt`** và **`/sitemap.xml`** (sinh động từ DB).
- Mặc định lấy từ `resources/lang/{vi,en}/seo.js`; mỗi trang tự truyền mô tả/ảnh riêng.
- ⚠️ Đặt **`SITE_URL`** trong `.env` (vd `https://tenmien.com`) để canonical/sitemap ra đúng domain khi lên production.

---

## 11. Triển khai (Deploy)

- Có sẵn cấu hình **Railway** (`railway.json`, `pm2-apps.json`) — xem chi tiết trong **`DEPLOY.md`**.
- `GET /health` là endpoint healthcheck (trả 200 khi DB sẵn sàng).
- Nhớ đặt trên môi trường thật: `JWT_SECRET`, `DB_*`, `SITE_URL`, đổi `ADMIN_USER/ADMIN_PASS`.

---

## 12. Lưu ý quan trọng (gotchas)

1. **Windows + Git Bash**: không truyền tiếng Việt qua dòng lệnh `curl -d '{...}'` / `mysql -e "..."` — hỏng UTF-8. Hãy ghi ra **file** rồi `curl -d @file.json` / `mysql < file.sql`.
2. **Ảnh admin upload** lưu **base64 trong DB** (không ra ổ đĩa). Đây là lý do `BODY_LIMIT=25mb` và các cột ảnh là `MEDIUMTEXT`.
3. **`schema.sql`/`seed.sql` chỉ tự chạy khi volume Docker TRỐNG.** DB đã có dữ liệu thì phải áp thủ công (mục 5.2) — nếu không sẽ thiếu bảng/cột mới (vd `users.email/phone`).
4. **Bảng có xóa mềm** (`products`, `categories`, `examples`): xóa qua admin chỉ set `deleted_at`, dữ liệu vẫn còn trong DB.
5. Nội dung bài viết/mô tả dùng **Markdown rút gọn** (dựng HTML ở `app/Helpers/richtext.helper.js`), **không** lưu HTML thô.

---

*Tài liệu liên quan: `README.md` (tổng quan), `DEPLOY.md` (triển khai Railway), `doc/huong-dan-su-dung.md` (hướng dẫn dùng admin), `CLAUDE.md` (ghi chú kiến trúc chi tiết cho lập trình viên).*
