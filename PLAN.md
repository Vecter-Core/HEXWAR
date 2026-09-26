# HEXWAR (tên tạm) — Kế hoạch phát triển cho Claude Code

> Game 3D chiến thuật lượt, bàn cờ lục giác R=24, 6 người chơi (người + bot), chơi online, phát hành trên Steam.
> Tài liệu này là **nguồn đặc tả duy nhất**. Số liệu bàn cờ ở mục 3 đã được kiểm chứng bằng `tools/verify_board.py` (30 kiểm tra, tất cả qua).
> Tên game chỉ là tên tạm: kiểm tra trùng thương hiệu trước khi tạo trang cửa hàng Steam.

---

## 0. Cách dùng file này với Claude Code

1. Tạo repo mới, chép `PLAN.md` và `tools/verify_board.py` vào thư mục gốc.
2. Tạo `CLAUDE.md` ở thư mục gốc từ **Phụ lục A** (quy ước làm việc để Claude Code không lạc hướng).
3. Dán **prompt khởi động** ở Phụ lục B để bắt đầu Milestone M0.
4. Làm **tuần tự theo milestone (mục 15)**. Mỗi milestone kết thúc khi: test xanh + tiêu chí nghiệm thu đạt + commit.
5. Mọi luật được đánh mã `R-xx` (mục 4), cơ chế bổ sung `X-xx` (mục 5), điểm còn mở `D-xx` (mục 2). Test và code nên ghi chú mã luật tương ứng để dễ truy vết.
6. Nếu một luật ở mục 4 mâu thuẫn với ý bạn, **sửa mục 4 trước**, rồi mới sửa code. Không sửa luật trực tiếp trong code.

---

## 1. Tóm tắt

| Hạng mục | Nội dung |
|---|---|
| Thể loại | Cờ chiến thuật theo lượt, 6 người tự do (free-for-all), 3D |
| Bàn cờ | Lục giác, R = 24 → **1801 ô** (tâm + 24 vòng) |
| Người chơi | 6 ghế ở 6 góc. Thiếu người thì bot lấp đủ (1 người + 5 bot … 6 người + 0 bot) |
| Quân mỗi người | 18: 9 Tốt, 2 Xe, 2 Tượng, 2 Mã, 1 Vua, 1 Hậu, 1 Hề (tổng 108 quân) |
| Điều kiện thắng | Người cuối cùng còn Vua. Ăn Vua = người đó mất toàn bộ quân ngay lập tức |
| Nhịp chơi | Tung 3 xúc xắc chọn người đi đầu, sau đó theo chiều kim đồng hồ. 60 giây mỗi lượt |
| Áp lực thời gian | Các vòng ngoài của bàn cờ biến mất dần theo lịch hiệp (mục 3.5) |
| Cơ chế riêng | Tù binh (quân bị ăn còn ở lại 1 hiệp), phong cấp Tốt theo số kill, Hề thế mạng Vua |
| Online | Máy chủ trung tâm có thẩm quyền (authoritative), chat công khai/riêng, voice toàn phòng |
| Onboarding | Chuỗi màn tân thủ học từng cơ chế, rồi trận tập với bot |
| Nền tảng | Windows trước (Steam), Linux/Steam Deck sau |
| Ngôn ngữ | Tiếng Việt + tiếng Anh ngay từ đầu (i18n) |

---

## 2. Điểm mơ hồ trong yêu cầu và quyết định mặc định

Yêu cầu gốc có vài chỗ hiểu được theo nhiều cách. Mỗi dòng dưới đây ghi **cách hiểu mặc định** (đã dùng xuyên suốt tài liệu) và cách đổi nếu bạn muốn khác. Tất cả đều là **cờ cấu hình** trong `rules.config.json`, đổi không cần viết lại engine (trừ D-02).

| Mã | Vấn đề | Mặc định | Phương án khác |
|---|---|---|---|
| D-01 | "R=24" | 24 vòng quanh ô tâm → 1801 ô. Ghế xuất phát nằm ở **vòng 23**; vòng 24 (144 ô) để trống làm vòng đệm, biến mất ở hiệp 50 (lúc đó chưa ai bị mất quân, như một lần "học thu hẹp" nhẹ nhàng) | `seatCornerRing = 24`: quân xếp sát mép, ai chưa rời vòng 24 sẽ chết ở hiệp 50 |
| D-02 | "Đi thẳng, chéo như cờ vua, ngang đi zíc-zắc" trên bàn 6 cạnh | Theo cờ lục giác chuẩn: **Xe** = 6 hướng **cạnh** (thẳng tiến/lùi + 4 hướng chéo theo cạnh ô); **Tượng** = 6 hướng **đỉnh** (gồm đường **ngang zíc-zắc** trái/phải và 4 đường chéo dốc); **Hậu** = cả 12 hướng. Ô trên/dưới của đường zíc-zắc **không cản** đường đi. Lý do chọn: bàn 6 người phải **đối xứng khi xoay 60°**, nếu thêm hướng "ngang" kiểu cờ vua 8 hướng thì ghế ở góc trái/phải sẽ có lợi thế khác ghế khác. Script kiểm chứng bất biến này | Nếu muốn Xe cũng đi được ngang zíc-zắc, phải cho cả 6 hướng đỉnh (khi đó Xe = Hậu). Không khuyến nghị |
| D-03 | "Không quá 9 / 3 / 5 ô" | Đo bằng **khoảng cách lưới** (số ô đi qua theo đường ngắn nhất). Hệ quả: Xe/Hậu ≤ 9 ô theo hướng cạnh; Tượng ≤ 4 bước nhảy đỉnh (mỗi bước nhảy = 2 ô, tức 8 ô); Hề ≤ 3 ô; hồi sinh Vua nếu khoảng cách Vua–Hề ≤ 5 | `reachMetric = "hops"`: đếm số bước theo đường đi của quân (Tượng đi được tới 9 bước nhảy = 18 ô, gần như xuyên bàn) |
| D-04 | Tù binh: "quân bị ăn ở lại chung ô 1 hiệp… hiệp 2 đến lượt bản thân có thể di chuyển quân đó… hết lượt thì quân đó bị loại" | "Quân đó" = **quân bị ăn**. Người ăn được **trưng dụng** nó: ở lượt kế tiếp có thể chọn đi quân bị ăn như quân của mình (1 nước), rồi nó bị loại khi hết lượt. Quy tắc chi tiết ở R-30…R-36 | `captive.conscript = false`: tù binh chỉ nằm im, bị loại khi hết lượt kế tiếp của người ăn (chỉ là loại quân trễ 1 hiệp) |
| D-05 | Phong cấp "ăn 6 → Mã, 10 → Tượng, 15 → Xe, 20 → Hậu" | Số kill **tích lũy trên từng quân Tốt**, giữ nguyên qua các lần phong (Tốt → Mã ở 6, → Tượng ở 10, → Xe ở 15, → Hậu ở 20) | Reset kill sau mỗi lần phong |
| D-06 | Lịch thu hẹp bạn ghi: 50, 110, 180, 250, 260, **280** (không có 270), 290, …, 360 | **Giữ đúng như bạn viết** (14 lần). Nếu thiếu 270 là do sót, thêm 1 số vào mảng `collapse.rounds` | — |
| D-07 | Sau hiệp 360 (còn 331 ô) vẫn có thể chưa ai thắng | Đề xuất thêm: tiếp tục thu hẹp mỗi 10 hiệp (370 … 430) tới bán kính 3 (37 ô), và **kết thúc cứng ở hiệp 450** (mục 4.9) | Tắt bằng `collapse.extension.enabled = false` (khi đó trận có thể kéo dài vô hạn) |
| D-08 | "Hiệp" | 1 hiệp = mọi người còn sống đi đúng 1 lượt. Thu hẹp xảy ra ở **đầu hiệp** N, trước lượt của người mở hiệp | Thu hẹp cuối hiệp N−1 (chỉ khác về cách nói) |
| D-09 | Vua chết vì bị thu hẹp (đứng trên vòng biến mất) | Không kích hoạt Hề. Người chơi bị loại. Lý do: đã được báo trước 3 hiệp, và tránh việc cố tình để Vua ngoài rìa | `jesterSavesFromCollapse = true` |
| D-10 | Công nghệ | TypeScript + Three.js + Electron + máy chủ Node (mục 6). Lý do: engine luật dùng chung cho client, server, bot; kiểm thử được hoàn toàn bằng dòng lệnh; mô hình 3D dựng bằng code (không cần họa sĩ để chạy được bản đầu) | Godot 4 + GodotSteam (mục 6.4) |

### Cảnh báo về thời lượng trận (quan trọng)

Với lịch hiệp bạn đặt, trận có thể rất dài. Số liệu từ script (6 người còn sống suốt trận):

| Tới hiệp | Mỗi lượt dùng hết 60s | Trung bình 20s/lượt | Trung bình 8s/lượt |
|--:|--:|--:|--:|
| 50 | 5,0 giờ | 1,7 giờ | 0,7 giờ |
| 110 | 11,0 giờ | 3,7 giờ | 1,5 giờ |
| 360 | 36,0 giờ | 12,0 giờ | 4,8 giờ |

Thực tế người bị loại làm hiệp ngắn lại và ít trận sống tới hiệp 360, nhưng vẫn nên xử lý từ đầu:
- **Ván solo phải lưu/tiếp tục được** (X-10, bắt buộc).
- **Người mất kết nối hoặc AFK được bot thay** để trận luôn kết thúc được (X-04).
- Ngoài chế độ **Cổ điển** (đúng đặc tả của bạn), có thêm **Tiêu chuẩn** và **Nhanh** với đồng hồ ngắn hơn và lịch thu hẹp co lại (X-09). Người chơi chọn khi tạo phòng. Nên để Tiêu chuẩn làm mặc định khi ghép trận ngẫu nhiên.

---

## 3. Số liệu bàn cờ (đã kiểm chứng)

### 3.1 Toạ độ và hàm cơ bản

- Toạ độ trục **(q, r)**. Hạng của ô: `ring(q,r) = max(|q|, |r|, |q+r|)`. Tâm = hạng 0. Ô hợp lệ khi `ring ≤ R`.
- Khoảng cách lưới: `dist(a,b) = max(|dq|, |dr|, |dq+dr|)`.
- Số ô của bàn bán kính n: `3n(n+1)+1` → R=24: **1801**; hạng 24 có 144 ô.
- Xoay 60° **theo chiều kim đồng hồ** (nhìn từ trên xuống, x sang phải, z xuống dưới màn hình): `rotCW(q,r) = (−r, q+r)`.
- Toạ độ thế giới 3D (ô phẳng-đỉnh, cạnh ô = `s`): `x = 1.5·s·q`, `z = √3·s·(r + q/2)`.

### 3.2 Bộ hướng đi (đều bất biến khi xoay 60°)

Hướng **cạnh** E (khoảng cách 1), liệt kê theo chiều kim đồng hồ bắt đầu từ "lên" (N):

| Tên | N | NE | SE | S | SW | NW |
|---|---|---|---|---|---|---|
| (dq, dr) | (0,−1) | (1,−1) | (1,0) | (0,1) | (−1,1) | (−1,0) |

Hướng **đỉnh** V (khoảng cách 2; là tổng hai hướng cạnh kề nhau; ô trung gian không cản):

