import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import DownloadIcon from "@mui/icons-material/Download";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MenuBookIcon from "@mui/icons-material/MenuBook";

interface LessonPlan {
  _id: string;
  teacherName: string;
  subject: string;
  grade: string;
  educationLevel: string;
  duration: number;
  template: string;
  lessonTitle: string;
  content: {
    objectives: {
      knowledge: string;
      competencies: {
        general: string[];
        specific: string[];
      };
      qualities: string[];
    };
    equipment: {
      teacher: string[];
      student: string[];
    };
    activities: {
      activity1: { title: string; content: string };
      activity2: { title: string; content: string };
      activity3: { title: string; content: string };
      activity4: { title: string; content: string };
    };
    adjustment?: {
      nhanXet: string;
      huongDieuChinh: string[];
    };
  };
  createdAt: string;
}

const LessonPlanDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLessonPlan = async () => {
      try {
        const response = await axios.get(`/api/lesson-plans/${id}`);
        setLessonPlan(response.data.data);
      } catch (error: any) {
        toast.error("Không tìm thấy giáo án");
        navigate("/my-documents");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchLessonPlan();
    }
  }, [id, navigate]);

  const handleDownload = async () => {
    if (!lessonPlan) return;
    try {
      const response = await axios.get(`/api/lesson-plans/${id}/download`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Giao-An-${lessonPlan.lessonTitle.replace(
        /\s+/g,
        "-"
      )}.docx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error("Download error:", error);
      toast.error("Không tải được giáo án. Vui lòng thử lại.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 mb-4 border-b-2 border-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600">Đang tải giáo án...</p>
        </div>
      </div>
    );
  }

  if (!lessonPlan) {
    return null;
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <style>{`
        table thead tr {
          background: linear-gradient(to right, rgb(37, 99, 235), rgb(67, 56, 202)) !important;
        }
        table thead tr:hover {
          background: linear-gradient(to right, rgb(29, 78, 216), rgb(55, 48, 163)) !important;
        }
        table thead th {
          color: white !important;
          background-color: transparent !important;
        }
        table thead th,
        table thead th *,
        table thead th span,
        table thead th strong {
          color: white !important;
          -webkit-text-fill-color: white !important;
        }
      `}</style>
      <div className="max-w-5xl mx-auto">
        {/* Header Card */}
        <div className="p-6 mb-6 card md:p-8 animate-slide-up">
          <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
            <div className="flex-1">
              <div className="flex items-center mb-4 space-x-2">
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl">
                  <span className="text-xl text-white">
                    <MenuBookIcon />
                  </span>
                </div>
                <div>
                  <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                    {lessonPlan.lessonTitle}
                  </h1>
                  <p className="text-sm text-gray-500">
                    Tạo ngày{" "}
                    {new Date(lessonPlan.createdAt).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6 md:grid-cols-3">
                <div className="p-3 border border-blue-100 rounded-lg bg-blue-50">
                  <p className="mb-1 text-xs font-semibold text-blue-600">
                    MÔN HỌC
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lessonPlan.subject}
                  </p>
                </div>
                <div className="p-3 border border-indigo-100 rounded-lg bg-indigo-50">
                  <p className="mb-1 text-xs font-semibold text-indigo-600">
                    LỚP
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lessonPlan.grade}
                  </p>
                </div>
                <div className="p-3 border border-purple-100 rounded-lg bg-purple-50">
                  <p className="mb-1 text-xs font-semibold text-purple-600">
                    THỜI GIAN
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {lessonPlan.duration} phút
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleDownload}
                className="btn-primary whitespace-nowrap"
              >
                <DownloadIcon /> Tải xuống DOCX
              </button>
              <button
                onClick={() => navigate("/my-documents")}
                className="btn-secondary whitespace-nowrap"
              >
                <ArrowBackIcon /> Quay lại
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Objectives Section */}
          <div className="p-6 card md:p-8 animate-slide-up">
            <div className="flex items-center mb-6 space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500">
                <span className="font-bold text-white">I</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                YÊU CẦU CẦN ĐẠT
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-5 border-l-4 border-blue-500 bg-blue-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">💪</span>
                  1. Năng lực đặc thù
                </h3>
                <ul className="space-y-2 pl-7">
                  {lessonPlan.content.objectives.competencies.specific.map(
                    (comp, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="mt-1 text-blue-500">-</span>
                        <span className="text-gray-700">{comp}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-5 border-l-4 border-indigo-500 bg-indigo-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">💪</span>
                  2. Năng lực chung
                </h3>
                <ul className="space-y-2 pl-7">
                  {lessonPlan.content.objectives.competencies.general.map(
                    (comp, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="mt-1 text-green-500">-</span>
                        <span className="text-gray-700">{comp}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>

              <div className="p-5 border-l-4 border-purple-500 bg-purple-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">⭐</span>
                  3. Phẩm chất
                </h3>
                <ul className="space-y-2 pl-7">
                  {lessonPlan.content.objectives.qualities.map(
                    (quality, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="mt-1 text-purple-500">-</span>
                        <span className="text-gray-700">{quality}</span>
                      </li>
                    )
                  )}
                </ul>
              </div>
            </div>
          </div>

          {/* Equipment Section */}
          <div className="p-6 card md:p-8 animate-slide-up">
            <div className="flex items-center mb-6 space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500">
                <span className="font-bold text-white">II</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                ĐỒ DÙNG DẠY HỌC
              </h2>
            </div>

            <div className="space-y-4">
              <div className="p-5 border-l-4 border-green-500 bg-green-50 rounded-xl">
                <p className="text-gray-700">
                  <span className="font-bold">- Giáo viên:</span>{' '}
                  {lessonPlan.content.equipment.teacher.join(', ')}
                </p>
              </div>
              <div className="p-5 border-l-4 border-emerald-500 bg-emerald-50 rounded-xl">
                <p className="text-gray-700">
                  <span className="font-bold">- Học sinh:</span>{' '}
                  {lessonPlan.content.equipment.student.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* Activities Section */}
          <div className="p-6 card md:p-8 animate-slide-up">
            <div className="flex items-center mb-6 space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500">
                <span className="font-bold text-white">III</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                TIẾN TRÌNH DẠY HỌC
              </h2>
            </div>

            <div className="space-y-8">
              {[
                {
                  key: "activity1",
                  bgClass: "bg-orange-50",
                  borderClass: "border-orange-500",
                  icon: "🚀",
                },
                {
                  key: "activity2",
                  bgClass: "bg-blue-50",
                  borderClass: "border-blue-500",
                  icon: "📖",
                },
                {
                  key: "activity3",
                  bgClass: "bg-green-50",
                  borderClass: "border-green-500",
                  icon: "✏️",
                },
                {
                  key: "activity4",
                  bgClass: "bg-purple-50",
                  borderClass: "border-purple-500",
                  icon: "💡",
                },
              ].map(({ key, bgClass, borderClass, icon }) => {
                const activity =
                  lessonPlan.content.activities[
                    key as keyof typeof lessonPlan.content.activities
                  ];
                // Chỉ hiển thị activity nếu có nội dung (content là bắt buộc, title có thể rỗng)
                if (!activity || !activity.content || activity.content.trim() === '') {
                  return null;
                }
                
                // Xác định title và icon dựa trên nội dung
                let activityTitle: string;
                let displayIcon = icon;
                
                if (activity.title && activity.title.trim()) {
                  // Nếu title có chứa "TIẾT", dùng title đó và icon phù hợp
                  if (activity.title.toUpperCase().includes('TIẾT')) {
                    activityTitle = activity.title;
                    // Icon cho tiết: 📚 hoặc 📖
                    displayIcon = '📚';
                  } else {
                    activityTitle = activity.title;
                  }
                } else {
                  // Nếu title rỗng, dùng title mặc định dựa trên key
                  activityTitle = key === 'activity1' ? 'Hoạt động 1' 
                    : key === 'activity2' ? 'Hoạt động 2'
                    : key === 'activity3' ? 'Hoạt động 3'
                    : 'Hoạt động 4';
                }
                
                return (
                  <div
                    key={key}
                    className={`${bgClass} rounded-xl p-6 border-l-4 ${borderClass}`}
                  >
                    <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                      <span className="mr-2">{displayIcon}</span>
                      {activityTitle}
                    </h3>
                    <div className="prose max-w-none pl-7">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          table: ({ children }) => (
                            <div className="my-4 overflow-x-auto">
                              <table className="min-w-full bg-white border border-collapse border-gray-300 shadow-sm">
                                {children}
                              </table>
                            </div>
                          ),
                          thead: ({ children }) => (
                            <thead className="bg-gradient-to-r from-blue-600 to-indigo-700">
                              {children}
                            </thead>
                          ),
                          tbody: ({ children }) => (
                            <tbody className="divide-y divide-gray-200">
                              {children}
                            </tbody>
                          ),
                          tr: ({ children }) => (
                            <tr className="transition-colors hover:bg-gray-50">
                              {children}
                            </tr>
                          ),
                          th: ({ children }) => (
                            <th 
                              className="px-4 py-3 text-sm font-bold text-left border border-gray-300" 
                              style={{ 
                                color: 'white',
                                backgroundColor: 'transparent'
                              }}
                            >
                              <span style={{ color: 'white' }}>{children}</span>
                            </th>
                          ),
                          td: ({ children }) => (
                            <td className="px-4 py-3 text-sm text-gray-700 align-top border border-gray-300">
                              {children}
                            </td>
                          ),
                          strong: ({ children }) => (
                            <strong className="font-bold text-gray-900">
                              {children}
                            </strong>
                          ),
                          em: ({ children }) => (
                            <em className="italic text-gray-600">
                              {children}
                            </em>
                          ),
                        }}
                        className="text-gray-700"
                      >
                        {activity.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Adjustment Section - IV. ĐIỀU CHỈNH SAU BÀI DẠY */}
          <div className="p-6 card md:p-8 animate-slide-up">
            <div className="flex items-center mb-6 space-x-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600">
                <span className="font-bold text-white">IV</span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 md:text-3xl">
                ĐIỀU CHỈNH SAU BÀI DẠY
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-5 border-l-4 border-gray-500 bg-gray-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">📝</span>
                  Nhận xét chung
                </h3>
                <p className="leading-relaxed text-gray-700 whitespace-pre-line pl-7">
                  {lessonPlan.content.adjustment?.nhanXet && lessonPlan.content.adjustment.nhanXet.trim() 
                    ? lessonPlan.content.adjustment.nhanXet 
                    : '(Chưa có nhận xét)'}
                </p>
              </div>
              {lessonPlan.content.adjustment?.huongDieuChinh && 
               lessonPlan.content.adjustment.huongDieuChinh.length > 0 && (
                <div className="p-5 border-l-4 border-gray-500 bg-gray-50 rounded-xl">
                  <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                    <span className="mr-2">🔧</span>
                    Hướng điều chỉnh
                  </h3>
                  <ul className="space-y-2 pl-7">
                    {lessonPlan.content.adjustment.huongDieuChinh.map(
                      (item, idx) => (
                        <li key={idx} className="flex items-start space-x-2">
                          <span className="mt-1 text-gray-500">-</span>
                          <span className="text-gray-700">{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanDetail;
