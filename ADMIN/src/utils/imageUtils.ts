/**
 * Utility functions for handling image paths
 */

/**
 * Xử lý đường dẫn ảnh để hỗ trợ cả cũ và mới
 * @param imagePath - Đường dẫn ảnh từ database
 * @returns URL đầy đủ để hiển thị ảnh
 */
export const getImageUrl = (imagePath: string | null | undefined): string | undefined => {
  if (!imagePath) return undefined;
  
  console.log('ImageUtils - Processing image path:', imagePath);
  
  // Kiểm tra xem có phải JSON array không
  if (imagePath.startsWith('[') && imagePath.endsWith(']')) {
    try {
      const imageArray = JSON.parse(imagePath);
      if (Array.isArray(imageArray) && imageArray.length > 0) {
        const firstImage = imageArray[0];
        console.log('ImageUtils - JSON array detected, using first image:', firstImage);
        return getImageUrl(firstImage); // Recursive call for the first image
      }
    } catch (error) {
      console.error('ImageUtils - Error parsing JSON array:', error);
    }
  }
  
  // Nếu đã là URL đầy đủ thì trả về luôn
  if (imagePath.startsWith('http')) {
    console.log('ImageUtils - Full URL detected:', imagePath);
    return imagePath;
  }
  
  // Nếu bắt đầu bằng / thì thêm localhost
  if (imagePath.startsWith('/')) {
    const result = `http://localhost:3000${imagePath}`;
    console.log('ImageUtils - Absolute path converted:', result);
    return result;
  }
  
  // Nếu là đường dẫn tương đối (như tulanh/image/...)
  const result = `http://localhost:3000/${imagePath}`;
  console.log('ImageUtils - Relative path converted:', result);
  return result;
};

/**
 * Lấy URL ảnh đầu tiên từ mảng ảnh
 * @param images - Mảng đường dẫn ảnh
 * @returns URL ảnh đầu tiên hoặc undefined
 */
export const getFirstImageUrl = (images: string[] | string | null | undefined): string | undefined => {
  if (!images) return undefined;
  
  // Nếu là string thì xử lý như một ảnh
  if (typeof images === 'string') {
    return getImageUrl(images);
  }
  
  // Nếu là array thì lấy ảnh đầu tiên
  if (Array.isArray(images) && images.length > 0) {
    return getImageUrl(images[0]);
  }
  
  return undefined;
};

/**
 * Lọc và xử lý mảng ảnh hợp lệ
 * @param images - Mảng đường dẫn ảnh
 * @returns Mảng URL ảnh đã được xử lý
 */
export const getValidImageUrls = (images: string[] | string | null | undefined): string[] => {
  if (!images) return [];
  
  let imageArray: string[] = [];
  
  // Chuyển đổi thành array nếu cần
  if (typeof images === 'string') {
    // Kiểm tra xem có phải JSON array không
    if (images.startsWith('[') && images.endsWith(']')) {
      try {
        const parsedArray = JSON.parse(images);
        if (Array.isArray(parsedArray)) {
          imageArray = parsedArray;
        } else {
          imageArray = [images];
        }
      } catch (error) {
        console.error('ImageUtils - Error parsing JSON array in getValidImageUrls:', error);
        imageArray = [images];
      }
    } else {
      imageArray = [images];
    }
  } else if (Array.isArray(images)) {
    imageArray = images;
  }
  
  // Lọc và xử lý ảnh
  return imageArray
    .filter(img => img && img.trim() !== '')
    .map(img => getImageUrl(img))
    .filter(url => url !== undefined) as string[];
};
