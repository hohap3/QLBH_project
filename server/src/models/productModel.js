const { poolPromise, sql } = require("../config/database");

class ProductModel {
  // 1. LẤY SẢN PHẨM BÁN CHẠY (CÓ PHÂN TRANG)
  static async getBestSellers(page = 1, limit = 8) {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    // Truy vấn 1: Đếm tổng số lượng sản phẩm bán chạy để tính tổng số trang
    const countResult = await pool.request().query(`
            SELECT COUNT(DISTINCT sp.MaSP) as Total FROM SANPHAM sp
            INNER JOIN CHITIET_DONHANG ct ON sp.MaSP = ct.MaSP
        `);
    const totalItems = countResult.recordset[0].Total;

    // Truy vấn 2: Lấy dữ liệu phân trang thực tế dựa trên OFFSET & FETCH NEXT
    const result = await pool
      .request()
      .input("offset", sql.Int, offset)
      .input("limit", sql.Int, limit).query(`
                SELECT 
                    sp.MaSP, sp.TenSP, sp.GiaBan, sp.HinhAnh, 
                    SUM(ct.SoLuong) as TongDaBan
                FROM SANPHAM sp
                LEFT JOIN CHITIET_DONHANG ct ON sp.MaSP = ct.MaSP
                GROUP BY sp.MaSP, sp.TenSP, sp.GiaBan, sp.HinhAnh
                ORDER BY TongDaBan DESC, sp.MaSP ASC
                OFFSET @offset ROWS
                FETCH NEXT @limit ROWS ONLY
            `);

    return {
      products: result.recordset,
      totalItems: totalItems,
    };
  }

  // 2. LẤY TẤT CẢ SẢN PHẨM HOẶC THEO DANH MỤC (CÓ PHÂN TRANG)
  static async getProducts(maDM = null, page = 1, limit = 8) {
    const pool = await poolPromise;
    const offset = (page - 1) * limit;

    let countQuery = `SELECT COUNT(*) as Total FROM SANPHAM sp WHERE 1=1`;
    let dataQuery = `
            SELECT sp.*, dm.TenDanhMuc 
            FROM SANPHAM sp
            JOIN DANHMUC dm ON sp.MaDanhMuc = dm.MaDanhMuc
            WHERE 1=1
        `;

    const requestCount = pool.request();
    const requestData = pool.request();

    // Lọc danh mục nếu có tham số hợp lệ
    if (maDM && maDM !== "all" && maDM !== "undefined" && maDM.trim() !== "") {
      countQuery += ` AND sp.MaDanhMuc = @maDM`;
      dataQuery += ` AND sp.MaDanhMuc = @maDM`;

      requestCount.input("maDM", sql.VarChar, maDM);
      requestData.input("maDM", sql.VarChar, maDM);
    }

    // Đếm tổng số dòng
    const countResult = await requestCount.query(countQuery);
    const totalItems = countResult.recordset[0].Total;

    // Thêm mệnh đề phân trang bắt buộc phải có ORDER BY trong SQL Server
    dataQuery += ` ORDER BY sp.MaSP ASC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;

    requestData.input("offset", sql.Int, offset);
    requestData.input("limit", sql.Int, limit);

    const resultData = await requestData.query(dataQuery);

    return {
      products: resultData.recordset,
      totalItems: totalItems,
    };
  }

  // 3. TÌM KIẾM SẢN PHẨM GỢI Ý (Giữ nguyên logic của bạn)
  static async searchProducts(keyword) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("keyword", sql.NVarChar, `%${keyword}%`).query(`
                SELECT TOP 5 MaSP, TenSP, GiaBan, HinhAnh 
                FROM SANPHAM 
                WHERE TenSP LIKE @keyword
            `);
    return result.recordset;
  }

  // 4. CHI TIẾT SẢN PHẨM (Giữ nguyên logic của bạn)
  static async getProductById(maSP) {
    const pool = await poolPromise;
    const result = await pool.request().input("maSP", sql.VarChar, maSP).query(`
                SELECT sp.*, dm.TenDanhMuc, ncc.TenNCC,
                       (SELECT ISNULL(SUM(SoLuong), 0) FROM CHITIET_DONHANG WHERE MaSP = sp.MaSP) as TongDaBan
                FROM SANPHAM sp
                JOIN DANHMUC dm ON sp.MaDanhMuc = dm.MaDanhMuc
                JOIN NHACUNGCAP ncc ON sp.MaNCC = ncc.MaNCC
                WHERE sp.MaSP = @maSP
            `);
    return result.recordset[0];
  }

  // 5. SẢN PHẨM LIÊN QUAN (Giữ nguyên logic của bạn)
  static async getRelatedProducts(maDanhMuc, currentMaSP) {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("maDanhMuc", sql.VarChar, maDanhMuc)
      .input("currentMaSP", sql.VarChar, currentMaSP).query(`
                SELECT TOP 4 sp.MaSP, sp.TenSP, sp.GiaBan, sp.HinhAnh, dm.TenDanhMuc,sp.SoLuongTon
                FROM SANPHAM sp
                JOIN DANHMUC dm ON sp.MaDanhMuc = dm.MaDanhMuc
                WHERE sp.MaDanhMuc = @maDanhMuc AND sp.MaSP != @currentMaSP
            `);
    return result.recordset;
  }
}

module.exports = ProductModel;
