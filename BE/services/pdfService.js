const puppeteer = require('puppeteer');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

class PDFService {
  // Tạo QR Code dạng base64
  async generateQRCode(data) {
    try {
      return await QRCode.toDataURL(data);
    } catch (error) {
      console.error('Error generating QR code:', error);
      return null;
    }
  }

  // Format tiền tệ VND
  formatCurrency(amount) {
    if (typeof amount !== 'number') return '0 ₫';
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  }

  // Chuyển số thành chữ tiếng Việt
  convertNumberToWords(num) {
    if (num === 0) return 'Không đồng';
    
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const teens = ['mười', 'mười một', 'mười hai', 'mười ba', 'mười bốn', 'mười lăm', 'mười sáu', 'mười bảy', 'mười tám', 'mười chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    
    function convertLessThanThousand(n) {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) {
        const ten = Math.floor(n / 10);
        const one = n % 10;
        return tens[ten] + (one ? ' ' + (one === 1 && ten > 1 ? 'mốt' : ones[one]) : '');
      }
      const hundred = Math.floor(n / 100);
      const rest = n % 100;
      let result = ones[hundred] + ' trăm';
      if (rest) {
        if (rest < 10) {
          result += ' linh ' + ones[rest];
        } else {
          result += ' ' + convertLessThanThousand(rest);
        }
      }
      return result;
    }
    
    if (num < 1000) {
      return convertLessThanThousand(num).charAt(0).toUpperCase() + convertLessThanThousand(num).slice(1) + ' đồng';
    }
    
    const billion = Math.floor(num / 1000000000);
    const million = Math.floor((num % 1000000000) / 1000000);
    const thousand = Math.floor((num % 1000000) / 1000);
    const remainder = num % 1000;
    
    let result = '';
    if (billion) result += convertLessThanThousand(billion) + ' tỷ';
    if (million) result += (result ? ' ' : '') + convertLessThanThousand(million) + ' triệu';
    if (thousand) result += (result ? ' ' : '') + convertLessThanThousand(thousand) + ' nghìn';
    if (remainder) result += (result ? ' ' : '') + convertLessThanThousand(remainder);
    
    result = result.trim().charAt(0).toUpperCase() + result.trim().slice(1);
    return result + ' đồng';
  }

  // Tạo HTML template cho hóa đơn PDF
  generateInvoicePDFTemplate(orderData, paymentData, companyInfo) {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    // Debug: Log orderData để kiểm tra dữ liệu
    console.log('PDF Debug - orderData:', JSON.stringify(orderData, null, 2));
    console.log('PDF Debug - chiTiet:', JSON.stringify(orderData.chiTiet, null, 2));
    console.log('PDF Debug - giaTriKhuyenMai:', orderData.giaTriKhuyenMai);
    console.log('PDF Debug - GiamGia:', orderData.GiamGia);
    
    // Debug: Log từng item trong chiTiet
    if (orderData.chiTiet && Array.isArray(orderData.chiTiet)) {
      orderData.chiTiet.forEach((item, index) => {
        console.log(`PDF Debug - chiTiet[${index}]:`, {
          tenSanPham: item.tenSanPham,
          soLuong: item.soLuong,
          donGia: item.donGia,
          Gia: item.Gia,
          thanhTien: item.thanhTien,
          // Debug thêm các field khác
          allFields: Object.keys(item),
          rawItem: item
        });
      });
    }

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="UTF-8">
        <title>Hóa đơn giá trị gia tăng</title>
        <style>
            @page {
                size: A4;
                margin: 8mm;
            }
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 11px;
                line-height: 1.2;
                color: #000;
                background-color: #fff;
            }
            
            .invoice-wrapper {
                border: 2px solid #000;
                padding: 10px;
                position: relative;
                min-height: 297mm;
            }
            
            .header-section {
                border-bottom: 2px solid #000;
                padding-bottom: 10px;
                margin-bottom: 15px;
            }
            
            .main-title {
                text-align: center;
                font-size: 20px;
                font-weight: bold;
                color: #d32f2f;
                margin-bottom: 5px;
                text-transform: uppercase;
            }
            
            .subtitle {
                text-align: center;
                font-size: 12px;
                color: #666;
                margin-bottom: 10px;
            }
            
            .invoice-info {
                display: table;
                width: 100%;
                margin-bottom: 15px;
            }
            
            .invoice-left {
                display: table-cell;
                width: 50%;
                vertical-align: top;
            }
            
            .invoice-right {
                display: table-cell;
                width: 50%;
                text-align: right;
                vertical-align: top;
            }
            
            .company-section, .customer-section {
                margin-bottom: 15px;
                border: 1px solid #ddd;
                padding: 10px;
            }
            
