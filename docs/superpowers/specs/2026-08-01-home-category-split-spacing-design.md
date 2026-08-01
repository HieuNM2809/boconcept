# Khối loại sản phẩm ở trang chủ — giãn cách & căn chữ

Ngày: 2026-08-01

## Vấn đề

Khối split "loại sản phẩm" ở trang chủ (chữ trái · ảnh phải, một khối cho mỗi danh mục cha)
đang **kéo sát mép màn hình cả hai bên** và khoảng thở giữa cột chữ với ảnh quá hẹp.

Khách đánh dấu trực tiếp lên ảnh chụp màn hình `images/screenshot_1785518647.png`:

| Ô đánh dấu | Vị trí | Số ghi |
|---|---|---|
| Xanh lá (trái) | Mép trang → chữ | `25 px` |
| Đỏ (giữa) | Cột chữ → ảnh | `150 px` |
| Xanh lá (phải) | Ảnh → mép trang | `25 px` |

Kèm hai yêu cầu chữ: *"Cho chữ được căn đều 2 bên"* và *"Cho lùi vô 10 hoặc 15 px"*.

Mốc `25px` không phải số tuỳ tiện — nó là **lề trang chung của site**, đã có sẵn trong
`public/css/style.css:57-58`:

```css
.container      { width: calc(100% - 50px); margin-inline: auto; }  /* 25px mỗi bên */
.container-wide { width: 100%; padding-inline: 25px; }
```

Khối này là chỗ duy nhất trên trang chủ không theo lề đó.

## Hiện trạng

- **Markup** — `views/home.ejs:111-147`. `categories.forEach` sinh **một** `<section class="section why">`
  cho mỗi danh mục cha; bên trong là `.why-split > .why-copy + .why-media`.
  Nhãn giữa ảnh (`.why-media-label`) chính là tên danh mục ("Đồ nội thất 1" trong ảnh chụp).
- **CSS** — `public/css/style.css:504-653`.

```css
.why-split {
    display: grid;
    grid-template-columns: 1fr 1fr;   /* KHÔNG gap, KHÔNG lề trang */
    min-height: 480px;
    position: relative;
}
.why-copy {
    padding: clamp(40px, 5vw, 80px) clamp(28px, 4vw, 72px);
    ...
}
.why-body { ...; white-space: pre-line; }
```

`clamp(28px, 4vw, 72px)` của `.why-copy` đang **gánh hai vai cùng lúc**: vừa là lề trái của
trang, vừa là khoảng cách sang ảnh. Còn `.why-media` không có lề nào nên ảnh chạm mép phải.
Tách hai vai này ra là toàn bộ nội dung phần hình học bên dưới.

## Quyết định đã chốt

| Câu hỏi | Chốt | Vì sao |
|---|---|---|
| Hai cột co lại thế nào khi thêm gap 150px | **Bằng nhau** (`1fr 1fr` + `gap`) | Hai khối cân đối; CSS gọn nhất |
| Đặt lề/gap ở đâu | Trên `.why-split` | Không phải sửa EJS; grid tự chia cột |
| "Lùi vô 10-15px" nghĩa là gì | **Thụt dòng đầu** (`text-indent`), không phải thụt cả khối | Đi cặp chuẩn với "căn đều 2 bên" |
| 10px hay 15px | **15px** | ≈1em ở cỡ chữ 14px; 10px gần như không thấy |
| Căn đều áp cho phần nào | Chỉ `.why-body`, **không** áp cho `.why-title` | Tiêu đề tự xuống dòng mà justify sẽ giãn chữ rất xấu |
| Màn hẹp | 150px → 60px (≤1200px) → 24px dọc (≤768px) | Giữ đúng số ở desktop mà không bóp chữ ở laptop |

## Thiết kế

Chỉ sửa `public/css/style.css`. **Không** đụng `views/home.ejs`, không đụng model/service/route.

### 1. Hình học — `.why-split` và `.why-copy`

```css
.why-split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 150px;
    padding: 0 25px;
    min-height: 480px;
    position: relative;
}
.why-copy {
    padding: clamp(40px, 5vw, 80px) 0;
    display: flex; flex-direction: column; justify-content: flex-start;
    background: #fff;
}
```

Dùng `column-gap` chứ **không** phải `gap`: ở ≤768px lưới xuống một cột, `gap: 150px` sẽ
biến thành khe **dọc** 150px giữa ảnh và chữ. Khe dọc mobile do `row-gap` trong media query
lo, tách bạch hẳn hai trục.

**Bắt buộc phải gỡ `clamp(28px, 4vw, 72px)` khỏi `.why-copy`.** Nếu để lại, nó cộng dồn với
`padding-inline: 25px` của grid và chữ rơi vào 53–97px thay vì 25px. Padding **dọc**
`clamp(40px, 5vw, 80px)` giữ nguyên — ảnh chụp không đánh dấu chiều dọc.

