const db = require('../db');

// Cerebras API configuration
const CEREBRAS_API_KEY = process.env.CEREBRAS_API_KEY || 'csk-46tmr9der88p82vwrpetdkjhy326mdmk4tdwrkwernwhwwry';
const CEREBRAS_API_URL = 'https://api.cerebras.ai/v1/chat/completions';

// Format giá tiền
const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
};

// Get order status description
const getOrderStatusDescription = (status) => {
    const statusLower = status?.toLowerCase();
    const statusMap = {
        'pending': 'Đang chờ xử lý',
        'processing': 'Đang xử lý',
        'paid': 'Đã thanh toán',
        'completed': 'Đã hoàn thành',
        'cancelled': 'Đã hủy',
        'refunded': 'Đã hoàn tiền'
    };
    return statusMap[statusLower] || status;
};

// Helper function to get user orders
async function getUserOrders(userId) {
    try {
        const [orders] = await db.query(
            `SELECT 
                o.DonHangID as order_id,
                o.DonHangID as order_code,
                o.TongTien as total_amount,
                o.TrangThai as status,
                o.PhuongThucThanhToan as payment_method,
                o.NgayTao as created_at,
                COUNT(ct.ChiTietDonHangID) as item_count
            FROM DonHang o
            LEFT JOIN ChiTietDonHang ct ON o.DonHangID = ct.DonHangID
            WHERE o.NguoiDungID = ?
            GROUP BY o.DonHangID
            ORDER BY o.NgayTao DESC
            LIMIT 10`,
            [userId]
        );
        return orders;
    } catch (error) {
        console.error('Error getting user orders:', error);
        return [];
    }
}

// Helper function to get order by code
async function getOrderByCode(orderCode) {
    try {
        const [orders] = await db.query(
            `SELECT 
                o.DonHangID as order_id,
                o.DonHangID as order_code,
                o.TongTien as total_amount,
                o.TrangThai as status,
                o.PhuongThucThanhToan as payment_method,
                o.NgayTao as created_at
            FROM DonHang o
            WHERE o.DonHangID = ?`,
            [orderCode]
        );

        if (orders.length === 0) return null;

        const order = orders[0];

        // Get order items
        const [items] = await db.query(
            `SELECT 
                ct.SoLuong as quantity,
                ct.DonGia as unit_price,
                ct.ThanhTien as subtotal,
                sp.TenSanPham as product_name
            FROM ChiTietDonHang ct
            LEFT JOIN SanPham sp ON ct.SanPhamID = sp.SanPhamID
            WHERE ct.DonHangID = ?`,
            [order.order_id]
        );

        order.items = items;
        return order;
    } catch (error) {
        console.error('Error getting order by code:', error);
        return null;
    }
}

// Helper function to get products on sale
async function getProductsOnSale(limit = 5) {
    try {
        const [products] = await db.query(
            `SELECT 
                sp.SanPhamID as product_id,
                sp.TenSanPham as name,
                sp.GiaGoc as original_price,
                sp.GiamGia as sale_price,
                sp.HinhAnh as image_url,
                dm.TenDanhMuc as category_name,
                COALESCE(tk.SoLuongTon, 0) as stock_quantity
            FROM SanPham sp
            LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            WHERE sp.GiamGia > 0 AND sp.GiamGia < sp.GiaGoc
            ORDER BY ((sp.GiaGoc - sp.GiamGia) / sp.GiaGoc) DESC
            LIMIT ?`,
            [limit]
        );
        return products;
    } catch (error) {
        console.error('Error getting products on sale:', error);
        return [];
    }
}

// Helper function to search products
async function searchProducts(searchTerm, limit = 5) {
    try {
        const searchPattern = `%${searchTerm}%`;
        const [products] = await db.query(
            `SELECT 
                sp.SanPhamID as product_id,
                sp.TenSanPham as name,
                sp.GiaGoc as original_price,
                sp.GiamGia as sale_price,
                sp.HinhAnh as image_url,
                dm.TenDanhMuc as category_name,
                COALESCE(tk.SoLuongTon, 0) as stock_quantity
            FROM SanPham sp
            LEFT JOIN DanhMuc dm ON sp.DanhMucID = dm.DanhMucID
            LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
            WHERE sp.TenSanPham LIKE ?
            ORDER BY tk.SoLuongTon DESC
            LIMIT ?`,
            [searchPattern, limit]
        );
        return products;
    } catch (error) {
        console.error('Error searching products:', error);
        return [];
    }
}

