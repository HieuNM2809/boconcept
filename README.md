# Node.js Service Base

Bộ khung (boilerplate) cho REST API viết bằng **Node.js** theo kiến trúc **MVC kiểu Laravel**, trích xuất và làm sạch từ dự án HasakiNow — đã bỏ toàn bộ phần geo/logistics và thay bằng 1 resource mẫu (`Example`) demo đủ các tầng.

## Stack

- **Express.js** — web framework
- **Sequelize + MySQL** (`mysql2`) — ORM & database
- **Redis** (`ioredis`) — cache
- **JWT** (`jsonwebtoken`) — xác thực client
- **express-validator** — validate request
- **log4js** (stdout JSON, có traceId) + **winston** (ghi file xoay vòng) — logging
- **node-cron** — job định kỳ (tiến trình `schedule-runner`)
- **yargs** — CLI command
- **PM2** — quản lý tiến trình khi deploy
- **helmet / hpp / cors / compression / express-rate-limit** — middleware bảo mật & hiệu năng
- **Jest + supertest** — test

## Cấu trúc thư mục

```
.
├── index.js                     # Entry HTTP server
├── pm2-apps.json                # Cấu hình PM2 (app-server cluster + schedule-runner)
├── config/                      # Cấu hình kết nối
│   ├── mysql.js
│   ├── redis.js
│   └── log4js.js
├── lib/                         # Khởi tạo singleton kết nối
│   ├── database.js              # instance Sequelize
│   ├── redis.js                 # client ioredis
│   └── winston.js               # logger ghi file
├── routes/
│   ├── index.route.js           # gắn /api và /
│   ├── api.route.js             # /api/auth, /api/examples
│   └── web.route.js             # health check
├── resources/lang/{vi,en}/      # i18n message
├── general/Constants/           # hằng số dùng chung
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── BaseController.js         # sendSuccessResponse / sendErrorResponse
│   │   │   └── Api/{auth,example}.controller.js
│   │   ├── Middleware/
│   │   │   ├── index.middleware.js       # gom middleware + error handler
│   │   │   └── auth.middleware.js        # verify JWT
│   │   └── Requests/example.validation.js
│   ├── Services/Api/{auth,example}.service.js   # business logic
│   ├── Models/{index,ApiClient,Example}.model.js
│   ├── Jobs/{BaseJob,example.Job}.js
│   ├── Console/
│   │   ├── Kernel.js            # đăng ký cron job
│   │   └── Commands/example.command.js  # CLI
│   └── Helpers/{base,cache}.helper.js
├── storage/logs/                # log file (gitignored)
├── tests/                       # Jest (unit + feature)
└── doc/schema.sql               # SQL tạo bảng + seed api client mẫu
```

## Yêu cầu

- Node.js >= 18
- MySQL (cho các API dùng DB)
- Redis (tùy chọn — chỉ cần khi dùng cache)

## Cài đặt

```bash
npm install
cp .env.example .env        # rồi chỉnh thông số DB/Redis/JWT
```

> Trên Windows (Git Bash) dùng `copy .env.example .env` nếu `cp` không có.

### Hạ tầng bằng Docker — MySQL + Redis (khuyến nghị cho dev)

```bash
docker compose up -d          # chạy MySQL 8 + Redis 7
docker compose ps             # trạng thái
docker compose logs -f redis  # xem log 1 service
docker compose down           # dừng (giữ dữ liệu)
docker compose down -v        # dừng + XÓA dữ liệu (chạy lại schema.sql từ đầu)
```

- **MySQL** (`boconcept-mysql`, port `DB_PORT` mặc định 3306) — lần khởi tạo đầu tiên tự chạy `doc/schema.sql` + `doc/seed.sql` (tạo bảng, seed client demo `demo-client` / `demo-secret` và catalog mẫu). Dữ liệu ở volume `boconcept_mysql_data`.
- **Redis** (`boconcept-redis`, port `REDIS_PORT` mặc định 6379) — cache; dữ liệu ở volume `boconcept_redis_data` (appendonly). Dev chạy không mật khẩu (khớp `REDIS_PASSWORD` rỗng); nếu đặt mật khẩu thêm `--requirepass` vào `command`.
- Kiểm tra kết nối từ app: `RUN_DB_TESTS=1 npm test` (MySQL). Redis dùng qua `lib/redis.js` / `app/Helpers/cache.helper.js`.

### Hoặc dùng MySQL sẵn có

```bash
mysql -u root -p app_db < doc/schema.sql   # tạo bảng + client demo
```

## Chạy

```bash
npm run dev          # HTTP server (nodemon, hot reload)
npm start            # HTTP server (production)
npm run schedule     # tiến trình cron (schedule-runner)
npm test             # chạy test (unit + feature)

# CLI mẫu
node app/Console/Commands/example.command.js seed -n "Demo"
node app/Console/Commands/example.command.js list

# PM2 (deploy)
npm run pm2:start    # chạy app-server + schedule-runner theo pm2-apps.json
```

Mặc định server chạy tại `http://localhost:3000`.

### Giao diện trang chủ (SSR bằng EJS)

Mở `http://localhost:3000/` để xem **trang chủ** render bằng EJS, dữ liệu load thẳng từ DB:

- **Loại sản phẩm** ← `CategoryService.getAll` (danh mục cấp 1, kèm ảnh)
- **Sản phẩm nổi bật** ← `ProductService.getFeatured` (`is_featured=1`, sắp theo `priority`)
- Song ngữ: `http://localhost:3000/?lang=en` (mặc định `vi`)
- Các mục tĩnh (hero slideshow, why-us, đối tác, chứng nhận) hiện là placeholder trong `app/Http/Controllers/home.controller.js` — TODO chuyển sang bảng DB (content module).

