# Hướng dẫn sử dụng — Website nội thất

Tài liệu dành cho **người vận hành** (không cần biết lập trình). Phần kỹ thuật (cài đặt, kiến trúc code) xem `README.md`.

---

## 1. Khởi động nhanh

```bash
docker compose up -d      # bật MySQL + Redis
npm install               # (lần đầu)
npm run dev               # chạy web
```

Mở trình duyệt:

- **Trang người dùng:** http://localhost:3000
- **Trang quản trị:** http://localhost:3000/admin (tài khoản mặc định `admin` / `admin`)

> Sau khi sửa nội dung trong admin, quay lại trang chủ và nhấn **Ctrl + F5** để thấy thay đổi.

---

## 2. Chức năng trang người dùng

### 2.1. Trang chủ (`/`)
Gồm các khu vực (đều lấy dữ liệu từ hệ thống, trừ mục ghi chú):

| Khu vực | Nội dung | Quản trị ở |
|---|---|---|
| **Slideshow (hero)** | Ảnh lớn đầu trang, tự chạy, có nút ‹ › và chấm chuyển | Slideshow |
| **Tại sao chọn chúng tôi** | Ảnh trái + 4 lý do (icon + tiêu đề + mô tả) | *(nội dung cố định trong mã nguồn — chưa quản trị qua admin)* |
| **Loại sản phẩm** | Dải thẻ danh mục cấp 1, cuộn ngang, nút ‹ › | Loại sản phẩm |
| **Thông tin sản phẩm nổi bật** | Lưới loại sản phẩm kèm số lượng "(N sản phẩm)", sắp theo độ ưu tiên | Loại sản phẩm (trường *Thứ tự*) |
| **Đối tác hợp tác** | Logo/tên các đối tác | Đối tác |
| **Giấy chứng nhận công ty** | Ảnh + tên các chứng nhận | Chứng nhận |
| **Footer** | Liên hệ, dịch vụ, hotline + nút vào **Quản trị** | — |

### 2.2. Đổi ngôn ngữ (Việt / Anh)
- Bấm nút cờ **🇻🇳 VI / 🇬🇧 EN** ở góc phải header.
- Hệ thống nhớ lựa chọn (cookie) khi bạn chuyển trang.
- Hoặc thêm `?lang=en` / `?lang=vi` vào URL.

### 2.3. Trang danh sách theo loại (`/categories/:id`)
Bấm vào một loại sản phẩm ở trang chủ để mở. Có:
- **Đường dẫn (breadcrumb)** + danh sách **danh mục con** (kèm số sản phẩm).
- **Sắp xếp:** Phổ biến · Mới nhất · Bán chạy · Giá (thấp→cao / cao→thấp).
- **Số sản phẩm / trang** (12 / 24 / 40 / 60).
- **Tìm kiếm theo tên** + **phân trang**.

### 2.4. Trang chi tiết sản phẩm (`/products/:id`)
- **Thư viện ảnh** (1 ảnh chính + dải ảnh nhỏ, bấm để đổi).
- **Chọn phân loại/biến thể** (đổi ảnh, giá, mã SKU).
- **Tabs:** Thông tin thêm · Đóng gói & vận chuyển · Câu hỏi thường gặp.

---

## 3. Cách vào trang quản trị

**Cách 1 — qua nút:** kéo xuống **cuối trang (footer)** → bấm nút **🔒 Quản trị**.

**Cách 2 — gõ địa chỉ:** vào thẳng http://localhost:3000/admin

Sau đó trình duyệt hiện hộp **đăng nhập**:

- Tài khoản: **`admin`**
- Mật khẩu: **`admin`**

> 🔐 **Đổi mật khẩu:** sửa `ADMIN_USER` và `ADMIN_PASS` trong file `.env` rồi khởi động lại (`npm run dev`). Nên đổi trước khi đưa lên mạng.

Sau khi đăng nhập, bạn thấy thanh menu với **5 mục**:
**Slideshow · Loại sản phẩm · Đối tác · Sản phẩm · Chứng nhận**

---

## 4. Quản trị từng mục

Mỗi mục hoạt động giống nhau: **danh sách → Thêm / Sửa / Xóa**.
- Nút **“+ Thêm …”** ở góc phải để tạo mới.
- Cột cuối mỗi dòng có **Sửa** và **Xóa** (xóa sẽ hỏi xác nhận).
- **Trạng thái = Ẩn** → không hiển thị ngoài trang.
- **Thứ tự** nhỏ hơn hiển thị trước.
- Ảnh nhập bằng **đường dẫn URL** (dán link ảnh; chưa hỗ trợ tải ảnh lên từ máy).

### 4.1. Slideshow
Quản lý ảnh chạy đầu trang chủ.
- **Ảnh (URL)** *(bắt buộc)*, **Tiêu đề VI/EN**, **Badge VI/EN** (dòng chữ nhỏ phía trên), **Link nút “Mua ngay”** (vd `#featured` hoặc `/categories/1`), **Thứ tự**, **Trạng thái**.

### 4.2. Loại sản phẩm
Danh mục sản phẩm (dạng cây cha–con).
- **Tên VI/EN** *(VI bắt buộc)*, **Ảnh**, **Danh mục cha** (để trống = cấp 1), **Slug**, **Thứ tự**, **Trạng thái**.
- **Thứ tự** quyết định vị trí ở mục **“Thông tin sản phẩm nổi bật”** trên trang chủ.
- ⚠️ Không xóa được loại đang **còn danh mục con** hoặc **còn sản phẩm**.

### 4.3. Đối tác
- **Tên** *(bắt buộc)*, **Logo (URL)** — *để trống sẽ hiển thị bằng chữ (tên)*, **Link**, **Thứ tự**, **Trạng thái**.

### 4.4. Sản phẩm
- **Tên VI/EN** *(VI bắt buộc)*, **Ảnh chính**, **Danh mục**, **Giá**, **Nổi bật** (đánh dấu sản phẩm nổi bật), **Ưu tiên (thứ tự)**, **Slug**, **Trạng thái**, **Mô tả VI/EN**.
- Nút **Xem** mở trang chi tiết sản phẩm ngoài site.
- *Ghi chú: quản lý **biến thể** (màu/size) và **thư viện ảnh** sẽ được bổ sung sau; hiện quản lý các trường chính + ảnh chính.*

### 4.5. Chứng nhận
- **Ảnh (URL)** *(bắt buộc)*, **Tiêu đề VI/EN**, **Thứ tự**, **Trạng thái**.

---

## 5. Lưu ý chung

- **Song ngữ:** nên điền cả tiếng Việt và tiếng Anh; nếu bỏ trống tiếng Anh, hệ thống tự dùng bản tiếng Việt.
- **Ẩn/Hiện nhanh:** đổi *Trạng thái* → *Ẩn* để tạm ngừng hiển thị mà không cần xóa.
- **Thứ tự hiển thị:** dùng trường *Thứ tự* (số nhỏ lên trước).
- **Không thấy thay đổi?** Nhấn **Ctrl + F5** ở trang chủ để tải lại (bỏ bộ nhớ đệm).
- **Sao lưu dữ liệu:** dữ liệu nằm trong MySQL (volume Docker `boconcept_mysql_data`); `docker compose down -v` sẽ **xóa sạch** dữ liệu.