// Helper function to detect user intent and fetch relevant data
async function getContextualData(message, userId) {
    const lowerMessage = message.toLowerCase();
    let contextData = '';

    // Check for order lookup by order code
    const orderCodeMatch = message.match(/(?:đơn hàng|order|mã đơn)\s*[:#]?\s*([A-Z0-9-]+)/i);
    if (orderCodeMatch) {
        const orderCode = orderCodeMatch[1];
        const order = await getOrderByCode(orderCode);
        if (order) {
            contextData += `\n\n**Thông tin đơn hàng ${orderCode}:**\n`;
            contextData += `- Trạng thái: ${getOrderStatusDescription(order.status)}\n`;
            contextData += `- Tổng tiền: ${formatPrice(order.total_amount)}\n`;
            contextData += `- Phương thức thanh toán: ${order.payment_method}\n`;
            contextData += `- Ngày đặt: ${order.created_at}\n`;
            if (order.items && order.items.length > 0) {
                contextData += `- Sản phẩm:\n`;
                order.items.forEach(item => {
                    contextData += `  + ${item.product_name} x${item.quantity} - ${formatPrice(item.subtotal)}\n`;
                });
            }
        } else {
            contextData += `\n\nKhông tìm thấy đơn hàng với mã ${orderCode}.`;
        }
    }

    // Check for user's own orders
    if ((lowerMessage.includes('đơn hàng') || lowerMessage.includes('order')) &&
        (lowerMessage.includes('của tôi') || lowerMessage.includes('my') || lowerMessage.includes('tôi đã'))) {
        if (userId) {
            const orders = await getUserOrders(userId);
            if (orders.length > 0) {
                contextData += `\n\nĐơn hàng gần đây của bạn:\n\n`;
                orders.slice(0, 5).forEach(order => {
                    contextData += `- Đơn ${order.order_code}: ${getOrderStatusDescription(order.status)} - ${formatPrice(order.total_amount)} (${order.item_count} sản phẩm)\n`;
                });
            } else {
                contextData += `\n\nBạn chưa có đơn hàng nào.`;
            }
        } else {
            contextData += `\n\nVui lòng đăng nhập để xem đơn hàng của bạn.`;
        }
    }

    // Check for products on sale
    if (lowerMessage.includes('sale') || lowerMessage.includes('giảm giá') ||
        lowerMessage.includes('khuyến mãi') || lowerMessage.includes('ưu đãi')) {
        const products = await getProductsOnSale(5);
        if (products.length > 0) {
            contextData += `\n\nSản phẩm đang giảm giá:\n\n`;
            products.forEach(product => {
                const discount = Math.round((1 - product.sale_price / product.original_price) * 100);
                contextData += `- ${product.name}: ${formatPrice(product.original_price)} -> ${formatPrice(product.sale_price)} (-${discount}%) - Còn ${product.stock_quantity} sản phẩm\n`;
            });
        }
    }

    // Check for product search
    const searchTerms = ['tìm', 'search', 'có', 'bán', 'sản phẩm', 'tivi', 'tủ lạnh', 'máy giặt', 'điều hòa', 'laptop', 'điện thoại'];
    if (searchTerms.some(term => lowerMessage.includes(term))) {
        // Extract potential product name from message
        const words = message.split(' ').filter(w => w.length > 2);
        for (const word of words) {
            if (!['tìm', 'search', 'có', 'bán', 'sản', 'phẩm', 'cho', 'tôi', 'mình', 'được', 'không', 'giúp', 'xem'].includes(word.toLowerCase())) {
                const products = await searchProducts(word, 5);
                if (products.length > 0) {
                    contextData += `\n\nSản phẩm liên quan đến "${word}":\n\n`;
                    products.forEach(product => {
                        const price = product.sale_price > 0 ? product.sale_price : product.original_price;
                        const stockStatus = product.stock_quantity > 0 ? `Còn ${product.stock_quantity} sản phẩm` : 'Hết hàng';
                        contextData += `- ${product.name}: ${formatPrice(price)} - ${stockStatus}\n`;
                    });
                    break;
                }
            }
        }
    }

    return contextData;
}

// SYSTEM PROMPT - Định nghĩa tính cách và cách trả lời của chatbot
const getSystemPrompt = (contextData) => {
    return `Bạn là trợ lý ảo của cửa hàng Điện Máy Xanh.

NHIỆM VỤ:
- Tư vấn sản phẩm điện máy, điện tử
- Tra cứu đơn hàng và trạng thái
- Cung cấp thông tin khuyến mãi
- Tìm kiếm sản phẩm

PHONG CÁCH:
- Thân thiện, ngắn gọn
- Trả lời chính xác theo dữ liệu hệ thống
- KHÔNG dùng emoji, icon, dấu sao
- KHÔNG dùng markdown (**, *, ~~)
- Chỉ liệt kê thông tin rõ ràng

ĐỊNH DẠNG:
- Tên sản phẩm: [tên]
- Giá: [số tiền]
- Tồn kho: [số lượng]
- Mỗi sản phẩm cách nhau 1 dòng trống

LƯU Ý QUAN TRỌNG:
- KHÔNG hiển thị quá trình suy nghĩ
- KHÔNG dùng tag <think>, <thinking>
- Chỉ trả lời dựa trên dữ liệu từ hệ thống
- Nếu không có dữ liệu, nói thẳng là không tìm thấy${contextData ? '\n\nDỮ LIỆU TỪ HỆ THỐNG:' + contextData : ''}`;
};

const chatController = {
    sendMessage: async (req, res) => {
        try {
            const { message, history, userId } = req.body;
            
            if (!message) {
                return res.status(400).json({ 
                    response: "Xin chào! Tôi là trợ lý ảo của Điện Máy Xanh.\n\nBạn đang tìm kiếm sản phẩm gì?\n\nHãy cho tôi biết tên sản phẩm bạn cần tìm.",
                    products: []
                });
            }

            console.log("=== CHAT REQUEST ===");
            console.log("User message:", message, "userId:", userId);

            // Get contextual data from database based on user message
            let contextData = '';
            try {
                contextData = await getContextualData(message, userId);
                console.log("Context data loaded successfully");
            } catch (error) {
                console.error("Error loading context data:", error);
                // Continue without context data
            }

            // Build conversation history for context
            const messages = [
                {
                    role: 'system',
                    content: getSystemPrompt(contextData)
                }
            ];

            // Add conversation history (last 10 messages)
            if (history && Array.isArray(history)) {
                history.slice(-10).forEach(msg => {
                    messages.push({
                        role: msg.sender === 'user' ? 'user' : 'assistant',
                        content: msg.text
                    });
                });
            }

            // Add current user message
            messages.push({
                role: 'user',
                content: message
            });

            console.log("Searching database for:", message);
            const lowerMsg = message.toLowerCase();

            // Search for products in database FIRST
            let products = [];
            let aiResponse = null;
            try {
                const searchPattern = `%${message}%`;
                console.log("Search pattern:", searchPattern);
                
                const result = await db.query(
                    `SELECT 
                        sp.SanPhamID, 
                        sp.TenSanPham, 
                        sp.GiaGoc, 
                        sp.GiamGia, 
                        sp.HinhAnh,
                        COALESCE(tk.SoLuongTon, 0) as SoLuongTon
                     FROM SanPham sp
                     LEFT JOIN TonKho tk ON sp.SanPhamID = tk.SanPhamID
                     WHERE sp.TenSanPham LIKE ? 
                     ORDER BY tk.SoLuongTon DESC
                     LIMIT 5`,
                    [searchPattern]
                );

                console.log("Query result type:", typeof result);
                console.log("Query result is array:", Array.isArray(result));
                console.log("Result[0] type:", typeof result[0]);
                console.log("Result[0] is array:", Array.isArray(result[0]));
                console.log("Result structure:", JSON.stringify(result).substring(0, 200));
                
                // Handle different result formats
                if (Array.isArray(result) && Array.isArray(result[0])) {
                    products = result[0];
                } else if (Array.isArray(result)) {
                    products = result;
                } else {
                    products = [];
                }
                
                console.log(`Found ${products ? products.length : 'undefined'} products in database`);
                if (products && products.length > 0) {
                    console.log("First product:", products[0].TenSanPham);
                }
            } catch (dbError) {
                console.error("Database query error:", dbError);
                products = [];
            }

            // Build product data for AI
            let productContext = '';
            if (products.length > 0) {
                productContext = '\n\nSẢN PHẨM TÌM THẤY TRONG DATABASE:\n';
                products.forEach((product, index) => {
                    // Calculate price correctly
                    let finalPrice = product.GiaGoc;
                    if (product.GiamGia && product.GiamGia > 0) {
                        // If GiamGia < 100, it's a percentage discount
                        if (product.GiamGia < 100) {
                            finalPrice = product.GiaGoc * (1 - product.GiamGia / 100);
                        } else {
                            // If GiamGia >= 100, it's the discounted price
                            finalPrice = product.GiamGia;
                        }
                    }
                    
                    const stockInfo = product.SoLuongTon > 0 ? `Còn ${product.SoLuongTon} sản phẩm` : 'Hết hàng';
                    productContext += `${index + 1}. ${product.TenSanPham}\n`;
                    productContext += `   Giá: ${formatPrice(finalPrice)}\n`;
                    productContext += `   Tồn kho: ${stockInfo}\n\n`;
                });
            }

            // Try AI with product data
            if (products.length > 0 || contextData) {
                try {
                    console.log("Calling Cerebras AI with product data...");
                    
                    // Update system prompt with product data
                    const aiMessages = [
                        {
                            role: 'system',
                            content: getSystemPrompt(contextData + productContext)
                        }
                    ];
                    
                    // Add history
                    if (history && Array.isArray(history)) {
                        history.slice(-10).forEach(msg => {
                            aiMessages.push({
                                role: msg.sender === 'user' ? 'user' : 'assistant',
                                content: msg.text
                            });
                        });
                    }
                    
                    // Add current message
                    aiMessages.push({
                        role: 'user',
                        content: message
                    });

                    const response = await fetch(CEREBRAS_API_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${CEREBRAS_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: 'llama3.3-70b',
                            messages: aiMessages,
                            temperature: 0.3,
                            max_tokens: 1000,
                            top_p: 0.9,
                            stream: false
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        aiResponse = data.choices[0]?.message?.content || null;
                        
                        // Remove thinking process
                        if (aiResponse) {
                            aiResponse = aiResponse
                                .replace(/<think>[\s\S]*?<\/think>/gi, '')
                                .replace(/<thinking>[\s\S]*?<\/thinking>/gi, '')
                                .replace(/\*\*Thinking:?\*\*[\s\S]*?(?=\n\n|\*\*[A-Z]|$)/gi, '')
                                .replace(/^[\s\S]*?(?=Trả lời:|Câu trả lời:|Answer:)/i, '')
                                .replace(/^(Trả lời:|Câu trả lời:|Answer:)\s*/i, '')
                                .trim();
                        }
                        
                        console.log("AI response received");
                    } else {
                        console.error('Cerebras API error:', await response.text());
                    }
                } catch (error) {
                    console.error('Cerebras API error:', error);
                }
            }

            // Fallback to simple response if AI fails
            if (!aiResponse || aiResponse.length < 10) {
                console.log("Using fallback response");
                if (products.length > 0) {
                    let response = `Tìm thấy ${products.length} sản phẩm:\n\n`;
                    products.forEach((product, index) => {
                        // Calculate price correctly
                        let finalPrice = product.GiaGoc;
                        if (product.GiamGia && product.GiamGia > 0) {
                            if (product.GiamGia < 100) {
                                finalPrice = product.GiaGoc * (1 - product.GiamGia / 100);
                            } else {
                                finalPrice = product.GiamGia;
                            }
                        }
                        
                        const stockInfo = product.SoLuongTon > 0 ? `Còn ${product.SoLuongTon} sản phẩm` : 'Hết hàng';
                        
                        response += `${product.TenSanPham}\n`;
                        response += `Giá: ${formatPrice(finalPrice)}\n`;
                        response += `Tồn kho: ${stockInfo}\n`;
                        
                        if (index < products.length - 1) {
                            response += '\n';
                        }
                    });
                    response += '\n\nBạn cần tư vấn thêm không?';
                    aiResponse = response;
                } else if (lowerMsg.includes('xin chào') || lowerMsg.includes('hi') || lowerMsg.includes('hello') || lowerMsg.includes('chào')) {
                    aiResponse = "Xin chào! Tôi là trợ lý ảo của Điện Máy Xanh.\n\nBạn đang tìm kiếm sản phẩm gì?\n\nHãy cho tôi biết tên sản phẩm bạn cần tìm.";
                } else {
                    aiResponse = `Không tìm thấy sản phẩm "${message}".\n\nBạn có thể:\n- Thử tìm với từ khóa khác\n- Cho tôi biết thêm về nhu cầu của bạn`;
                }
            }

            console.log("=== SENDING RESPONSE ===");
            console.log("Response:", aiResponse ? aiResponse.substring(0, 100) : 'null');
            console.log("Products count:", products.length);

            return res.json({
                response: aiResponse,
                products: products,
                success: true
            });

        } catch (error) {
            console.error('Chat Error:', error);
            return res.status(200).json({ 
                response: "Xin lỗi, hệ thống đang gặp sự cố kỹ thuật.\n\nVui lòng thử lại sau ít phút hoặc liên hệ hotline: 1800-xxxx để được hỗ trợ trực tiếp.\n\nCảm ơn bạn đã thông cảm!", 
                products: [],
                success: false
            });
        }
    }
};

module.exports = chatController;