            .section-title {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 8px;
                color: #000;
                border-bottom: 1px solid #ddd;
                padding-bottom: 3px;
            }
            
            .company-info, .customer-info {
                font-size: 10px;
                line-height: 1.4;
            }
            
            .company-info div, .customer-info div {
                margin-bottom: 3px;
            }
            
            .products-section {
                margin-bottom: 15px;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
                font-size: 10px;
            }
            
            .products-table th, .products-table td {
                border: 1px solid #000;
                padding: 6px 4px;
                text-align: center;
            }
            
            .products-table th {
                background-color: #f5f5f5;
                font-weight: bold;
            }
            
            .total-section {
                margin: 15px 0;
                font-size: 11px;
                border: 1px solid #000;
                padding: 10px;
            }
            
            .total-row {
                display: flex;
                justify-content: space-between;
                padding: 4px 0;
                border-bottom: 1px solid #ddd;
            }
            
            .discount-row {
                color: #d32f2f;
            }
            
            .final-row {
                font-weight: bold;
                border-top: 2px solid #000;
                margin-top: 8px;
                padding-top: 8px;
            }
            
            .amount-words {
                margin: 15px 0;
                font-size: 11px;
                padding: 8px;
                background-color: #f9f9f9;
                border: 1px solid #ddd;
            }
            
            
            .header-section {
                display: table;
                width: 100%;
                margin-bottom: 10px;
            }
            
            .header-left {
                display: table-cell;
                width: 50%;
                vertical-align: top;
            }
            
            .header-center {
                display: table-cell;
                width: 30%;
                text-align: center;
                vertical-align: top;
            }
            
            .header-right {
                display: table-cell;
                width: 20%;
                text-align: right;
                vertical-align: top;
                font-size: 11px;
            }
            
            .company-logo {
                font-size: 18px;
                font-weight: bold;
                color: #004d99;
                margin-bottom: 6px;
                line-height: 1.2;
            }
            
            .company-tagline {
                font-size: 11px;
                color: #666;
                margin-bottom: 6px;
                font-style: italic;
            }
            
            .shipping-badge {
                font-size: 11px;
                color: #2e7d32;
                font-weight: bold;
                background-color: #e8f5e8;
                padding: 4px 8px;
                border: 1px solid #4caf50;
                border-radius: 4px;
                display: inline-block;
                margin-bottom: 6px;
            }
            
            .company-name {
                font-size: 11px;
                font-weight: bold;
                margin-bottom: 4px;
                line-height: 1.3;
            }
            
            .company-tax {
                font-size: 10px;
                margin-bottom: 3px;
            }
            
            .company-account {
                font-size: 10px;
                margin-bottom: 3px;
            }
            
            .company-location {
                font-size: 10px;
                margin-bottom: 2px;
                line-height: 1.3;
            }
            
            .invoice-title {
                font-size: 18px;
                font-weight: bold;
                text-transform: uppercase;
                margin-bottom: 3px;
            }
            
            .invoice-subtitle {
                font-size: 11px;
                margin-bottom: 5px;
            }
            
            .invoice-date {
                font-size: 11px;
                font-style: italic;
            }
            
            .invoice-meta {
                text-align: right;
            }
            
            .meta-row {
                margin-bottom: 3px;
            }
            
            .seller-info {
                border: 1px solid #000;
                padding: 8px;
                margin: 10px 0;
                font-size: 11px;
            }
            
            .info-line {
                margin-bottom: 3px;
            }
            
            .buyer-info {
                margin: 10px 0;
                font-size: 11px;
            }
            
            .buyer-row {
                display: table;
                width: 100%;
                margin-bottom: 4px;
                line-height: 1.4;
            }
            
            .buyer-label {
                display: table-cell;
                width: 22%;
                font-weight: normal;
                padding-right: 5px;
            }
            
            .buyer-value {
                display: table-cell;
                width: 78%;
            }
            
            .products-table {
                width: 100%;
                border-collapse: collapse;
                margin: 15px 0;
                font-size: 11px;
            }
            
            .products-table th {
                border: 1px solid #000;
                padding: 8px 5px;
                text-align: center;
                font-weight: bold;
                background-color: #e8e8e8;
            }
            
            .products-table td {
                border: 1px solid #000;
                padding: 7px 5px;
            }
            
            .products-table tbody tr:nth-child(even) {
                background-color: #fafafa;
            }
            
            .text-center {
                text-align: center;
            }
            
            .text-right {
                text-align: right;
            }
            
            .text-left {
                text-align: left;
            }
            
            .total-text {
                padding: 8px 10px;
                font-size: 11px;
                border: 1px solid #ddd;
                background-color: #f9f9f9;
                margin: 10px 0;
            }
            
            .total-text em {
                font-style: italic;
                text-transform: capitalize;
            }
            