| Tên | NNE | **E** (ngang phải) | SSE | SSW | **W** (ngang trái) | NNW |
|---|---|---|---|---|---|---|
| (dq, dr) | (1,−2) | (2,−1) | (1,1) | (−1,2) | (−2,1) | (−1,−1) |

**Mã** nhảy tới 12 ô (bằng đúng 12 ô "không phải góc" của hạng 3):
`(1,−3) (2,−3) (3,−2) (3,−1) (2,1) (1,2) (−1,3) (−2,3) (−3,2) (−3,1) (−2,−1) (−1,−2)`

### 3.3 Sáu ghế

Ghế đánh số 0…5 **theo chiều kim đồng hồ** trên màn hình. Góc xuất phát của ghế `s` là `rotCW^s(0, 23)`. Hướng "tiến về tâm" của ghế `s` là `rotCW^s(N)`.

| Ghế | Vị trí trên màn hình (camera mặc định) | Ô góc | Hướng tiến |
|--:|---|---|---|
| 0 | Dưới | (0, 23) | N (0,−1) |
| 1 | Trái-dưới | (−23, 23) | NE (1,−1) |
| 2 | Trái-trên | (−23, 0) | SE (1,0) |
| 3 | Trên | (0, −23) | S (0,1) |
| 4 | Phải-trên | (23, −23) | SW (−1,1) |
| 5 | Phải-dưới | (23, 0) | NW (−1,0) |

Camera của mỗi người chơi xoay `s × 60°` để **ghế của mình luôn ở đáy màn hình**, quân của mình tiến "lên trên". Vì lưới ô phẳng-đỉnh bất biến khi xoay 60°, mọi người thấy cùng một hình ảnh.

### 3.4 Đội hình 18 quân (tọa độ cục bộ của ghế 0; ghế `s` = `rotCW^s` của từng ô)

Nhìn từ ghế của mình (trên = về phía tâm bàn cờ). Mỗi hàng là một đường ngang zíc-zắc:

```
   ↑ về phía tâm
 hàng 5:   P   P   P   P   P   P          6 tốt (tiền tuyến)
 hàng 4:     N   P   P   P   N            2 mã, 3 tốt
 hàng 3:       R   J   B   R              2 xe, 1 hề, 1 tượng
 hàng 2:         Q   K   B                hậu, vua, 1 tượng
   ↓ góc bàn cờ (ô (0,23) để trống, sau lưng Vua)

 P=Tốt  N=Mã  B=Tượng  R=Xe  Q=Hậu  K=Vua  J=Hề
```

| Hàng | Quân → ô (q, r) |
|--:|---|
| 2 | Q (−2,23) · K (0,22) · B (2,21) |
| 3 | R (−3,23) · J (−1,22) · B (1,21) · R (3,20) |
| 4 | N (−4,23) · P (−2,22) · P (0,21) · P (2,20) · N (4,19) |
| 5 | P (−5,23) · P (−3,22) · P (−1,21) · P (1,20) · P (3,19) · P (5,18) |

**Vì sao hai Tượng đứng ở hai hàng khác nhau:** bàn cờ được tô **3 tông màu** theo `(q − r) mod 3` (hai ô kề cạnh luôn khác màu). Bước nhảy đỉnh của Tượng luôn giữ nguyên màu, và mọi quân cùng một hàng đều cùng màu. Nếu đặt cả hai Tượng ở cùng hàng, cả hai chỉ đánh được 1/3 số ô. Ở đội hình này Tượng ở hàng 2 (màu 2) và hàng 3 (màu 1), nên hai Tượng bao quát hai màu khác nhau (script có kiểm tra). Mã thì luôn đổi màu sau mỗi nước đi.

Kết quả kiểm chứng: 18 quân/ghế, 108 quân toàn bàn, không trùng ô, tất cả ở vòng ≤ 23; Hề cách Vua 1 ô (hồi sinh dùng được ngay từ hiệp 1); khoảng cách gần nhất giữa hai ghế kề nhau = **13 ô**, giữa hai ghế đối diện = **41 ô**, đều nhau cho cả 6 ghế.

**Số nước đi hợp lệ ở thế đầu** (mỗi ghế, theo luật mục 4; dùng làm *golden test* cho engine, mọi ghế phải ra cùng số này): Hậu 7, Vua 5, Hề 6, Xe 4 (cả hai), Tượng 12 (cả hai), Mã 12 (cả hai), Tốt 11 (cả chín) → **57**.

### 3.5 Lịch thu hẹp

Mỗi lần, **vòng ngoài cùng hiện tại** biến mất ở **đầu hiệp** ghi trong bảng.

| # | Hiệp | Hạng biến mất | Ô mất | Ô còn lại | Bán kính còn |
|--:|--:|--:|--:|--:|--:|
| 1 | 50 | 24 | 144 | 1657 | 23 |
| 2 | 110 | 23 | 138 | 1519 | 22 |
| 3 | 180 | 22 | 132 | 1387 | 21 |
| 4 | 250 | 21 | 126 | 1261 | 20 |
| 5 | 260 | 20 | 120 | 1141 | 19 |
| 6 | 280 | 19 | 114 | 1027 | 18 |
| 7 | 290 | 18 | 108 | 919 | 17 |
| 8 | 300 | 17 | 102 | 817 | 16 |
| 9 | 310 | 16 | 96 | 721 | 15 |
| 10 | 320 | 15 | 90 | 631 | 14 |
| 11 | 330 | 14 | 84 | 547 | 13 |
| 12 | 340 | 13 | 78 | 469 | 12 |
| 13 | 350 | 12 | 72 | 397 | 11 |
| 14 | 360 | 11 | 66 | 331 | 10 |
| 15 | 370 *(đề xuất D-07)* | 10 | 60 | 271 | 9 |
| 16 | 380 *(đề xuất)* | 9 | 54 | 217 | 8 |
| 17 | 390 *(đề xuất)* | 8 | 48 | 169 | 7 |
| 18 | 400 *(đề xuất)* | 7 | 42 | 127 | 6 |
| 19 | 410 *(đề xuất)* | 6 | 36 | 91 | 5 |
| 20 | 420 *(đề xuất)* | 5 | 30 | 61 | 4 |
| 21 | 430 *(đề xuất)* | 4 | 24 | 37 | 3 |

Hệ quả thiết kế đáng chú ý (đếm từ đội hình ở mục 3.4): mỗi ghế có **8 quân ở vòng 23** (Hậu, 1 Tượng, 2 Xe, 2 Mã, 2 Tốt) phải rời chỗ trước hiệp 110, và **7 quân ở vòng 22** (Vua, Hề, 1 Tượng, 4 Tốt) phải rời chỗ trước hiệp 180; 3 Tốt còn lại ở vòng 21. Người chơi không đưa Vua vào trong sẽ bị loại ở hiệp 180.

---

## 4. Bộ luật chuẩn (Rules Spec)

Đây là phần engine phải hiện thực **chính xác**. Mỗi mã `R-xx` cần ít nhất một unit test.

### 4.1 Chuẩn bị và tung xúc xắc

- **R-01** Có đúng 6 ghế. Người chơi thật và bot cộng lại đủ 6. Ghế do server gán ngẫu nhiên khi vào trận.
- **R-02** Mỗi người tung 3 xúc xắc 6 mặt (RNG phía server). Tổng cao nhất đi đầu. Nếu nhiều người đồng điểm cao nhất, **chỉ những người đó tung lại**, lặp tới khi có duy nhất một người.
- **R-03** Thứ tự đi: theo chiều kim đồng hồ từ người thắng, tức ghế `s, s+1, …` (mod 6), bỏ qua người đã bị loại.

### 4.2 Hiệp, lượt, đồng hồ

- **R-10** Hiệp 1 bắt đầu khi người đi đầu bước vào lượt đầu tiên. Một hiệp gồm đúng một lượt của mỗi người còn sống. Hiệp mới bắt đầu khi thứ tự quay về **người mở hiệp** (người còn sống đầu tiên theo thứ tự ở R-03; nếu người mở hiệp bị loại thì người còn sống kế tiếp làm người mở hiệp).
- **R-11** Mỗi lượt: chọn một quân của mình và đi **một nước hợp lệ**, hoặc đi một tù binh theo R-32. Không được bỏ lượt tự nguyện.
- **R-12** Mỗi lượt **60 giây** suy nghĩ (chưa tính thời gian hoạt ảnh cố định giữa các lượt, xem 7.4), đồng hồ do server quản lý. Hết giờ: lượt bị bỏ qua (không đi). Ba lượt hết giờ liên tiếp: bot tiếp quản ghế (X-04).
- **R-13** Nếu không có nước đi hợp lệ, lượt tự động bị bỏ qua.
- **R-14** Không có chiếu, chiếu bí, nhập thành, bắt tốt qua đường hay hòa bế tắc. Thắng bằng cách ăn Vua. Vua được phép đi vào ô đang bị đe dọa.

### 4.3 Nước đi của từng quân

Mọi quân đều lấy hướng đi từ mục 3.2. "Ô" đo bằng khoảng cách lưới (D-03).

| Quân | Ký hiệu | Cách đi | Tầm | Ăn quân |
|---|---|---|---|---|
| Tốt | P | 1 ô **tiến hoặc lùi** dọc trục hướng-tâm của ghế mình (2 hướng cạnh N/S theo khung ghế). Ô đích phải trống | 1 | Chỉ ăn **chéo**: 4 ô kề theo hướng NE, NW, SE, SW **của khung ghế**. **Không ăn thẳng** |
| Mã | N | Nhảy tới 1 trong 12 ô ở mục 3.2, bỏ qua quân chắn | cố định | Có, ở ô đến |
| Tượng | B | Trượt theo 6 hướng đỉnh V | ≤ 9 ô (≤ 4 bước nhảy) | Có, ở ô đến |
| Xe | R | Trượt theo 6 hướng cạnh E | ≤ 9 ô | Có |
| Hậu | Q | Trượt theo 6 hướng cạnh + 6 hướng đỉnh | ≤ 9 ô | Có |
| Vua | K | 1 bước theo 1 trong 12 hướng (6 cạnh + 6 đỉnh) | 1 bước | Có |
| Hề | J | Trượt 12 hướng, đi vào ô **trống** | ≤ 3 ô | **Không bao giờ** |

- **R-20** Quân trượt bị chặn bởi bất kỳ ô nào đang có quân (kể cả ô có tù binh). Gặp quân địch hoạt động thì được ăn rồi dừng; gặp quân mình thì dừng trước đó. Với bước nhảy đỉnh, hai ô trung gian (trên/dưới) **không** ảnh hưởng.
- **R-21** Đích đến phải còn tồn tại trên bàn cờ. Quân trượt dừng ở biên hiện tại.
- **R-22** Không có nước đi đầu 2 ô cho Tốt (`pawnDoubleStep = false`, có thể bật).

### 4.4 Ăn quân và tù binh

