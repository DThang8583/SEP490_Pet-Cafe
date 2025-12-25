/**
 * Format price to Vietnamese currency format
 * @param {number} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
    try {
        const num = Number(price);
        if (Number.isNaN(num)) return '0 VNĐ';
        const formatted = new Intl.NumberFormat('vi-VN', {
            maximumFractionDigits: 0
        }).format(num);
        return `${formatted} VNĐ`;
    } catch (e) {
        return `${price} VNĐ`;
    }
};

export default formatPrice;
