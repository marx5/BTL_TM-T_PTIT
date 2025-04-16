const express = require('express');
const { sequelize, initializeDatabase } = require('./config/database');
const models = require('./models');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const orderRoutes = require('./routes/orderRoutes.js');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const favoriteRoutes = require('./routes/favoriteRoutes');
const addressRoutes = require('./routes/addressRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const profileRoutes = require('./routes/profileRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const errorHandler = require('./middleware/error');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit'); // Vô hiệu hóa rate limiting
const winston = require('winston');
require('dotenv').config();

const app = express();

// Cấu hình logging với Winston
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// Cấu hình CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : ['http://localhost:3000', 'http://localhost:3456'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
  maxAge: 86400 // 24 hours
};
app.use(cors(corsOptions));

// Cấu hình Helmet để tăng cường bảo mật header
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Giới hạn tỷ lệ yêu cầu (Toàn cục) - Đã vô hiệu hóa
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 phút
//   max: 500,
//   message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút.',
// });
// app.use(limiter);

// Phục vụ file tĩnh từ thư mục uploads
app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, filePath) => {
      // Xác định Content-Type dựa trên phần mở rộng của file
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.jpg' || ext === '.jpeg') {
        res.set('Content-Type', 'image/jpeg');
      } else if (ext === '.png') {
        res.set('Content-Type', 'image/png');
      }
      // Cho phép truy cập từ bất kỳ origin nào
      res.set('Access-Control-Allow-Origin', '*');
    },
  })
);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.raw({ type: 'application/octet-stream', limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/cart', cartRoutes);

// Swagger UI (chỉ bật trong môi trường development)
if (process.env.NODE_ENV !== 'production') {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

// Error handling
app.use(errorHandler);

// Graceful shutdown
let server;
async function startServer() {
  try {
    await initializeDatabase();
    await sequelize.sync({ force: false }); // Đồng bộ database, force: true để tạo lại bảng
    logger.info('Đã đồng bộ cơ sở dữ liệu thành công!');

    const PORT = process.env.PORT || 3456;
    server = app.listen(PORT, () => {
      logger.info(`Máy chủ đang chạy trên cổng ${PORT}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`Swagger UI có sẵn tại http://localhost:${PORT}/api-docs`);
      }
    });
  } catch (error) {
    logger.error('Không thể khởi động máy chủ:', { error: error.message });
    process.exit(1);
  }
}

process.on('SIGTERM', async () => {
  logger.info('Nhận tín hiệu SIGTERM. Đang thực hiện graceful shutdown...');
  if (server) {
    server.close(async () => {
      logger.info('Server đã đóng.');
      try {
        await sequelize.close();
        logger.info('Kết nối database đã đóng.');
      } catch (error) {
        logger.error('Lỗi khi đóng kết nối database:', { error: error.message });
      }
      process.exit(0);
    });
  }
});

process.on('SIGINT', async () => {
  logger.info('Nhận tín hiệu SIGINT. Đang thực hiện graceful shutdown...');
  if (server) {
    server.close(async () => {
      logger.info('Server đã đóng.');
      try {
        await sequelize.close();
        logger.info('Kết nối database đã đóng.');
      } catch (error) {
        logger.error('Lỗi khi đóng kết nối database:', { error: error.message });
      }
      process.exit(0);
    });
  }
});

startServer();