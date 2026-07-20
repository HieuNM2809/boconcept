# Lưới ảnh mosaic 8 khe — 3 khe slider + 5 khe tĩnh CMS

Ngày: 2026-07-20 · Nhánh: `feat/site-rebuild`

## 1. Bối cảnh

Khối "Style advice" ở trang chủ (`#inspiration`) đã có sẵn lưới mosaic 12 cột khớp
**đúng 100%** với mockup yêu cầu (`images/c094054a-…(1).jpg`). Đối chiếu tọa độ đo
từ ảnh với `public/css/style.css:464-472` cho kết quả trùng khít cả 8 ô.

Vì vậy phần "dựng grid/masonry responsive" **không nằm trong phạm vi việc này**.
Chỉ có hai thứ thật sự phải làm:

1. Ba ô được đánh số 1/2/3 trên mockup hiện là **một** ảnh tĩnh kèm hiệu ứng nháy
   trắng bằng CSS. Phải thành **slider nhiều ảnh, tự chuyển**.
2. Năm ô còn lại đang **đóng cứng** trong `app/Http/Controllers/home.controller.js:24-30`
   (hằng `SMALL_TILES`). Phải đưa vào CMS để admin tự thay ảnh từng vị trí.

## 2. Quyết định đã chốt

| # | Vấn đề | Chốt |
|---|---|---|
| 1 | Lưu nhóm ảnh cho khe slider | Bỏ UNIQUE trên `gallery.slot`, dùng **một bảng** cho cả 8 khe |
| 2 | Màn admin | Giữ luồng cũ: danh sách khe → trang sửa riêng, nới từ 3 lên 8 dòng |
| 3 | Hiệu ứng chuyển ảnh | Fade + zoom nhẹ (1.06 → 1), 5s/ảnh, lệch pha giữa 3 khe |
| 4 | Đánh số khe | Gộp `big-1..3` + `small-1..5` về **một dãy `collage-slot-1..8`** |

## 3. Cơ sở dữ liệu

**Không thêm bảng, không thêm cột.** Bảng `gallery` giữ nguyên schema; chỉ đổi
ràng buộc để một khe chứa được nhiều dòng.

`doc/migrations/2026-07-20-gallery-multi.sql` — idempotent theo đúng pattern
`information_schema` của các migration hiện có:

```sql
-- 1. Bỏ uk_gallery_slot (chỉ khi đang tồn tại)
-- 2. Thêm INDEX idx_gallery_slot_order (slot, sort_order) (chỉ khi chưa có)
-- 3. Seed khe 4..8 từ 5 giá trị đang hardcode ở SMALL_TILES,
--    kèm INSERT ... WHERE NOT EXISTS (SELECT 1 FROM gallery WHERE slot = N)
```

Điều kiện `WHERE NOT EXISTS` ở bước 3 là điểm an toàn quan trọng: chạy lại
migration lần hai, hoặc chạy sau khi admin đã tự upload ảnh, đều **không đè** dữ
liệu người dùng.

Cùng nội dung seed thêm vào `doc/seed.sql` cho database dựng mới.

Cấu trúc dữ liệu sau migration:

```
gallery
  id | slot | image | alt_vi | alt_en | sort_order | status
  ---+------+-------+--------+--------+------------+-------
   1 |  1   |  ...  |        |        |     0      |   1     <- khe slider
   2 |  1   |  ...  |        |        |     1      |   1     <- cùng khe 1
   3 |  1   |  ...  |        |        |     2      |   1     <- cùng khe 1
   4 |  2   |  ...  |        |        |     0      |   1
  ...
  12 |  6   |  ...  |        |        |     0      |   1     <- khe tĩnh (1 dòng)
```

Khe tĩnh không có gì đặc biệt ở tầng schema — nó chỉ **tình cờ** có đúng một
dòng. Ràng buộc "khe 4-8 chỉ một ảnh" nằm ở tầng UI/service, không ở DB.

## 4. Đánh số lại khe

Hiện có hai hệ đánh số chồng nhau: `.big-1..3` và `.small-1..5`. "1" vừa là ô
slider trái vừa là ô tĩnh trên-giữa. Admin nói "Khe 5" mà CSS có cả `.big-3` lẫn
`.small-5` — dễ sửa nhầm ô. Gộp về một dãy duy nhất:

