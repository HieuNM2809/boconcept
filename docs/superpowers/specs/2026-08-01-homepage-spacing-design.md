# Khoảng cách các khối trang chủ — thiết kế

Ngày: 2026-08-01

## Vấn đề

Khách gửi 3 ảnh chụp màn hình có khoanh vùng + ghi số khoảng cách mong muốn:

| Ảnh | Vị trí | Đích |
|---|---|---|
| `images/screenshot_1785518562.png` | dải công năng → tiêu đề "Sản phẩm nổi bật" | 50px |
| `images/screenshot_1785518562.png` | tiêu đề "Sản phẩm nổi bật" → hàng ảnh sản phẩm | 50px |
| `images/screenshot_1785518603.png` | đáy hàng ảnh sản phẩm → khối "Chúng tôi chuyên về..." | 50px |
| `images/screenshot_1785518647.png` | mép trái trang → chữ cột text của `.why-split` | 25px |
| `images/screenshot_1785518647.png` | khe giữa cột chữ và cột ảnh của `.why-split` | 150px |
| `images/screenshot_1785518647.png` | mép phải ảnh → mép phải trang | 25px |

> **Đính chính:** ban đầu spec này đọc nhãn viết tay của khe cột là `50 px`. Phóng to 5×
> vùng nhãn cho thấy có nét sổ đứng đứng trước — số thật là **`150 px`** (3 chữ số), khác
> hẳn hai nhãn `50 px` (2 chữ số) trong ảnh `...562`. Con số đã sửa lại thành 150px.

### Ảnh chụp KHÔNG phải build của repo này

Đo màu pixel trên 3 ảnh cho thấy giao diện được chụp chạy CSS khác hẳn repo:

- Tiêu đề "Sản phẩm nổi bật" nằm trên dải nền be `#F6F2EC` tràn ngang. Repo: `.showcase`
  (`public/css/style.css:444`) và `.showcase-title` (`:447`) **không có `background`**, `body`
  nền trắng.
- Cột chữ `.why-copy` trong ảnh nền `#F6F2EC`. Repo (`:516`): `background: #fff`.
- Ảnh có khe trắng 28px giữa hai cột `.why-split`. Repo (`:510`): `grid-template-columns:
  1fr 1fr`, không `gap` — hai cột dính liền.
- Lề ngang cột chữ trong ảnh ~27px. Repo: `clamp(28px, 4vw, 72px)` ≈ 45px ở khổ đó.

Đã kiểm tra nhánh `feat/site-rebuild`, toàn bộ lịch sử `style.css` và `origin/main` (local
đi trước 2 commit, không thiếu commit nào): **không nhánh nào có dải nền be đó**. Ảnh
`...603` còn hiện banner *"meet.google.com is sharing your screen"* — nhiều khả năng là màn
hình máy khác trong buổi Meet, chạy code chưa push.

Hệ quả: **các con số "hiện tại" đo trên ảnh không dùng được làm mốc**. Phải tính lại khoảng
cách hiện tại từ chính CSS của repo này, rồi sửa cho ra đúng số đích.

## Quyết định đã chốt

| Câu hỏi | Chốt |
|---|---|
| Sửa ở repo nào | Sửa thẳng repo này, không chờ build trong ảnh |
| Phạm vi | Cả 3 ảnh (cùng một đợt chụp, đều là trang chủ) |
| Mốc đo 50px của tiêu đề | **Mép hộp `<h2>`** (chuẩn CSS), không bù `line-height` |
| Dải nền be, nền be cột chữ | **Không dựng lại** — ngoài phạm vi yêu cầu |

Về mốc đo: `.showcase-title` kế thừa `line-height: 1.6` từ `body`, nên mép hộp `<h2>` cách
đỉnh chữ khoảng 19px. Chọn mép hộp nghĩa là khoảng trắng mắt nhìn thấy trên/dưới chữ sẽ
là ~69px chứ không phải 50px. Đây là lựa chọn có chủ ý: 50px là con số đo được bằng
DevTools/Figma, và không phải đụng vào `line-height` của tiêu đề.

## Kiến trúc

