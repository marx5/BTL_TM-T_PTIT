# Hệ Thống Backend E-commerce

## Mô tả
Đây là hệ thống backend cho một ứng dụng thương mại điện tử, được xây dựng bằng Node.js và Express.js. Hệ thống cung cấp các API để quản lý sản phẩm, người dùng, đơn hàng, thanh toán và các chức năng khác của một cửa hàng trực tuyến.

### Tính năng chính
- Quản lý người dùng và phân quyền
- Quản lý sản phẩm và danh mục
- Quản lý đơn hàng
- Giỏ hàng và thanh toán
- Đánh giá sản phẩm
- Quản lý địa chỉ giao hàng
- Banner quảng cáo
- Tìm kiếm và lọc sản phẩm
- Upload và quản lý hình ảnh
- Xác thực và phân quyền JWT

## Yêu cầu hệ thống
- Node.js (phiên bản 14.x trở lên)
- MySQL (phiên bản 5.7 trở lên)
- npm hoặc yarn
- Git
- Tối thiểu 2GB RAM
- Tối thiểu 1GB dung lượng ổ đĩa

## Cài đặt

### 1. Clone repository
```bash
git clone [đường-dẫn-repository]
cd be
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình môi trường
Tạo file `.env` trong thư mục gốc của dự án với nội dung sau:
```env
# Cấu hình Database
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ecommerce_db

# Cấu hình JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# Cấu hình CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3456
CORS_METHODS=GET,POST,PUT,DELETE,OPTIONS
CORS_ALLOWED_HEADERS=Content-Type,Authorization,Accept
CORS_CREDENTIALS=true

# Cấu hình Server
PORT=3456
NODE_ENV=development
API_PREFIX=/api
UPLOAD_DIR=uploads

# Cấu hình Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@yourdomain.com
```

### 4. Khởi tạo cơ sở dữ liệu
```bash
mysql -u root -p
CREATE DATABASE ecommerce_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
exit;
```

### 5. Chạy ứng dụng
```bash
npm start
```

## API Documentation

### Authentication
- `POST /api/auth/register` - Đăng ký tài khoản
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/verify-email` - Xác minh email
- `POST /api/auth/forgot-password` - Yêu cầu đặt lại mật khẩu
- `POST /api/auth/reset-password` - Đặt lại mật khẩu

### Users
- `GET /api/users/me` - Lấy thông tin người dùng hiện tại
- `GET /api/users` - Lấy danh sách người dùng (Admin)
- `GET /api/users/:id` - Lấy chi tiết người dùng (Admin)
- `PUT /api/users/:id` - Cập nhật thông tin người dùng (Admin)
- `DELETE /api/users/:id` - Xóa người dùng (Admin)
- `GET /api/users/:id/orders` - Lấy danh sách đơn hàng của người dùng (Admin)

### Profile
- `GET /api/profile` - Lấy hồ sơ người dùng
- `PUT /api/profile` - Cập nhật hồ sơ người dùng

### Products
- `GET /api/products` - Lấy danh sách sản phẩm
  - Query params: page, limit, categoryId, search
- `GET /api/products/search` - Tìm kiếm sản phẩm nâng cao
  - Query params: q, categoryId, size, color, minPrice, maxPrice, inStock, page, limit
- `POST /api/products` - Tạo sản phẩm mới (Admin)
- `PUT /api/products/:id` - Cập nhật sản phẩm (Admin)
- `DELETE /api/products/:id` - Xóa sản phẩm (Admin)
- `GET /api/products/:id` - Lấy chi tiết sản phẩm
- `GET /api/products/category/:categoryId` - Lấy sản phẩm theo danh mục
- `GET /api/products/featured` - Lấy sản phẩm nổi bật
- `GET /api/products/new` - Lấy sản phẩm mới
- `GET /api/products/popular` - Lấy sản phẩm phổ biến
- `GET /api/products/:id/reviews` - Lấy đánh giá sản phẩm
- `POST /api/products/:id/reviews` - Thêm đánh giá sản phẩm
- `GET /api/products/:id/variants` - Lấy biến thể sản phẩm
- `POST /api/products/:id/variants` - Thêm biến thể sản phẩm (Admin)
- `PUT /api/products/:id/variants/:variantId` - Cập nhật biến thể (Admin)
- `DELETE /api/products/:id/variants/:variantId` - Xóa biến thể (Admin)

### Categories
- `GET /api/categories` - Lấy danh sách danh mục
- `POST /api/categories` - Tạo danh mục mới (Admin)
- `PUT /api/categories/:id` - Cập nhật danh mục (Admin)
- `DELETE /api/categories/:id` - Xóa danh mục (Admin)
- `GET /api/categories/:id` - Lấy chi tiết danh mục
- `GET /api/categories/tree` - Lấy cây danh mục
- `GET /api/categories/:id/products` - Lấy sản phẩm theo danh mục

### Orders
- `GET /api/orders` - Lấy danh sách đơn hàng
  - Query params: page, limit, status, dateFrom, dateTo, userId
- `POST /api/orders` - Tạo đơn hàng mới từ giỏ hàng
  - Request body: addressId, paymentMethod