| CSS cũ | CSS mới | Vị trí grid (giữ nguyên) | Loại |
|---|---|---|---|
| `.big-1`   | `.collage-slot-1` | `1 / 5` · `11 / 17` | slider |
| `.big-2`   | `.collage-slot-2` | `5 / 9` · `6 / 15`  | slider |
| `.big-3`   | `.collage-slot-3` | `9 / 13` · `7 / 13` | slider |
| `.small-1` | `.collage-slot-4` | `6 / 9` · `1 / 6`   | tĩnh |
| `.small-2` | `.collage-slot-5` | `9 / 11` · `3 / 7`  | tĩnh |
| `.small-3` | `.collage-slot-6` | `3 / 5` · `6 / 11`  | tĩnh |
| `.small-4` | `.collage-slot-7` | `5 / 7` · `15 / 21` | tĩnh |
| `.small-5` | `.collage-slot-8` | `7 / 9` · `15 / 19` | tĩnh |

**Vị trí grid không đổi một dòng nào** — chỉ đổi tên selector.

Lớp `.is-big` **giữ lại** nhưng đổi vai trò: nó đánh dấu *vai trò bố cục* (khe
1-3 là ô lớn, mobile cho chiếm full-width), không còn gắn animation. Không thêm
lớp `.has-slider` vào markup — JS tự nhận biết khe nào cần chạy bằng cách đếm số
thẻ `<img>` trong ô.

## 5. Service

`app/Services/Api/gallery.service.js` viết lại:

```js
const SLOTS = [1, 2, 3, 4, 5, 6, 7, 8];
const SLIDER_SLOTS = [1, 2, 3];          // khe được phép chứa nhiều ảnh
```

| Hàm | Đổi thành |
|---|---|
| `getSlots()` | Trả **đúng 8** phần tử `{slot, isSlider, images: [{id, image, alt_vi, alt_en}, …]}`, sắp theo `slot ASC, sort_order ASC`. Khe rỗng lấp bằng `SLOT_FALLBACK`. Cờ `isSlider` do service tính, để view không phải biết khe nào là 1-3. |
| `fallbackSlots()` | Cùng kiểu trả về, đồng bộ, không throw. |
| `isSliderSlot(slot)` | Mới — `SLIDER_SLOTS.includes(…)`. |
| `saveSlot(slot, images[])` | Ghi đè cả nhóm trong **một transaction**: xoá hết dòng của khe rồi `bulkCreate` theo thứ tự mảng, `sort_order` = chỉ số. |
| `getBySlot()` | Bỏ — không còn ngữ nghĩa "một dòng cho một khe". |

`saveSlot` bắt buộc dùng transaction (`lib/database`): xoá xong mà chèn lỗi thì
khe sẽ trắng vĩnh viễn. Kiểm tra trước khi ghi:

- khe không hợp lệ → `status: 400`
- mảng rỗng → `status: 400` ("phải có ít nhất một ảnh")
- khe tĩnh mà nhận > 1 ảnh → cắt còn ảnh đầu (không báo lỗi — UI đã chỉ gửi một)

`getSlots()` **không** lọc `status: 1`, giữ đúng hành vi hiện tại.

## 6. Controller và routes

`app/Http/Controllers/admin.gallery.controller.js`:

- `SLOT_LABELS` nới lên 8 mục, kèm mô tả vị trí để admin biết ô nào:
  1 "Slider — ô lớn dưới-trái", 2 "Slider — ô lớn giữa", 3 "Slider — ô lớn phải",
  4 "Ảnh tĩnh — trên, giữa", 5 "Ảnh tĩnh — trên, phải", 6 "Ảnh tĩnh — trái",
  7 "Ảnh tĩnh — dưới, giữa-trái", 8 "Ảnh tĩnh — dưới, giữa-phải".
- `form()` truyền thêm `isSlider` để view chọn dạng soạn thảo.
- `update()` gom `req.body` (mảng ảnh dạng `image[]`, `alt_vi[]`, `alt_en[]`)
  thành mảng object rồi gọi `saveSlot`. Bỏ qua dòng có `image` rỗng — admin xoá
  một dòng giữa chừng không được tạo lỗ hổng.

