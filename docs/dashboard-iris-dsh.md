# IRIS · Trung tâm điều hành DeepSeek Harness

Trang **Điều hành** nối trực tiếp vào app DSH hiện có qua `@aris/ui-pages`, không phải GitHub Pages tĩnh. Giao diện dựa trên ba màn Office, Learning, Brain trong thiết kế Aris.

## Luồng dữ liệu thật

| Khối | Nguồn | Làm mới |
| --- | --- | --- |
| Đội bot và trạng thái | `useTeam` và `useTeamLive` của UI kit | Theo dịch vụ đội |
| Token | `GET /api/aris/stats?range=today` | 15 giây |
| Chi phí và trần | `GET /api/aris/guard` | 15 giây |
| Kênh Telegram/Zalo/Lark | `GET /api/aris/channels` | 5 giây |
| Việc cần duyệt và đề xuất tự học | `useInboxCount` | Theo dịch vụ inbox |
| Đồ thị, skill, routine | Các trang có sẵn `Brain`, `Learn`, `Routine` | Khi mở |

Không dùng số liệu `DEMO_DASHBOARD`. Nếu API thiếu hoặc lỗi, hiển thị `—`, `Đang kiểm tra`, hoặc trạng thái chưa sẵn sàng, không báo kết nối giả.

## Chạy cục bộ

Node >= 22.19 và pnpm 10:

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm aris:setup
pnpm aris
```

Cấu hình khóa DeepSeek ở **máy chạy DSH**, không ghi vào mã frontend hay commit lên GitHub. Vào Cài đặt → Kênh để ghép Telegram, Zalo, Lark. Ứng dụng cần host Node/dsh cùng các dịch vụ API, không thể chạy đủ bot chỉ từ hosting tĩnh.

## Phạm vi và bảo mật

- Màn **Điều hành** chỉ đọc API. Các nút điều hướng tới trang hiện có, không tự tạo kênh hoặc phê duyệt quyền.
- Các API dùng cookie phiên cùng nguồn; việc phân quyền nằm ở host, tuyệt đối không để API key vào JS client.
- Trạng thái `running` của Telegram, `listening` của Zalo, `receiving` của Lark dùng đúng schema từ `channels-api.ts`.
- Zalo cá nhân qua bộ nối không chính thức có nguy cơ bị giới hạn hoặc khóa tài khoản; ưu tiên kênh chính thức khi triển khai thực.
- Tự học chỉ đề xuất, trí nhớ/skill cần chủ nhân xác nhận theo chính sách hiện hữu.
- Giữ nguyên thông báo giấy phép MIT và tác giả gốc của dự án; không thay thế khẳng định nguồn gốc mã.

## Những việc vẫn cần để chạy thật

Cấu hình API key DeepSeek, đăng ký bot Telegram, xác thực Zalo/Lark theo tài liệu, host DSH cùng backend thường trực và kiểm thử tải, xác thực, điều kiện lỗi. Không có bí mật nào được thiết lập bởi thay đổi này.