- **R-30** Khi quân X của A ăn quân Y (không phải Vua) của B: X đứng vào ô đó. Y **không bị loại ngay** mà trở thành **tù binh của A** và nằm chung ô với X (đây là trường hợp duy nhất 2 quân chung 1 ô; một ô có thể có 1 quân hoạt động + nhiều tù binh). X được **+1 kill**.
- **R-31** Tù binh bị đóng băng: không đi, không ăn, không tạo đe dọa, không bị nhắm riêng (mọi đòn đánh vào ô đó đánh vào quân hoạt động X). Tù binh vẫn tính là quân của chủ cũ, nên chủ chưa bị coi là mất quân cho tới khi nó bị loại.
- **R-32** Ở **lượt kế tiếp của A** (hiệp sau), A chọn **một** trong hai: (a) đi một quân thường bất kỳ; (b) **trưng dụng** một tù binh của mình và đi nó 1 nước theo luật loại quân của nó (được phép ăn). Quân bị tù binh ăn thì **bị loại ngay** (không tạo chuỗi tù binh), tính +1 vào điểm kill của A nhưng không tính vào phong cấp. Ăn Vua bằng tù binh vẫn thắng.
- **R-33** Khi **lượt đó của A kết thúc**, mọi tù binh của A bị loại khỏi bàn cờ, dù A có dùng chúng hay không, dù chúng đang đứng ở đâu (kể cả A hết giờ).
- **R-34** Nếu quân giữ tù binh (gọi là X) bị ăn **trước** lượt đó bởi người C (C có thể là chủ của tù binh hoặc người thứ ba): X trở thành tù binh của C; mọi tù binh khác trên ô đó cũng chuyển sang C, **trừ** những tù binh thuộc chính C thì được **giải cứu**: trở lại bình thường và đặt vào ô trống gần nhất (R-36). Hạn mới của các tù binh chuyển giao là hết lượt kế tiếp của C.
- **R-35** Nếu người giữ tù binh bị loại (mất Vua) trước hạn thì tù binh được giải phóng (đặt vào ô trống gần nhất). Nếu ô đó bị thu hẹp thì tù binh mất cùng ô.
- **R-36** "Ô trống gần nhất": tìm theo khoảng cách lưới tăng dần từ ô gốc, hòa thì chọn ô có `q` nhỏ hơn, rồi `r` nhỏ hơn; ô phải còn trên bàn cờ.
- **R-37** Vua không bao giờ trở thành tù binh (xem R-60). Tù binh là Hề thì không hồi sinh Vua được.

### 4.5 Kill và phong cấp

- **R-40** Mỗi quân có bộ đếm `kills`, tăng 1 mỗi lần **chính nó** ăn một quân địch (kể cả Vua và Hề). Nước ăn của một tù binh được trưng dụng (R-32) chỉ tính vào tổng kill của người chơi để xếp hạng, không tăng `kills` của quân nào.
- **R-41** Chỉ quân có nguồn gốc Tốt (`origin = P`) được phong cấp theo `kills` tích lũy: **6 → Mã, 10 → Tượng, 15 → Xe, 20 → Hậu**. `kills` giữ nguyên qua các lần phong. Phong xảy ra **ngay sau nước ăn** đó, tại chỗ, cùng lượt. Hậu là bậc cuối.
- **R-42** Quân đã phong tuân theo luật đi và tầm đi của loại mới (ví dụ Xe phong vẫn ≤ 9 ô).

### 4.6 Quân Hề

- **R-50** Hề không ăn được quân địch. Hề đi trong bán kính ≤ 3 ô (mục 4.3).
- **R-51** Khi Vua của người chơi bị ăn (bởi bất kỳ nước ăn nào, kể cả bằng tù binh), nếu Hề của họ **còn sống, không phải tù binh, và `dist(Vua, Hề) ≤ 5`**: Vua **hồi sinh ngay tại ô Hề đang đứng**, Hề bị loại, người đó **không** mất quân nào khác. Quân vừa ăn Vua vẫn được tính kill và ở lại ô cũ.
- **R-52** Hề chỉ cứu được **một lần** (vì Hề mất đi sau đó). Không cứu khi Vua chết vì thu hẹp (D-09).

### 4.7 Quân Vua và loại người chơi

- **R-60** Vua bị ăn mà không được Hề cứu: **toàn bộ quân của người đó bị loại ngay lập tức** (kể cả tù binh của họ đang bị người khác giữ). Tù binh của người khác đang nằm trong ô do quân của người bị loại giữ thì được giải phóng theo R-35. Người chơi bị đánh dấu "bị loại", được xem tiếp (X-07). Người ăn được +1 kill.
- **R-61** Người chơi đầu hàng (X-05) bị loại theo cách giống R-60.

### 4.8 Thu hẹp bàn cờ

- **R-70** Theo lịch ở mục 3.5, ở **đầu hiệp N** (trước lượt của người mở hiệp), vòng ngoài cùng hiện tại biến mất. Mọi quân trên các ô đó (kể cả tù binh) **bị loại**, **không** tính kill cho ai. Nếu đó là Vua thì người đó bị loại (không Hề cứu).
- **R-71** Cảnh báo: từ **3 hiệp trước**, vòng sắp biến mất nhấp nháy vàng; **1 hiệp trước** chuyển đỏ; HUD hiển thị "còn N hiệp". Hiển thị trên cả bản đồ nhỏ. (X-01)
- **R-72** Nếu thu hẹp làm **tất cả** người còn lại bị loại cùng lúc thì ván hòa; xếp hạng theo điểm (R-82).

### 4.9 Kết thúc trận và xếp hạng

- **R-80** Chỉ còn một người còn Vua thì người đó thắng ngay.
- **R-81** *(đề xuất, D-07)* Sau hiệp 360, tiếp tục thu hẹp mỗi 10 hiệp (370 … 430, tới bán kính 3). **Hiệp 450**: kết thúc cứng, xếp hạng theo R-82.
- **R-82** Xếp hạng: người còn sống xếp trên người bị loại. Giữa những người còn sống: điểm cao hơn xếp trên, với `điểm = tổng giá trị quân còn lại + tổng kill` và giá trị quân P=1, N=3, B=3, R=5, Q=9, J=2, K=0. Giữa người bị loại: bị loại **muộn hơn** xếp cao hơn; bị loại cùng lúc thì so điểm tại thời điểm đó.

### 4.10 Thứ tự xử lý một lượt (bắt buộc đúng thứ tự)

1. Kiểm tra nước đi hợp lệ (đúng người, đúng luật, còn trong thời gian).
2. Di chuyển; nếu có ăn: áp dụng R-30 / R-34 (tù binh) hoặc R-51 / R-60 (nếu là Vua).
3. Cập nhật `kills`; nếu đạt ngưỡng thì phong cấp (R-41).
4. **Cuối lượt**: loại các tù binh của người vừa đi đã tới hạn (R-33); các tù binh tạo ra ở lượt này chuyển sang trạng thái "đợi lượt kế".
5. Kiểm tra có ai bị loại / có người thắng (R-80). Nếu ván kết thúc thì dừng.
6. Chuyển lượt sang người còn sống kế tiếp. Nếu quay về người mở hiệp thì `round += 1`.
7. Nếu hiệp mới nằm trong lịch: **thu hẹp** (R-70), rồi làm lại bước 5.
8. Bắt đầu đồng hồ 60 giây cho người kế tiếp.

**Các ca biên cần test riêng:**

| Ca | Kết quả mong đợi |
|---|---|
| Tốt ăn Hậu ở hiệp 1, hiệp 2 dùng Hậu ăn Vua | Ăn Vua thành công, người đó bị loại (R-32, R-60) |
| Vua bị ăn khi Hề cách 5 ô / cách 6 ô | Hồi sinh / bị loại |
| Tốt ăn quân thứ 6 là Mã địch, đồng thời quân đó là tù binh | Phong thành Mã sau nước ăn; quân bị ăn thành tù binh |
| Chủ tù binh ăn lại người giữ | Tù binh của người đó về ô trống gần nhất; người giữ thành tù binh của họ (R-34) |
| Người thứ ba ăn người giữ tù binh | Người giữ và các tù binh cũ đều thuộc người thứ ba (R-34) |
| Người giữ mang tù binh của hai chủ khác nhau bị một trong hai chủ ăn | Tù binh của chủ đó được giải cứu; tù binh của chủ kia và người giữ chuyển sang chủ đó (R-34) |
| Người giữ tù binh bị loại giữa hiệp | Tù binh được giải phóng (R-35) |
| Vòng biến mất có tù binh + người giữ | Tất cả biến mất, không ai được kill |
| Người mở hiệp bị loại | Người còn sống kế tiếp thành người mở hiệp, `round` không tăng sai |
| Tất cả bị loại cùng lúc do thu hẹp | Hòa, xếp hạng theo điểm (R-72) |
| Hết giờ ở lượt có tù binh tới hạn | Tù binh vẫn bị loại cuối lượt (R-33) |

---

## 5. Cơ chế bổ sung (đề xuất thêm để tăng tính logic)

Mặc định **bật** trừ khi ghi khác. Mỗi cơ chế có cờ cấu hình.

| Mã | Cơ chế | Vì sao |
|---|---|---|
| X-01 | **Báo trước thu hẹp**: nhấp nháy 3 hiệp trước, đỏ 1 hiệp trước, đếm ngược trên HUD và bản đồ nhỏ | Vua không bị chết oan vì không biết |
| X-02 | **Giai đoạn cuối** sau hiệp 360 (R-81) | Trận luôn có hồi kết |
| X-03 | **Hiệp 450 kết thúc cứng** + xếp hạng điểm (R-82) | Chặn trận kéo dài vô hạn |
| X-04 | **AFK / mất kết nối → bot tiếp quản**: mất kết nối được giữ ghế 90 giây để vào lại; 3 lượt hết giờ liên tiếp thì bot lái ghế; người chơi bấm vào quân bất kỳ để lấy lại quyền | Trận không bị treo vì một người |
| X-05 | **Đầu hàng** (có hộp xác nhận): bị loại theo R-61 | Người thua rõ ràng không phải ngồi chờ |
| X-06 | **Cảnh báo đe dọa** (tùy chọn, mặc định bật ở tân thủ và chơi thường): tô đỏ quân/ô đang bị đe dọa, cảnh báo "Vua đang bị ăn được". Tắt được để chơi khó hơn | Bàn quá lớn, khó theo dõi bằng mắt |
| X-07 | **Khán giả**: người bị loại xem tiếp bằng camera tự do và chat kênh riêng "Người đã bị loại" | Giữ người chơi ở lại xem kết quả |
| X-08 | **Giải cứu tù binh** (đã nằm trong R-34) | Phản đòn có ý nghĩa |
| X-09 | **Chế độ / preset**: *Cổ điển* (đúng đặc tả: 60s, lịch gốc), *Tiêu chuẩn* (45s, lịch nhân 0,6), *Nhanh* (30s, lịch nhân 0,35). Số hệ số là điểm khởi đầu, chỉnh khi thử nghiệm | Xử lý thời lượng trận |
| X-10 | **Lưu / tiếp tục ván solo** (bắt buộc), tự lưu mỗi lượt | Ván solo có thể dài hàng giờ |
| X-11 | **Ghi lại ván (replay)**: chỉ cần lưu seed + danh sách nước đi vì engine tất định | Xem lại, gỡ lỗi, làm trailer |
| X-12 | **Thành tích + bảng xếp hạng Steam** (mục 13) | Giữ chân người chơi |
| X-13 | **Xếp hạng kỹ năng (Elo cho trận nhiều người)** — sau khi ra mắt | Ghép trận công bằng |
| X-14 | **Xác nhận nước đi** (tùy chọn): chọn quân → ô sáng → bấm ô đích → bấm lại để xác nhận; có nút hủy trước khi xác nhận | Tránh bấm nhầm trên bàn 1801 ô |

---

## 6. Kiến trúc kỹ thuật

### 6.1 Nguyên tắc bắt buộc