`routes/web.route.js`: **không đổi**. Ba dòng route hiện có đã đúng contract.

`app/Http/Controllers/home.controller.js`:

- Xoá hằng `SMALL_TILES` (dòng 21-30).
- `res.render` bỏ `galleryBig` / `gallerySmall`, thay bằng một biến `gallery`.
- Lời gọi `softFail` giữ nguyên, chỉ đổi fallback sang `GalleryService.fallbackSlots()`
  kiểu mới.

## 7. View trang chủ

`views/home.ejs`, khối `.collage`:

```ejs
<div class="collage" id="collage">
    <% gallery.forEach(function (g) { %>
        <%# is-big = vai trò bố cục (ô lớn, mobile chiếm full-width). Trùng đúng
            tập khe slider nên dùng chung cờ isSlider, không sinh thêm cờ thứ hai. %>
        <figure class="collage-cell collage-slot-<%= g.slot %><%= g.isSlider ? ' is-big' : '' %>">
            <% g.images.forEach(function (im, i) { %>
                <img class="collage-img<%= i === 0 ? ' is-active' : '' %>"
                     src="<%= im.image %>" alt="<%= pick(im, 'alt') %>"
                     <%= i === 0 ? '' : 'aria-hidden="true"' %>
                     loading="<%= i === 0 ? 'eager' : 'lazy' %>">
            <% }) %>
        </figure>
    <% }) %>
</div>
```

Hai điểm quan trọng:

- Lớp vị trí lấy từ **`g.slot`**, không phải chỉ số vòng lặp. Code hiện tại dùng
  `big-<%= k + 1 %>` (chỉ số mảng) — một khe thiếu là cả mosaic xô lệch.
- `.is-active` do **server** đóng lên ảnh đầu, không phải JS. Đây là điều kiện để
  khối chạy được khi không có JS.

## 8. Hiệu ứng và JavaScript

Bỏ hẳn `@keyframes collage-veil` / `collage-zoom` và các rule `.collage-cell.is-big::after`
(`style.css:474-513`) — hiệu ứng mới thay thế toàn bộ.

CSS mới:

```css
.collage-img {
    position: absolute; inset: 0; width: 100%; height: 100%;
    object-fit: cover; display: block;
    opacity: 0; transform: scale(1.06);
    transition: opacity .9s ease, transform 5s ease-out;
}
.collage-img.is-active { opacity: 1; transform: scale(1); }
```

`transform` để 5s bằng đúng chu kỳ đổi ảnh: ảnh zoom chậm suốt quãng nó hiện
diện rồi mới nhường chỗ. Để dài hơn 5s thì zoom bị cắt giữa chừng mỗi vòng.

Ảnh chồng nhau bằng `position: absolute; inset: 0` — đây đã là pattern hiện có,
và là lý do **layout không thể xô lệch**: ô đã có kích thước do grid quyết định,
ảnh bên trong không đóng góp gì vào việc tính kích thước, kể cả khi ảnh sau tải
chậm hoặc có tỉ lệ khác hẳn.

JS mới trong `public/js/main.js` (~25 dòng), đặt cạnh khối hero slideshow:

```
với mỗi .collage-cell:
    imgs = ảnh trong ô
    nếu imgs.length < 2  -> bỏ qua (khe tĩnh, hoặc slider mới có 1 ảnh)
    nếu prefers-reduced-motion -> bỏ qua (đứng ở ảnh đầu)
    delay khởi động = thứ tự khe slider × 600ms   (0 / 600 / 1200)
    setTimeout(delay) rồi setInterval(5000):
        gỡ .is-active khỏi ảnh hiện tại, gắn vào ảnh kế (vòng lại đầu)
        cập nhật aria-hidden tương ứng
```

Nghỉ khi tab ẩn: `document.visibilitychange` → `clearInterval` / khởi động lại.
Không có nút điều hướng, không dot — đây là ảnh trang trí, không phải nội dung
người dùng cần duyệt qua.

## 9. Suy biến an toàn

