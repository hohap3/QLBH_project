const { pool } = require("../config/database");

class ProductModel {
  // 1. LẤY SẢN PHẨM BÁN CHẠY (CÓ PHÂN TRANG)
  static async getBestSellers(page = 1, limit = 8) {
    try {
      const offset = (page - 1) * limit;

      // Truy vấn 1: Tính tổng số lượng mặt hàng đã từng phát sinh lượt bán
      const countResult = await pool.query(`
        SELECT COUNT(DISTINCT sp.masp) as total FROM sanpham sp
        INNER JOIN chitiet_donhang ct ON sp.masp = ct.masp
      `);
      const totalItems = parseInt(countResult.rows[0].total) || 0;

      // Truy vấn 2: Lấy dữ liệu thực tế bằng LIMIT và OFFSET của Postgres
      const result = await pool.query(
        `
        SELECT 
          sp.masp, sp.tensp, sp.giaban, sp.hinhanh, 
          COALESCE(SUM(ct.soluong), 0) as tongdaban
        FROM sanpham sp
        LEFT JOIN chitiet_donhang ct ON sp.masp = ct.masp
        GROUP BY sp.masp, sp.tensp, sp.giaban, sp.hinhanh
        ORDER BY tongdaban DESC, sp.masp ASC
        LIMIT $1 OFFSET $2
      `,
        [limit, offset],
      );

      return {
        products: result.rows,
        totalItems: totalItems,
      };
    } catch (error) {
      throw error;
    }
  }

  // 2. LẤY TẤT CẢ SẢN PHẨM HOẶC THEO DANH MỤC (CÓ PHÂN TRANG)
  static async getProducts(maDM = null, page = 1, limit = 8) {
    try {
      const offset = (page - 1) * limit;
      let countQuery = `SELECT COUNT(*) as total FROM sanpham sp WHERE 1=1`;
      let dataQuery = `
        SELECT sp.*, dm.tendanhmuc 
        FROM sanpham sp
        JOIN danhmuc dm ON sp.madanhmuc = dm.madanhmuc
        WHERE 1=1
      `;
      const params = [];

      // Lọc danh mục nếu có tham số hợp lệ
      if (
        maDM &&
        maDM !== "all" &&
        maDM !== "undefined" &&
        maDM.trim() !== ""
      ) {
        params.push(maDM);
        countQuery += ` AND sp.madanhmuc = $1`;
        dataQuery += ` AND sp.madanhmuc = $1`;
      }

      // Đếm tổng số lượng dòng
      const countResult = await pool.query(countQuery, params);
      const totalItems = parseInt(countResult.rows[0].total) || 0;

      // Gắn thêm LIMIT, OFFSET cho câu lệnh lấy data
      const dataParams = [...params];
      dataParams.push(limit);
      dataParams.push(offset);

      dataQuery += ` ORDER BY sp.masp ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`;
      const resultData = await pool.query(dataQuery, dataParams);

      return {
        products: resultData.rows,
        totalItems: totalItems,
      };
    } catch (error) {
      throw error;
    }
  }

  // 3. TÌM KIẾM SẢN PHẨM GỢI Ý
  static async searchProducts(keyword) {
    try {
      // Thay đổi TOP 5 của SQL Server bằng LIMIT 5 đặt ở cuối trong Postgres
      const result = await pool.query(
        `
        SELECT masp, tensp, giaban, hinhanh 
        FROM sanpham 
        WHERE tensp ILIKE $1
        LIMIT 5
      `,
        [`%${keyword}%`],
      ); // Dùng ILIKE để tìm kiếm không phân biệt hoa thường tiếng Việt

      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // 4. CHI TIẾT SẢN PHẨM
  static async getProductById(maSP) {
    try {
      // Thay đổi ISNULL thành COALESCE
      const result = await pool.query(
        `
        SELECT sp.*, dm.tendanhmuc, ncc.tenncc,
          (SELECT COALESCE(SUM(soluong), 0) FROM chitiet_donhang WHERE masp = sp.masp) as tongdaban
        FROM sanpham sp
        JOIN danhmuc dm ON sp.madanhmuc = dm.madanhmuc
        JOIN nhacungcap ncc ON sp.mancc = ncc.mancc
        WHERE sp.masp = $1
      `,
        [maSP],
      );

      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // 5. SẢN PHẨM LIÊN QUAN
  static async getRelatedProducts(maDanhMuc, currentMaSP) {
    try {
      // Thay đổi TOP 4 của SQL Server thành LIMIT 4 ở cuối câu lệnh
      const result = await pool.query(
        `
        SELECT sp.masp, sp.tensp, sp.giaban, sp.hinhanh, dm.tendanhmuc, sp.soluongton
        FROM sanpham sp
        JOIN danhmuc dm ON sp.madanhmuc = dm.madanhmuc
        WHERE sp.madanhmuc = $1 AND sp.masp != $2
        LIMIT 4
      `,
        [maDanhMuc, currentMaSP],
      );

      return result.rows;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductModel;