- `POST /api/orders/buy-now` - Thanh toán ngay sản phẩm đang xem
  - Request body: ProductVariantId, quantity, addressId, paymentMethod
- `GET /api/orders/:id` - Lấy chi tiết đơn hàng
- `PUT /api/orders/:id` - Cập nhật đơn hàng
- `PUT /api/orders/:id/status` - Cập nhật trạng thái đơn hàng
- `GET /api/orders/user/:userId` - Lấy đơn hàng của người dùng
- `GET /api/orders/my-orders` - Lấy đơn hàng của người dùng hiện tại

### Cart
- `GET /api/cart` - Lấy giỏ hàng
- `POST /api/cart` - Thêm sản phẩm vào giỏ hàng
  - Request body: variantId, quantity
- `PUT /api/cart/:id` - Cập nhật số lượng sản phẩm trong giỏ hàng
  - Request body: quantity
- `DELETE /api/cart/:id` - Xóa sản phẩm khỏi giỏ hàng
- `DELETE /api/cart` - Xóa toàn bộ giỏ hàng
- `GET /api/cart/count` - Lấy số lượng sản phẩm trong giỏ
- `GET /api/cart/me` - Lấy giỏ hàng của người dùng hiện tại
- `GET /api/cart/admin/:userId` - Lấy giỏ hàng của người dùng (Admin)

### Reviews
- `GET /api/reviews` - Lấy danh sách đánh giá
- `POST /api/reviews` - Tạo đánh giá
- `PUT /api/reviews/:id` - Cập nhật đánh giá
- `DELETE /api/reviews/:id` - Xóa đánh giá
- `GET /api/reviews/product/:productId` - Lấy đánh giá theo sản phẩm
- `GET /api/reviews/me` - Lấy đánh giá của người dùng hiện tại

### Addresses
- `GET /api/addresses` - Lấy danh sách địa chỉ
- `POST /api/addresses` - Thêm địa chỉ
- `PUT /api/addresses/:id` - Cập nhật địa chỉ
- `DELETE /api/addresses/:id` - Xóa địa chỉ
- `PUT /api/addresses/:id/set-default` - Đặt làm địa chỉ mặc định
- `GET /api/addresses/me` - Lấy địa chỉ của người dùng hiện tại

### Banners
- `GET /api/banners` - Lấy danh sách banner (Admin)
- `POST /api/banners` - Tạo banner mới (Admin)
  - Request body (multipart/form-data): image, productId, isActive
- `PUT /api/banners/:id` - Cập nhật banner (Admin)
  - Request body (multipart/form-data): image, productId, isActive
- `DELETE /api/banners/:id` - Xóa banner (Admin)
- `GET /api/banners/active` - Lấy danh sách banner đang hoạt động

### Favorites
- `POST /api/favorites` - Thêm sản phẩm vào danh sách yêu thích
- `GET /api/favorites` - Lấy danh sách sản phẩm yêu thích của người dùng
- `DELETE /api/favorites/:productId` - Xóa sản phẩm khỏi danh sách yêu thích

### Payments
- `POST /api/payments` - Tạo thanh toán cho đơn hàng bằng PayPal
- `GET /api/payments/success` - Xử lý thanh toán PayPal thành công
- `GET /api/payments/cancel` - Xử lý hủy thanh toán PayPal
- `GET /api/payments/:orderId` - Lấy trạng thái thanh toán của đơn hàng

## Bảo mật
- Sử dụng JWT cho xác thực
- Mã hóa mật khẩu với bcrypt
- CORS được cấu hình để bảo vệ API
- Helmet được sử dụng để bảo mật HTTP headers
- Input validation cho tất cả các request
- Xử lý file upload an toàn
- Bảo mật thông tin nhạy cảm trong .env

## Logging
Hệ thống sử dụng Winston để ghi log:
- Log lỗi được lưu trong `logs/error.log`
- Log tổng hợp được lưu trong `logs/combined.log`
- Log format: JSON với timestamp
- Log levels: error, warn, info, debug

## Xử lý lỗi
Hệ thống có middleware xử lý lỗi tập trung, trả về response thống nhất:
```json
{
  "success": false,
  "error": {
    "message": "Thông báo lỗi",
    "code": "Mã lỗi",
    "details": {
      "field": "Chi tiết lỗi"
    }
  }
}
```

### Các mã lỗi thông dụng
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Unprocessable Entity
- 500: Internal Server Error

## Triển khai
### Development
```bash
npm start
```

### Production
```bash
NODE_ENV=production npm start
```

## Giấy phép
ISC

## Liên hệ
- Email: [your-email@domain.com]
- GitHub: [github-username]
- Website: [your-website.com]

## Đóng góp
1. Fork repository
2. Tạo branch mới (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add some amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## Lưu ý
- Đảm bảo cấu hình đúng các biến môi trường trong file `.env`
- Kiểm tra kết nối database trước khi chạy ứng dụng
- Đảm bảo các thư mục `uploads` và `logs` có quyền ghi
- Trong môi trường production, nên sử dụng HTTPS
- Thường xuyên backup database
- Cập nhật dependencies định kỳ