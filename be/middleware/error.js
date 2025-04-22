const AppError = require('../utils/appError'); // Thêm dòng này

const errorMessages = {
  // Auth errors
  admin_required: 'Chỉ quản trị viên mới có quyền thực hiện hành động này.',
  invalid_token: 'Token không hợp lệ hoặc đã hết hạn.',
  user_not_found: 'Không tìm thấy người dùng.',
  email_already_verified: 'Email đã được xác minh trước đó.',
  invalid_credentials: 'Email hoặc mật khẩu không chính xác.',
  email_already_exists: 'Email đã được sử dụng. Vui lòng sử dụng email khác.',
  phone_already_exists: 'Số điện thoại đã được sử dụng.',

  // Product errors
  product_not_found: 'Không tìm thấy sản phẩm.',
  image_not_found: 'Không tìm thấy hình ảnh sản phẩm.',
  only_images_allowed: 'Chỉ cho phép tải lên file ảnh (jpg, jpeg, png).',
  variant_not_found: 'Phiên bản sản phẩm không tồn tại.',

  // Category errors
  category_not_found: 'Không tìm thấy danh mục.',
  category_name_required: 'Tên danh mục là bắt buộc.',
  parent_category_not_found: 'Không tìm thấy danh mục cha.',
  category_loop_detected: 'Không thể tạo vòng lặp danh mục.',

  // Cart errors
  cart_not_found: 'Không tìm thấy giỏ hàng.',
  item_not_in_cart: 'Sản phẩm không có trong giỏ hàng.',
  stock_exceeded: 'Số lượng sản phẩm vượt quá số lượng tồn kho.',
  cart_empty: 'Giỏ hàng trống.',
  invalid_quantity: 'Số lượng không hợp lệ.',

  // Order errors
  order_not_found: 'Đơn hàng không tồn tại.',
  order_not_found_or_invalid: 'Đơn hàng không tồn tại hoặc không hợp lệ.',
  invalid_address: 'Địa chỉ không hợp lệ.',
  order_cannot_be_cancelled: 'Không thể hủy đơn hàng này.',
  order_completed: 'Đơn hàng đã hoàn thành.',
  order_already_paid: 'Đơn hàng đã được thanh toán.',

  // Payment errors
  currency_not_supported: 'Loại tiền tệ không được hỗ trợ.',
  failed_exchange_rate: 'Không thể lấy tỷ giá hối đoái.',
  only_momo_supported: 'Chỉ hỗ trợ thanh toán qua momo.',
  payment_not_found: 'Không tìm thấy thông tin thanh toán.',
  payment_failed: 'Thanh toán thất bại.',
  momo_error: 'Lỗi khi tạo thanh toán momo.',
  momo_execution_failed: 'Lỗi khi thực thi thanh toán momo.',
  invalid_payment_amount: 'Số tiền thanh toán không khớp.',

  // Favorite errors
  product_already_favorite: 'Sản phẩm đã có trong danh sách yêu thích.',
  favorite_not_found: 'Không tìm thấy sản phẩm trong danh sách yêu thích.',
  product_id_required: 'Yêu cầu ID sản phẩm.',

  // Address errors
  address_not_found: 'Không tìm thấy địa chỉ.',
  max_addresses_reached: 'Bạn đã đạt giới hạn 10 địa chỉ.',

  // Review errors
  invalid_rating: 'Điểm đánh giá phải từ 1 đến 5.',
  purchase_required_for_review: 'Bạn cần mua sản phẩm trước khi đánh giá.',
  review_already_exists: 'Bạn đã đánh giá sản phẩm này.',
};

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      message: errorMessages[err.message] || err.message,
    });
  }

  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors.map((e) => e.message),
    });
  }

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      message: 'Token không hợp lệ',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      message: 'Token đã hết hạn',
    });
  }

  res.status(500).json({
    message: 'Đã xảy ra lỗi không xác định',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};

module.exports = errorHandler;