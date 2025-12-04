import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import ReactMarkdown from "react-markdown";
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
                MỤC TIÊU BÀI HỌC
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-5 border-l-4 border-blue-500 bg-blue-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">🎯</span>
                  1. Kiến thức
                </h3>
                <p className="leading-relaxed text-gray-700 pl-7">
                  {lessonPlan.content.objectives.knowledge}
                </p>
              </div>

              <div className="p-5 border-l-4 border-indigo-500 bg-indigo-50 rounded-xl">
                <h3 className="flex items-center mb-3 text-xl font-bold text-gray-900">
                  <span className="mr-2">💪</span>
                  2. Năng lực
                </h3>
                <div className="space-y-4 pl-7">
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Năng lực chung:
                    </h4>
                    <ul className="space-y-2">
                      {lessonPlan.content.objectives.competencies.general.map(
                        (comp, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="mt-1 text-green-500">✓</span>
                            <span className="text-gray-700">{comp}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-semibold text-gray-900">
                      Năng lực đặc thù:
                    </h4>
                    <ul className="space-y-2">
                      {lessonPlan.content.objectives.competencies.specific.map(
                        (comp, idx) => (
                          <li key={idx} className="flex items-start space-x-2">
                            <span className="mt-1 text-blue-500">✓</span>
                            <span className="text-gray-700">{comp}</span>
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
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
                        <span className="mt-1 text-purple-500">•</span>
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
                THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="p-5 border border-green-200 bg-green-50 rounded-xl">
                <h3 className="flex items-center mb-4 font-bold text-gray-900">
                  <span className="mr-2">👨‍🏫</span>
                  Giáo viên
                </h3>
                <ul className="space-y-2">
                  {lessonPlan.content.equipment.teacher.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="mt-1 text-green-500">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-5 border bg-emerald-50 rounded-xl border-emerald-200">
                <h3 className="flex items-center mb-4 font-bold text-gray-900">
                  <span className="mr-2">👨‍🎓</span>
                  Học sinh
                </h3>
                <ul className="space-y-2">
                  {lessonPlan.content.equipment.student.map((item, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="mt-1 text-emerald-500">•</span>
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
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
                return (
                  <div
                    key={key}
                    className={`${bgClass} rounded-xl p-6 border-l-4 ${borderClass}`}
                  >
                    <h3 className="flex items-center mb-4 text-xl font-bold text-gray-900">
                      <span className="mr-2">{icon}</span>
                      {activity.title}
                    </h3>
                    <div className="prose max-w-none pl-7">
                      <ReactMarkdown className="text-gray-700">
                        {activity.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlanDetail;
