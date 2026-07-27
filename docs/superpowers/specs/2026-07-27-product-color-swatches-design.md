# Ô màu sản phẩm (color swatches) — thiết kế

Ngày: 2026-07-27

## Vấn đề

Trang chi tiết sản phẩm hiện hiển thị màu là một dòng chữ trong bảng thông số:

```
Màu sắc: Nâu cognac
```

Khách yêu cầu (tin nhắn, ảnh `images/screenshot_1785163407.png`): *"Này là khung màu nha"*,
*"Ko phải chữ"*, *"Cho họ chọn khung màu"* — tức là ô vuông màu bấm chọn được, không hiện chữ.

Dữ liệu hiện tại không đáp ứng được: `products.color_vi` là **chuỗi tự do, một giá trị duy
nhất, không có mã màu** ("Trắng vân xám", "Vân gỗ sáng"). Không thể suy ra hex.

## Quyết định đã chốt

| Câu hỏi | Chốt |
|---|---|
| Nguồn màu | Admin nhập màu cho từng sản phẩm (hex + tên) |
| Bấm vào ô màu | Đổi ảnh chính sang ảnh gắn với màu đó |
| Dòng chữ "Màu sắc" cũ | Bỏ khỏi bảng thông số |
| Khối "Biến thể" | Giữ nguyên |

## Kiến trúc

### Bảng `product_colors`

```
id, product_id, hex, name_vi, name_en, image_index, sort_order, created_at, updated_at
```

- `hex` — `CHAR(7)`, dạng `#RRGGBB`. Đây là thứ vẽ ra ô vuông.
- `name_vi` / `name_en` — tên màu. **Không hiện thành chữ trên giao diện**, chỉ dùng cho
  `title` / `aria-label`. Người dùng trình đọc màn hình và người mù màu không có cách nào
  khác để biết ô đó là màu gì, và thuộc tính này không vẽ chữ lên trang.
- `image_index` — `INT NULL`, **vị trí** của ảnh trong gallery sản phẩm (0-based), không
  phải id.
- `sort_order` — thứ tự hiện.

**Vì sao mỗi màu KHÔNG có ảnh riêng:** ảnh trong dự án là base64 nằm thẳng trong DB
(~2MB/tấm). Cho mỗi màu một ảnh riêng thì 5 màu × 100 sản phẩm ≈ 1GB — đúng cơ chế đã làm
đầy volume MySQL và gây sự cố `1114 The table is full`. Trỏ tới ảnh có sẵn tốn 0 byte.

**Vì sao dùng `image_index` chứ không phải khoá ngoại tới `product_images.id`:** khi tạo
sản phẩm mới, ảnh chưa tồn tại lúc form được điền nên chưa có id để chọn. Vị trí thì luôn
xác định được ngay trong chính lần submit đó, dùng chung một đường cho cả tạo mới lẫn sửa.

### Service

`ProductService._syncColors(productId, colors, t)` — chạy **sau** `_syncImages` trong cùng
transaction của `create()` và `update()`.

**Xoá hết rồi chèn lại** — cố ý KHÁC `_syncImages`. Ở đó mỗi dòng là chuỗi base64 ~2MB nên
ghi lại một dòng không đổi là lãng phí thấy rõ; ở đây một dòng chỉ vài chục byte và không
có gì tham chiếu tới id của màu, nên so từng dòng chỉ đổi lấy code phức tạp hơn mà không
được gì. Lý do khác nhau được ghi thẳng trong comment của cả hai hàm.

Kiểm tra và chuẩn hoá **toàn bộ danh sách trước, ghi sau**: nếu để lẫn vào giữa vòng ghi
thì một mã màu hỏng ở cuối danh sách sẽ xảy ra sau khi `destroy` đã chạy — màu cũ mất sạch
rồi mới báo lỗi.

Bỏ qua hoàn toàn khi `colors` không phải mảng (payload không gửi field → giữ nguyên), giống
`_syncImages`.

### Admin — `/admin/products`

Mục "Màu sắc" mới, bám pattern `gallery[]` đang có (mảng input + nút thêm/xoá):

```
Màu sắc
┌────────────────────────────────────────────────┐
│ [■] #8B5A2B  │ Nâu óc chó │ Ảnh: [Ảnh 2 ▾] │ ✕ │
│ + Thêm màu                                     │
└────────────────────────────────────────────────┘
```

- Ô chọn màu: `<input type="color">` sẵn có của trình duyệt.
- Cột "Ảnh": `<select>` liệt kê các ảnh trong gallery của chính sản phẩm đó, để trống được.
- Ô ẩn `has_colors` luôn gửi kèm. Nó phân biệt "admin đã xoá hết màu" (`[]` → xoá thật) với
  "payload không đụng tới màu" (`undefined` → giữ nguyên). Thiếu nó thì **xoá dòng màu cuối
  cùng sẽ không có tác dụng** — controller không thấy `color_hex` nào và hiểu nhầm là giữ
  nguyên. Lỗi này đang tồn tại sẵn với `gallery[]`, không sửa ở phạm vi này.
- Hai ô text **"Màu sản phẩm" / "Màu tiếng anh"** bị bỏ khỏi form. Cột `color_vi`/`color_en`
  trong DB **giữ nguyên**, không xoá — API `/api/products` vẫn trả về, không mất dữ liệu.

### Trang khách — `views/product.ejs`

Thay dòng `Màu sắc: …` bằng hàng ô vuông, đặt dưới khối biến thể:

```html
<button class="pd-color" style="--sw:#8B5A2B" data-image="<url ảnh>"
        title="Nâu óc chó" aria-label="Nâu óc chó" aria-pressed="false">
```

- Bấm → đổi ảnh chính, dùng lại cơ chế JS của khối biến thể.
- Màu không gắn ảnh → chỉ đổi trạng thái chọn, ảnh giữ nguyên.
- Sản phẩm không có màu nào → không hiện mục này.

## Hệ quả đã biết

**Các sản phẩm đang có chữ màu sẽ không hiện gì ở mục Màu sắc** cho tới khi admin vào chọn
màu cho từng cái. Không có đường tự chuyển đổi — "Vân gỗ sáng" không quy được ra mã hex nào
đúng. Đây là đánh đổi đã được chấp nhận khi chốt "bỏ dòng chữ".

## Ngoài phạm vi

- Quản lý biến thể trong admin (hiện vẫn là "sẽ bổ sung sau").
- Lọc sản phẩm theo màu ở trang danh sách.
- Đồng bộ ngược `color_vi` từ danh sách màu.