Nguyên tắc: **mỗi khoảng cách do đúng một thuộc tính quyết định**, để lần sau đổi số chỉ
phải sửa một chỗ. Không dùng kiểu cộng dồn `padding` của cha + `margin` của con.

Toàn bộ thay đổi nằm trong `public/css/style.css`. Không đụng vào view, controller hay JS.

### 1. Khối "Sản phẩm nổi bật" (`.showcase`)

Cấu trúc hiện tại (`views/home.ejs`):

```
section.features        padding: 50px 0 · border-bottom: 1px solid var(--line)
section.showcase        padding: 24px var(--showcase-pad) 0
  h2.showcase-title     margin: 6px 0 22px
  div.showcase-body     (không margin/padding)
    div.showcase-track  → hàng ảnh
section.section.intro   .section { padding: 50px 0 } · .intro không đè padding
```

> **Cập nhật lúc triển khai:** một phiên làm việc song song vừa chèn khối `.intro` (giới
> thiệu doanh nghiệp, căn giữa) vào giữa `.showcase` và các dải `.why`, đồng thời đổi
> `.showcase` thành `padding: 24px var(--showcase-pad) 0`. Khối đứng ngay dưới hàng ảnh
> **không còn là `.why`** mà là `.intro`. Phần dưới đây đã tính lại theo cấu trúc mới.

Khoảng cách hiện tại tính ra:

| Khe | Công thức hiện tại | Ra | Đích |
|---|---|---|---|
| viền `.features` → mép hộp `<h2>` | `.showcase` padding-top 24 + `.showcase-title` margin-top 6 | 30px | 50px |
| mép hộp `<h2>` → hàng ảnh | `.showcase-title` margin-bottom 22 | 22px | 50px |
| hàng ảnh → `.intro` | `.showcase` padding-bottom 0 + `.section` padding-top 50 | **50px** | 50px |

Thay đổi:

| Rule | Hiện tại | Sửa thành |
|---|---|---|
| `.showcase` | `padding: 24px var(--showcase-pad) 0` | `padding: 50px var(--showcase-pad) 0` |
| `.showcase-title` | `margin: 6px 0 22px` | `margin: 0 0 50px` |

**Chỉ sửa `padding-top`.** `padding-bottom: 0` phải giữ nguyên: khe xuống `.intro` đã đúng
50px nhờ `.section`, đặt lại 50px ở đây thì hai số cộng dồn thành 100px.

`margin-top` về `0` là phần bắt buộc: để nguyên `6px` thì khe trên thành 56px. Sau khi
sửa, khe trên do **một mình** `padding-top` của `.showcase` quyết định.

Không có margin collapsing làm sai lệch: `.showcase` có `padding-top` nên margin-top của
`<h2>` không thoát ra ngoài được, và ở phía dưới `.showcase-body` lẫn `.showcase-track` đều
margin 0 nên không có gì gộp với `margin-bottom` của `<h2>`.

**Giữ nguyên** override responsive `:1676` (`.showcase { padding-top: 18px;
padding-bottom: 18px }` ở tablet) — 50px chỉ áp cho desktop.

### 2. Khối `.why-split`

> **Spec chính của khối này là `2026-08-01-home-category-split-spacing-design.md`** (một
> phiên làm việc song song, đã commit `88cfc58`). Spec đó đặc tả đầy đủ hơn: thang responsive
> `150px → 60px (≤1200px) → row-gap 24px (≤768px)` và bảng bề rộng cột theo từng khổ màn.
> Phần dưới đây chỉ ghi lại thay đổi cần cho 3 ảnh của yêu cầu này; **khi hai spec vênh
> nhau, lấy spec kia làm chuẩn.**

| Rule | Hiện tại | Sửa thành |
|---|---|---|
| `.why-split` | `display: grid; grid-template-columns: 1fr 1fr; min-height: 480px; position: relative` | thêm `column-gap: 150px` và `padding: 0 25px` |
| `.why-copy` | `padding: clamp(40px,5vw,80px) clamp(28px,4vw,72px)` | `padding: clamp(40px,5vw,80px) 0` |