1. **Engine luật thuần và tất định** (`packages/rules`): không dùng DOM, mạng, đồng hồ hệ thống hay `Math.random`. Đầu vào: trạng thái + hành động + RNG có seed; đầu ra: trạng thái mới + danh sách sự kiện. Nhờ vậy cùng một code chạy ở server, client (để tô ô hợp lệ), bot và tutorial, và replay chỉ cần lưu seed + nước đi.
2. **Server có thẩm quyền**: client chỉ gửi *ý định* (chọn quân, ô đích). Server kiểm tra lại bằng chính engine rồi phát kết quả. Client không bao giờ tự quyết luật.
3. **Một `GameSession`, hai cách chạy**: trên server (online) hoặc trong Web Worker cục bộ (solo, tutorial) qua lớp trừu tượng `Transport` (`WebSocketTransport` / `LocalTransport`). UI không biết mình đang chơi online hay offline.
4. **Mọi con số luật nằm trong `rules.config.json`** (Phụ lục C), không rải trong code.
5. **Tách hiển thị khỏi trạng thái**: engine phát *sự kiện* (`MOVE`, `CAPTURE`, …); lớp hoạt ảnh 3D tiêu thụ sự kiện theo hàng đợi. Trạng thái logic luôn cập nhật ngay, hoạt ảnh chạy sau.

### 6.2 Công nghệ

| Lớp | Lựa chọn | Ghi chú |
|---|---|---|
| Ngôn ngữ | TypeScript (strict) | Một ngôn ngữ cho mọi tầng |
| Monorepo | pnpm workspaces | Các package ở 6.3 |
| Đồ họa 3D | Three.js + Vite | InstancedMesh cho 1801 ô; hậu kỳ nhẹ (bloom, SSAO tùy chọn) |
| UI | HTML/CSS/TypeScript phủ lên canvas (không dùng UI trong WebGL) | Dễ làm chat, nhập chữ, i18n, hỗ trợ IME tiếng Việt |
| Desktop | Electron | Đóng gói cho Steam |
| Steam | `steamworks.js` (hoặc thư viện tương đương) | Thành tích, cloud, lobby, vé xác thực |
| Mạng | WebSocket (`ws`) qua TLS, mã hóa msgpack, kiểm schema bằng Zod | Game theo lượt nên băng thông rất nhỏ |
| Voice | WebRTC (Opus), tín hiệu qua server, STUN + TURN (coturn) | Mục 8 |
| Server | Node.js, Docker | 1 tiến trình chứa nhiều phòng |
| Lưu trữ | SQLite giai đoạn đầu, PostgreSQL khi lên quy mô | Hồ sơ, thống kê, báo cáo vi phạm |
| Test | Vitest (đơn vị + thuộc tính với fast-check), Playwright (e2e và ảnh chụp cảnh 3D) | |
| CI | GitHub Actions: lint, type-check, test, build | |

**Rủi ro cần kiểm chứng ngay ở M0 (spike):** Steam Overlay hoạt động trong cửa sổ Electron, `steamworks.js` khởi tạo được trong Electron bản đóng gói, và lobby/mời bạn bè chạy được. Dùng AppID thử nghiệm 480 (Spacewar) trong lúc chưa có AppID riêng. Nếu spike thất bại, chuyển sang phương án Godot ở 6.4 trước khi viết nhiều code.

### 6.3 Cấu trúc repo

```
hexwar/
├─ CLAUDE.md                    # quy ước cho Claude Code (Phụ lục A)
├─ PLAN.md                      # file này
├─ tools/verify_board.py        # nguồn chân lý cho hình học bàn cờ
├─ packages/
│  ├─ rules/                    # ENGINE luật: hex.ts, board.ts, moves.ts, turn.ts, captives.ts,
│  │                            #   collapse.ts, dice.ts, score.ts, config.ts + test/
│  ├─ protocol/                 # kiểu message, schema Zod, rulesVersion
│  ├─ bot/                      # eval.ts, search.ts, personalities.ts, difficulty.ts
│  ├─ tutorial/                 # scenarios/*.json + runner + hint engine
│  ├─ server/                   # lobby, room, matchmaking, chat, voice-signaling, auth, storage
│  ├─ client/
│  │   ├─ scene/                # board renderer, camera rig, picking, highlights
│  │   ├─ pieces/               # mô hình procedural + registry glTF
│  │   ├─ fx/                   # hạt, hiệu ứng thu hẹp, xúc xắc 3D
│  │   ├─ ui/                   # HUD, lobby, chat, cài đặt, kết quả
│  │   ├─ net/                  # Transport, đồng bộ đồng hồ, voice
│  │   ├─ audio/  i18n/  state/
│  └─ desktop/                  # Electron main, steam.ts, đóng gói, SteamPipe scripts
├─ assets/                      # models/, textures/, audio/, i18n/vi.json, en.json
└─ .github/workflows/ci.yml
```

### 6.4 Phương án thay thế: Godot 4 + GodotSteam

Chọn nếu spike Electron thất bại hoặc bạn ưu tiên chất lượng đồ họa gốc. Engine luật viết bằng GDScript/C# dùng chung cho client và server headless. Đổi lại: kiểm thử tự động khó hơn, chỉnh cảnh 3D thường cần trình soạn thảo đồ họa mà Claude Code không thao tác được, và voice phải tự triển khai. Phần luật (mục 4), giao thức (mục 7) và lộ trình (mục 15) vẫn giữ nguyên.

### 6.5 Mô hình dữ liệu của engine (gợi ý)

```ts
type Seat = 0|1|2|3|4|5;
type PieceType = 'P'|'N'|'B'|'R'|'Q'|'K'|'J';
interface Cell { q: number; r: number }

interface Piece {
  id: string; owner: Seat; type: PieceType;
  origin: PieceType;              // 'P' nếu xuất thân là Tốt (được phong cấp)
  cell: Cell; kills: number;
  status: 'active' | 'captive';
  holder?: Seat;                  // người đang giữ tù binh
  armed?: boolean;                // true: tới lượt kế tiếp của holder thì có thể trưng dụng
}

interface GameState {
  rulesVersion: string; config: RulesConfig; seed: number;
  phase: 'dice' | 'playing' | 'over';
  round: number; order: Seat[]; opener: Seat; turnSeat: Seat;
  pieces: Piece[]; radius: number;            // bán kính bàn hiện tại
  eliminated: { seat: Seat; round: number; reason: 'king'|'collapse'|'resign' }[];
}
type Move = { pieceId: string; to: Cell; conscript?: boolean };
```

**Hàm công khai của `rules`:** `newGame(config, seats, seed)`, `rollDice(state, rng)`, `legalMoves(state, seat): Move[]`, `explainIllegal(state, move): IllegalReason` (mã lý do để UI hiện "vì sao không đi được"), `applyMove(state, move): { state, events }`, `timeoutTurn(state)`, `resign(state, seat)`, `scoreOf(state, seat)`, `hash(state)`.

**Sự kiện phát ra:** `DICE_ROLLED`, `TURN_STARTED`, `MOVED`, `CAPTURED`, `CAPTIVE_CREATED`, `CAPTIVE_CONSCRIPTED`, `CAPTIVE_RELEASED`, `CAPTIVE_EXPIRED`, `PROMOTED`, `KING_CAPTURED`, `JESTER_REVIVED`, `PLAYER_ELIMINATED`, `RING_WARNING`, `RING_COLLAPSED`, `ROUND_STARTED`, `TURN_SKIPPED`, `GAME_OVER`.

### 6.6 Hiệu năng hiển thị

- 1801 ô vẽ bằng **một InstancedMesh** (thuộc tính riêng từng ô: màu, độ cao, cường độ nhấp nháy). Quân cờ tối đa 108, vẽ instanced theo loại.
- **Chọn ô không dùng raycast từng ô**: bắn tia tới mặt phẳng bàn cờ rồi đổi tọa độ thế giới sang (q, r) bằng công thức nghịch đảo và làm tròn lục giác. Chi phí O(1).
- Hiệu ứng thu hẹp chạy trong vertex shader (ô rung, nứt, rơi) để không tạo/xóa đối tượng.
- Mục tiêu: 60 FPS ở 1080p trên GPU tầm GTX 1050 / iGPU đời gần đây ở mức "Thấp"; có 3 mức đồ họa (mục 12.5).

---

## 7. Mạng và online

### 7.1 Thành phần

```
Client (Electron) ── WSS ──► Cổng vào (Lobby/Matchmaker) ──► Game Server (Node, nhiều phòng)
        │                          │                                │
        └── WebRTC voice (mesh) ◄──┴── tín hiệu qua server ────────┘
Steam Web API ◄── xác thực vé phiên (Auth Session Ticket)
```

- **Danh tính** = SteamID. Client gửi vé xác thực Steam khi kết nối; server xác thực qua Steam Web API. Chế độ khách chỉ dành cho bản dev.
- **Phòng (Room)** đi qua các pha: `LOBBY → DICE → PLAYING → RESULT`. Mỗi phòng giữ một `GameSession` và log nước đi.
- **Bản luật**: handshake gửi `rulesVersion`; khác phiên bản thì bắt cập nhật.

### 7.2 Ghép trận và phòng

- **Ghép nhanh**: chọn preset (Cổ điển / Tiêu chuẩn / Nhanh), vào hàng chờ; sau khoảng 20 giây (chỉnh được) nếu chưa đủ 6 người thì **bot lấp chỗ trống**. Người mới vào khi còn bot ở phòng chờ sẽ thay bot.
- **Phòng riêng**: mã 6 ký tự + mời bạn bè Steam qua lobby. Chủ phòng chọn preset, số bot (tự đề xuất `6 − số người`), độ khó từng bot, hoặc để "tự lấp bot".
- **Solo**: 1 người + 5 bot chạy cục bộ (LocalTransport), không cần internet, có lưu/tiếp tục (X-10).
- **Lobby**: hiện 6 ghế, màu (mỗi người một màu, không trùng), nút Sẵn sàng, chat, nút mời. Chỉ bắt đầu khi tất cả người thật đã Sẵn sàng.

### 7.3 Giao thức (tóm tắt; đặc tả đầy đủ nằm ở `packages/protocol`)

| Hướng | Message | Nội dung chính |
|---|---|---|
| C→S | `hello` | vé Steam, `rulesVersion`, ngôn ngữ |
| C→S | `queue.join / queue.leave / room.create / room.join / room.leave / room.ready / room.addBot / room.removeBot / room.setConfig` | |
| C→S | `game.rollDice` | (tự động sau 15 giây) |
| C→S | `game.move` | `{ pieceId, to, conscript? }`, kèm `seq` |
| C→S | `game.resign` | |
| C→S | `chat.send` | `{ channel: 'all'\|'whisper'\|'dead', to?: seat, text? , phraseId? }` |
| C→S | `voice.signal` | SDP/ICE cho WebRTC, `{ to: seat, data }` |
| C→S | `report.player` | |
| S→C | `room.state` | ghế, người, bot, cấu hình |
| S→C | `game.start` | seed, cấu hình, ghế của mình |
| S→C | `game.events` | `{ seq, events[], turnSeat, deadline (giờ server) }` |
| S→C | `game.snapshot` | dùng khi vào lại (reconnect) |
| S→C | `game.rejected` | `{ seq, reason: IllegalReason }` |
| S→C | `chat.message`, `voice.signal`, `system.notice` | |

### 7.4 Đồng hồ và đồng bộ

