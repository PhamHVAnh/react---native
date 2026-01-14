import api from './api';

export interface PaymentTransaction {
  PaymentID: string;
  OrderID: string;
  PaymentMethod: string;
  Amount: number;
  Status: 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
  PaymentProvider: string;
  TransactionRef: string;
  QRCode?: string;
  QRContent?: string;
  CustomerInfo?: string | {
    name?: string;
    email?: string;
    phone?: string;
    cardType?: string;
    cardLast4?: string;
  };
  CreatedAt: string;
  UpdatedAt: string;
  // Thông tin khách hàng từ đơn hàng
  HoTen?: string;
  SoDienThoai?: string;
  Email?: string;
  DiaChi?: string;
}

export interface PaymentStats {
  totalTransactions: number;
  totalAmount: number;
  successRate: number;
  pendingCount: number;
  successCount: number;
  failedCount: number;
  cancelledCount: number;
}

export interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  requiresCardDetails?: boolean;
  supportsCardTypes?: string[];
  supportsQR?: boolean;
}

export interface VietQRConfig {
  clientId: string;
  accountNo: string;
  accountName: string;
  bankCode: string;
  apiUrl: string;
  hasApiKey: boolean;
  imageUrlTemplate: string;
}

class PaymentService {
  // Lấy danh sách tất cả giao dịch thanh toán
  async getAllTransactions(params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentMethod?: string;
    startDate?: string;
    endDate?: string;
    search?: string;
  }): Promise<{ data: PaymentTransaction[]; total: number }> {
    try {
      const queryParams = new URLSearchParams();
      
      if (params?.page) queryParams.append('page', params.page.toString());
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.status) queryParams.append('status', params.status);
      if (params?.paymentMethod) queryParams.append('paymentMethod', params.paymentMethod);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.search) queryParams.append('search', params.search);

      const response = await api.get(`/payment/transactions?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment transactions:', error);
      throw error;
    }
  }

  // Lấy thông tin chi tiết giao dịch
  async getTransactionById(paymentId: string): Promise<PaymentTransaction> {
    try {
      const response = await api.get(`/payment/status/${paymentId}`);
      return response.data.payment;
    } catch (error) {
      console.error('Error fetching payment transaction:', error);
      throw error;
    }
  }

  // Lấy thống kê thanh toán
  async getPaymentStats(): Promise<PaymentStats> {
    try {
      const response = await api.get('/payment/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      throw error;
    }
  }

  // Lấy danh sách phương thức thanh toán
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/payment/methods');
      return response.data.paymentMethods;
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  // Cập nhật trạng thái thanh toán
  async updatePaymentStatus(transactionRef: string, status: string): Promise<void> {
    try {
      await api.post('/payment/vietqr/update-status', {
        transactionRef,
        status
      });
    } catch (error) {
      console.error('Error updating payment status:', error);
      throw error;
    }
  }

  // Kiểm tra cấu hình VietQR
  async checkVietQRConfig(): Promise<VietQRConfig> {
    try {
      const response = await api.get('/payment/vietqr/config');
      return response.data.config;
    } catch (error) {
      console.error('Error checking VietQR config:', error);
      throw error;
    }
  }

  // Test VietQR API
  async testVietQRAPI(amount: number = 100000, description: string = 'Test payment'): Promise<{
    success: boolean;
    message: string;
    response?: {
      status: number;
      data: unknown;
    };
    error?: {
      status?: number;
      statusText?: string;
      data?: unknown;
      message: string;
    };
  }> {
    try {
      const response = await api.post('/payment/vietqr/test', {
        amount,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error testing VietQR API:', error);
      throw error;
    }
  }

  // Parse VietQR content
  async parseVietQRContent(qrUrl: string): Promise<{
    success: boolean;
    data?: {
      accountNo: string;
      accountName: string;
      amount: number | null;
      description: string;
      originalUrl: string;
    };
    error?: string;
  }> {
    try {
      const response = await api.post('/payment/vietqr/parse', {
        qrUrl
      });
      return response.data;
    } catch (error) {
      console.error('Error parsing VietQR content:', error);
      throw error;
    }
  }

  // Xác nhận thanh toán
  async confirmPayment(paymentData: {
    paymentId: string;
    qrCode?: string;
    qrContent?: string;
    qrImageUrl?: string;
    amount: number;
    orderDescription: string;
    customerEmail: string;
  }): Promise<void> {
    try {
      await api.post('/payment/confirm-payment', paymentData);
    } catch (error) {
      console.error('Error confirming payment:', error);
      throw error;
    }
  }

  // Lấy báo cáo thanh toán theo khoảng thời gian
  async getPaymentReport(startDate: string, endDate: string): Promise<{
    transactions: PaymentTransaction[];
    stats: PaymentStats;
    chartData: Array<{
      date: string;
      amount: number;
      count: number;
    }>;
  }> {
    try {
      const response = await api.get(`/payment/report?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching payment report:', error);
      throw error;
    }
  }

  // Xuất báo cáo thanh toán
  async exportPaymentReport(startDate: string, endDate: string, format: 'excel' | 'pdf' = 'excel'): Promise<Blob> {
    try {
      const response = await api.get(`/payment/export?startDate=${startDate}&endDate=${endDate}&format=${format}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      console.error('Error exporting payment report:', error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();
