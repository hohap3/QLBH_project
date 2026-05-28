import axios from "axios";
import Swal from "sweetalert2";

export async function initUpdatePass() {
  const passwordForm = document.getElementById("passwordForm");
  const userStorage = JSON.parse(localStorage.getItem("hpstore_user"));

  if (passwordForm) {
    passwordForm.onsubmit = async (e) => {
      e.preventDefault();

      const oldPass = document.getElementById("txtOldPassword").value;
      const newPass = document.getElementById("txtNewPassword").value;
      const confirmPass = document.getElementById("txtConfirmPassword").value;

      // --- BIỂU THỨC CHÍNH QUY (REGEX) ---
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;

      // 1. Kiểm tra định dạng mật khẩu mới
      if (!passwordRegex.test(newPass)) {
        Swal.fire({
          icon: "warning",
          title: "Mật khẩu yếu",
          html: `Mật khẩu mới phải bao gồm:
                           <ul class="text-start mt-2 small">
                               <li>Ít nhất 6 ký tự</li>
                               <li>Ít nhất 1 chữ cái viết hoa</li>
                               <li>Ít nhất 1 chữ cái viết thường</li>
                               <li>Ít nhất 1 ký tự đặc biệt (@$!%*?&)</li>
                           </ul>`,
        });
        return;
      }

      // 2. Kiểm tra khớp mật khẩu
      if (newPass !== confirmPass) {
        Swal.fire("Lỗi", "Xác nhận mật khẩu mới không khớp!", "error");
        return;
      }

      // 3. Kiểm tra mật khẩu mới không được trùng mật khẩu cũ
      if (oldPass === newPass) {
        Swal.fire(
          "Thông báo",
          "Mật khẩu mới không được giống mật khẩu cũ!",
          "info",
        );
        return;
      }

      try {
        const response = await axios.put(
          "http://localhost:3000/api/user/change-password",
          {
            MaND: userStorage.id || userStorage.MaND, // Hỗ trợ linh hoạt cả 2 trường định danh
            OldPassword: oldPass,
            NewPassword: newPass,
          },
        );

        // 🟢 ĐÃ UPDATE: Chờ người dùng bấm "OK" trên hộp thoại thông báo rồi mới thực hiện chuỗi đăng xuất
        await Swal.fire({
          icon: "success",
          title: "Thành công",
          text: "Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập lại với mật khẩu mới.",
          confirmButtonColor: "#6f42c1",
          allowOutsideClick: false, // Ép người dùng phải bấm nút để kiểm soát luồng
        });

        // 🟢 1. Xóa thông tin phiên làm việc cũ khỏi localStorage của HP STORE
        localStorage.removeItem("hpstore_user");
        localStorage.removeItem("current_admin_page");

        // Nếu bạn lưu giỏ hàng theo ID người dùng thì có thể giữ lại hoặc clear nếu muốn bảo mật tối đa:
        // const currentUserId = userStorage.id || userStorage.MaND;
        // localStorage.removeItem(`hpstore_cart_${currentUserId}`);

        // 🟢 2. Làm mới form nhập liệu
        passwordForm.reset();

        // 🟢 3. Đẩy người dùng quay trở lại trang đăng nhập (login)
        window.location.href = "/src/pages/login.html";
      } catch (error) {
        const msg = error.response?.data?.message || "Không thể đổi mật khẩu";
        Swal.fire("Thất bại", msg, "error");
      }
    };
  }
}