- Server giữ **đồng hồ duy nhất**. Mỗi `game.events` kèm `deadline` (giờ server). Client ước lượng độ lệch đồng hồ bằng ping/pong và hiển thị đếm ngược.
- Cho thêm ~1 giây dung sai độ trễ ở phía server. Hoạt ảnh sau nước đi (ăn quân, thu hẹp…) **không** trừ vào 60 giây suy nghĩ: server cộng sẵn một khoảng cố định theo loại sự kiện vào hạn của lượt kế tiếp (ví dụ +1 giây cho nước đi thường, +3 giây khi có thu hẹp; số chỉnh được), để mọi client thấy cùng một hạn và người chơi luôn có đủ 60 giây nhìn bàn cờ đã ổn định.
- Hết giờ: server gọi `timeoutTurn`, phát `TURN_SKIPPED`.

### 7.5 Mất kết nối và vào lại

- Mất kết nối: ghế được giữ **90 giây** (X-04). Trong lúc đó lượt của người này vẫn chạy đồng hồ và bị bỏ qua khi hết giờ.
- Vào lại: gửi token phiên, server trả `game.snapshot` + các sự kiện sau `seq` cuối mà client có. Nếu đã bị bot tiếp quản, người chơi lấy lại ghế bằng cách thao tác vào quân bất kỳ.
- Server chạy lại toàn bộ log để dựng lại trạng thái khi tiến trình khởi động lại (không mất phòng đang chơi nếu có lưu log).

### 7.6 Bảo mật và chống gian lận

- Không tin client: kiểm tra chủ lượt, luật, thời gian, `seq` tăng dần, kích thước message, tần suất (rate limit).
- RNG xúc xắc và thứ tự ghế chỉ do server tạo.
- Game thông tin công khai (không có quân ẩn) nên lộ thông tin không phải rủi ro; rủi ro chính là **thao túng lượt** và **bot hỗ trợ** (chấp nhận, ghi chú trong điều khoản).
- **Thông đồng** giữa người chơi qua voice/chat trong trận tự do là điều khó tránh; xem mục 16.
- Chat/báo cáo: mục 8. Không lưu tin nhắn riêng, trừ tối đa 50 tin gần nhất của người bị báo cáo, lưu 30 ngày phục vụ xử lý.

### 7.7 Hạ tầng

- Bắt đầu với 1 VPS + Docker, 1 vùng (chọn vùng gần nhóm người chơi mục tiêu), thêm vùng theo dữ liệu thực.
- Giám sát: số phòng, độ trễ, tỷ lệ mất kết nối, lỗi engine (mỗi lỗi kèm seed + log để tái hiện).
- TURN server (coturn) cho voice, cấp thông tin đăng nhập ngắn hạn cho từng phiên.

---

## 8. Chat và voice

### 8.1 Các kênh

| Kênh | Ai thấy | Ghi chú |
|---|---|---|
| **Toàn phòng** | Tất cả người chơi thật | Mặc định |
| **Nhắn riêng** | Chỉ người gửi và người nhận | Theo mô tả của bạn: bấm tên người muốn nhắn |
| **Hệ thống** | Tất cả | Sự kiện: ăn Vua, thu hẹp, hồi sinh… (tùy chọn ẩn) |
| **Người đã bị loại** | Chỉ người bị loại | Để khán giả không làm lộ chiến thuật |

### 8.2 Luồng nhắn riêng

1. Bấm **tên một người chơi** (ở bảng người chơi hoặc biển tên trên bàn cờ) → mở khung "Nhắn riêng cho *Tên*".
2. Khung có hai tab: **Câu có sẵn** (bấm là gửi) và **Gõ chữ** (nhập tự do rồi Enter).
3. Tin hiện ở tab hội thoại riêng với người đó, có dấu hiệu chưa đọc. Người nhận bấm trả lời được ngay.
4. Không nhắn riêng cho bot được (bot không đọc chữ tự do). Bot chỉ thỉnh thoảng gửi câu có sẵn ở kênh toàn phòng (mục 9.4).

### 8.3 Câu có sẵn (chat nhanh)

Gửi bằng **mã câu** (`phraseId`), mỗi client tự dịch sang ngôn ngữ của mình, nên hai người khác ngôn ngữ vẫn hiểu nhau và không cần lọc từ. Khởi đầu khoảng 24 câu, nhóm theo mục đích:

| Nhóm | Ví dụ |
|---|---|
| Chào hỏi | "Chúc may mắn!", "Chơi hay đấy!", "Xin lỗi nhé" |
| Ngoại giao | "Đừng đánh tôi, tôi sẽ đánh người kia", "Cùng đánh kẻ dẫn đầu nhé?", "Tôi không có ý tấn công bạn" |
| Cảnh báo | "Vua bạn đang bị đe dọa!", "Vòng ngoài sắp biến mất!", "Cẩn thận tù binh!" |
| Cảm xúc | "Haha", "Tiếc quá!", "Thật bất ngờ" |

Phím tắt mở vòng chọn câu nhanh (mặc định `T`).

### 8.4 Quy tắc văn bản tự do

- Tối đa 200 ký tự, tối đa 5 tin/10 giây, hỗ trợ tiếng Việt có dấu (kiểm tra nhập bằng IME).
- Lọc từ cấm bằng danh sách nội bộ theo ngôn ngữ; nếu có API lọc văn bản của Steamworks (`ISteamUtils::FilterText`) thì dùng thêm, kiểm tra tài liệu Steamworks khi triển khai.
- Mỗi người chơi có: **tắt tiếng** (ẩn tin từ người đó), **chặn**, **báo cáo** (chọn lý do, gửi kèm tin gần nhất). Tùy chọn cá nhân: tắt hoàn toàn chat chữ, ẩn từ tục.
- Người bị báo cáo nhiều lần trong ngày bị hạn chế chat tạm thời (ngưỡng chỉnh được).

### 8.5 Voice toàn phòng

Đúng theo mô tả: **nếu bật thì cả 6 người (những ai bật nghe) cùng nghe**; không có voice riêng.

- **Mặc định TẮT** cả nói lẫn nghe. Lần đầu bật: hộp thoại giải thích và xin quyền micro của hệ điều hành.
- Hai công tắc độc lập: **Mic** (Push-to-talk mặc định, phím `V`; hoặc mở mic có phát hiện giọng nói) và **Nghe** (loa). Ai tắt Nghe thì không nghe ai; ai bật Nghe mà tắt Mic thì chỉ nghe.
- Bot không có voice. Người bị loại vẫn nói/nghe được nếu đã bật (trong phòng mình).
- **Kỹ thuật**: WebRTC mesh (mỗi người tối đa 5 kết nối, chấp nhận được cho 6 người), codec Opus, bật sẵn khử tiếng vọng / khử ồn / tự chỉnh âm lượng của `getUserMedia`. Chỉ tạo kết nối khi người đó bật voice. Tín hiệu SDP/ICE đi qua server (`voice.signal`), có STUN và TURN dự phòng. Nếu mesh không ổn thì nâng lên SFU (ví dụ LiveKit) mà không đổi UI.
- **Riêng tư**: mesh làm lộ địa chỉ IP giữa những người chơi. Cung cấp tùy chọn **"Chỉ đi qua máy chủ trung gian (TURN)"** để ẩn IP, và ghi rõ trong cài đặt. Không ghi âm, không lưu.
- UI: biểu tượng "đang nói" trên biển tên và bảng người chơi, thanh trượt âm lượng và nút tắt tiếng từng người, chọn micro/loa, nút thử mic. Người bị chặn không nghe nhau.

---

## 9. Bot (AI)

### 9.1 Yêu cầu

- Lấp đủ 6 ghế: 1 người thật → 5 bot, 2 người → 4 bot … 6 người → 0 bot.
- 3 độ khó (Dễ / Thường / Khó), chọn cho từng bot, cùng dùng engine ở mục 4 (không bot nào được "gian lận" thông tin hay luật).
- Suy nghĩ có độ trễ giả lập 1–6 giây (ngẫu nhiên theo seed) để trận không bị "tức thì"; ngân sách tính toán thật tối đa 1,5 giây, chạy trong Worker để không giật UI.
- Tất định theo seed (để replay tái hiện được).

### 9.2 Đánh giá thế cờ (điểm số)

| Thành phần | Ý nghĩa |
|---|---|
| Vật chất | Giá trị quân của mình trừ giá trị quân đối thủ mạnh nhất kề cận (P1, N3, B3, R5, Q9, J2) |
| An toàn Vua | Số quân địch có thể ăn Vua ở nước tới; số ô kề Vua bị đe dọa; ưu tiên còn Hề trong bán kính 5 của Vua |
| **Thu hẹp** | Phạt rất nặng cho quân (nhất là Vua) đứng trên vòng sắp biến mất trong 3 hiệp tới; thưởng cho việc dịch vào trong |
| Tiến độ phong cấp | Thưởng cho Tốt gần ngưỡng 6/10/15/20 kill |
| Tù binh | Thưởng khi trưng dụng tù binh để ăn Vua hoặc quân giá trị; đừng bỏ phí lượt trưng dụng nếu có nước tốt |
| Vị trí | Thưởng kiểm soát vùng giữa, phạt bị bao vây |
| Mục tiêu | Chọn đối thủ mục tiêu (gần nhất, yếu nhất, hoặc kẻ vừa tấn công mình — có "trí nhớ thù hận" giảm dần) |

### 9.3 Độ khó

| Độ khó | Cách chọn nước | Chỉ tiêu kiểm thử |
|---|---|---|
| Dễ | Chấm điểm 1 nước + nhiễu ngẫu nhiên; ăn quân miễn phí với xác suất ~60%; tránh để Vua bị ăn ngay; phản ứng thu hẹp đủ để hiếm khi chết oan | Trong trận 1 vs 5 Dễ, người tập chơi thắng nhiều hơn bình thường |
| Thường | Tham lam 1 nước theo bảng điểm, kèm kiểm tra phản đòn tức thì của từng đối thủ (chỉ xét nước ăn) | 1 Thường vs 5 Dễ: thắng ≥ 35% (mức ngẫu nhiên là 16,7%) |
| Khó | Chọn top-K (K≈8) nước theo điểm, rồi mô phỏng phản ứng tốt nhất của 5 đối thủ theo thứ tự lượt (mỗi người 1 nước, chỉ xét nước ăn/đe dọa Vua) hoặc MCTS với rollout có định hướng trong 1–1,5 giây | 1 Khó vs 5 Thường: thắng ≥ 30% |

Chỉ tiêu là **mục tiêu khởi điểm**; điều chỉnh sau khi chạy mô phỏng thực. Bắt đầu bằng Dễ + Thường (M4), thêm Khó ở M9.

### 9.4 Tính cách và giao tiếp

- 3 tính cách (hệ số trọng số khác nhau): **Hung hăng** (tấn công sớm), **Thủ thế** (giữ Vua và Hề, thu hẹp phòng thủ), **Cơ hội** (chờ hai người khác đánh nhau rồi nhặt quân).
- Bot thỉnh thoảng (xác suất thấp) gửi một câu chat có sẵn phù hợp ("Chơi hay đấy!", "Xin lỗi nhé" sau khi ăn quân người chơi…). Không dùng chữ tự do, không voice.
- Tên và ảnh đại diện bot lấy từ danh sách riêng, ghi rõ là bot (có nhãn "BOT").

### 9.5 Kiểm thử bot