Vì `* { box-sizing: border-box }` (dòng 44) nên `min-height: 480px` đã tính cả padding,
không cần chỉnh.

### 2. Chữ — `.why-body`

```css
.why-body {
    color: var(--muted); font-size: 14px; line-height: 1.85;
    margin: 0 0 24px;
    white-space: pre-line;
    text-align: justify;
    text-indent: 15px;
}
```

Hai hệ quả của việc `white-space: pre-line` gặp `text-align: justify` — cả hai đều là hành
vi mong muốn, **không** phải lỗi cần chữa:

- CSS **không** kéo giãn dòng kết thúc bằng ngắt dòng cưỡng bức. Mô tả trong DB xuống dòng
  bằng `\n`, nên các dòng gạch đầu dòng ngắn ("Cấu trúc bằng gỗ tếch nguyên khối"…) giữ
  nguyên căn trái, không bị dàn thưa; chỉ đoạn văn dài tự wrap mới được căn đều.
- Cả mô tả là **một** thẻ `<p>`, nên `text-indent` chỉ thụt **dòng đầu tiên của toàn khối**,
  không thụt lại sau mỗi lần xuống dòng.

### 3. Màn hẹp

Chèn khối 1200px **ngay trước** `@media (max-width: 768px)` sẵn có (dòng 648) để thứ tự
cascade đúng — ở ≤768px cả hai khối cùng khớp, khối viết sau thắng.

```css
@media (max-width: 1200px) {
    .why-split { gap: 60px; }
}
@media (max-width: 768px) {
    .why-split { grid-template-columns: 1fr; gap: 24px; }   /* + gap, phần còn lại giữ nguyên */
    .why-media { min-height: 300px; order: -1; }
    .why-sub-item { flex: 0 0 160px; }
    .why-subs-wrap { display: block; opacity: 1; }
}
```

Ở ≤768px grid chỉ còn một cột nên `gap: 24px` thành khoảng cách **dọc** giữa ảnh và chữ;
`padding-inline: 25px` vẫn giữ, nên cả ảnh lẫn chữ đều cách mép 25px.

### Kết quả theo bề rộng màn

| Màn | gap | cột chữ | ảnh |
|---|---|---|---|
| 1920 | 150 | 860 | 860 |
| 1440 | 150 | 620 | 620 |
| 1280 | 150 | 540 | 540 |
| 1201 | 150 | 500 | 500 |
| 1200 | 60 | 545 | 545 |
| 1024 | 60 | 457 | 457 |
| 768 | 24 (dọc) | 718 | 718 |

Công thức: cột `= (W − 50 − gap) / 2`.

## Phạm vi ảnh hưởng

Áp cho **mọi** khối danh mục cha trên trang chủ, không riêng khối trong ảnh chụp — tất cả
dùng chung class `.why-split`. Đây là điều mong muốn: các khối phải nhất quán với nhau.

Class `.why-*` chỉ xuất hiện ở `views/home.ejs`, nên không trang nào khác bị ảnh hưởng.

## Kiểm chứng

Chạy site (`docker compose up -d` + `npm run dev`) và chụp trang chủ ở **1440px**, **1100px**,
**600px**. Cần thấy:

1. Chữ cách mép trái 25px; ảnh cách mép phải 25px (1440px).
2. Khoảng chữ ↔ ảnh đúng 150px ở 1440px, 60px ở 1100px.
3. Cột chữ và ảnh **rộng bằng nhau**.
4. Đoạn văn dài căn đều hai bên; dòng đầu thụt 15px; các dòng gạch đầu dòng **không** bị dàn thưa.
5. Ở 600px: xếp dọc, ảnh trên chữ dưới, cả hai cách mép 25px.
6. Hover vào ảnh vẫn xổ hàng danh mục con như cũ (`.why-subs-wrap`).

## Ngoài phạm vi

- `images/screenshot_1785518562.png` và `..._1785518603.png` đánh dấu **khoảng cách dọc 50px**
  giữa các section. Khách chưa yêu cầu trong lần này; làm riêng nếu cần.
- `.why { background: var(--white) }` (dòng 504) và `.why-media-subs` tham chiếu biến
  `--white` **không tồn tại** trong `:root` (dòng 2-42) → khai báo vô hiệu, nền thành trong
  suốt. Không ảnh hưởng thay đổi này; không sửa lẫn vào đây.
- `.why-features` (dòng 528-543) là CSS chết — `home.ejs` không render class này. Để nguyên.

## Giả định

Không khớp được tỉ lệ trong ảnh chụp với CSS đang có (đo ra ~24px lề trái trong khi CSS tính
ra 45–72px ở mọi bề rộng hợp lý) — nhiều khả năng ảnh screen-share bị thu nhỏ, hoặc chụp ở
máy khác. Spec này coi **25 / 150 / 15 là giá trị CSS đích**, xác nhận lại bằng bước Kiểm chứng.