            .signature-section {
                margin-top: 25px;
                display: table;
                width: 100%;
            }
            
            .signature-left {
                display: table-cell;
                width: 50%;
                text-align: center;
                vertical-align: top;
                padding-right: 10px;
            }
            
            .signature-right {
                display: table-cell;
                width: 50%;
                text-align: center;
                vertical-align: top;
                padding-left: 10px;
            }
            
            .signature-title {
                font-weight: bold;
                font-size: 12px;
                margin-bottom: 5px;
                text-transform: uppercase;
            }
            
            .signature-name {
                font-weight: bold;
                color: #c00;
                font-size: 11px;
                margin-top: 15px;
            }
            
            .signature-valid {
                color: #0a0;
                font-size: 10px;
                margin-top: 2px;
                font-style: italic;
            }
            
            .signature-info div {
                margin-bottom: 3px;
            }
            
            .footer-note {
                margin-top: 20px;
                font-size: 9px;
                font-style: italic;
                text-align: center;
                color: #666;
                line-height: 1.4;
            }
            
            @media print {
                .invoice-wrapper {
                    border-width: 2px;
                }
            }
        </style>
    </head>
    <body>
        <div class="invoice-wrapper">
            <!-- Header Section -->
                    <div class="header-section">
                <div class="main-title">HÓA ĐƠN BÁN HÀNG</div>
                <div class="subtitle">Hóa đơn điện tử</div>
                
                <div class="invoice-info">
                    <div class="invoice-left">
                        <div><strong>Mẫu số:</strong> 01GTKT0/001</div>
                        <div><strong>Ký hiệu:</strong> DM/20E</div>
                        </div>
                    <div class="invoice-right">
                        <div><strong>Số:</strong> <span style="color: #d32f2f;">${orderData.maDonHang}</span></div>
                        <div><strong>Ngày:</strong> ${day}/${month}/${year}</div>
                            </div>
                        </div>
                    </div>
            
            <!-- Company Info Section -->
            <div class="company-section">
                <div class="section-title">Đơn vị bán hàng</div>
                <div class="company-info">
                    <div><strong>Đơn vị bán hàng:</strong> ${companyInfo.name}</div>
                    <div><strong>Mã số thuế:</strong> ${companyInfo.taxCode || '0902026739'}</div>
                    <div><strong>Địa chỉ:</strong> ${companyInfo.address}</div>
                    <div><strong>Điện thoại:</strong> ${companyInfo.phone}</div>
                    <div><strong>Số tài khoản:</strong>927241616</div>
                    <div><strong>Ngân hàng:</strong> Ngân hàng MB Bank Quân Đội</div>
                        </div>
                        </div>
            
            <!-- Customer Info Section -->
            <div class="customer-section">
                <div class="section-title">Người mua hàng</div>
                <div class="customer-info">
                    <div><strong>Họ tên người mua hàng:</strong> ${orderData.hoTen}</div>
                    <div><strong>Tên đơn vị:</strong> ${orderData.hoTen}</div>
                    <div><strong>Địa chỉ:</strong> ${orderData.diaChi}</div>
                    <div><strong>Hình thức thanh toán:</strong> ${paymentData.method || 'Thanh toán khi nhận hàng'}</div>
                        </div>
                    </div>
            
            <!-- Products Table Section -->
            <div class="products-section">
                <div class="section-title">Hình thức thanh toán: ${paymentData.method || 'Thanh toán khi nhận hàng'}</div>
                