- Chạy 1000 ván không giao diện: không lỗi engine, mọi ván kết thúc trước hiệp giới hạn, thời gian nghĩ p95 nằm trong ngân sách.
- Cả 6 ghế cùng độ khó: tỷ lệ thắng mỗi ghế nằm trong khoảng 16,7% ± 3% (kiểm tra công bằng ghế; 1000 ván cho sai số chuẩn ≈ 1,2%).

---

## 10. Màn tân thủ (tutorial)

### 10.1 Nguyên tắc

- Học **từng cơ chế một**, chơi thật trên bàn cờ thu nhỏ, mỗi bài dưới 3 phút, ít chữ nhiều thao tác.
- Chạy bằng **engine thật** (không mô phỏng giả), qua `LocalTransport`, không cần mạng.
- Lần đầu vào game tự mở bài 1. Có nút **Bỏ qua**, **Làm lại**, và tiến độ lưu cục bộ + Steam Cloud.
- Khuyến nghị: mở khóa ghép trận online sau khi hoàn thành bài T1–T11, kèm nút "Tôi đã biết chơi" để bỏ qua.
- Gợi ý theo thời gian nếu người chơi lúng túng: sau 15 giây làm nổi bật quân/ô đúng; sau 30 giây hiện đường đi mẫu (bóng mờ).
- **Giải thích nước đi sai**: khi bấm ô không hợp lệ, hiện lý do bằng lời (dùng `explainIllegal`), ví dụ "Tốt không ăn thẳng được", "Xe chỉ đi tối đa 9 ô". Tính năng này dùng chung cho cả trận thật.

### 10.2 Danh sách bài

| Bài | Nội dung | Kịch bản và điều kiện hoàn thành | Luật liên quan |
|---|---|---|---|
| T1 | Làm quen bàn cờ | Xoay/zoom/kéo camera, chọn quân, ô sáng, đi 1 nước; xem bản đồ nhỏ, ghế của mình, hướng tiến về tâm | 3.3 |
| T2 | Quân Tốt | Đi tiến/lùi 1 ô; ăn chéo 3 quân; thử ăn thẳng để thấy bị từ chối | R-22, 4.3 |
| T3 | Quân Xe | 6 hướng cạnh, tầm tối đa 9 ô; bị chặn bởi quân khác | R-20 |
| T4 | Quân Tượng | Đường **ngang zíc-zắc** và chéo dốc; ô trên/dưới không cản; tầm 9 ô | D-02, R-20 |
| T5 | Quân Mã | Nhảy qua quân chắn; 12 ô đích | 3.2 |
| T6 | Quân Hậu | Hợp Xe + Tượng | 4.3 |
| T7 | Vua và cách thắng | Không có chiếu; ăn Vua địch = loại cả đội; bảo vệ Vua của mình | R-14, R-60 |
| T8 | Quân Hề | Không ăn quân; đi ≤ 3 ô; cho Vua bị ăn khi Hề trong 5 ô để thấy hồi sinh | R-50…52 |
| T9 | Tù binh | Tốt ăn Hậu → hiệp sau dùng Hậu ăn Vua; thử giải cứu tù binh | R-30…36 |
| T10 | Kill và phong cấp | Tốt đã có 5 kill, ăn thêm để thành Mã; xem thanh tiến độ 6/10/15/20 | R-40…42 |
| T11 | Thu hẹp và thời gian | Vòng nhấp nháy → đỏ → biến mất; đưa quân vào trong; đồng hồ 60 giây | R-12, R-70, R-71 |
| T12 | Xúc xắc, lượt, chat, voice | Tung 3 xúc xắc; thứ tự kim đồng hồ; gửi câu có sẵn; nhắn riêng cho 1 bot mẫu; bật thử voice | 4.1, mục 8 |
| T13 | Trận tập | 1 người + 5 bot Dễ, có gợi ý bật sẵn; chơi tới khi thắng hoặc tới hiệp 50 | tổng hợp |

### 10.3 Dữ liệu bài học

Mỗi bài là một file `scenarios/Tn.json`: bàn cờ (bán kính nhỏ), quân đặt sẵn, danh sách nước đi được phép, kịch bản phản ứng của quân địch, mục tiêu (điều kiện thắng bài), lời thoại theo khóa i18n, thời điểm gợi ý. Runner kiểm tra điều kiện, phát sự kiện tiến độ cho UI. Có test tự động chạy "người chơi ảo" giải từng bài để đảm bảo bài nào cũng hoàn thành được.

---

## 11. Giao diện (UI/UX)

### 11.1 Sơ đồ màn hình

```
Khởi động → (đăng nhập Steam tự động) → Menu chính
   ├─ Chơi solo (1 người + bot) ─────────┐
   ├─ Chơi online: Ghép nhanh / Phòng riêng / Vào bằng mã ─┤→ Phòng chờ (Lobby) → Tải → Tung xúc xắc → TRẬN → Kết quả
   ├─ Tân thủ (13 bài)                    │                                              └→ Chơi lại / Xem replay / Về menu
   ├─ Hồ sơ & thống kê · Thành tích · Cài đặt · Thoát
```

### 11.2 HUD trong trận

| Vị trí | Nội dung |
|---|---|
| Trên giữa | **Hiệp N**, chế độ; đếm ngược thu hẹp ("Vòng ngoài biến mất sau X hiệp") |
| Dải trên | Thứ tự lượt: 6 ảnh đại diện, người đang đi sáng lên, **vòng đếm 60 giây**, nhãn BOT / AFK / đã bị loại |
| Trái | **Bảng người chơi**: tên (**bấm để nhắn riêng**), màu, số quân, tổng kill, điểm, biểu tượng đang nói, nút tắt tiếng |
| Phải | **Chat**: tab Toàn phòng / Riêng / Hệ thống; ô nhập; nút câu nhanh |
| Dưới trái | **Bản đồ nhỏ** toàn bàn (quân là chấm màu, vòng sắp biến mất nhấp nháy) |
| Dưới giữa | **Thông tin quân đang chọn**: loại, tầm đi, `kills` / ngưỡng phong cấp kế tiếp (thanh 6/10/15/20), trạng thái tù binh; nút Xác nhận / Hủy (X-14) |
| Dưới phải | Voice (mic/loa), Đầu hàng, Cài đặt |
| Giữa màn hình | Thông báo ngắn: "Bạn vừa ăn Hậu! Lượt sau có thể dùng nó", "Hề đã cứu Vua của X" |

**Màu tô ô:** xanh = đi được, đỏ = ăn được, vàng/đỏ mờ = đang bị đe dọa (X-06), nhấp nháy vàng → đỏ = sắp biến mất (X-01).

### 11.3 Điều khiển

- **Chuột**: bấm chọn quân, bấm ô đích; giữ chuột phải kéo để xoay camera; cuộn để zoom; giữ chuột giữa (hoặc `Shift` + kéo) để dịch chuyển.
- **Bàn phím**: `WASD` dịch camera, `Q`/`E` xoay 60°, `F` về quân/lượt hiện tại, `Tab` quân kế, `Space` xác nhận, `Esc` hủy, `T` chat nhanh, `V` nói (push-to-talk), `M` bật/tắt bản đồ nhỏ. Tất cả gán lại được.
- **Tay cầm / Steam Deck**: thiết kế nút và chữ đủ lớn ngay từ đầu, hỗ trợ Steam Input ở giai đoạn sau.

### 11.4 Camera và cách đọc một bàn cờ lớn

Bàn có 1801 ô nên phải có công cụ định hướng:
- Camera quỹ đạo, tự xoay `s × 60°` theo ghế; nút chuyển nhanh **nhìn từ trên xuống**; giới hạn góc và độ zoom; chuyển động mượt.
- Nút **nhảy tới**: Vua của tôi / quân đang chọn / nước đi cuối cùng / vòng sắp biến mất.
- Số vòng khắc ở mép bàn; **bản đồ nhỏ** bấm để dịch camera.
- Tùy chọn tự động theo dõi nước đi của đối thủ (camera lướt tới nơi xảy ra sự kiện rồi trả về).

### 11.5 Cài đặt

| Nhóm | Nội dung |
|---|---|
| Đồ họa | Mức Thấp / Vừa / Cao / Tùy chỉnh (độ phân giải, chế độ cửa sổ, vsync, giới hạn FPS, bóng, SSAO, bloom, hạt) |
| Âm thanh | Tổng, nhạc, hiệu ứng, voice |
| Điều khiển | Gán phím, độ nhạy camera |
| Ngôn ngữ | Tiếng Việt, English |
| Hỗ trợ truy cập | Bảng màu thân thiện người mù màu (kèm hình biểu tượng trên đế quân), cỡ chữ, giảm chuyển động/rung, độ tương phản |
| Chat | Lọc từ tục, tắt chat chữ, danh sách chặn |
| Voice | Micro/loa, push-to-talk, "chỉ qua TURN" (ẩn IP) |

### 11.6 Màn kết quả

Bảng xếp hạng 1–6 (điểm, kill, quân còn lại, hiệp bị loại), khoảnh khắc nổi bật (ăn Vua, hồi sinh…), thành tích mới mở khóa, nút **Chơi lại cùng phòng**, **Xem replay**, **Về menu**.

### 11.7 Đa ngôn ngữ

Toàn bộ chữ nằm trong `i18n/vi.json`, `en.json` bằng khóa (không viết chữ cứng trong code). Chọn font hỗ trợ đầy đủ dấu tiếng Việt và có giấy phép mở (ví dụ Noto Sans, Be Vietnam Pro). Câu chat nhanh dịch theo `phraseId` (mục 8.3).

---

## 12. Đồ họa 3D, mô hình, âm thanh

### 12.1 Định hướng nghệ thuật

Phong cách **cách điệu (stylized), dễ đọc** hơn là chân thực: người chơi phải nhìn ra loại quân, chủ quân và ô đi được ngay từ xa. Ý tưởng chủ đạo: bàn cờ là **một hòn đảo lục giác lơ lửng** trên biển mây lúc hoàng hôn. Khi vòng ngoài biến mất, các ô nứt, rung rồi rơi xuống biển mây, nên việc thu hẹp trông như một sự kiện thật chứ không phải một con số.

### 12.2 Bàn cờ

- Ô lục giác, có độ dày nhẹ; **3 tông màu** theo `(q − r) mod 3` để phân biệt ô kề nhau và giúp đọc đường đi của Tượng (cùng màu).
- Ô cạnh mép: viền và số vòng; ô sắp biến mất: phát sáng vàng rồi đỏ.
- Hiệu ứng thu hẹp: ô rung → nứt → rơi kèm bụi, ánh sáng, tiếng rung; các quân còn trên ô rơi theo và biến mất.
- Ô tô sáng (đi được / ăn được / bị đe dọa) vẽ bằng lớp phủ instanced riêng, không đổi vật liệu ô gốc.

### 12.3 Quân cờ

