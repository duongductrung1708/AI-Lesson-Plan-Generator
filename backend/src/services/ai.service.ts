import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, Part } from '@google/generative-ai';
import { ILessonPlan } from '../models/LessonPlan.model';
import { processFilesForAI } from './file.service';
import dotenv from 'dotenv';

dotenv.config();

interface LessonPlanInput {
  teacherName: string;
  subject: string;
  grade: string;
  educationLevel: 'Mầm non' | 'Tiểu học' | 'THCS' | 'THPT';
  duration: number;
  template: '5512' | '2345' | '1001';
  lessonTitle: string;
  uploadedFiles?: string[];
}

/**
 * Generate lesson plan using Google Gemini AI
 * Falls back to mock service if API key is not configured
 */
export const generateLessonPlan = async (
  input: LessonPlanInput
): Promise<ILessonPlan['content']> => {
  const apiKey = process.env.GEMINI_API_KEY?.trim();

  // Fallback to mock if no API key
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not found, using mock service');
    return generateMockLessonPlan(input);
  }

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    // Use model from env or default to gemini-2.5-flash (latest and fastest)
    // Note: Make sure Generative Language API is enabled in Google Cloud Console
    const modelName = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
    console.log(`Using Gemini model: ${modelName}`);
    
    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
      ],
    });

    // Process uploaded files
    let fileContext = '';
    const parts: Part[] = [];

    if (input.uploadedFiles && input.uploadedFiles.length > 0) {
      try {
        const { pdfTexts, images } = await processFilesForAI(input.uploadedFiles);
        
        // Add PDF texts to context
        if (pdfTexts.length > 0) {
          fileContext = `\n\nNội dung từ tài liệu đã upload:\n${pdfTexts.join('\n\n---\n\n')}`;
        }

        // Add images to parts
        for (const image of images) {
          parts.push({
            inlineData: {
              data: image.base64,
              mimeType: image.mimeType,
            },
          } as Part);
        }
      } catch (error: any) {
        console.error('Error processing files:', error);
        // Continue without file context if processing fails
      }
    }

    // Build prompt according to Công văn 2345
    const prompt = buildPrompt(input, fileContext);

    // Add text prompt as first part
    parts.unshift({ text: prompt } as Part);

    // Generate content with retry logic
    let response;
    let retries = 3;
    let lastError: Error | null = null;

    while (retries > 0) {
      try {
        // Use generateContent with parts array directly
        const result = await model.generateContent(parts);

        response = result.response;
        break;
      } catch (error: any) {
        lastError = error;
        retries--;
        
        // If it's a 404 error, it means model doesn't exist - don't retry
        if (error.status === 404) {
          console.error(`Model ${modelName} not found. Please check:`);
          console.error('1. Make sure Generative Language API is enabled in Google Cloud Console');
          console.error('2. Check if your API key has access to this model');
          console.error('3. Try a different model name (gemini-1.5-flash, gemini-1.5-pro, gemini-pro)');
          throw new Error(`Model ${modelName} not found. Please enable Generative Language API in Google Cloud Console or try a different model.`);
        }
        
        if (retries > 0) {
          console.warn(`Gemini API error, retrying... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s before retry
        }
      }
    }

    if (!response) {
      throw lastError || new Error('Failed to generate response from Gemini');
    }

    const responseText = response.text();

    // Parse JSON response
    try {
      // Try to extract JSON from markdown code blocks if present
      let jsonText = responseText;
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonText);
      return validateAndFormatLessonPlan(parsed, input);
    } catch (parseError) {
      console.error('Error parsing Gemini response as JSON:', parseError);
      console.error('Response text:', responseText);
      // Fallback: try to extract structured data or use mock
      return generateMockLessonPlan(input);
    }
  } catch (error: any) {
    console.error('Error generating lesson plan with Gemini:', error);
    // Fallback to mock service on error
    return generateMockLessonPlan(input);
  }
};

/**
 * Build prompt for Gemini according to Công văn 2345
 */
const buildPrompt = (input: LessonPlanInput, fileContext: string): string => {
  const { teacherName, subject, grade, educationLevel, lessonTitle, duration, template } = input;

  // Chế độ đặc biệt: Công văn 2345 với cấu trúc JSON chi tiết hơn
  if (template === '2345') {
    return `Bạn là một giáo viên tiểu học giỏi, am hiểu sâu chương trình GDPT 2018 và Công văn 2345/BGDĐT-GDTrH.
Nhiệm vụ của bạn: Soạn Kế hoạch bài dạy (Giáo án) chi tiết và chuẩn mực, TUÂN THỦ CHẶT CHẼ cấu trúc theo công văn 2345.

THÔNG TIN ĐẦU VÀO:
- Giáo viên: ${teacherName}
- Môn học: ${subject}
- Tên bài học: ${lessonTitle}
- Lớp: ${grade}
- Cấp học: ${educationLevel}
- Thời lượng: ${duration} phút

NỘI DUNG THAM KHẢO TỪ TÀI LIỆU ĐÃ UPLOAD (NẾU CÓ, CHỈ DÙNG LÀM NGỮ CẢNH, KHÔNG SAO CHÉP NGUYÊN VĂN):
${fileContext || 'Không có'}

YÊU CẦU VỀ CẤU TRÚC (THEO CÔNG VĂN 2345):

I. YÊU CẦU CẦN ĐẠT
1. Năng lực đặc thù (dựa vào mục tiêu của bài, gắn với môn học)
2. Năng lực chung
3. Phẩm chất

II. ĐỒ DÙNG DẠY HỌC
- Thiết bị / đồ dùng cho Giáo viên
- Thiết bị / đồ dùng cho Học sinh

III. CÁC HOẠT ĐỘNG DẠY HỌC
Gồm 4 phần, mỗi phần có thể gồm 1–2 hoạt động nhỏ, MỖI HOẠT ĐỘNG phải có:
- Mục tiêu hoạt động
- Nội dung hoạt động
- Tổ chức dạy học được trình bày RÕ RÀNG theo 2 cột:
  + Hoạt động của Giáo viên
  + Hoạt động của Học sinh
- Phương pháp / kĩ thuật dạy học
- Sản phẩm hoặc kết quả mong đợi

4 PHẦN BẮT BUỘC:
1. Khởi động (Kết nối)
2. Khám phá (Hình thành kiến thức mới)
3. Luyện tập (Thực hành, củng cố)
4. Vận dụng (Trải nghiệm, mở rộng)

IV. ĐIỀU CHỈNH SAU BÀI DẠY
- Nhận xét chung
- Hướng điều chỉnh (nếu HS gặp khó khăn, nếu thời lượng không đủ, ...)

YÊU CẦU VỀ CÁCH VIẾT:
- Sử dụng các phương pháp dạy học tích cực (trò chơi, thảo luận nhóm, sắm vai, sơ đồ tư duy, …) và nêu rõ ở từng hoạt động.
- Gợi ý lời thoại của Giáo viên tự nhiên, sư phạm, khơi gợi hứng thú.
- Nội dung phải phù hợp với lứa tuổi học sinh tiểu học, đúng chuẩn kiến thức – kĩ năng GDPT 2018.

YÊU CẦU VỀ ĐỊNH DẠNG MARKDOWN (RẤT QUAN TRỌNG):
Khi trả về nội dung trong trường "to_chuc" (tổ chức hoạt động), bạn PHẢI sử dụng định dạng markdown với:
1. **Bảng 2 cột** để trình bày "Hoạt động của Giáo viên" và "Hoạt động của Học sinh" song song:
   - Cột 1: Hoạt động của Giáo viên
   - Cột 2: Hoạt động của Học sinh
   - Mỗi hàng tương ứng với một bước trong quá trình dạy học
   - Ví dụ format bảng markdown:
     | **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |
     |------------------------------|----------------------------|
     | GV đặt câu hỏi: "Các em thấy...?" | HS quan sát và trả lời |
     | GV hướng dẫn HS làm việc nhóm | HS thảo luận trong nhóm |
   
2. **In đậm** cho các tiêu đề, từ khóa quan trọng: **Mục tiêu**, **Phương pháp**, **Thời gian**
3. **In nghiêng** cho lời thoại, ví dụ: *"Các em hãy quan sát..."*
4. **Căn dòng** sử dụng markdown lists (- hoặc 1.) cho các bước, nội dung
5. **Bảng thời gian** nếu cần: | Bước | Thời gian | Nội dung |

RẤT QUAN TRỌNG – ĐỊNH DẠNG KẾT QUẢ:
Chỉ trả về MỘT đối tượng JSON hợp lệ, không thêm bất kỳ giải thích hay văn bản ngoài JSON nào.

LƯU Ý VỀ ĐỊNH DẠNG TRONG JSON:
- Trong trường "to_chuc.giao_vien" và "to_chuc.hoc_sinh", bạn có thể sử dụng markdown:
  + **In đậm** cho các từ khóa: **Bước 1**, **GV**, **HS**
  + *In nghiêng* cho lời thoại: *"Các em hãy quan sát..."*
  + Số thứ tự: 1., 2., 3. hoặc Bước 1:, Bước 2:
- Mỗi phần tử trong mảng "giao_vien" và "hoc_sinh" tương ứng với nhau (cùng bước)
- Ví dụ:
  "giao_vien": [ "**Bước 1:** GV đặt câu hỏi: *\"Các em thấy gì trong hình?\"*", "**Bước 2:** GV hướng dẫn HS làm việc nhóm" ],
  "hoc_sinh": [ "HS quan sát và trả lời câu hỏi", "HS thảo luận trong nhóm 4 người" ]

ĐỊNH DẠNG JSON CHÍNH XÁC (VIẾT ĐÚNG TÊN TRƯỜNG):
{
  "thong_tin_bai_hoc": {
    "mon_hoc": "${subject}",
    "ten_bai": "${lessonTitle}",
    "lop": "${grade}",
    "bo_sach": "",
    "thoi_luong_tiet": ${Math.max(1, Math.round(duration / 35))}
  },
  "yeu_cau_can_dat": {
    "nang_luc_dac_thu": [ "..." ],
    "nang_luc_chung": [ "..." ],
    "pham_chat": [ "..." ]
  },
  "do_dung_day_hoc": {
    "giao_vien": [ "..." ],
    "hoc_sinh": [ "..." ]
  },
  "hoat_dong_day_hoc": {
    "khoi_dong": [
      {
        "ten_hoat_dong": "...",
        "muc_tieu": [ "..." ],
        "phuong_phap": [ "trò chơi", "thảo luận nhóm" ],
        "to_chuc": {
          "giao_vien": [ "**Bước 1:** GV đặt câu hỏi: *\"Các em thấy...?\"*", "**Bước 2:** GV hướng dẫn HS làm việc nhóm" ],
          "hoc_sinh": [ "HS quan sát và trả lời", "HS thảo luận trong nhóm" ]
        },
        "san_pham": [ "..." ]
      }
    ],
    "kham_pha": [ /* giống cấu trúc trên */ ],
    "luyen_tap": [ /* ... */ ],
    "van_dung": [ /* ... */ ]
  },
  "dieu_chinh_sau_bai_day": {
    "nhan_xet": "...",
    "huong_dieu_chinh": [ "..." ]
  }
}

Nếu không thể tuân thủ đúng JSON trên, hãy trả về lỗi JSON tối giản:
{ "error": "Không thể tạo giáo án" }`;
  }

  // Mặc định cho các mẫu khác (giữ như cũ để không phá vỡ hành vi hiện tại)
  return `Bạn là một chuyên gia giáo dục Việt Nam. Hãy tạo một giáo án chi tiết theo Công văn ${template} của Bộ Giáo dục và Đào tạo.

THÔNG TIN ĐẦU VÀO:
- Giáo viên: ${teacherName}
- Môn học: ${subject}
- Lớp: ${grade}
- Cấp học: ${educationLevel}
- Thời gian: ${duration} phút
- Tên bài học: ${lessonTitle}
${fileContext}

YÊU CẦU:
Tạo giáo án theo đúng cấu trúc Công văn ${template} với các phần sau:

I. MỤC TIÊU BÀI HỌC:
1. Kiến thức: Mô tả kiến thức học sinh cần đạt được
2. Năng lực:
   - Năng lực chung: Tự chủ, tự học, giao tiếp, hợp tác, giải quyết vấn đề
   - Năng lực đặc thù: Phù hợp với môn ${subject}
3. Phẩm chất: Yêu nước, nhân ái, chăm chỉ, trung thực, trách nhiệm

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU:
- Giáo viên: Liệt kê thiết bị, tài liệu giáo viên cần
- Học sinh: Liệt kê thiết bị, tài liệu học sinh cần

III. TIẾN TRÌNH DẠY HỌC:
Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề/nhiệm vụ học tập)
- Thời gian: 5-7 phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 2: Hình thành kiến thức mới
- Thời gian: Khoảng ${Math.floor(duration * 0.4)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 3: Luyện tập (Thực hành, củng cố)
- Thời gian: Khoảng ${Math.floor(duration * 0.3)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

Hoạt động 4: Vận dụng/Tìm tòi mở rộng
- Thời gian: Khoảng ${Math.floor(duration * 0.2)} phút
- Mục tiêu, nội dung, phương pháp chi tiết

LƯU Ý:
- Giáo án phải phù hợp với cấp học ${educationLevel}
- Nội dung phải cụ thể, chi tiết, có thể thực hiện được
- Sử dụng thông tin từ tài liệu đã upload (nếu có) để làm ngữ cảnh
- Phương pháp dạy học phải đa dạng, phù hợp với từng hoạt động
- Đảm bảo tính khoa học, sư phạm và phù hợp với chương trình giáo dục Việt Nam

YÊU CẦU VỀ ĐỊNH DẠNG MARKDOWN (RẤT QUAN TRỌNG):
Khi viết nội dung trong trường "content", bạn PHẢI sử dụng định dạng markdown với:
1. **Bảng 2 cột** để trình bày "Hoạt động của Giáo viên" và "Hoạt động của Học sinh" song song (nếu có):
   | **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |
   |------------------------------|----------------------------|
   | GV đặt câu hỏi: "Các em thấy...?" | HS quan sát và trả lời |
   | GV hướng dẫn HS làm việc nhóm | HS thảo luận trong nhóm |
   
2. **In đậm** cho các tiêu đề, từ khóa quan trọng: **Mục tiêu**, **Phương pháp**, **Thời gian**, **Nội dung**
3. **In nghiêng** cho lời thoại, ví dụ: *"Các em hãy quan sát..."*
4. **Lists** sử dụng - hoặc 1. cho các bước, nội dung
5. **Bảng thời gian** nếu cần: | Bước | Thời gian | Nội dung |

Hãy trả về kết quả dưới dạng JSON với cấu trúc sau (chỉ trả về JSON, không có markdown hay text khác):

{
  "objectives": {
    "knowledge": "string",
    "competencies": {
      "general": ["string", "string"],
      "specific": ["string", "string"]
    },
    "qualities": ["string", "string"]
  },
  "equipment": {
    "teacher": ["string", "string"],
    "student": ["string", "string"]
  },
  "activities": {
    "activity1": {
      "title": "Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity2": {
      "title": "Hoạt động 2: Hình thành kiến thức mới",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity3": {
      "title": "Hoạt động 3: Luyện tập (Thực hành, củng cố)",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    },
    "activity4": {
      "title": "Hoạt động 4: Vận dụng/Tìm tòi mở rộng",
      "content": "**Thời gian:** X phút\\n\\n**Mục tiêu:** ...\\n\\n**Nội dung:**\\n- ...\\n\\n**Phương pháp:** ..."
    }
  }
}`;
};

/**
 * Validate and format lesson plan from Gemini response
 */
const validateAndFormatLessonPlan = (
  parsed: any,
  input: LessonPlanInput
): ILessonPlan['content'] => {
  // Nếu là cấu trúc mới theo Công văn 2345 (JSON có trường thong_tin_bai_hoc, yeu_cau_can_dat,...)
  if (parsed && (parsed.thong_tin_bai_hoc || parsed.yeu_cau_can_dat || parsed.hoat_dong_day_hoc)) {
    const yc = parsed.yeu_cau_can_dat || {};
    const doDung = parsed.do_dung_day_hoc || {};
    const hd = parsed.hoat_dong_day_hoc || {};

    const toArray = (v: any): string[] =>
      Array.isArray(v) ? v.map((x) => String(x)) : typeof v === 'string' ? [v] : [];

    const formatPhase = (title: string, activities: any[], fallback: string): { title: string; content: string } => {
      if (!Array.isArray(activities) || activities.length === 0) {
        return {
          title,
          content: fallback,
        };
      }

      const blocks = activities.map((act: any, index: number) => {
        const name = act.ten_hoat_dong || `${title} - Hoạt động ${index + 1}`;
        const mucTieu = toArray(act.muc_tieu);
        const pp = toArray(act.phuong_phap);
        const gv = toArray(act.to_chuc?.giao_vien);
        const hs = toArray(act.to_chuc?.hoc_sinh);
        const sp = toArray(act.san_pham);

        // Tạo bảng markdown cho tổ chức hoạt động (2 cột: GV và HS)
        let toChucTable = '';
        if (gv.length > 0 || hs.length > 0) {
          const maxRows = Math.max(gv.length, hs.length);
          const tableRows: string[] = [];
          tableRows.push('| **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |');
          tableRows.push('|------------------------------|----------------------------|');
          
          for (let i = 0; i < maxRows; i++) {
            const gvText = gv[i] || '';
            const hsText = hs[i] || '';
            // Escape pipe characters in content
            const gvEscaped = gvText.replace(/\|/g, '\\|');
            const hsEscaped = hsText.replace(/\|/g, '\\|');
            tableRows.push(`| ${gvEscaped} | ${hsEscaped} |`);
          }
          toChucTable = tableRows.join('\n');
        } else {
          toChucTable = '| **Hoạt động của Giáo viên** | **Hoạt động của Học sinh** |\n|------------------------------|----------------------------|\n| ... | ... |';
        }

        return [
          `**${name}**`,
          '',
          '**Mục tiêu:**',
          ...(mucTieu.length ? mucTieu.map((m) => `- ${m}`) : ['- ...']),
          '',
          '**Phương pháp / kĩ thuật:**',
          ...(pp.length ? pp.map((p) => `- ${p}`) : ['- ...']),
          '',
          '**Tổ chức hoạt động:**',
          '',
          toChucTable,
          '',
          '**Sản phẩm / kết quả:**',
          ...(sp.length ? sp.map((s) => `- ${s}`) : ['- ...']),
        ].join('\n');
      });

      return {
        title,
        content: blocks.join('\n\n---\n\n'),
      };
    };

    const activity1 = formatPhase(
      'Hoạt động 1: Khởi động (Kết nối)',
      hd.khoi_dong || hd.khoiDong || [],
      'Hoạt động khởi động để tạo hứng thú và kết nối với bài học.'
    );
    const activity2 = formatPhase(
      'Hoạt động 2: Khám phá (Hình thành kiến thức mới)',
      hd.kham_pha || hd.khamPha || [],
      'Hoạt động khám phá và hình thành kiến thức mới.'
    );
    const activity3 = formatPhase(
      'Hoạt động 3: Luyện tập (Thực hành, củng cố)',
      hd.luyen_tap || hd.luyenTap || [],
      'Hoạt động luyện tập, thực hành và củng cố kiến thức.'
    );
    const activity4 = formatPhase(
      'Hoạt động 4: Vận dụng (Trải nghiệm, mở rộng)',
      hd.van_dung || hd.vanDung || [],
      'Hoạt động vận dụng kiến thức vào thực tế và mở rộng.'
    );

    return {
      objectives: {
        knowledge:
          parsed.muc_tieu_chung ||
          `Học sinh nắm được nội dung chính của ${input.lessonTitle}`,
        competencies: {
          general:
            toArray(yc.nang_luc_chung).length > 0
              ? toArray(yc.nang_luc_chung)
              : ['Tự chủ và tự học', 'Giao tiếp và hợp tác', 'Giải quyết vấn đề và sáng tạo'],
          specific:
            toArray(yc.nang_luc_dac_thu).length > 0
              ? toArray(yc.nang_luc_dac_thu)
              : [`Năng lực đặc thù môn ${input.subject}`],
        },
        qualities:
          toArray(yc.pham_chat).length > 0
            ? toArray(yc.pham_chat)
            : ['Yêu nước', 'Nhân ái', 'Chăm chỉ', 'Trung thực'],
      },
      equipment: {
        teacher:
          toArray(doDung.giao_vien).length > 0
            ? toArray(doDung.giao_vien)
            : ['Sách giáo khoa', 'Giáo án điện tử', 'Máy chiếu'],
        student:
          toArray(doDung.hoc_sinh).length > 0
            ? toArray(doDung.hoc_sinh)
            : ['Sách giáo khoa', 'Vở ghi chép', 'Bút, thước'],
      },
      activities: {
        activity1,
        activity2,
        activity3,
        activity4,
      },
    };
  }

  // Mặc định: cấu trúc cũ (objectives/equipment/activities) như trước đây
  return {
    objectives: {
      knowledge: parsed.objectives?.knowledge || `Học sinh nắm được nội dung chính của ${input.lessonTitle}`,
      competencies: {
        general: Array.isArray(parsed.objectives?.competencies?.general)
          ? parsed.objectives.competencies.general
          : ['Tự chủ và tự học', 'Giao tiếp và hợp tác', 'Giải quyết vấn đề và sáng tạo'],
        specific: Array.isArray(parsed.objectives?.competencies?.specific)
          ? parsed.objectives.competencies.specific
          : [`Năng lực đặc thù môn ${input.subject}`],
      },
      qualities: Array.isArray(parsed.objectives?.qualities)
        ? parsed.objectives.qualities
        : ['Yêu nước', 'Nhân ái', 'Chăm chỉ', 'Trung thực'],
    },
    equipment: {
      teacher: Array.isArray(parsed.equipment?.teacher)
        ? parsed.equipment.teacher
        : ['Sách giáo khoa', 'Giáo án điện tử', 'Máy chiếu'],
      student: Array.isArray(parsed.equipment?.student)
        ? parsed.equipment.student
        : ['Sách giáo khoa', 'Vở ghi chép', 'Bút, thước'],
    },
    activities: {
      activity1: {
        title: parsed.activities?.activity1?.title || 'Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)',
        content: parsed.activities?.activity1?.content || 'Nội dung hoạt động 1',
      },
      activity2: {
        title: parsed.activities?.activity2?.title || 'Hoạt động 2: Hình thành kiến thức mới',
        content: parsed.activities?.activity2?.content || 'Nội dung hoạt động 2',
      },
      activity3: {
        title: parsed.activities?.activity3?.title || 'Hoạt động 3: Luyện tập (Thực hành, củng cố)',
        content: parsed.activities?.activity3?.content || 'Nội dung hoạt động 3',
      },
      activity4: {
        title: parsed.activities?.activity4?.title || 'Hoạt động 4: Vận dụng/Tìm tòi mở rộng',
        content: parsed.activities?.activity4?.content || 'Nội dung hoạt động 4',
      },
    },
  };
};

/**
 * Mock service fallback (original implementation)
 */
const generateMockLessonPlan = async (
  input: LessonPlanInput
): Promise<ILessonPlan['content']> => {
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  const { subject, grade, educationLevel, lessonTitle, duration } = input;

  // Generate content based on template 2345
  const content: ILessonPlan['content'] = {
    objectives: {
      knowledge: `Học sinh nắm được nội dung chính của ${lessonTitle}, hiểu được các khái niệm và kiến thức cơ bản liên quan đến bài học.`,
      competencies: {
        general: [
          'Tự chủ và tự học: Học sinh tự đọc, tự nghiên cứu tài liệu',
          'Giao tiếp và hợp tác: Thảo luận nhóm, trình bày ý kiến',
          'Giải quyết vấn đề và sáng tạo: Phân tích, đánh giá, đề xuất giải pháp',
        ],
        specific: [
          `Năng lực ngôn ngữ: Đọc hiểu, diễn đạt về ${subject}`,
          'Năng lực tìm kiếm: Thu thập thông tin từ nhiều nguồn',
          'Năng lực phát hiện: Nhận biết các vấn đề trong bài học',
        ],
      },
      qualities: [
        'Yêu nước: Tôn trọng và giữ gìn giá trị văn hóa',
        'Nhân ái: Quan tâm, chia sẻ với bạn bè',
        'Chăm chỉ: Tích cực tham gia các hoạt động học tập',
        'Trung thực: Thẳng thắn trong học tập và đánh giá',
      ],
    },
    equipment: {
      teacher: [
        'Sách giáo khoa',
        'Giáo án điện tử',
        'Máy chiếu/Màn hình',
        'Bảng phụ',
        'Tranh ảnh minh họa',
      ],
      student: [
        'Sách giáo khoa',
        'Vở ghi chép',
        'Bút, thước',
        'Dụng cụ học tập theo môn học',
      ],
    },
    activities: {
      activity1: {
        title: 'Hoạt động 1: Mở đầu (Khởi động, Xác định vấn đề)',
        content: `**Thời gian:** 5-7 phút

**Mục tiêu:** Tạo hứng thú, kích thích tư duy học sinh

**Nội dung:**
- Giáo viên đặt câu hỏi gợi mở về chủ đề ${lessonTitle}
- Học sinh thảo luận nhóm nhỏ về những hiểu biết ban đầu
- Xác định nhiệm vụ học tập: Tìm hiểu về ${lessonTitle}
- Kết nối với kiến thức đã học trước đó

**Phương pháp:** Đàm thoại, thảo luận nhóm`,
      },
      activity2: {
        title: 'Hoạt động 2: Hình thành kiến thức mới',
        content: `**Thời gian:** ${Math.floor(duration * 0.4)} phút

**Mục tiêu:** Học sinh nắm được kiến thức cốt lõi của bài học

**Nội dung:**
- Giáo viên trình bày nội dung chính của ${lessonTitle}
- Học sinh đọc sách giáo khoa, làm việc cá nhân và nhóm
- Phân tích, khám phá các khái niệm quan trọng
- Giáo viên giải thích, làm rõ các điểm khó hiểu
- Học sinh ghi chép, hệ thống hóa kiến thức

**Phương pháp:** Thuyết trình, đàm thoại, làm việc nhóm, phân tích`,
      },
      activity3: {
        title: 'Hoạt động 3: Luyện tập (Thực hành, củng cố)',
        content: `**Thời gian:** ${Math.floor(duration * 0.3)} phút

**Mục tiêu:** Củng cố kiến thức, rèn luyện kỹ năng

**Nội dung:**
- Học sinh làm bài tập trong sách giáo khoa
- Thực hành các dạng bài tập từ cơ bản đến nâng cao
- Giáo viên quan sát, hỗ trợ học sinh gặp khó khăn
- Chữa bài tập, rút kinh nghiệm
- Hệ thống hóa kiến thức đã học

**Phương pháp:** Thực hành, luyện tập, đánh giá`,
      },
      activity4: {
        title: 'Hoạt động 4: Vận dụng/Tìm tòi mở rộng',
        content: `**Thời gian:** ${Math.floor(duration * 0.2)} phút

**Mục tiêu:** Vận dụng kiến thức vào thực tế, mở rộng hiểu biết

**Nội dung:**
- Học sinh vận dụng kiến thức đã học vào tình huống thực tế
- Tìm hiểu thêm về các vấn đề liên quan đến ${lessonTitle}
- Thực hiện dự án nhỏ hoặc bài tập mở rộng
- Trình bày kết quả, chia sẻ với lớp
- Giáo viên tổng kết, đánh giá

**Phương pháp:** Dự án, thuyết trình, tự học`,
      },
    },
  };

  return content;
};
