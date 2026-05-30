const accountModel = require("../models/accountModel");

const getCheckoutProfile = async (req, res) => {
  // Lấy maND từ params (Ví dụ: /api/account/checkout-profile/:maND)
  const { maND } = req.params;

  // Kiểm tra tham số đầu vào đề phòng client gửi rỗng
  if (!maND) {
    return res.status(400).json({
      success: false,
      message: "Không tìm thấy mã người dùng hợp lệ!",
    });
  }

  try {
    const userInfo = await accountModel.getCheckoutInfoByUserId(maND);

    if (!userInfo) {
      return res.status(404).json({
        success: false,
        message: "Tài khoản người dùng không tồn tại trên hệ thống.",
      });
    }

    // Trả về dữ liệu thành công cho client
    return res.status(200).json({
      success: true,
      message: "Lấy thông tin tài khoản thành công.",
      data: userInfo, // Chứa { hoten, sdt, diachi, diemtichluy } dạng chữ thường
    });
  } catch (error) {
    console.error("Lỗi nghiêm trọng tại accountController:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ khi truy xuất hồ sơ tài khoản.",
      error: error.message,
    });
  }
};

module.exports = {
  getCheckoutProfile,
};