- **Sáu màu người chơi** thân thiện với người mù màu (bảng Okabe–Ito): cam `#E69F00`, xanh da trời `#56B4E9`, xanh lục `#009E73`, vàng `#F0E442`, đỏ cam `#D55E00`, tím hồng `#CC79A7`. Kèm **6 biểu tượng hình học** khác nhau trên đế quân (tròn, tam giác, vuông, thoi, sao, lục giác) để không phụ thuộc màu.
- **Hình dáng đặc trưng** (giai đoạn đầu dựng bằng code với LatheGeometry/ExtrudeGeometry, sau đó thay bằng mô hình glTF nếu có họa sĩ): Tốt (thân tròn thấp, đầu bán cầu), Xe (tháp có răng cưa), Tượng (mũ nhọn có khe), Mã (đầu ngựa ép khối), Hậu (vương miện nhiều mũi), Vua (vương miện có thập tự/ngọc), Hề (mũ ba chóp có chuông).
- `PieceModelRegistry`: khóa theo loại quân, có `fallback` procedural, để thay mô hình mà không đụng logic.
- Trạng thái hiển thị: quân được chọn (viền sáng), **tù binh** (bị xích/đóng băng, ánh xanh lạnh, đứng chung ô nhưng thấp hơn quân giữ), quân đã phong cấp (hiệu ứng ánh sáng một lần, đổi mô hình), Vua nhấp nháy khi bị đe dọa (X-06).
- **Quy chuẩn tài nguyên**: tối đa ~5.000 tam giác/quân, glTF/GLB nén (Draco hoặc meshopt), texture KTX2, một atlas vật liệu chung để giữ số draw call thấp.

### 12.4 Hoạt ảnh và hiệu ứng

| Sự kiện | Hiệu ứng |
|---|---|
| Di chuyển | Quân trượt hoặc nhảy theo cung (Mã nhảy, Tượng lướt), độ dài theo khoảng cách nhưng không quá ~1,2 giây |
| Ăn quân | Va chạm, tia sáng; quân bị ăn chuyển sang trạng thái tù binh, còn nằm chung ô |
| Trưng dụng tù binh | Vòng sáng quanh tù binh khi tới lượt của chủ giam giữ |
| Hết hạn tù binh | Tan thành hạt sáng |
| Phong cấp | Ánh sáng từ dưới lên, đổi mô hình, thanh kill đầy |
| Hồi sinh Vua | Vệt sáng nối Hề và Vua, Hề tan biến, Vua xuất hiện tại chỗ Hề |
| Ăn Vua | Toàn bộ quân người đó vỡ tan theo đợt (0,6 giây), rung nhẹ camera |
| Thu hẹp | Như 12.2 |
| Xúc xắc | 3 xúc xắc 3D với vật lý đơn giản, kết quả do server quyết định, hoạt ảnh chỉ diễn lại kết quả |

Có tùy chọn **giảm chuyển động** và **bỏ qua hoạt ảnh** (tăng tốc gấp đôi) cho ván dài.

### 12.5 Mức đồ họa và hiệu năng

| Mức | Nội dung |
|---|---|
| Thấp | Không bóng động, không hậu kỳ, ít hạt, độ phân giải nội bộ 75% |
| Vừa | Bóng mềm cho quân, bloom nhẹ |
| Cao | Bóng đầy đủ, SSAO, bloom, hạt dày, phản xạ nhẹ cho ô |

Đo và ghi vào `docs/perf.md` ở mỗi milestone đồ họa: FPS trung bình/1% thấp, số draw call, bộ nhớ GPU. Mục tiêu 60 FPS ở mức Thấp trên máy yếu.

### 12.6 Âm thanh

- Nhạc nền theo pha (bình thường, căng thẳng khi có vòng sắp biến mất, kết thúc trận).
- Hiệu ứng: chọn quân, đi, ăn, tù binh, phong cấp, hồi sinh, đếm ngược 10 giây cuối, thu hẹp, tung xúc xắc, tin nhắn, kết thúc.
- Chỉ dùng âm thanh do bạn tạo hoặc có giấy phép rõ ràng (CC0 / mua bản quyền). Lập bảng nguồn gốc tài nguyên `docs/credits.md` từ đầu.

---

## 13. Phát hành trên Steam

### 13.1 Thủ tục và chi phí (đã tra tài liệu Steamworks)

| Việc | Chi tiết |
|---|---|
| Phí đăng ký | **100 USD cho mỗi ứng dụng** (Steam Direct). Không hoàn lại, nhưng được **trừ lại** ở kỳ thanh toán sau khi ứng dụng đạt ít nhất **1.000 USD doanh thu gộp đã điều chỉnh** |
| Hồ sơ | Danh tính, thuế, tài khoản ngân hàng. Chưa hoàn thành thì chưa phát hành được |
| Thời gian chờ | Các hướng dẫn thứ cấp nêu **30 ngày chờ** sau khi trả phí trước khi phát hành. Hãy xác nhận trên Steamworks và làm thủ tục **ngay từ đầu dự án** |
| Trang "Sắp ra mắt" | Ứng dụng mới phải có trang Coming Soon công khai **ít nhất 2 tuần** trước khi phát hành |
| Duyệt trang cửa hàng | Thường 3–5 ngày làm việc; Valve khuyên nộp **ít nhất 7 ngày** trước ngày muốn đăng |
| Duyệt build | Thường 3–5 ngày làm việc; nên nộp **2–3 tuần** trước ngày phát hành và dự trù có thể phải nộp lại một lần |
| Đổi ngày phát hành | Khi còn dưới 14 ngày, không tự đổi được, phải liên hệ Valve. Hãy đặt ngày sát thực tế |
| Bấm phát hành | Bạn tự bấm nút "Release App" sau khi mọi thứ được duyệt |

Kế hoạch thời gian gợi ý: trả phí và làm hồ sơ ngay ở **M0**; đăng trang Coming Soon khi có ảnh chụp và trailer đầu tiên (**M10**) để tích lũy wishlist; nộp build duyệt ở **M13**.

### 13.2 Tính năng Steamworks sẽ dùng

| Tính năng | Dùng để |
|---|---|
| Vé xác thực phiên (Auth Session Ticket) | Danh tính người chơi trên server (mục 7.1) |
| Lobby và mời bạn bè | Phòng riêng, nút "Mời" |
| Rich Presence | "Đang chơi Tiêu chuẩn · hiệp 42" |
| Thành tích, thống kê, bảng xếp hạng | X-12 |
| Steam Cloud | Tiến độ tân thủ, cài đặt, ván solo đang lưu |
| Steam Overlay | Bạn bè, trình duyệt; phải kiểm chứng ở spike M0 |
| Steam Playtest | Mời người thử trước khi phát hành |
| Steam Input | Hỗ trợ tay cầm (giai đoạn sau) |

### 13.3 Thành tích gợi ý (khoảng 14)

Học trò (xong tân thủ) · Ván đầu tiên · Vương miện (thắng 1 ván; 10 ván) · Cứu tinh (Hề cứu Vua) · Tù binh chiến tranh (ăn quân bằng tù binh) · Nước cờ cuối (thắng bằng cách ăn Vua qua tù binh) · Lên đời (Tốt thành Mã; Tốt thành Hậu) · Sống sót (còn sống đến hiệp 250; 360) · Người cuối cùng của hòn đảo (thắng khi bàn còn bán kính ≤ 5) · Hạ cả năm bot (1 vs 5 bot Khó) · Giải cứu (giải cứu một tù binh).

### 13.4 Trang cửa hàng

- Ảnh đại diện (capsule), ảnh nền, ảnh chụp màn hình, trailer, mô tả: **dùng kích thước và yêu cầu mới nhất trong tài liệu "Graphical Assets" của Steamworks** (không chép số ở đây vì có thể thay đổi).
- Gợi ý thẻ: Turn-Based Strategy, Board Game, Chess, Multiplayer, Online, Strategy (đối chiếu danh sách thẻ hiện có). Ngôn ngữ giao diện: Tiếng Việt, English.
- **Khảo sát nội dung / độ tuổi** và **khai báo nội dung AI**: đọc chính sách hiện hành trong Steamworks trước khi nộp. Nếu game dùng hình ảnh, âm thanh, giọng nói do AI tạo ra và người chơi thấy/nghe được, phải khai báo. Cần rà lại phần này vì bản cập nhật gần đây của Valve tập trung vào nội dung người chơi thấy, không tính công cụ hỗ trợ khi làm game.
- Giá bán và mô hình (mua một lần hay miễn phí): quyết định sau; nên tính chi phí máy chủ và TURN vào giá.
- Có **chính sách quyền riêng tư và điều khoản sử dụng** (game có chat, voice, danh tính Steam, máy chủ). Nên có bản Tiếng Việt và Tiếng Anh.
- Kiểm tra tên game và logo không trùng nhãn hiệu có sẵn.

### 13.5 Đóng gói và cập nhật

- `packages/desktop` build ra bản Windows (và Linux sau). Dùng **SteamPipe** (`steamcmd`) đẩy build lên các nhánh: `dev`, `beta` (Playtest), `default`.
- Tự động hóa bằng script `tools/release.sh` (build → kiểm tra → tải lên nhánh `dev`).
- `rulesVersion` ghi trong build; server từ chối phiên bản cũ để không lệch luật.

---

## 14. Kiểm thử và chất lượng

| Loại | Nội dung | Công cụ |
|---|---|---|
| Đơn vị (engine) | Mỗi luật `R-xx` ít nhất một test; **golden test** hình học (tọa độ, 1801 ô, 57 nước đi đầu ở cả 6 ghế); các ca biên ở 4.10 | Vitest |
| Thuộc tính | Bất biến sau mọi nước đi: không hai quân hoạt động cùng ô; tù binh luôn thuộc ô có quân giữ; số quân không tăng; **bất biến xoay**: xoay cả thế cờ 60° thì tập nước đi hợp lệ cũng xoay đúng như vậy | fast-check |
| Tất định | Cùng seed + chuỗi nước đi → cùng `hash(state)` ở mọi máy | Vitest |
| Bot / mô phỏng | 1000 ván không giao diện (mục 9.5) | script Node |
| Tích hợp mạng | 6 client giả kết nối 1 server, chơi trọn ván, có ngắt kết nối và vào lại | Vitest + ws |
| Tải | 200 phòng đồng thời, đo CPU/bộ nhớ/độ trễ | script |
| Giao diện | Chụp ảnh cảnh 3D và HUD ở vài trạng thái chuẩn, so sánh khác biệt | Playwright |
| Steam | Chạy với AppID 480 trước, sau đó AppID thật: đăng nhập, lobby, mời, thành tích, cloud | thủ công + checklist |
| Playtest | 3 vòng: nội bộ, bạn bè (Steam Playtest), công khai hạn chế; ghi lại nơi người chơi kẹt ở tutorial | biểu mẫu + log |

**CI bắt buộc xanh** trước khi gộp: lint, type-check, test, build. Mỗi lỗi engine ở production phải kèm `seed` + log nước đi để tái hiện.

---

## 15. Lộ trình theo milestone

Quy mô: **S** = vài ngày, **M** = 1–2 tuần, **L** = 3–5 tuần (một người + Claude Code; chỉ để tương đối, không phải cam kết).

