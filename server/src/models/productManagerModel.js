// src/models/productManagerModel.js
const { poolPromise } = require("../config/database");

const productManagerModel = {
  // Lấy tất cả sản phẩm (Kèm tên danh mục và nhà cung cấp)
  getAllProducts: async () => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT sp.*, dm.tendanhmuc AS "TenDanhMuc", ncc.tenncc AS "TenNCC"
                FROM sanpham sp
                JOIN danhmuc dm ON sp.madanhmuc = dm.madanhmuc
                JOIN nhacungcap ncc ON sp.mancc = ncc.mancc
            `;
      const result = await pool.query(query);
      return result.rows; // Trả về danh sách mảng đối tượng
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết một sản phẩm theo ID
  getProductById: async (maSP) => {
    try {
      const pool = await poolPromise;
      const query = `
                SELECT sp.*, dm.tendanhmuc AS "TenDanhMuc", ncc.tenncc AS "TenNCC"
                FROM sanpham sp
                JOIN danhmuc dm ON sp.madanhmuc = dm.madanhmuc
                JOIN nhacungcap ncc ON sp.mancc = ncc.mancc
                WHERE sp.masp = $1
            `;
      const result = await pool.query(query, [maSP]);
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  // Thêm sản phẩm mới
  createProduct: async (data) => {
    try {
      const pool = await poolPromise;
      const query = `
                INSERT INTO sanpham (masp, tensp, gianhap, giaban, soluongton, mota, donvitinh, madanhmuc, mancc, hinhanh)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            `;
      const values = [
        data.MaSP,
        data.TenSP,
        parseFloat(data.GiaNhap) || 0,
        parseFloat(data.GiaBan) || 0,
        parseInt(data.SoLuongTon) || 0,
        data.MoTa || null,
        data.DonViTinh || null,
        data.MaDanhMuc,
        data.MaNCC,
        data.HinhAnh || null,
      ];
      await pool.query(query, values);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật thông tin sản phẩm
  updateProduct: async (maSP, data) => {
    try {
      const pool = await poolPromise;
      const query = `
                UPDATE sanpham 
                SET tensp = $1, gianhap = $2, giaban = $3, 
                    soluongton = $4, mota = $5, donvitinh = $6, 
                    madanhmuc = $7, mancc = $8, hinhanh = $9
                WHERE masp = $10
            `;
      const values = [
        data.TenSP,
        parseFloat(data.GiaNhap) || 0,
        parseFloat(data.GiaBan) || 0,
        parseInt(data.SoLuongTon) || 0,
        data.MoTa || null,
        data.DonViTinh || null,
        data.MaDanhMuc,
        data.MaNCC,
        data.HinhAnh || null,
        maSP,
      ];
      await pool.query(query, values);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Xóa sản phẩm
  deleteProduct: async (maSP) => {
    try {
      const pool = await poolPromise;
      const query = "DELETE FROM sanpham WHERE masp = $1";
      await pool.query(query, [maSP]);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Đồng bộ hàng loạt sản phẩm từ file Excel (Thêm mới hoặc Cập nhật)
  bulkCreateOrUpdateProducts: async (productsList) => {
    try {
      const pool = await poolPromise;
      let successCount = 0;

      for (const item of productsList) {
        // Đọc linh hoạt từ file Excel (hỗ trợ cả cột chữ hoa lẫn chữ thường)
        const maSP = item.MaSP || item.masp;
        const tenSP = item.TenSP || item.tensp;
        const maDanhMuc = item.MaDanhMuc || item.madanhmuc;
        const maNCC = item.MaNCC || item.mancc;

        if (!maSP || !tenSP || !maDanhMuc || !maNCC) continue;

        // Kiểm tra trùng mã bằng câu lệnh đếm trực tiếp của Postgres
        const checkQuery =
          "SELECT COUNT(*)::int AS count FROM sanpham WHERE masp = $1";
        const checkExist = await pool.query(checkQuery, [maSP]);
        const isExist = checkExist.rows[0].count > 0;

        const giaNhap = parseFloat(item.GiaNhap || item.gianhap) || 0;
        const giaBan = parseFloat(item.GiaBan || item.giaban) || 0;
        const soLuongTon = parseInt(item.SoLuongTon || item.soluongton) || 0;
        const moTa = item.MoTa || item.mota || null;
        const donViTinh = item.DonViTinh || item.donvitinh || null;
        const hinhAnh = item.HinhAnh || item.hinhanh || null;

        if (isExist) {
          // Trùng mã -> Thực hiện UPDATE
          const updateQuery = `
                        UPDATE sanpham 
                        SET tensp = $1, gianhap = $2, giaban = $3, 
                            soluongton = $4, mota = $5, donvitinh = $6, 
                            madanhmuc = $7, mancc = $8, hinhanh = COALESCE($9, hinhanh)
                        WHERE masp = $10
                    `;
          await pool.query(updateQuery, [
            tenSP,
            giaNhap,
            giaBan,
            soLuongTon,
            moTa,
            donViTinh,
            maDanhMuc,
            maNCC,
            hinhAnh,
            maSP,
          ]);
        } else {
          // Chưa tồn tại -> Thực hiện INSERT
          const insertQuery = `
                        INSERT INTO sanpham (masp, tensp, gianhap, giaban, soluongton, mota, donvitinh, madanhmuc, mancc, hinhanh)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    `;
          await pool.query(insertQuery, [
            maSP,
            tenSP,
            giaNhap,
            giaBan,
            soLuongTon,
            moTa,
            donViTinh,
            maDanhMuc,
            maNCC,
            hinhAnh,
          ]);
        }
        successCount++;
      }
      return successCount;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = productManagerModel;
