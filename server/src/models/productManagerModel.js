const { sql, poolPromise } = require("../config/database");

const productManagerModel = {
  // Lấy tất cả sản phẩm (kèm tên danh mục và nhà cung cấp nếu cần)
  getAllProducts: async () => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().query(`
                SELECT sp.*, dm.TenDanhMuc, ncc.TenNCC 
                FROM SANPHAM sp
                JOIN DANHMUC dm ON sp.MaDanhMuc = dm.MaDanhMuc
                JOIN NHACUNGCAP ncc ON sp.MaNCC = ncc.MaNCC
            `);
      return result.recordset;
    } catch (error) {
      throw error;
    }
  },

  getProductById: async (maSP) => {
    try {
      const pool = await poolPromise;
      const result = await pool.request().input("MaSP", sql.VarChar, maSP)
        .query(`
                SELECT sp.*, dm.TenDanhMuc, ncc.TenNCC 
                FROM SANPHAM sp
                JOIN DANHMUC dm ON sp.MaDanhMuc = dm.MaDanhMuc
                JOIN NHACUNGCAP ncc ON sp.MaNCC = ncc.MaNCC
                WHERE sp.MaSP = @MaSP
            `);
      return result.recordset[0]; // Trả về đối tượng đầu tiên tìm thấy
    } catch (error) {
      throw error;
    }
  },

  // Thêm sản phẩm mới
  createProduct: async (data) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaSP", sql.VarChar, data.MaSP)
        .input("TenSP", sql.NVarChar, data.TenSP)
        // Ép kiểu để tránh lỗi String vs Decimal/Int
        .input("GiaNhap", sql.Decimal(18, 2), parseFloat(data.GiaNhap) || 0)
        .input("GiaBan", sql.Decimal(18, 2), parseFloat(data.GiaBan) || 0)
        .input("SoLuongTon", sql.Int, parseInt(data.SoLuongTon) || 0)
        .input("MoTa", sql.NVarChar, data.MoTa || null)
        .input("DonViTinh", sql.NVarChar, data.DonViTinh || null)
        .input("MaDanhMuc", sql.VarChar, data.MaDanhMuc)
        .input("MaNCC", sql.VarChar, data.MaNCC)
        .input("HinhAnh", sql.VarChar, data.HinhAnh || null).query(`
                    INSERT INTO SANPHAM (MaSP, TenSP, GiaNhap, GiaBan, SoLuongTon, MoTa, DonViTinh, MaDanhMuc, MaNCC, HinhAnh)
                    VALUES (@MaSP, @TenSP, @GiaNhap, @GiaBan, @SoLuongTon, @MoTa, @DonViTinh, @MaDanhMuc, @MaNCC, @HinhAnh)
                `);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật sản phẩm
  updateProduct: async (maSP, data) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaSP", sql.VarChar, maSP)
        .input("TenSP", sql.NVarChar, data.TenSP)
        .input("GiaNhap", sql.Decimal(18, 2), parseFloat(data.GiaNhap) || 0)
        .input("GiaBan", sql.Decimal(18, 2), parseFloat(data.GiaBan) || 0)
        .input("SoLuongTon", sql.Int, parseInt(data.SoLuongTon) || 0)
        .input("MoTa", sql.NVarChar, data.MoTa || null)
        .input("DonViTinh", sql.NVarChar, data.DonViTinh || null)
        .input("MaDanhMuc", sql.VarChar, data.MaDanhMuc)
        .input("MaNCC", sql.VarChar, data.MaNCC)
        .input("HinhAnh", sql.VarChar, data.HinhAnh || null).query(`
                    UPDATE SANPHAM 
                    SET TenSP = @TenSP, GiaNhap = @GiaNhap, GiaBan = @GiaBan, 
                        SoLuongTon = @SoLuongTon, MoTa = @MoTa, DonViTinh = @DonViTinh, 
                        MaDanhMuc = @MaDanhMuc, MaNCC = @MaNCC, HinhAnh = @HinhAnh
                    WHERE MaSP = @MaSP
                `);
      return true;
    } catch (error) {
      throw error;
    }
  },

  // Xóa sản phẩm
  deleteProduct: async (maSP) => {
    try {
      const pool = await poolPromise;
      await pool
        .request()
        .input("MaSP", sql.VarChar, maSP)
        .query("DELETE FROM SANPHAM WHERE MaSP = @MaSP");
      return true;
    } catch (error) {
      throw error;
    }
  },

  bulkCreateOrUpdateProducts: async (productsList) => {
    try {
      const pool = await poolPromise;
      let successCount = 0;

      for (const item of productsList) {
        if (!item.MaSP || !item.TenSP || !item.MaDanhMuc || !item.MaNCC)
          continue;

        // Kiểm tra xem mã sản phẩm này đã tồn tại hay chưa
        const checkExist = await pool
          .request()
          .input("CheckMaSP", sql.VarChar, item.MaSP)
          .query(
            "SELECT COUNT(*) as count FROM SANPHAM WHERE MaSP = @CheckMaSP",
          );

        const isExist = checkExist.recordset[0].count > 0;

        const request = pool
          .request()
          .input("MaSP", sql.VarChar, item.MaSP)
          .input("TenSP", sql.NVarChar, item.TenSP)
          .input("GiaNhap", sql.Decimal(18, 2), parseFloat(item.GiaNhap) || 0)
          .input("GiaBan", sql.Decimal(18, 2), parseFloat(item.GiaBan) || 0)
          .input("SoLuongTon", sql.Int, parseInt(item.SoLuongTon) || 0)
          .input("MoTa", sql.NVarChar, item.MoTa || null)
          .input("DonViTinh", sql.NVarChar, item.DonViTinh || null)
          .input("MaDanhMuc", sql.VarChar, item.MaDanhMuc)
          .input("MaNCC", sql.VarChar, item.MaNCC)
          .input("HinhAnh", sql.VarChar, item.HinhAnh || null);

        if (isExist) {
          // Nếu đã tồn tại -> Thực hiện cập nhật thông tin
          await request.query(`
            UPDATE SANPHAM 
            SET TenSP = @TenSP, GiaNhap = @GiaNhap, GiaBan = @GiaBan, 
                SoLuongTon = @SoLuongTon, MoTa = @MoTa, DonViTinh = @DonViTinh, 
                MaDanhMuc = @MaDanhMuc, MaNCC = @MaNCC, HinhAnh = COALESCE(@HinhAnh, HinhAnh)
            WHERE MaSP = @MaSP
          `);
        } else {
          // Nếu chưa tồn tại -> Thêm mới sản phẩm
          await request.query(`
            INSERT INTO SANPHAM (MaSP, TenSP, GiaNhap, GiaBan, SoLuongTon, MoTa, DonViTinh, MaDanhMuc, MaNCC, HinhAnh)
            VALUES (@MaSP, @TenSP, @GiaNhap, @GiaBan, @SoLuongTon, @MoTa, @DonViTinh, @MaDanhMuc, @MaNCC, @HinhAnh)
          `);
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
