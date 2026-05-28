// src/models/accountModel.js
const { sql, poolPromise } = require("../config/database");

class AccountModel {
  static async getCheckoutInfoByUserId(maND) {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("MaND", sql.VarChar(20), maND)
        .query(`
                    SELECT 
                        COALESCE(kh.HoTen, nd.HoTen) AS HoTen,
                        COALESCE(kh.SDT, nd.SDT) AS SDT,
                        kh.DiaChi
                    FROM NGUOIDUNG nd
                    LEFT JOIN KHACHHANG kh ON nd.MaND = kh.MaND
                    WHERE nd.MaND = @MaND
                `);

      // Nếu tìm thấy tài khoản, trả về bản ghi đầu tiên, ngược lại trả về null
      return result.recordset.length > 0 ? result.recordset[0] : null;
    } catch (error) {
      throw new Error(
        "Lỗi truy vấn database tại AccountModel: " + error.message,
      );
    }
  }
}

module.exports = AccountModel;