| Tình huống | Hành vi |
|---|---|
| Không có JS | Ảnh đầu đã có `.is-active` từ server → hiện ảnh tĩnh, lưới nguyên vẹn |
| `prefers-reduced-motion: reduce` | Không gắn timer, đứng ở ảnh đầu. (Hero hiện **không** xử lý cái này; phần mới làm đúng.) |
| Mất bảng / lỗi DB | `softFail` sẵn có → `fallbackSlots()`, trang chủ không sập |
| Khe slider chỉ có 1 ảnh | Không gắn timer, hoạt động y như khe tĩnh |
| Khe chưa có dòng nào | `SLOT_FALLBACK` lấp bằng ảnh placeholder |

## 10. Admin

`views/admin/gallery.ejs` — bảng nới lên 8 dòng, thêm cột **số ảnh** và dải
thumbnail nhỏ cho khe slider. Vẫn không có nút "Thêm" và không có form xoá.

`views/admin/gallery-form.ejs` — rẽ hai nhánh theo `isSlider`:

- **Khe tĩnh (4-8):** một ô ảnh, dùng partial `_image-field.ejs` thay cho markup
  tự viết hiện tại (partial khớp sẵn quy ước id mà `bindEncoders` trong
  `public/js/admin.js` mong đợi).
- **Khe slider (1-3):** danh sách dòng động, mỗi dòng một ảnh + alt VI/EN + nút
  xoá, kèm nút "Thêm ảnh". Tái dùng **đúng** pattern dynamic rows của
  `views/admin/product-form.ejs` và lời gọi `bindEncoders(row)` ở
  `public/js/admin.js:27` — không viết cơ chế upload mới.

Ảnh vẫn lưu dạng base64 data URI trong `gallery.image` (MEDIUMTEXT), giống mọi
ảnh khác của dự án. Lý do đã ghi ở `views/admin/_image-field.ejs:8-12`: Railway
xoá filesystem mỗi lần redeploy.

**Rủi ro cần lưu ý:** khe slider nhiều ảnh làm POST body phình to. Trần hiện tại
là `BODY_LIMIT` mặc định 16mb (`app/Http/Middleware/index.middleware.js:38,42`).
`shrinkImage` đã ép mỗi ảnh về ≤5 megapixel nên ~8 ảnh/khe vẫn an toàn, nhưng
form slider sẽ hiện cảnh báo mềm khi vượt 8 ảnh.

## 11. Responsive

Rule mobile hiện có (`style.css:1094-1096`) giữ nguyên cấu trúc, chỉ đổi selector:

```css
.collage { grid-template-columns: repeat(2, 1fr); grid-auto-rows: 30vw; gap: 8px; }
.collage-cell { grid-column: auto !important; grid-row: auto !important; }
.collage-cell.is-big { grid-column: 1 / -1 !important; }   /* giữ nguyên */
```

`.is-big` vẫn có mặt trên khe 1-3 (mục 4) nên rule này không cần sửa. Slider chạy
bình thường trên mobile vì việc chồng ảnh bằng `absolute` độc lập hoàn toàn với
lưới grid.

## 12. Kiểm thử

Không có test tự động cho tầng view trong dự án này. Kiểm chứng bằng tay:

1. Chạy migration lên container đang có dữ liệu → `SELECT slot, COUNT(*) FROM gallery GROUP BY slot` cho đủ 8 khe.
2. Chạy migration **lần hai** → không dòng nào bị đổi (`updated_at` giữ nguyên).
3. `/admin/gallery` liệt kê 8 khe, không có nút Thêm/Xoá.
4. Thêm 3 ảnh vào khe 2 → trang chủ ô giữa tự chuyển, **các ô khác không xê dịch**.
5. Sửa khe 6 → đúng ô trái đổi ảnh (kiểm tra ánh xạ số khe ↔ vị trí).
6. Bật "giảm chuyển động" trong OS → slider đứng yên ở ảnh đầu.
7. Tắt JS → cả 8 ô hiện ảnh đầu, lưới không vỡ.
8. Thu hẹp xuống < 768px → lưới về 2 cột, 3 ô slider chiếm full-width.

## 13. Ngoài phạm vi

- Không đụng vào hero slideshow (kể cả việc nó thiếu xử lý `prefers-reduced-motion`).
- Không đổi vị trí grid của bất kỳ ô nào.
- Không chuyển ảnh sang lưu file trên đĩa.
- Không thêm nút điều hướng / dot cho slider mosaic.