| M | Tên | Nội dung | Nghiệm thu | Cỡ |
|--:|---|---|---|:-:|
| **M0** | Khởi tạo | Repo, pnpm workspace, CI, `CLAUDE.md`, chạy `verify_board.py` trong CI. **Spike Steam + Electron** (overlay, `steamworks.js`, lobby với AppID 480). Đăng ký Steamworks và trả phí | CI xanh; spike có kết luận bằng văn bản (đi tiếp hay chuyển Godot) | S |
| **M1** | Engine hình học và nước đi | `hex.ts`, bàn cờ 1801 ô, đội hình, xoay ghế, nước đi 7 loại quân (mục 4.3), `explainIllegal` | Golden test: 1801 ô, 108 quân, **57 nước đi đầu ở cả 6 ghế**; bất biến xoay | M |
| **M2** | Engine luật đặc biệt | Ăn quân + tù binh (R-30…37), kill/phong cấp, Hề, Vua, thu hẹp, xúc xắc, hiệp/lượt, xếp hạng, sự kiện; `rules.config.json` | Toàn bộ ca biên 4.10 có test; ván mô phỏng ngẫu nhiên chạy trọn không lỗi | L |
| **M3** | Bàn cờ 3D cơ bản | Renderer ô (instanced), camera xoay/zoom/pan, quân procedural, chọn ô bằng công thức nghịch đảo, tô ô đi được, hoạt ảnh di chuyển cơ bản, đọc sự kiện engine | Chơi được ván hotseat trên một máy; 60 FPS mức Thấp; ảnh chụp Playwright | L |
| **M4** | Solo với bot | `LocalTransport` + Worker, bot Dễ + Thường, HUD tối thiểu (lượt, hiệp, đồng hồ, danh sách người), xúc xắc, lưu/tiếp tục ván (X-10) | Chơi trọn ván 1 vs 5 bot từ đầu tới kết thúc, thoát và vào lại được | L |
| **M5** | Giao diện hoàn chỉnh | Menu, cài đặt, HUD đầy đủ (mục 11), bản đồ nhỏ, cảnh báo thu hẹp, cảnh báo đe dọa, giải thích nước sai, i18n vi/en, màn kết quả | Đi hết luồng menu → ván → kết quả không lỗi; kiểm tra chữ Việt có dấu | L |
| **M6** | Online | `packages/server`, giao thức, phòng, ghép nhanh + bot lấp chỗ, đồng hồ server, reconnect, AFK → bot, đầu hàng, xác thực Steam | Test tích hợp 6 client + ngắt/nối; thử thật 2 máy qua internet | L |
| **M7** | Chat và voice | Chat toàn phòng, nhắn riêng theo mục 8.2, câu có sẵn, lọc/chặn/báo cáo; voice WebRTC mesh + TURN | 6 client nghe nhau; whisper chỉ tới đúng người (test tự động); tùy chọn ẩn IP hoạt động | M |
| **M8** | Tân thủ | Runner kịch bản, hệ thống gợi ý, 13 bài (mục 10), lưu tiến độ | "Người chơi ảo" giải xong cả 13 bài trong CI; 3 người mới thử xong tutorial không cần hỏi | M |
| **M9** | Bot nâng cao và cân bằng | Bot Khó, tính cách, mô phỏng hàng loạt, chỉnh preset Tiêu chuẩn/Nhanh | Đạt các chỉ tiêu mục 9.3, công bằng ghế 16,7% ± 3% | M |
| **M10** | Đồ họa và âm thanh hoàn thiện | Mô hình quân cuối, vật liệu, hiệu ứng (12.4), thu hẹp đẹp, nhạc + SFX, mức đồ họa, tối ưu | Video/ảnh chụp đạt chuẩn trang cửa hàng; số đo hiệu năng ghi vào `docs/perf.md`. **Đăng trang Coming Soon** | L |
| **M11** | Tích hợp Steam | Thành tích, bảng xếp hạng, Cloud, Rich Presence, lobby/mời bạn, Playtest, SteamPipe | Tất cả chạy với AppID thật trên máy sạch | M |
| **M12** | Beta | Playtest vòng 2–3, sửa lỗi, cân bằng theo dữ liệu, giám sát server, tài liệu vận hành | Không lỗi nghiêm trọng trong 50 ván liên tiếp; tỷ lệ hoàn thành tutorial đạt mục tiêu bạn đặt | L |
| **M13** | Phát hành | Nộp build duyệt, khảo sát nội dung, giá, ngày phát hành, bấm Release | Build được duyệt, game chạy trên máy sạch qua Steam | S |
| Sau ra mắt | | Xếp hạng Elo (X-13), replay công khai, hỗ trợ tay cầm/Steam Deck, mỹ phẩm/skin, thêm ngôn ngữ, bản đồ/luật mới | | |

**Thứ tự phụ thuộc:** M1 → M2 → (M3 ∥ bot ở M4) → M5 → M6 → M7; M8 sau M5; M9 sau M4 và có thể chạy song song với M6–M8.

---

## 16. Rủi ro và cách giảm

| Rủi ro | Mức | Giảm |
|---|---|---|
| **Trận quá dài** (mục 2) | Cao | Preset Tiêu chuẩn/Nhanh, AFK → bot, lưu/tiếp tục solo, đầu hàng, hiệp 450 kết thúc cứng |
| **Không đủ 6 người để ghép trận** | Cao | Bot lấp chỗ, phòng riêng với bạn bè, chế độ solo là chính từ ngày đầu |
| **Thông đồng / "xử người dẫn đầu" trong trận 6 người** | Trung bình | Chấp nhận là bản chất của game tự do; giảm bằng điểm xếp hạng (không chỉ thắng/thua), câu chat "ngoại giao" có sẵn để hợp thức hóa; cân nhắc ghép trận theo Elo sau |
| **Luật tù binh khó hiểu** | Trung bình | Bài T9 riêng, hiệu ứng thị giác rõ, thông báo văn bản khi có tù binh, cờ `captive.conscript` để đổi cách hiểu |
| **Bàn cờ 1801 ô khó đọc** | Trung bình | Bản đồ nhỏ, nút nhảy tới, cảnh báo đe dọa, tô ô rõ ràng |
| **Electron + Steam Overlay/`steamworks.js` không ổn** | Trung bình | Spike ở M0; phương án Godot (6.4) |
| **Chi phí và vận hành máy chủ** | Trung bình | Một VPS ban đầu, 1 tiến trình nhiều phòng, giám sát; ván solo không tốn máy chủ |
| **Chat/voice bị lạm dụng** | Trung bình | Chặn, tắt tiếng, báo cáo, câu có sẵn, voice mặc định tắt |
| **Quyền riêng tư (IP lộ trong voice mesh)** | Trung bình | Tùy chọn chỉ qua TURN, thông báo rõ, chính sách quyền riêng tư |
| **Lệch luật giữa client/server** | Thấp | Một engine dùng chung, `rulesVersion` bắt buộc khớp |
| **Nội dung do AI tạo cần khai báo Steam** | Thấp | Đọc chính sách trước khi nộp, lập `docs/credits.md` |

---

## 17. Nguồn tham khảo (Steam)

- Steam Direct Fee: https://partner.steamgames.com/doc/gettingstarted/appfee
- Coming Soon: https://partner.steamgames.com/doc/store/coming_soon
- Release Process: https://partner.steamgames.com/doc/store/releasing
- Release Options / Coming Soon tối thiểu 2 tuần: https://partner.steamgames.com/doc/store/types
- Content Survey: https://partner.steamgames.com/doc/gettingstarted/contentsurvey
- Thời gian chờ 30 ngày và mốc tổng thể (nguồn thứ cấp, cần xác nhận trên Steamworks): https://www.immutable.com/guides/how-to-publish-a-game-on-steam

---

## Phụ lục A — Nội dung `CLAUDE.md` đề xuất

```markdown
# HEXWAR — quy ước làm việc

## Nguồn sự thật
- PLAN.md là đặc tả. Luật: mục 4 (mã R-xx). Số liệu bàn cờ: mục 3. Không tự đổi luật; nếu thấy mâu thuẫn hoặc thiếu, ghi vào docs/questions.md và hỏi.
- tools/verify_board.py là chuẩn hình học. Chuyển nó thành test trong packages/rules và giữ hai bên khớp.

## Nguyên tắc code
- TypeScript strict, không `any`. packages/rules KHÔNG import DOM, mạng, Date.now, Math.random. RNG luôn nhận từ seed.
- Mọi con số luật ở rules.config.json. Không rải hằng số trong code.
- Engine trả sự kiện; UI/hoạt ảnh chỉ đọc sự kiện. Client không tự quyết luật.
- Hàm nhỏ, tên rõ, có chú thích mã luật (// R-34) ở chỗ hiện thực luật.
- Không thêm thư viện nếu chưa có lý do; ghi lý do vào docs/decisions.md.
- Chữ hiển thị luôn qua i18n (vi, en). Không chữ cứng trong UI.

## Quy trình mỗi milestone
1. Đọc mục 15 của PLAN.md, chia thành task nhỏ.
2. Viết test trước cho luật mới, rồi mới hiện thực.
3. Chạy: pnpm lint && pnpm typecheck && pnpm test. Chỉ commit khi xanh.
4. Kiểm tra tiêu chí nghiệm thu của milestone bằng lệnh/ảnh chụp thật, không chỉ nói "đã làm".
5. Commit nhỏ, thông điệp rõ. Cuối milestone cập nhật docs/progress.md.

## Cấm
- Không sửa test để cho qua. Nếu test sai, giải thích và sửa có lý do.
- Không lưu bí mật (khóa Steam, khóa server) trong repo.
- Không dùng tài nguyên (hình, âm thanh, font) chưa rõ giấy phép; ghi nguồn vào docs/credits.md.
```

## Phụ lục B — Prompt khởi động (dán vào Claude Code)

```text
Hãy đọc PLAN.md và tools/verify_board.py. Nhiệm vụ: thực hiện Milestone M0 rồi M1 theo mục 15.
- Dựng monorepo pnpm với các package ở mục 6.3, thiết lập lint/typecheck/test/CI.
- Chuyển các kiểm tra trong tools/verify_board.py thành test Vitest trong packages/rules (hex.ts, board.ts, moves.ts).
- Hiện thực đúng mục 3 và mục 4.3 (chưa làm tù binh/thu hẹp, để M2).
- Khi xong, chạy toàn bộ test và cho tôi xem kết quả, đặc biệt: 1801 ô, 108 quân, 57 nước đi đầu ở mỗi ghế.
Nếu có điểm mơ hồ, hãy làm theo mặc định ở mục 2 và ghi câu hỏi vào docs/questions.md.
```

## Phụ lục C — `rules.config.json` mẫu

```json
{
  "rulesVersion": "1.0.0",
  "board": { "radius": 24, "seatCornerRing": 23 },
  "reach": { "metric": "distance", "R": 9, "B": 9, "Q": 9, "J": 3, "jesterReviveDistance": 5 },
  "pawn": { "doubleStep": false },
  "captive": { "conscript": true, "rescueByOwner": true },
  "promotion": { "N": 6, "B": 10, "R": 15, "Q": 20, "cumulativeKills": true },
  "jester": { "savesFromCollapse": false },
  "turn": { "seconds": 60, "afkTimeoutsBeforeBot": 3, "reconnectGraceSeconds": 90 },
  "collapse": {
    "rounds": [50, 110, 180, 250, 260, 280, 290, 300, 310, 320, 330, 340, 350, 360],
    "warn": { "yellowRoundsBefore": 3, "redRoundsBefore": 1 },
    "extension": { "enabled": true, "firstRound": 370, "every": 10, "minRadius": 3 },
    "hardCapRound": 450
  },
  "score": { "P": 1, "N": 3, "B": 3, "R": 5, "Q": 9, "J": 2, "K": 0, "perKill": 1 },
  "presets": {
    "classic":  { "seconds": 60, "roundScale": 1.0 },
    "standard": { "seconds": 45, "roundScale": 0.6 },
    "blitz":    { "seconds": 30, "roundScale": 0.35 }
  }
}
```
