-- Bảng lưu trữ thông tin giao dịch thanh toán
CREATE TABLE IF NOT EXISTS PaymentTransactions (
    PaymentID VARCHAR(36) PRIMARY KEY,
    OrderID VARCHAR(36) NOT NULL,
    PaymentMethod VARCHAR(50) NOT NULL,
    Amount DECIMAL(15,2) NOT NULL,
    Status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED') DEFAULT 'PENDING',
    PaymentProvider VARCHAR(50) NOT NULL,
    TransactionRef VARCHAR(100) NOT NULL,
    PaymentUrl TEXT,
    QRCode TEXT,
    QRContent TEXT,
    BankCode VARCHAR(10),
    CustomerInfo JSON,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (OrderID) REFERENCES DonHang(DonHangID) ON DELETE CASCADE,
    INDEX idx_order_id (OrderID),
    INDEX idx_transaction_ref (TransactionRef),
    INDEX idx_status (Status),
    INDEX idx_created_at (CreatedAt)
);

-- Bảng cấu hình thanh toán
CREATE TABLE IF NOT EXISTS PaymentConfig (
    ConfigID INT AUTO_INCREMENT PRIMARY KEY,
    Provider VARCHAR(50) NOT NULL,
    ConfigKey VARCHAR(100) NOT NULL,
    ConfigValue TEXT,
    IsEncrypted BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_provider_key (Provider, ConfigKey)
);

-- Thêm cột thanh toán vào bảng DonHang nếu chưa có
ALTER TABLE DonHang 
ADD COLUMN IF NOT EXISTS PaymentStatus ENUM('UNPAID', 'PAID', 'REFUNDED') DEFAULT 'UNPAID',
ADD COLUMN IF NOT EXISTS PaymentMethod VARCHAR(50),
ADD COLUMN IF NOT EXISTS PaymentTransactionRef VARCHAR(100);

-- Thêm index cho các cột mới
ALTER TABLE DonHang 
ADD INDEX IF NOT EXISTS idx_payment_status (PaymentStatus),
ADD INDEX IF NOT EXISTS idx_payment_method (PaymentMethod);

-- Insert cấu hình mặc định (cần cập nhật với thông tin thực tế)
INSERT IGNORE INTO PaymentConfig (Provider, ConfigKey, ConfigValue, IsEncrypted) VALUES
('VNPAY', 'TMN_CODE', 'YOUR_TMN_CODE', FALSE),
('VNPAY', 'SECRET_KEY', 'YOUR_SECRET_KEY', TRUE),
('VNPAY', 'URL', 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html', FALSE),
('VNPAY', 'RETURN_URL', 'http://localhost:3000/api/payment/vnpay-return', FALSE),

('MOMO', 'PARTNER_CODE', 'YOUR_PARTNER_CODE', FALSE),
('MOMO', 'ACCESS_KEY', 'YOUR_ACCESS_KEY', TRUE),
('MOMO', 'SECRET_KEY', 'YOUR_SECRET_KEY', TRUE),
('MOMO', 'ENDPOINT', 'https://test-payment.momo.vn/v2/gateway/api/create', FALSE),
('MOMO', 'RETURN_URL', 'http://localhost:3000/api/payment/momo-return', FALSE),
('MOMO', 'NOTIFY_URL', 'http://localhost:3000/api/payment/momo-notify', FALSE),

('VIETQR', 'CLIENT_ID', 'YOUR_CLIENT_ID', FALSE),
('VIETQR', 'API_KEY', 'YOUR_API_KEY', TRUE),
('VIETQR', 'API_URL', 'https://api.vietqr.io/v2/generate', FALSE),
('VIETQR', 'ACCOUNT_NO', 'YOUR_ACCOUNT_NO', FALSE),
('VIETQR', 'ACCOUNT_NAME', 'YOUR_ACCOUNT_NAME', FALSE),