Cấu trúc view: `views/home.ejs` + `views/partials/*` · CSS/JS tĩnh ở `public/` (phục vụ tại `/static`). Health check chuyển sang `GET /health`.

### Trang danh sách theo loại — `GET /categories/:id`

`views/category.ejs` (controller `catalog.controller.js`): breadcrumb, danh mục con (kèm số sản phẩm), và lưới sản phẩm có **sắp xếp / phân trang / tìm theo tên**. Query: `?sort=popular|newest|bestseller|price_asc|price_desc&per_page=&page=&q=`. Dữ liệu từ `ProductService.getAll` + `CategoryService`. Card danh mục ở trang chủ trỏ tới trang này.

> `bestseller` tạm map sang `priority` (chưa có dữ liệu lượt bán).

### Trang chi tiết sản phẩm — `GET /products/:id`

`views/product.ejs` (controller `catalog.controller.js`): gallery (1 hình gốc + dải thumbnail kiểu Shopee, bấm để đổi ảnh chính), chọn **biến thể** (cập nhật ảnh/giá/SKU qua JS), SKU, danh mục, nút liên hệ, và **tabs** (Thông tin thêm / Đóng gói & vận chuyển / FAQ accordion). Dữ liệu từ `ProductService.getById` (kèm `variants` + `images`); tự fallback khi sản phẩm không có biến thể/ảnh. Card sản phẩm ở trang chủ & trang danh sách trỏ tới đây.

> Thông số / đóng gói / FAQ là placeholder theo ngôn ngữ ở `resources/lang/{vi,en}/product.js` (schema chưa có cột thông số kỹ thuật).

## API

| Method | Endpoint            | Auth | Mô tả                          |
|--------|---------------------|------|--------------------------------|
| GET    | `/`                 | –    | Health check                   |
| POST   | `/api/auth/login`   | –    | Lấy JWT từ client_id/secret    |
| GET    | `/api/examples`     | ✅   | Danh sách (phân trang, `?q=`)  |
| POST   | `/api/examples`     | ✅   | Tạo mới                        |
| GET    | `/api/examples/:id` | ✅   | Chi tiết                       |
| PUT    | `/api/examples/:id` | ✅   | Cập nhật                       |
| DELETE | `/api/examples/:id` | ✅   | Xóa mềm                        |
| GET    | `/api/categories`     | –   | Danh mục (`?tree=1` trả cây, `?parent_id=`) |
| GET    | `/api/categories/:id` | –   | Chi tiết danh mục (kèm `children`) |
| POST/PUT/DELETE | `/api/categories[/:id]` | ✅ | Tạo / sửa / xóa danh mục |
| GET    | `/api/products`       | –   | Danh sách + lọc + tìm kiếm + phân trang |
| GET    | `/api/products/featured` | – | Sản phẩm nổi bật (`?limit=6`, theo priority) |
| GET    | `/api/products/:id`   | –   | Chi tiết (kèm `category`, `variants`, `images`) |
| POST/PUT/DELETE | `/api/products[/:id]` | ✅ | Tạo / sửa / xóa sản phẩm (POST hỗ trợ variants + images lồng) |

**Catalog** = mô hình nội thất (theo spec): `Category` (cây danh mục) → `Product` → `ProductVariant` (item con kiểu Shopee) + `ProductImage` (gallery). READ public, WRITE cần token.

Bộ lọc `/api/products`: `page`, `per_page`, `q` (tên VI/EN), `category_id`, `is_featured`, `min_price`, `max_price`, `status`, `sort` (`newest|oldest|price_asc|price_desc|priority`).

> Dữ liệu song ngữ lưu ở cột `name_vi`/`name_en`, `description_vi`/`description_en`. Kết nối MySQL đã ép `utf8mb4` (config + `SET NAMES` trong SQL) để tiếng Việt không lỗi mã hóa.

### Luồng xác thực

```bash
# 1. Login lấy token (client demo có sẵn trong schema.sql)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"client_id":"demo-client","client_secret":"demo-secret"}'

# 2. Gọi API kèm Bearer token
curl http://localhost:3000/api/examples \
  -H "Authorization: Bearer <accessToken>"
```

Mọi response đều theo format chuẩn:
```json
{ "status": "success", "message": "...", "data": {}, "meta": {} }
{ "status": "error",   "message": "...", "error": "..." }
```

## Thêm một resource mới (vd: `Product`)

1. **Model** — copy `app/Models/Example.model.js` → `Product.model.js`, đổi `tableName`/cột. Khai báo trong `app/Models/index.model.js`.
2. **Service** — copy `app/Services/Api/example.service.js` → `product.service.js`, viết business logic.
3. **Validation** — copy `app/Http/Requests/example.validation.js` → `product.validation.js`.
4. **Controller** — copy `app/Http/Controllers/Api/example.controller.js` → `product.controller.js`.
5. **Route** — thêm block router trong `routes/api.route.js`.
6. (tùy chọn) thêm message trong `resources/lang/*/messages.js`.

## Khác biệt so với source gốc (đã bỏ trong bản Core)

- Elasticsearch, Kafka (consumer/producer), Bee-Queue + Workers, Elastic APM
- Toàn bộ domain geo/logistics (grid cell, pickup location, distance, ward/district…)

Đã **sửa** vài điểm so với source:
- `BaseController.sendErrorResponse` không còn gọi `process.exit(1)` khi thiếu `res`.
- Thống nhất client Redis dùng `ioredis` với đúng key config.
- `Kernel.js` trỏ đúng đường dẫn `.env`.
```
