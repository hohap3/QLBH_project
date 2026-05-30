const { pool } = require("../config/database");

class AccountModel {
  static async getCheckoutInfoByUserId(maND) {
    try {
      // 🟢 Chuyển sang cú pháp Postgres ($1) và viết thường toàn bộ tên bảng/cột
      const query = `
        SELECT 
          COALESCE(kh.hoten, nd.hoten) AS hoten,
          COALESCE(kh.sdt, nd.sdt) AS sdt,
          kh.diachi,
          kh.diemtichluy -- Lấy thêm điểm tích lũy phục vụ giao diện nếu cần
        FROM nguoidung nd
        LEFT JOIN khachhang kh ON nd.mand = kh.mand
        WHERE nd.mand = $1
      `;

      // Thực thi truy vấn bằng thư viện pg
      const result = await pool.query(query, [maND]);

      // 🟢 ĐỒNG BỘ: Kết quả Postgres nằm trong mảng `rows`
      return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
      throw new Error(
        "Lỗi truy vấn database tại AccountModel: " + error.message,
      );
    }
  }
}

module.exports = AccountModel;
