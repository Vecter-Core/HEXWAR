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

## Lệnh thường dùng (bổ sung so với Phụ lục A của PLAN.md)
- `pnpm check`: lint + typecheck + test + `tools/verify_board.py` (chạy trước mỗi commit).
- `pnpm golden:gen`: sinh lại `packages/rules/test/fixtures/initial-moves.json` từ `tools/verify_board.py`. Chỉ cần chạy khi verify_board.py đổi; CI kiểm tra fixture còn khớp.
- `python3 tools/mutate.py [tiền_tố_id…]`: kiểm thử đột biến cho `packages/rules` (chậm, không chạy trong CI). Chạy sau khi sửa luật; mã thoát 1 nếu có đột biến sống sót thật. Sửa mã nguồn làm chuỗi vá không khớp thì cập nhật bảng đột biến trong script.
- `pnpm --filter @hexwar/client e2e`: Playwright (trình duyệt thật: hotseat, solo 1 vs 5 bot, thoát/vào lại, ảnh chụp ở `packages/client/test-results/screenshots/`).
- `pnpm --filter @hexwar/bot arena` (tuỳ chọn `ARENA_GAMES=n ARENA_OUT=file.md`): đấu thử hàng loạt đo tỉ lệ thắng / độ dài ván của bot (chậm, không chạy trong CI). Chạy lại khi sửa trọng số bot, cập nhật `docs/bot.md`.
- Package đã có code: `rules` (M1–M2), `client` (M3–M4), `bot` + `protocol` (M4). `server`, `tutorial`, `desktop` vẫn là khung rỗng.
