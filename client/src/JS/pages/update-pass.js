import axios from "axios";
import Swal from "sweetalert2";
import { BASE_URL } from "/src/JS/common/header";

export async function initUpdatePass() {
  const passwordForm = document.getElementById("passwordForm");
  const userStorage = JSON.parse(localStorage.getItem("hpstore_user"));

  // Kiểm tra xem người dùng đã đăng nhập chưa, nếu chưa có thông tin thì chặn thao tác
  if (!userStorage) {
    console.warn("Không tìm thấy thông tin đăng nhập trong localStorage.");
    return;
  }

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
        // Lấy mã người dùng linh hoạt từ bộ nhớ tạm và ép kiểu sang chuỗi nguyên bản
        const maND = String(
          userStorage.id || userStorage.mand || userStorage.MaND || "",
        );

        if (!maND || maND === "undefined") {
          Swal.fire(
            "Lỗi hệ thống",
            "Không thể xác định danh tính tài khoản. Vui lòng đăng nhập lại!",
            "error",
          );
          return;
        }

        // 🟢 FIX LỖI 1: Đồng bộ sang phương thức POST phù hợp với Router/Controller ở Backend
        const response = await axios.put(`${BASE_URL}/user/change-password`, {
          MaND: maND,
          OldPassword: oldPass,
          NewPassword: newPass,
        });

        // 🟢 Kiểm tra nếu Backend phản hồi thành công (Có trả về status 200 hoặc success)
        if (response.status === 200 || response.data.success) {
          // Chờ người dùng bấm "OK" trên hộp thoại thông báo rồi mới thực hiện chuỗi đăng xuất
          await Swal.fire({
            icon: "success",
            title: "Thành công",
            text:
              response.data.message ||
              "Mật khẩu đã được cập nhật thành công! Vui lòng đăng nhập lại.",
            confirmButtonColor: "#6f42c1",
            allowOutsideClick: false, // Ép người dùng phải bấm nút để kiểm soát luồng chuyển trang
          });

          // 1. Xóa thông tin phiên làm việc cũ khỏi localStorage của HP STORE
          localStorage.removeItem("hpstore_user");
          localStorage.removeItem("current_admin_page");

          // 2. Làm mới form nhập liệu
          passwordForm.reset();

          // 3. Đẩy người dùng quay trở lại trang đăng nhập (login)
          window.location.href = "/src/pages/login.html";
        }
      } catch (error) {
        console.error("Lỗi khi đổi mật khẩu:", error);
        const msg =
          error.response?.data?.message ||
          "Mật khẩu cũ không chính xác hoặc không thể thực hiện giao tiếp Server!";
        Swal.fire("Thất bại", msg, "error");
      }
    };
  }
}
