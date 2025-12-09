import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import RocketLaunchIcon from "@mui/icons-material/RocketLaunch";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import SaveAsIcon from "@mui/icons-material/SaveAs";
import FavoriteIcon from '@mui/icons-material/Favorite';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 opacity-10"></div>
        <div className="px-4 pt-20 pb-16 mx-auto max-w-7xl sm:px-6 lg:px-8 md:pt-32 md:pb-24">
          <div className="text-center">
            <h1 className="mb-6 text-4xl font-extrabold text-gray-900 md:text-6xl animate-fade-in-down">
              <span className="text-gradient">
                Ứng Dụng AI Soạn Giáo Án
              </span>
            </h1>
            <p className="max-w-3xl mx-auto mb-4 text-xl text-gray-600 md:text-2xl animate-fade-in-up animate-delay-200">
              Hỗ trợ giáo viên soạn giáo án tự động theo{" "}
              <span className="font-semibold text-blue-600">
                Công văn 2345/BGDĐT-GDTH
              </span>
            </p>
            <p className="max-w-2xl mx-auto mb-12 text-lg text-gray-500 animate-fade-in-up animate-delay-300">
              Tiết kiệm thời gian, đảm bảo chất lượng, tuân thủ chuẩn giáo dục
              Việt Nam
            </p>

            {user ? (
              <Link
                to="/create"
                className="inline-flex items-center px-8 py-4 space-x-2 text-lg btn-primary"
              >
                <span>
                  <RocketLaunchIcon />
                </span>
                <span>Bắt Đầu Tạo Giáo Án</span>
              </Link>
            ) : (
              <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  to="/register"
                  className="inline-flex items-center px-8 py-4 space-x-2 text-lg btn-primary"
                >
                  <span>
                    <AutoAwesomeIcon />
                  </span>
                  <span>Đăng Ký Ngay</span>
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center px-8 py-4 text-lg btn-secondary"
                >
                  Đăng Nhập
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
            Tính năng nổi bật
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600">
            Công cụ hỗ trợ giáo viên tạo giáo án chuyên nghiệp một cách nhanh
            chóng và dễ dàng
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
          <div className="p-8 card hover-lift hover-glow group animate-fade-in-up animate-delay-200">
            <div className="flex items-center justify-center w-16 h-16 mb-6 text-3xl text-white transition-all duration-300 shadow-lg bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl group-hover:shadow-xl animate-float">
              <InsertDriveFileIcon />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Tạo Giáo Án Nhanh
            </h3>
            <p className="leading-relaxed text-gray-600">
              Chỉ cần nhập thông tin bài học, AI sẽ tự động tạo giáo án chi tiết
              theo chuẩn Bộ Giáo dục và Đào tạo trong vài giây
            </p>
          </div>

          <div className="p-8 card hover-lift hover-glow group animate-fade-in-up animate-delay-300">
            <div
              className="flex items-center justify-center w-16 h-16 mb-6 text-3xl text-white transition-all duration-300 shadow-lg bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl group-hover:shadow-xl animate-float"
              style={{ animationDelay: "0.5s" }}
            >
              <MenuBookIcon />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Theo Chuẩn 2345
            </h3>
            <p className="leading-relaxed text-gray-600">
              Giáo án được tạo theo đúng cấu trúc Công văn 2345 với đầy đủ các
              hoạt động: Mở đầu, Hình thành kiến thức, Luyện tập, Vận dụng
            </p>
          </div>

          <div className="p-8 card hover-lift hover-glow group animate-fade-in-up animate-delay-400">
            <div
              className="flex items-center justify-center w-16 h-16 mb-6 text-3xl text-white transition-all duration-300 shadow-lg bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl group-hover:shadow-xl animate-float"
              style={{ animationDelay: "1s" }}
            >
              <SaveAsIcon />
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900">
              Lưu Trữ & Tải Xuống
            </h3>
            <p className="leading-relaxed text-gray-600">
              Lưu trữ tất cả giáo án của bạn trên cloud và tải xuống định dạng
              DOCX để chỉnh sửa hoặc in ấn bất cứ lúc nào
            </p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-16 md:mt-24">
          <div className="p-8 border-2 border-blue-100 card md:p-12 bg-gradient-to-br from-blue-50 to-indigo-50">
            <div className="grid items-center gap-8 md:grid-cols-2">
              <div>
                <h3 className="mb-4 text-2xl font-bold text-gray-900 md:text-3xl">
                  Dành cho giáo viên các cấp
                </h3>
                <p className="mb-6 leading-relaxed text-gray-600">
                  Hỗ trợ giáo viên từ Mầm non, Tiểu học, THCS đến THPT. Tự động
                  điều chỉnh thời lượng và nội dung phù hợp với từng cấp học.
                </p>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Giao diện thân thiện, dễ sử dụng</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Tích hợp AI thông minh</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-green-500">✓</span>
                    <span>Giá rẻ tiện lợi</span>
                  </li>
                </ul>
              </div>
              <div className="hidden md:block">
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { value: "100%", color: "text-blue-600", label: "Tuân thủ chuẩn" },
                    { value: "24/7", color: "text-indigo-600", label: "Sẵn sàng sử dụng" },
                    { value: "∞", color: "text-purple-600", label: "Không giới hạn" },
                    { value: "⚡", color: "text-pink-600", label: "Tốc độ cao" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="p-6 text-center shadow-lg rounded-xl backdrop-blur border transition-colors"
                      style={{
                        backgroundColor: "var(--surface)",
                        borderColor: "var(--surface-border)",
                      }}
                    >
                      <div className={`mb-2 text-4xl font-bold ${item.color}`}>
                        {item.value}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "var(--muted)" }}
                      >
                        {item.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Section */}
      <div className="px-4 py-16 border-t border-gray-100 bg-gray-50 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-bold text-gray-900 md:text-4xl">
              Phản hồi từ giáo viên
            </h2>
            <p className="mt-3 text-lg text-gray-600">
              Trải nghiệm thực tế từ những người đã sử dụng AI soạn giáo án
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Cô Hằng – Tiểu học",
                quote:
                  "Tiết kiệm rất nhiều thời gian, giáo án ra đúng cấu trúc 2345, chỉ cần chỉnh nhẹ là dạy được.",
              },
              {
                name: "Thầy Trung – THCS",
                quote:
                  "Các hoạt động được gộp bảng rõ ràng, tải DOCX định dạng đẹp, dễ in và chia sẻ.",
              },
              {
                name: "Cô Mai – THPT",
                quote:
                  "AI tận dụng tốt tài liệu mình upload, gợi ý hoạt động bám sát nội dung, rất hữu ích.",
              },
            ].map((fb) => (
              <div
                key={fb.name}
                className="p-6 transition-shadow bg-white border border-gray-100 shadow-sm rounded-2xl hover:shadow-md"
              >
                <div className="mb-3 text-xl text-blue-600">“</div>
                <p className="leading-relaxed text-gray-700">{fb.quote}</p>
                <div className="mt-4 font-semibold text-gray-900">{fb.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-4 py-10 bg-white border-t border-gray-100 sm:px-6 lg:px-8">
        <div className="grid max-w-6xl gap-8 mx-auto md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="mb-2 text-lg font-bold text-gray-900">
              AI Lesson Plan Generator
            </h3>
            <p className="text-gray-600">
              Công cụ hỗ trợ giáo viên soạn giáo án nhanh, đúng chuẩn, tận dụng sức mạnh AI.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Liên kết</h4>
            <ul className="space-y-2 text-gray-600">
              <li>
                <Link to="/login" className="hover:text-blue-600">
                  Đăng nhập
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-blue-600">
                  Đăng ký
                </Link>
              </li>
              <li>
                <Link to="/create" className="hover:text-blue-600">
                  Tạo giáo án
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold text-gray-900">Hỗ trợ</h4>
            <ul className="space-y-2 text-gray-600">
              <li>trungyna1708@gmail.com</li>
              <li>Thời gian: 8:00 - 21:00</li>
              <li className="text-gray-500">Tạo ra với <FavoriteIcon sx={{ color: 'red' }} /> cho các giáo viên</li>
            </ul>
          </div>
        </div>
        <div className="mt-8 text-sm text-center text-gray-500">
          © {new Date().getFullYear()} HANG. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Home;
