require("dotenv").config();
const nodemailer = require("nodemailer");
const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");
const https = require("https");
const http = require("http");
const pdfService = require("./pdfService");
const QRCode = require("qrcode");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  // Tạo template HTML cho email hóa đơn
  generateInvoiceEmailTemplate(orderData, paymentData, qrCodeData) {
    const companyName = process.env.COMPANY_NAME || "ĐIỆN MÁY VIP";
    const companyPhone = process.env.COMPANY_PHONE || "0999.888.666";
    const companyEmail = process.env.COMPANY_EMAIL || process.env.EMAIL_USER;
    
    const template = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Hóa đơn điện tử</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 650px;
                margin: 0 auto;
                padding: 0;
                background-color: #f9f9f9;
            }
            .container {
                background-color: white;
                padding: 0;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background-color: #333;
                color: white;
                padding: 20px;
                text-align: center;
            }
            .header-logo {
                font-size: 24px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .header-subtitle {
                font-size: 13px;
                opacity: 0.9;
                margin-bottom: 15px;
            }
            .shipping-notice {
                font-size: 14px;
                color: #4caf50;
                font-weight: bold;
                margin-top: 10px;
                background-color: rgba(76, 175, 80, 0.1);
                padding: 8px 15px;
                border-radius: 20px;
                display: inline-block;
            }
            .invoice-title {
                font-size: 28px;
                font-weight: bold;
                margin: 15px 0 8px 0;
                text-transform: uppercase;
            }
            .invoice-number {
                font-size: 16px;
                background-color: rgba(255,255,255,0.2);
                display: inline-block;
                padding: 6px 16px;
                border-radius: 20px;
                margin-top: 5px;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 16px;
                margin-bottom: 20px;
                line-height: 1.5;
            }
            .greeting strong {
                color: #333;
            }
            .info-section {
                margin: 25px 0;
                border-left: 3px solid #666;
                padding-left: 15px;
            }
            .info-section h3 {
                color: #333;
                font-size: 16px;
                margin: 0 0 12px 0;
                font-weight: 600;
            }
            .info-grid {
                display: table;
                width: 100%;
            }
            .info-row {
                display: table-row;
            }
            .info-label {
                display: table-cell;
                padding: 8px 15px 8px 0;
                font-weight: 600;
                color: #555;
                width: 40%;
                vertical-align: top;
            }
            .info-value {
                display: table-cell;
                padding: 8px 0;
                color: #333;
                vertical-align: top;
            }
            .payment-status {
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 4px;
                padding: 15px;
                margin: 20px 0;
                text-align: center;
            }
            .payment-status .icon {
                font-size: 40px;
                color: #4caf50;
                margin-bottom: 8px;
            }
            .payment-status .text {
                font-size: 18px;
                font-weight: bold;
                color: #2e7d32;
            }
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 14px;
            }
            .products-table thead {
                background-color: #f5f5f5;
            }
            .products-table th {
                padding: 12px 10px;
                text-align: left;
                font-weight: 600;
                color: #333;
                border-bottom: 1px solid #ddd;
            }
            .products-table td {
                padding: 12px 10px;
                border-bottom: 1px solid #e0e0e0;
            }
            .products-table tr:last-child td {
                border-bottom: none;
            }
            .products-table .text-right {
                text-align: right;
            }
            .products-table .text-center {
                text-align: center;
            }
            .total-section {
                background-color: #f5f5f5;
                border-radius: 4px;
                padding: 20px;
                margin-top: 25px;
            }
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 15px;
            }
            .total-row.subtotal {
                color: #666;
            }
            .total-row.final {
                font-size: 20px;
                font-weight: bold;
                color: #333;
                border-top: 2px solid #666;
                padding-top: 15px;
                margin-top: 10px;
            }
            .qr-section {
                background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%);
                border: none;
                border-radius: 16px;
                padding: 40px;
                margin: 40px 0;
                text-align: center;
                box-shadow: 0 20px 40px rgba(79, 70, 229, 0.4);
                color: white;
                position: relative;
                overflow: hidden;
            }
            .qr-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%);
                pointer-events: none;
            }
            .qr-section h3 {
                color: white;
                margin: 0 0 25px 0;
                font-size: 24px;
                font-weight: 800;
                text-shadow: 0 4px 8px rgba(0,0,0,0.3);
                position: relative;
                z-index: 1;
            }
              .qr-code-img {
                  background: white;
                  padding: 40px;
                  border-radius: 25px;
                  display: block;
                  margin: 30px auto;
                  box-shadow: 0 20px 45px rgba(0,0,0,0.35);
                  border: 4px solid rgba(255,255,255,0.6);
                  position: relative;
                  z-index: 1;
                  max-width: 350px;
                  width: 100%;
                  text-align: center;
              }
              .qr-code-img img {
                  display: block;
                  max-width: 100%;
                  height: auto;
                  border-radius: 15px;
                  margin: 0 auto;
              }
            .qr-info {
                background: rgba(255,255,255,0.2);
                backdrop-filter: blur(15px);
                padding: 25px;
                border-radius: 15px;
                margin-top: 25px;
                font-size: 15px;
                text-align: left;
                line-height: 1.9;
                border: 2px solid rgba(255,255,255,0.3);
                position: relative;
                z-index: 1;
            }
            .attachment-notice {
                background-color: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                margin: 20px 0;
                border-radius: 4px;
            }
            .attachment-notice strong {
                color: #856404;
            }
            .footer {
                background-color: #f5f5f5;
                padding: 25px 30px;
                text-align: center;
                border-top: 1px solid #ddd;
            }
            .footer-message {
                font-size: 16px;
                color: #333;
                font-weight: 600;
                margin-bottom: 12px;
            }
            .footer-text {
                font-size: 14px;
                color: #666;
                margin: 8px 0;
            }
            .footer-contact {
                margin-top: 15px;
                padding-top: 15px;
                border-top: 1px solid #ddd;
                font-size: 13px;
                color: #888;
            }
            .footer-contact a {
                color: #333;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="header-logo">  ${companyName}</div>
                <div class="header-subtitle">Cửa hàng điện máy uy tín</div>
                <h1 class="invoice-title">HÓA ĐƠN BÁN HÀNG</h1>
                <div class="invoice-number">Mã đơn hàng: {{orderData.maDonHang}}</div>
                <div class="shipping-notice">  Miễn phí vận chuyển toàn quốc</div>
            </div>
            
            <!-- Content -->
            <div class="content">
                <!-- Greeting -->
                <div class="greeting">
                    <h3 style="color: #004d99; margin-bottom: 15px;">🎉 Cảm ơn bạn đã mua sắm!</h3>
                    <p>Xin chào <strong>{{orderData.hoTen}}</strong>,</p>
                    <p>Chúng tôi xin gửi bạn hóa đơn mua hàng số <strong>{{orderData.maDonHang}}</strong> 
                    ngày <strong>{{orderData.ngayDat}}</strong>. Đơn hàng của bạn đã được xác nhận và sẽ được xử lý trong thời gian sớm nhất.</p>
                </div>
                
                <!-- Attachment Notice -->
                <div class="attachment-notice">
                    <strong>📎 File đính kèm:</strong> Hóa đơn chi tiết được đính kèm dưới dạng file PDF. 
                    Vui lòng tải xuống và lưu giữ để đối chiếu và bảo hành.
                </div>
                
                <!-- Payment Status -->
                {{#if paymentData.isPaid}}
                <div class="payment-status">
                    <div class="icon">✓</div>
                    <div class="text">THANH TOÁN THÀNH CÔNG</div>
                </div>
                <div style="text-align: center; margin: 20px 0;">
                    <h2 style="color: #2e7d32; margin: 10px 0;">Xác nhận thanh toán thành công!</h2>
                    <p style="color: #666; font-size: 14px;">Mã giao dịch: {{paymentData.transactionRef}}</p>
                </div>
                {{/if}}
                
                <!-- Payment Details -->
                {{#if paymentData.isPaid}}
                <div class="info-section">
                    <h3 style="color: #2e7d32; margin-bottom: 15px;">Thông tin thanh toán</h3>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Số tiền:</div>
                            <div class="info-value amount-highlight">{{formatCurrency paymentData.amount}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Nội dung:</div>
                            <div class="info-value">{{paymentData.description}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Trạng thái:</div>
                            <div class="info-value" style="color: #2e7d32; font-weight: bold;">Thành công</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Thời gian:</div>
                            <div class="info-value">{{paymentData.paymentDate}}</div>
                        </div>
                    </div>
                </div>
                {{/if}}
                
                <!-- VietQR Payment QR Code -->
                {{#if paymentData.isVietQR}}
                <div class="qr-section">
                    <h3>💳 Thanh toán VietQR</h3>
                    <p style="margin: 0 0 20px 0; font-size: 16px; color: rgba(255,255,255,0.9); font-weight: 500;">
                        Quét mã QR bằng ứng dụng ngân hàng để thanh toán
                    </p>
                    {{#if paymentData.vietQRCode}}
                    <div class="qr-code-img">
                        <img src="{{paymentData.vietQRCode}}" alt="VietQR Code" />
                    </div>
                    {{/if}}
        
                    </div>
                </div>
                {{/if}}
                
                <!-- Customer Info -->
                <div class="info-section">
                    <h3>Thông tin khách hàng</h3>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Họ và tên:</div>
                            <div class="info-value">{{orderData.hoTen}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Số điện thoại:</div>
                            <div class="info-value">{{orderData.soDienThoai}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Địa chỉ:</div>
                            <div class="info-value">{{orderData.diaChi}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Email:</div>
                            <div class="info-value">{{orderData.email}}</div>
                        </div>
                    </div>
                </div>
                
                <!-- Payment Info -->
                <div class="info-section">
                    <h3>Thông tin thanh toán</h3>
                    <div class="info-grid">
                        <div class="info-row">
                            <div class="info-label">Phương thức:</div>
                            <div class="info-value">{{paymentData.method}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Mã giao dịch:</div>
                            <div class="info-value">{{paymentData.transactionRef}}</div>
                        </div>
                        <div class="info-row">
                            <div class="info-label">Ngày thanh toán:</div>
                            <div class="info-value">{{paymentData.paymentDate}}</div>
                        </div>
                        {{#if paymentData.cardInfo}}
                        <div class="info-row">
                            <div class="info-label">Thông tin thẻ:</div>
                            <div class="info-value">{{paymentData.cardInfo.type}} - **** {{paymentData.cardInfo.last4}}</div>
                        </div>
                        {{/if}}
                    </div>
                </div>

                <!-- Products Table -->
                <div style="margin: 30px 0;">
                    <h3 style="color: #333; margin-bottom: 15px;">Chi tiết đơn hàng</h3>
                    <table class="products-table">
                        <thead>
                            <tr>
                                <th style="width: 5%;">STT</th>
                                <th style="width: 45%;">Sản phẩm</th>
                                <th class="text-center" style="width: 12%;">SL</th>
                                <th class="text-right" style="width: 19%;">Đơn giá</th>
                                <th class="text-right" style="width: 19%;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {{#each orderData.chiTiet}}
                            <tr>
                                <td class="text-center">{{inc @index}}</td>
                                <td>{{tenSanPham}}</td>
                                <td class="text-center">{{soLuong}}</td>
                                <td class="text-right">{{formatCurrency donGia}}</td>
                                <td class="text-right">{{formatCurrency thanhTien}}</td>
                            </tr>
                            {{/each}}
                        </tbody>
                    </table>
                </div>

                <!-- Total Section -->
                <div class="total-section">
                    <div class="total-row subtotal">
                        <span>Tạm tính:</span>
                        <span>{{formatCurrency orderData.tongTien}}</span>
                    </div>
                    {{#if orderData.giaTriKhuyenMai}}
                    <div class="total-row subtotal">
                        <span>Giảm giá:</span>
                        <span style="color: #d32f2f;">-{{formatCurrency orderData.giaTriKhuyenMai}}</span>
                    </div>
                    {{/if}}
                    <div class="total-row subtotal">
                        <span>Phí vận chuyển:</span>
                        <span style="color: #4caf50; font-weight: bold;">Miễn phí vận chuyển</span>
                    </div>
                    <div class="total-row final">
                        <span>TỔNG CỘNG:</span>
                        <span>{{formatCurrency orderData.tongTienThanhToan}}</span>
                    </div>
                </div>
                
                <div style="text-align: center; margin: 30px 0; padding: 20px; background-color: #f8f9fa; border-radius: 8px;">
                    <h3 style="color: #2e7d32; margin-bottom: 15px;">Cảm ơn bạn đã thanh toán thành công!</h3>
                    <p style="color: #666; font-size: 14px; margin-bottom: 10px;">
                        Giao dịch của bạn đã được xử lý và xác nhận.
                    </p>
                    <p style="color: #888; font-size: 12px;">
                        Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ hotline: 1900-xxxxx
                    </p>
                    <p style="color: #999; font-size: 11px; margin-top: 15px; font-style: italic;">
                        Email này được gửi tự động, vui lòng không trả lời.
                    </p>
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <div class="footer-message">
                    Cảm ơn bạn đã mua sắm tại ${companyName}!
                </div>
                <div class="footer-text">
                    Đơn hàng của bạn đã được xác nhận và sẽ được xử lý trong thời gian sớm nhất.
                </div>
                <div class="footer-text">
                    Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.
                </div>
                <div class="footer-contact">
                    <strong>Hotline:</strong> ${companyPhone} | 
                    <strong>Email:</strong> <a href="mailto:${companyEmail}">${companyEmail}</a>
                    <br><br>
                    <em>Email này được gửi tự động, vui lòng không trả lời trực tiếp.</em>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
    
    return handlebars.compile(template);
  }

  // Gửi email hóa đơn với PDF đính kèm
  async sendInvoiceEmail(orderData, paymentData, customerEmail) {
    let pdfFilePath = null;
    
    try {
      // Chuẩn bị dữ liệu cho template
      const companyName = process.env.COMPANY_NAME || "ĐIỆN MÁY VIP";
      const taxCode = process.env.COMPANY_TAX_CODE || "0902026573";
      
      // Xác định trạng thái thanh toán
      const isPaid =
        paymentData.status === "Thành công" ||
        paymentData.status === "SUCCESS" ||
        paymentData.status === "Đã thanh toán";

      let statusText = "THANH TOÁN THÀNH CÔNG";
      if (paymentData.status === "Chờ thanh toán") {
        statusText = "CHỜ THANH TOÁN";
      } else if (paymentData.status === "Chưa thanh toán") {
        statusText = "CHƯA THANH TOÁN - THANH TOÁN KHI NHẬN HÀNG";
      } else if (paymentData.status === "Đang xử lý") {
        statusText = "ĐANG XỬ LÝ THANH TOÁN";
      }
      
      // Mapping phương thức thanh toán - chỉ còn 3 phương thức chính
      const getPaymentMethodName = (method) => {
        const methodMap = {
          COD: "Thanh toán khi nhận hàng",
          QR: "QR Code ngân hàng",
          CARD: "Thanh toán bằng thẻ",
          // Legacy mapping for old data
          ViDienTu: "Ví điện tử",
          TheNganHang: "Thẻ ngân hàng",
          CARD_PAYMENT: "Thanh toán bằng thẻ",
          VIETQR: "QR Code ngân hàng",
          VietQR: "QR Code ngân hàng",
        };
        return methodMap[method] || method;
      };
      
      // Kiểm tra xem có phải VietQR không
      const isVietQR =
        paymentData.method &&
        (paymentData.method.includes("VietQR") ||
          paymentData.method === "VIETQR");
      
      const templateData = {
        orderData: {
          ...orderData,
          ngayDat: new Date(orderData.ngayDat || new Date()).toLocaleDateString(
            "vi-VN",
            {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            }
          ),
          tongTienThanhToan:
            orderData.tongTien -
            (orderData.giaTriKhuyenMai || orderData.GiamGia || 0),
          taxCode: taxCode,
        },
        paymentData: {
          ...paymentData,
          method: getPaymentMethodName(paymentData.method),
          paymentDate: new Date().toLocaleDateString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          }),
          status: paymentData.status || "Đang xử lý",
          isPaid: isPaid,
          statusText: statusText,
          isVietQR: isVietQR,
          vietQRCode: isVietQR ? paymentData.vietQRCode || null : null,
        },
      };

      // Tạo QR Code cho tra cứu hóa đơn (giả lập mã bí mật)
      const secretCode = `ZEBRYML1XL8STZA`; // Mã tương tự trong hình mẫu
      const verifyUrl = `https://vinvoice.viettel.vn/utilities/invoice-search`;
      const qrContent = `${verifyUrl}?code=${secretCode}&invoice=${orderData.maDonHang}`;
      
      let qrCodeData = null;
      try {
        const qrImage = await QRCode.toDataURL(qrContent, {
          errorCorrectionLevel: "M",
          type: "image/png",
          width: 250,
          margin: 2,
        });
        
        qrCodeData = {
          image: qrImage,
          secretCode: secretCode,
          verifyUrl: verifyUrl,
        };
      } catch (qrError) {
        console.error("Error generating QR code:", qrError);
      }

      templateData.qrCodeData = qrCodeData;

      // Debug: Log dữ liệu trước khi tạo PDF
      console.log(
        "Email PDF Debug - templateData.orderData:",
        JSON.stringify(templateData.orderData, null, 2)
      );
      console.log(
        "Email PDF Debug - chiTiet:",
        JSON.stringify(templateData.orderData.chiTiet, null, 2)
      );
      console.log(
        "Email PDF Debug - giaTriKhuyenMai:",
        templateData.orderData.giaTriKhuyenMai
      );
      console.log("Email PDF Debug - GiamGia:", templateData.orderData.GiamGia);

      // Tạo PDF hóa đơn
      console.log("Creating invoice PDF...");
      console.log("PDF Input Data - orderData:", JSON.stringify(templateData.orderData, null, 2));
      console.log("PDF Input Data - paymentData:", JSON.stringify(templateData.paymentData, null, 2));
      
      const pdfResult = await pdfService.createInvoicePDF(
        templateData.orderData,
        templateData.paymentData
      );
      
      console.log("PDF Creation Result:", JSON.stringify(pdfResult, null, 2));
      
      if (!pdfResult.success) {
        console.error("Failed to create PDF:", pdfResult.error);
        console.error("PDF Error Details:", pdfResult);
      } else {
        pdfFilePath = pdfResult.filePath;
        console.log("PDF created successfully:", pdfFilePath);
        console.log("PDF file exists:", fs.existsSync(pdfFilePath));
        console.log("PDF file size:", fs.existsSync(pdfFilePath) ? fs.statSync(pdfFilePath).size : "N/A");
      }

      // Tạo template email
      const template = this.generateInvoiceEmailTemplate(
        templateData.orderData,
        templateData.paymentData,
        qrCodeData
      );
      const compiledTemplate = template(templateData);

      // Cấu hình email với PDF đính kèm
      const mailOptions = {
        from: `"${companyName}" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Hóa đơn điện tử ${orderData.maDonHang} - ${companyName}`,
        html: compiledTemplate,
        attachments: [],
      };

      // Đính kèm PDF nếu tạo thành công
      if (pdfFilePath && fs.existsSync(pdfFilePath)) {
        console.log("Adding PDF attachment:", pdfFilePath);
        mailOptions.attachments.push({
          filename: `HoaDon_${orderData.maDonHang}.pdf`,
          path: pdfFilePath,
          contentType: "application/pdf",
        });
        console.log("PDF attachment added successfully");
      } else {
        console.log("PDF file not found or not created:", pdfFilePath);
        console.log("File exists check:", pdfFilePath ? fs.existsSync(pdfFilePath) : "No file path");
      }

      // Gửi email
      console.log("Sending invoice email to:", customerEmail);
      console.log("Email options:", JSON.stringify({
        to: mailOptions.to,
        subject: mailOptions.subject,
        attachmentsCount: mailOptions.attachments.length,
        attachments: mailOptions.attachments.map(att => ({
          filename: att.filename,
          path: att.path,
          contentType: att.contentType
        }))
      }, null, 2));
      
      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent successfully:", result.messageId);
      console.log("Email response:", JSON.stringify(result, null, 2));
      
      // Xóa file PDF sau khi gửi (tùy chọn - có thể giữ lại để lưu trữ)
      // if (pdfFilePath && fs.existsSync(pdfFilePath)) {
      //   fs.unlinkSync(pdfFilePath);
      // }
      
      return {
        success: true,
        messageId: result.messageId,
        message: "Email hóa đơn đã được gửi thành công",
        pdfGenerated: pdfResult.success,
      };
    } catch (error) {
      console.error("Error sending invoice email:", error);
      
      // Xóa file PDF nếu có lỗi
      if (pdfFilePath && fs.existsSync(pdfFilePath)) {
        try {
          fs.unlinkSync(pdfFilePath);
        } catch (unlinkError) {
          console.error("Error deleting PDF file:", unlinkError);
        }
      }
      
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi email hóa đơn",
      };
    }
  }

  // Gửi email xác nhận đơn hàng (không thanh toán)
  async sendOrderConfirmationEmail(orderData, customerEmail) {
    try {
      const template = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Xác nhận đơn hàng</title>
          <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              .container { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
              .header { text-align: center; border-bottom: 3px solid #004d99; padding-bottom: 20px; margin-bottom: 30px; }
              .logo { font-size: 28px; font-weight: bold; color: #004d99; margin-bottom: 10px; }
              .info-section { margin-bottom: 25px; }
              .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <div class="logo">  SHOP ONLINE</div>
                  <h1>XÁC NHẬN ĐƠN HÀNG</h1>
                  <p>Mã đơn hàng: {{orderData.maDonHang}}</p>
              </div>
              
          </div>
      </body>
      </html>
      `;

      const compiledTemplate = handlebars.compile(template)({
        orderData: {
          ...orderData,
          ngayDat: new Date(orderData.ngayDat || new Date()).toLocaleDateString(
            "vi-VN"
          ),
        },
      });

      const mailOptions = {
        from: `"Shop Online" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Xác nhận đơn hàng - ${orderData.maDonHang}`,
        html: compiledTemplate,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Order confirmation email sent:", result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: "Email xác nhận đơn hàng đã được gửi thành công",
      };
    } catch (error) {
      console.error("Error sending confirmation email:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi email xác nhận đơn hàng",
      };
    }
  }

  // Helper function để format tiền tệ
  formatCurrency(amount) {
    // Parse string to number if needed
    const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    if (typeof numAmount !== "number" || isNaN(numAmount)) return "0 ₫";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(numAmount);
  }

  // Gửi email xác nhận thanh toán với QR code
  async sendPaymentConfirmationEmail(emailData) {
    try {
      const {
        to,
        amount,
        orderDescription,
        qrCode,
        qrImageUrl,
        qrContent,
        paymentId,
      } = emailData.data;

      console.log("📧 Payment confirmation email data:", {
        to,
        amount,
        orderDescription,
        qrCode: qrCode
          ? `QR Code present (${qrCode.substring(0, 50)}...)`
          : "No QR Code",
        qrImageUrl: qrImageUrl
          ? `QR Image URL present: ${qrImageUrl}`
          : "No QR Image URL",
        qrContent: qrContent ? "QR Content present" : "No QR Content",
        paymentId,
      });

      // Tải ảnh QR về server nếu có URL
      let qrImagePath = null;
      if (qrImageUrl) {
        try {
          qrImagePath = await this.downloadQRImage(qrImageUrl, paymentId);
          console.log("✅ QR image downloaded successfully:", qrImagePath);
        } catch (error) {
          console.error("❌ Failed to download QR image:", error);
          // Tiếp tục gửi email mà không có ảnh QR
        }
      }
      
      const template = `
      <!DOCTYPE html>
      <html lang="vi">
      <head>
          <meta charset="UTF-8">
          <title>Xác nhận thanh toán thành công</title>
          <style>
    /* RESET & BASE */
              body {
                  margin: 0;
                  padding: 0;
      background-color: #f5f6fa;
      font-family: Arial, Helvetica, sans-serif;
      color: #333333;
      -webkit-text-size-adjust: none;
    }
    table {
      border-spacing: 0;
      width: 100%;
    }
    img {
      display: block;
      border: 0;
      max-width: 100%;
              }
              .container {
                  max-width: 600px;
      margin: 20px auto;
      background: #ffffff;
      border-radius: 8px;
      overflow: hidden;
    }

    /* HEADER */
              .header {
      background: #4F46E5;
      color: #ffffff;
                  text-align: center;
      padding: 30px 20px;
    }
    .header h1 {
      margin: 10px 0 5px;
      font-size: 22px;
                  font-weight: 600;
              }
    .header p {
      margin: 0;
                  font-size: 14px;
      opacity: 0.9;
    }

    /* MAIN CONTENT */
    .section {
      padding: 25px 30px;
      border-bottom: 1px solid #e5e7eb;
    }
    .section h3 {
                  font-size: 18px;
      color: #111827;
      margin-top: 0;
      margin-bottom: 15px;
      border-left: 4px solid #4F46E5;
      padding-left: 10px;
              }
              .info-row {
      font-size: 14px;
      padding: 6px 0;
              }
              .info-label {
                  font-weight: 600;
      color: #4b5563;
    }
    .amount {
      color: #059669;
      font-weight: bold;
      font-size: 16px;
    }
    .status {
      color: #059669;
      font-weight: bold;
    }

    /* QR SECTION */
    .qr-wrapper {
                  text-align: center;
      padding: 15px 0;
    }
    .qr-wrapper img {
      width: 200px;
      border: 1px solid #e5e7eb;
                  border-radius: 6px;
              }
    .qr-note {
      font-size: 13px;
                  color: #6b7280;
                  margin-top: 10px;
    }

    /* FOOTER */
              .footer {
      background: #4F46E5;
                  color: white;
                  text-align: center;
      padding: 25px 15px;
      font-size: 13px;
    }
    .footer p {
      margin: 6px 0;
    }
    .footer small {
      opacity: 0.8;
      display: block;
      margin-top: 10px;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 100%;
        border-radius: 0;
      }
      .section {
        padding: 20px 15px;
      }
              }
          </style>
      </head>
      <body>
  <table role="presentation" class="container">
    <!-- HEADER -->
    <tr>
      <td class="header">
        <h1>Thanh toán thành công ✓</h1>
        <p>Mã giao dịch: {{paymentId}}</p>
      </td>
    </tr>

    <!-- THÔNG TIN THANH TOÁN -->
    <tr>
      <td class="section">
        <h3>Thông tin thanh toán</h3>
                  <div class="info-row">
                      <span class="info-label">Số tiền:</span>
          <span class="amount">{{formatCurrency amount}}</span>
                  </div>
                  <div class="info-row">
          <span class="info-label">Nội dung:</span> {{orderDescription}}
                  </div>
                  <div class="info-row">
          <span class="info-label">Thời gian:</span> {{currentDate}}
                  </div>
      </td>
    </tr>

    <!-- QR CODE -->
              {{#if qrImageUrl}}
    <tr>
      <td class="section">
        <h3>Mã QR thanh toán VietQR</h3>
        <div class="qr-wrapper">
          <img src="cid:qr-code-image" alt="QR Code">
          <p class="qr-note">Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng</p>
                  </div>
      </td>
    </tr>
              {{else if qrCode}}
    <tr>
      <td class="section">
        <h3>Mã QR thanh toán VietQR</h3>
        <div class="qr-wrapper">
          <img src="{{qrCode}}" alt="QR Code">
          <p class="qr-note">Quét mã QR bằng ứng dụng ngân hàng để thanh toán nhanh chóng</p>
                  </div>
      </td>
    </tr>
              {{/if}}

    <!-- THÔNG TIN CHUYỂN KHOẢN -->
    <tr>
      <td class="section">
        <h3>Thông tin chuyển khoản</h3>
        <div class="info-row"><span class="info-label">Người nhận:</span> PHAM HOANG VIET ANH</div>
        <div class="info-row"><span class="info-label">Số tài khoản:</span> <span style="font-family:monospace;">927241616</span></div>
        <div class="info-row"><span class="info-label">Số tiền:</span> <span class="amount">{{formatCurrency amount}}</span></div>
        <div class="info-row"><span class="info-label">Nội dung:</span> {{orderDescription}}</div>

              {{#if qrContent}}
        <div style="background:#f3f4f6; padding:10px; margin-top:15px; border-radius:4px; font-size:13px;">
          <strong>Nội dung QR:</strong><br>
          <code style="word-break:break-all;">{{qrContent}}</code>
          <p style="font-size:12px; color:#6b7280; margin-top:8px;">(Bạn có thể sao chép nội dung này để sử dụng trong ứng dụng ngân hàng)</p>
              </div>
              {{/if}}
      </td>
    </tr>

    <!-- HƯỚNG DẪN -->
    <tr>
      <td class="section">
        <h3>Hướng dẫn thanh toán</h3>
        <ol style="padding-left:20px; font-size:14px; color:#374151; margin:0;">
          <li>Mở ứng dụng ngân hàng</li>
          <li>Chọn “Quét mã QR”</li>
          <li>Quét mã QR trên</li>
          <li>Xác nhận thanh toán</li>
        </ol>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td class="footer">
        <p><strong>Cảm ơn bạn đã thanh toán!</strong></p>
        <p>Giao dịch của bạn đã được xử lý và xác nhận.</p>
        <p>Liên hệ hỗ trợ: <a href="tel:1900xxxx" style="color:white; text-decoration:underline;">1900-xxxx</a></p>
        <small>Email này được gửi tự động, vui lòng không trả lời.</small>
      </td>
    </tr>
  </table>
      </body>
      </html>

      `;

      const compiledTemplate = handlebars.compile(template)({
        amount: amount,
        orderDescription: orderDescription,
        qrCode: qrCode,
        qrImageUrl: qrImageUrl,
        qrContent: qrContent,
        paymentId: paymentId,
        currentDate: new Date().toLocaleString("vi-VN"),
      });

      // Tạo attachments nếu có QR code
      const attachments = [];
      
      // Ưu tiên sử dụng ảnh đã tải về
      if (qrImagePath && fs.existsSync(qrImagePath)) {
        attachments.push({
          filename: `qr-code-${paymentId}.jpg`,
          path: qrImagePath,
          cid: "qr-code-image",
        });
        console.log(
          "📎 QR attachment created from downloaded image:",
          qrImagePath
        );
      } else if (qrCode && qrCode.startsWith("data:image/")) {
        // Fallback về base64 nếu không tải được ảnh
        const matches = qrCode.match(/^data:image\/([a-zA-Z]*);base64,(.*)$/);
        if (matches) {
          attachments.push({
            filename: `qr-code-${paymentId}.${matches[1]}`,
            content: matches[2],
            encoding: "base64",
            cid: "qr-code-image",
          });
          console.log("📎 QR attachment created from base64 (fallback)");
        } else {
          console.log("❌ Failed to parse QR code data URL");
        }
      } else {
        console.log(
          "❌ No QR code or invalid format:",
          qrCode ? "QR code present but invalid format" : "No QR code"
        );
      }

      const mailOptions = {
        from: `"Shop Online" <${process.env.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: compiledTemplate,
        attachments: attachments,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Payment confirmation email sent:", result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: "Email xác nhận thanh toán đã được gửi thành công",
      };
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi email xác nhận thanh toán",
      };
    }
  }

  // Tải ảnh QR từ URL về server
  async downloadQRImage(qrImageUrl, paymentId) {
    return new Promise((resolve, reject) => {
      const url = new URL(qrImageUrl);
      const protocol = url.protocol === "https:" ? https : http;

      const filePath = path.join(
        __dirname,
        "../uploads/qr-codes",
        `qr-${paymentId}.jpg`
      );
      
      // Tạo thư mục nếu chưa tồn tại
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const file = fs.createWriteStream(filePath);
      
      protocol
        .get(qrImageUrl, (response) => {
        response.pipe(file);
        
          file.on("finish", () => {
          file.close();
            console.log("📥 QR image downloaded:", filePath);
          resolve(filePath);
        });
        
          file.on("error", (err) => {
          fs.unlink(filePath, () => {}); // Xóa file nếu có lỗi
            console.error("❌ Error downloading QR image:", err);
          reject(err);
        });
        })
        .on("error", (err) => {
          console.error("❌ Error downloading QR image:", err);
        reject(err);
      });
    });
  }

  // Generic send email method
  async sendEmail(emailData) {
    try {
      if (emailData.template === "payment-confirmation") {
        return await this.sendPaymentConfirmationEmail(emailData);
      }
      
      // Default email sending logic
      const mailOptions = {
        from: `"Shop Online" <${process.env.EMAIL_USER}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html || emailData.template,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log("Email sent:", result.messageId);
      
      return {
        success: true,
        messageId: result.messageId,
        message: "Email đã được gửi thành công",
      };
    } catch (error) {
      console.error("Error sending email:", error);
      return {
        success: false,
        error: error.message,
        message: "Không thể gửi email",
      };
    }
  }

  // Test kết nối email
  async testConnection() {
    try {
      await this.transporter.verify();
      console.log("Email service is ready to send messages");
      return true;
    } catch (error) {
      console.error("Email service connection failed:", error);
      return false;
    }
  }
}

// Đăng ký helper cho handlebars
handlebars.registerHelper("formatCurrency", function (amount) {
  // Parse string to number if needed
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  if (typeof numAmount !== "number" || isNaN(numAmount)) return "0 ₫";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(numAmount);
});

// Helper để tăng index (cho STT trong bảng)
handlebars.registerHelper("inc", function (value) {
  return parseInt(value) + 1;
});

module.exports = new EmailService();