`.why-split` ôm trọn bề ngang trang, nên `padding: 0 25px` của nó chính là 25px hai bên mà
khách khoanh. Bỏ padding ngang của `.why-copy` để chữ nằm đúng 25px tính từ mép trang —
nếu giữ lại thì chữ bị đẩy vào 25 + 45 = 70px.

Dùng `column-gap` chứ không phải `gap`: ở ≤768px lưới xuống một cột, `gap: 150px` sẽ thành
khe **dọc** 150px giữa ảnh và chữ.

`.why-subs-wrap` (`:592`) đã là `width: 80%; margin-inline: auto` nên không lệch theo thay
đổi này.

## Ảnh hưởng responsive

- **≤1024px**: `.showcase` đã có override riêng (`:1676`), không bị 50px chạm tới.
- **≤768px** (`:648-653`): `.why-split` xuống 1 cột — `column-gap` thành vô nghĩa (đúng),
  `padding: 0 25px` vẫn áp nên cột ảnh không còn tràn sát mép. Chấp nhận: repo đã dùng đúng
  con số 25px cho collage ở mobile (`:1685` `.gallery-grid-section > .collage { padding: 0
  25px }`), nên đây là thống nhất chứ không phải lệ ngoại.

## Kiểm chứng

Không có test tự động cho CSS, và lúc triển khai Docker chưa chạy nên không dựng được app
thật. Thay vào đó đo bằng **Chrome headless nạp thẳng `public/css/style.css` thật**, trên
một harness tĩnh dựng lại đúng DOM của `home.ejs` (`scratchpad/verify-spacing.html`: các
khối `.features` → `.showcase` → `.section.intro` → `.section.why`, ảnh thay bằng data-URI
SVG nên không cần mạng). Harness tự khẳng định stylesheet đã nạp (`.showcase` phải
`position: relative` và `.why-split` phải `display: grid`) trước khi số đo được coi là hợp lệ.

Kết quả (`--dump-dom`, `getBoundingClientRect`):

| Khe | Đích | 1920 | 1440 | 1280 | 800 |
|---|---|---|---|---|---|
| A · viền `.features` → mép hộp `<h2>` | 50 | **50** | **50** | **50** | 18 |
| B · mép hộp `<h2>` → hàng ảnh | 50 | **50** | **50** | **50** | **50** |
| C · hàng ảnh → chữ `.intro` | 50 | **50** | **50** | **50** | 78 |
| D · mép trái trang → chữ `.why` | 25 | **25** | **25** | **25** | **25** |
| E · khe giữa 2 cột `.why` | 150 | **150** | **150** | **150** | 60 |
| F · ảnh `.why` → mép phải trang | 25 | **25** | **25** | **25** | **25** |
| scroll ngang | không | không | không | không | không |

Sáu số đích đều đạt ở khổ desktop (1920 / 1440 / 1280). Cột 800 lệch là do override
responsive có sẵn, không phải hồi quy: `A=18` và phần `C` là `.showcase { padding-top:
18px; padding-bottom: 18px }` ở media query tablet, `E=60` là `.why-split { column-gap:
60px }` cũng ở media query.

### Điểm còn vênh, chưa sửa

Ở breakpoint tablet, `.showcase` bị đặt lại `padding-bottom: 18px`, nên khe xuống `.intro`
lúc đó do **hai** rule cộng lại (18 + 60 = 78px) — đúng cái kiểu cộng dồn mà comment
`padding-bottom = 0 CÓ CHỦ Ý` muốn tránh. Ở desktop không ảnh hưởng, và 3 ảnh khách gửi
đều là desktop, nên để nguyên; muốn nhất quán thì bỏ `padding-bottom: 18px` khỏi media
query đó.

## Ngoài phạm vi

- Dựng lại dải nền be sau tiêu đề và nền be cột `.why-copy` như build trong ảnh.
- Bất kỳ khoảng cách nào của các khối khác trên trang chủ (hero, collage, tin tức, đối tác,
  chứng nhận) — 3 ảnh không đụng tới.
- Đồng bộ code với build đang chạy trong ảnh Meet.