                    <table class="products-table">
                        <thead>
                            <tr>
                            <th style="width: 8%;">STT</th>
                            <th style="width: 50%;">Tên hàng hóa, dịch vụ</th>
                            <th style="width: 15%;">Số lượng</th>
                            <th style="width: 15%;">Đơn giá</th>
                            <th style="width: 12%;">Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${orderData.chiTiet.map((item, index) => `
                            <tr>
                                <td class="text-center">${index + 1}</td>
                                <td class="text-left" style="padding-left: 8px;">${item.tenSanPham}</td>
                                <td class="text-center">${item.soLuong}</td>
                            <td class="text-right" style="padding-right: 8px;">${this.formatCurrency(parseFloat(item.donGia || item.Gia || 0)).replace('₫', '').trim()}</td>
                            <td class="text-right" style="padding-right: 8px;"><strong>${this.formatCurrency(parseFloat(item.thanhTien || (item.soLuong * parseFloat(item.donGia || item.Gia || 0)))).replace('₫', '').trim()}</strong></td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                <!-- Total Section -->
                <div class="total-section">
                    <div class="total-row">
                        <div class="total-label">Tạm tính:</div>
                        <div class="total-value">${this.formatCurrency(parseFloat(orderData.tongTien)).replace('₫', '').trim()}</div>
                    </div>
                    ${(parseFloat(orderData.giaTriKhuyenMai || orderData.GiamGia || 0)) > 0 ? `
                    <div class="total-row discount-row">
                        <div class="total-label">Giảm giá:</div>
                        <div class="total-value" style="color: #d32f2f;">-${this.formatCurrency(parseFloat(orderData.giaTriKhuyenMai || orderData.GiamGia || 0)).replace('₫', '').trim()}</div>
                    </div>
                    ` : ''}
                    <div class="total-row">
                        <div class="total-label">Phí vận chuyển:</div>
                        <div class="total-value" style="color: #4caf50; font-weight: bold;">Miễn phí</div>
                    </div>
                    <div class="total-row final-row">
                        <div class="total-label"><strong>TỔNG CỘNG TIỀN THANH TOÁN:</strong></div>
                        <div class="total-value"><strong>${this.formatCurrency(parseFloat(orderData.tongTien) - parseFloat(orderData.giaTriKhuyenMai || orderData.GiamGia || 0)).replace('₫', '').trim()}</strong></div>
                    </div>
                </div>
                
                <!-- Amount in Words -->
                <div class="amount-words">
                    <strong>Số tiền viết bằng chữ:</strong> <em>${this.convertNumberToWords(Math.round(parseFloat(orderData.tongTien) - parseFloat(orderData.giaTriKhuyenMai || orderData.GiamGia || 0)))}</em>
                    </div>
                    
                    <!-- Signature Section -->
                    <div class="signature-section">
                        <div class="signature-left">
                        <div class="signature-title">Người mua hàng</div>
                 
                        </div>
                        <div class="signature-right">
                        <div class="signature-title">Người bán hàng</div>
                            <div class="signature-valid">Signature valid</div>
                        <div class="signature-info">
                            <div>Ký bởi</div>
                            <div style="color: #d32f2f; font-weight: bold;">${companyInfo.name}</div>
                           
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Tạo PDF từ HTML
  async generatePDFFromHTML(html, outputPath) {
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      await page.pdf({
        path: outputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '15mm',
          right: '15mm',
          bottom: '15mm',
          left: '15mm'
        }
      });
      
      console.log('PDF generated successfully:', outputPath);
      return outputPath;
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  // Tạo hóa đơn PDF
  async createInvoicePDF(orderData, paymentData) {
    try {
      console.log('PDF Service - Starting PDF creation');
      console.log('PDF Service - orderData:', JSON.stringify(orderData, null, 2));
      console.log('PDF Service - paymentData:', JSON.stringify(paymentData, null, 2));
      
      // Thông tin công ty - Có thể lấy từ config hoặc database
      const companyInfo = {
        name: process.env.COMPANY_NAME || 'ĐIỆN MÁY VIP',
        address: process.env.COMPANY_ADDRESS || 'Quý Khê - Cẩm Giang - Hải Phòng',
        phone: process.env.COMPANY_PHONE || '0999.888.666',
        email: process.env.COMPANY_EMAIL || process.env.EMAIL_USER || 'support@dienmayvip.vn',
        taxCode: process.env.COMPANY_TAX_CODE || '0123456789',
        logo: process.env.COMPANY_LOGO_URL || null
      };

      console.log('PDF Service - companyInfo:', JSON.stringify(companyInfo, null, 2));

      // Tạo HTML từ template (không có QR code trong PDF)
      const html = this.generateInvoicePDFTemplate(orderData, paymentData, companyInfo);
      console.log('PDF Service - HTML generated, length:', html.length);
      
      // Tạo thư mục uploads/invoices nếu chưa có
      const invoicesDir = path.join(__dirname, '../uploads/invoices');
      console.log('PDF Service - invoicesDir:', invoicesDir);
      if (!fs.existsSync(invoicesDir)) {
        console.log('PDF Service - Creating invoices directory');
        fs.mkdirSync(invoicesDir, { recursive: true });
      }
      
      // Tạo tên file PDF
      const fileName = `invoice_${orderData.maDonHang}_${Date.now()}.pdf`;
      const outputPath = path.join(invoicesDir, fileName);
      console.log('PDF Service - outputPath:', outputPath);
      
      // Generate PDF
      console.log('PDF Service - Starting PDF generation');
      await this.generatePDFFromHTML(html, outputPath);
      console.log('PDF Service - PDF generation completed');
      
      // Kiểm tra file đã được tạo
      const fileExists = fs.existsSync(outputPath);
      const fileSize = fileExists ? fs.statSync(outputPath).size : 0;
      console.log('PDF Service - File exists:', fileExists);
      console.log('PDF Service - File size:', fileSize);
      
      return {
        success: true,
        filePath: outputPath,
        fileName: fileName
      };
    } catch (error) {
      console.error('Error creating invoice PDF:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new PDFService();

