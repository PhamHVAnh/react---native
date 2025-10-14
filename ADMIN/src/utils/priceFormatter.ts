/**
 * Format số tiền theo chuẩn Việt Nam (VND)
 * @param amount - Số tiền cần format
 * @param showCurrency - Hiển thị ký hiệu tiền tệ (mặc định: true)
 * @param decimals - Số chữ số thập phân (mặc định: 0)
 * @returns Chuỗi giá tiền đã được format
 */
export const formatPrice = (
  amount: number | string | null | undefined,
  showCurrency: boolean = true,
  decimals: number = 0
): string => {
  // Kiểm tra đầu vào
  if (amount === null || amount === undefined || amount === '') {
    return showCurrency ? '0 ₫' : '0';
  }

  // Chuyển đổi thành số
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Kiểm tra số hợp lệ
  if (isNaN(numericAmount)) {
    return showCurrency ? '0 ₫' : '0';
  }

  // Format số với dấu phẩy ngăn cách hàng nghìn
  const formattedAmount = numericAmount.toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  // Trả về kết quả
  return showCurrency ? `${formattedAmount} ₫` : formattedAmount;
};

/**
 * Format giá tiền cho hiển thị trong bảng
 */
export const formatTablePrice = (amount: number | string | null | undefined): string => {
  return formatPrice(amount, true, 0);
};

/**
 * Format giá tiền cho input (không có ký hiệu tiền tệ)
 */
export const formatInputPrice = (amount: number | string | null | undefined): string => {
  return formatPrice(amount, false, 0);
};

/**
 * Parse giá tiền từ string (loại bỏ ký hiệu tiền tệ và dấu phẩy)
 */
export const parsePrice = (priceString: string): number => {
  if (!priceString) return 0;
  
  // Loại bỏ ký hiệu tiền tệ, dấu phẩy và khoảng trắng
  const cleanString = priceString.replace(/[₫,\s]/g, '');
  const parsed = parseFloat(cleanString);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Format phần trăm
 */
export const formatPercentage = (value: number | string | null | undefined): string => {
  if (value === null || value === undefined || value === '') {
    return '0%';
  }

  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numericValue)) {
    return '0%';
  }

  return `${numericValue}%`;
};

/**
 * Format số lượng
 */
export const formatQuantity = (quantity: number | string | null | undefined): string => {
  if (quantity === null || quantity === undefined || quantity === '') {
    return '0';
  }

  const numericQuantity = typeof quantity === 'string' ? parseInt(quantity, 10) : quantity;
  
  if (isNaN(numericQuantity)) {
    return '0';
  }

  return numericQuantity.toLocaleString('vi-VN');
};
