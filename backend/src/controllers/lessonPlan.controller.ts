import { Response, Request } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import LessonPlan from '../models/LessonPlan.model';
import User from '../models/User.model';
import Subscription from '../models/Subscription.model';
import { generateLessonPlan } from '../services/ai.service';
import { deleteFiles } from '../services/file.service';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Spacing, Indent, Table, TableRow, TableCell, WidthType } from 'docx';

const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

export const createLessonPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const {
      teacherName,
      subject,
      grade,
      educationLevel,
      duration,
      template,
      lessonTitle,
      uploadedFiles,
    } = req.body;

    // Generate lesson plan content using AI service
    const content = await generateLessonPlan({
      teacherName,
      subject,
      grade,
      educationLevel,
      duration,
      template,
      lessonTitle,
      uploadedFiles,
    });

    // Create lesson plan
    const lessonPlan = await LessonPlan.create({
      userId: authReq.user!._id,
      teacherName,
      subject,
      grade,
      educationLevel,
      duration,
      template,
      lessonTitle,
      uploadedFiles: uploadedFiles || [],
      content,
    });

    // Update trial usage count if user doesn't have active subscription
    const user = await User.findById(authReq.user!._id);
    if (user) {
      const currentMonth = getCurrentMonth();
      
      // Reset counter if new month
      if (user.trialMonth !== currentMonth) {
        user.trialUsageCount = 0;
        user.trialMonth = currentMonth;
      }
      
      // Check if user has active subscription
      const subscription = await Subscription.findOne({ userId: authReq.user!._id });
      const isSubscriptionActive =
        subscription &&
        subscription.status === 'active' &&
        subscription.paymentStatus === 'paid' &&
        new Date() <= subscription.endDate;

      // Only increment trial count if no active subscription
      if (!isSubscriptionActive) {
        user.trialUsageCount += 1;
        await user.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Tạo giáo án thành công',
      data: lessonPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tạo giáo án',
      error: error.message,
    });
  }
};

export const getLessonPlans = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const lessonPlans = await LessonPlan.find({ userId: authReq.user!._id })
      .sort({ createdAt: -1 })
      .select('-content');

    res.json({
      success: true,
      count: lessonPlans.length,
      data: lessonPlans,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy danh sách giáo án',
      error: error.message,
    });
  }
};

export const getLessonPlanById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const lessonPlan = await LessonPlan.findOne({
      _id: req.params.id,
      userId: authReq.user!._id,
    });

    if (!lessonPlan) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo án',
      });
      return;
    }

    res.json({
      success: true,
      data: lessonPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy giáo án',
      error: error.message,
    });
  }
};

export const updateLessonPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const lessonPlan = await LessonPlan.findOneAndUpdate(
      { _id: req.params.id, userId: authReq.user!._id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!lessonPlan) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo án',
      });
      return;
    }

    res.json({
      success: true,
      message: 'Cập nhật giáo án thành công',
      data: lessonPlan,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cập nhật giáo án',
      error: error.message,
    });
  }
};

export const deleteLessonPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    // Find lesson plan first (before deleting) to get uploaded files
    const lessonPlan = await LessonPlan.findOne({
      _id: req.params.id,
      userId: authReq.user!._id,
    });

    if (!lessonPlan) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo án',
      });
      return;
    }

    // Delete uploaded files from S3 or local storage
    if (lessonPlan.uploadedFiles && lessonPlan.uploadedFiles.length > 0) {
      try {
        await deleteFiles(lessonPlan.uploadedFiles);
        console.log(`Deleted ${lessonPlan.uploadedFiles.length} file(s) for lesson plan ${req.params.id}`);
      } catch (fileError: any) {
        // Log error but don't fail the deletion - files might already be deleted
        console.error('Error deleting files:', fileError);
      }
    }

    // Delete lesson plan from database
    await LessonPlan.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Xóa giáo án thành công',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa giáo án',
      error: error.message,
    });
  }
};

export const downloadLessonPlan = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const authReq = req as AuthRequest;
    const lessonPlan = await LessonPlan.findOne({
      _id: req.params.id,
      userId: authReq.user!._id,
    });

    if (!lessonPlan) {
      res.status(404).json({
        success: false,
        message: 'Không tìm thấy giáo án',
      });
      return;
    }

    // Validate content structure
    if (!lessonPlan.content) {
      res.status(400).json({
        success: false,
        message: 'Giáo án chưa có nội dung',
      });
      return;
    }

    // Helper function to safely get text or return empty string
    const safeText = (text: any): string => {
      return text && typeof text === 'string' ? text : '';
    };

    // Helper function to safely get array or return empty array
    const safeArray = (arr: any): string[] => {
      return Array.isArray(arr) ? arr.filter(item => item && typeof item === 'string') : [];
    };

    // Get content with safe defaults
    const content = lessonPlan.content;
    const objectives = content.objectives || {};
    const competencies = objectives.competencies || { general: [], specific: [] };
    const equipment = content.equipment || { teacher: [], student: [] };
    const activities = content.activities || {};
    const adjustment = content.adjustment || { nhanXet: '', huongDieuChinh: [] };

    // Helper function to create formatted paragraph with spacing
    const createParagraph = (text: string, options?: {
      heading?: (typeof HeadingLevel)[keyof typeof HeadingLevel];
      bold?: boolean;
      spacing?: { before?: number; after?: number };
      indent?: { left?: number };
    }): Paragraph => {
      const runs = text ? [new TextRun({
        text,
        bold: options?.bold || false,
      })] : [];
      
      return new Paragraph({
        children: runs,
        heading: options?.heading,
        spacing: options?.spacing ? {
          before: options.spacing.before ? options.spacing.before * 20 : undefined,
          after: options.spacing.after ? options.spacing.after * 20 : undefined,
        } : undefined,
        indent: options?.indent ? {
          left: options.indent.left ? options.indent.left * 720 : undefined,
        } : undefined,
      });
    };

    // Build document children (can be Paragraph or Table)
    const children: (Paragraph | Table)[] = [
      createParagraph('GIÁO ÁN', {
        heading: HeadingLevel.TITLE,
        spacing: { after: 2 },
      }),
      createParagraph(`Môn: ${safeText(lessonPlan.subject)}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph(`Lớp: ${safeText(lessonPlan.grade)}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph(`Giáo viên: ${safeText(lessonPlan.teacherName)}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph(`Bài: ${safeText(lessonPlan.lessonTitle)}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph(`Thời gian: ${lessonPlan.duration || 0} phút`, {
        spacing: { after: 2 },
      }),
      createParagraph('', { spacing: { after: 1 } }),
      createParagraph('I. YÊU CẦU CẦN ĐẠT', {
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 1, after: 1 },
      }),
      createParagraph('1. Năng lực đặc thù', {
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 0.5, after: 0.5 },
      }),
      ...safeArray(competencies.specific).map(
        (comp) =>
          createParagraph(comp.startsWith('-') ? comp : `- ${comp}`, {
            spacing: { after: 0.2 },
            indent: { left: 0.5 },
          })
      ),
      createParagraph('2. Năng lực chung', {
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 0.5, after: 0.5 },
      }),
      ...safeArray(competencies.general).map(
        (comp) =>
          createParagraph(comp.startsWith('-') ? comp : `- ${comp}`, {
            spacing: { after: 0.2 },
            indent: { left: 0.5 },
          })
      ),
      createParagraph('3. Phẩm chất', {
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 0.5, after: 0.5 },
      }),
      ...safeArray(objectives.qualities).map(
        (quality) =>
          createParagraph(quality.startsWith('-') ? quality : `- ${quality}`, {
            spacing: { after: 0.2 },
            indent: { left: 0.5 },
          })
      ),
      createParagraph('', { spacing: { after: 1 } }),
      createParagraph('II. ĐỒ DÙNG DẠY HỌC', {
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 1, after: 1 },
      }),
      createParagraph(`- Giáo viên: ${safeArray(equipment.teacher).join(', ')}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph(`- Học sinh: ${safeArray(equipment.student).join(', ')}`, {
        spacing: { after: 0.5 },
      }),
      createParagraph('', { spacing: { after: 1 } }),
      createParagraph('III. CÁC HOẠT ĐỘNG DẠY HỌC', {
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 1, after: 1 },
      }),
    ];

    // Helper function to parse markdown table
    const parseMarkdownTable = (tableLines: string[]): Table | null => {
      if (tableLines.length < 2) return null;
      
      const rows: TableRow[] = [];
      
      for (let i = 0; i < tableLines.length; i++) {
        const line = tableLines[i].trim();
        if (!line || line.startsWith('|---')) continue; // Skip separator line
        
        const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
        if (cells.length === 0) continue;
        
        const tableCells = cells.map(cell => {
          // Remove markdown bold (**text**)
          const cleanText = cell.replace(/\*\*/g, '');
          const isBold = cell.includes('**');
          
          return new TableCell({
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: cleanText,
                    bold: isBold,
                  }),
                ],
              }),
            ],
            margins: {
              top: 100,
              bottom: 100,
              left: 100,
              right: 100,
            },
          });
        });
        
        rows.push(new TableRow({
          children: tableCells,
        }));
      }
      
      if (rows.length === 0) return null;
      
      return new Table({
        rows,
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
      });
    };

    // Helper function to split markdown content into paragraphs and tables
    const splitContentIntoParagraphs = (content: string): (Paragraph | Table)[] => {
      if (!content) return [];
      
      const lines = content.split('\n');
      const result: (Paragraph | Table)[] = [];
      let i = 0;
      
      while (i < lines.length) {
        const line = lines[i].trim();
        
        if (!line) {
          i++;
          continue;
        }
        
        // Check if it's a markdown table (starts with |)
        if (line.startsWith('|')) {
          const tableLines: string[] = [];
          let j = i;
          
          // Collect all table lines
          while (j < lines.length && (lines[j].trim().startsWith('|') || lines[j].trim().startsWith('---'))) {
            tableLines.push(lines[j]);
            j++;
          }
          
          const table = parseMarkdownTable(tableLines);
          if (table) {
            result.push(table);
            result.push(createParagraph('', { spacing: { after: 0.5 } })); // Add spacing after table
            i = j;
            continue;
          }
        }
        
        // Check if it's a heading (starts with ## or **)
        if (line.startsWith('##') || (line.startsWith('**') && line.endsWith('**'))) {
          const text = line.replace(/^##+\s*/, '').replace(/\*\*/g, '');
          result.push(createParagraph(text, {
            bold: true,
            spacing: { before: 0.5, after: 0.3 },
          }));
        } else if (line.includes('**') || line.includes('*')) {
          // Handle mixed bold/italic text
          const parts: TextRun[] = [];
          let currentText = '';
          let inBold = false;
          let inItalic = false;
          
          for (let k = 0; k < line.length; k++) {
            const char = line[k];
            const nextChar = line[k + 1];
            
            if (char === '*' && nextChar === '*') {
              // Bold marker
              if (currentText) {
                parts.push(new TextRun({
                  text: currentText,
                  bold: inBold,
                  italics: inItalic,
                }));
                currentText = '';
              }
              inBold = !inBold;
              k++; // Skip next *
            } else if (char === '*' && !inBold) {
              // Italic marker (only if not in bold)
              if (currentText) {
                parts.push(new TextRun({
                  text: currentText,
                  bold: inBold,
                  italics: inItalic,
                }));
                currentText = '';
              }
              inItalic = !inItalic;
            } else {
              currentText += char;
            }
          }
          
          if (currentText) {
            parts.push(new TextRun({
              text: currentText,
              bold: inBold,
              italics: inItalic,
            }));
          }
          
          result.push(new Paragraph({
            children: parts,
            spacing: { after: 0.3 },
            indent: { left: 0.5 },
          }));
        } else if (line.startsWith('- ') || line.startsWith('• ')) {
          // List item
          const text = line.replace(/^[-•]\s*/, '');
          result.push(createParagraph(`• ${text}`, {
            spacing: { after: 0.2 },
            indent: { left: 1 },
          }));
        } else if (line.startsWith('---')) {
          // Separator
          result.push(createParagraph('', { spacing: { after: 1 } }));
        } else {
          // Regular paragraph
          result.push(createParagraph(line, {
            spacing: { after: 0.3 },
            indent: { left: 0.5 },
          }));
        }
        
        i++;
      }
      
      return result;
    };

    // Helper function to parse title with markdown
    const parseTitle = (title: string): Paragraph => {
      if (!title) return createParagraph('', { spacing: { before: 1, after: 0.5 } });
      
      if (title.includes('**')) {
        const parts: TextRun[] = [];
        let currentText = '';
        let inBold = false;
        
        for (let k = 0; k < title.length; k++) {
          const char = title[k];
          const nextChar = title[k + 1];
          
          if (char === '*' && nextChar === '*') {
            if (currentText) {
              parts.push(new TextRun({
                text: currentText,
                bold: inBold,
              }));
              currentText = '';
            }
            inBold = !inBold;
            k++;
          } else {
            currentText += char;
          }
        }
        
        if (currentText) {
          parts.push(new TextRun({
            text: currentText,
            bold: inBold,
          }));
        }
        
        return new Paragraph({
          children: parts,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 1, after: 0.5 },
        });
      }
      
      return createParagraph(title, {
        heading: HeadingLevel.HEADING_2,
        bold: true,
        spacing: { before: 1, after: 0.5 },
      });
    };

    // Add activities safely
    const activity1 = activities.activity1 || { title: '', content: '' };
    const activity2 = activities.activity2 || { title: '', content: '' };
    const activity3 = activities.activity3 || { title: '', content: '' };
    const activity4 = activities.activity4 || { title: '', content: '' };

    children.push(
      parseTitle(safeText(activity1.title) || 'Hoạt động 1'),
      ...splitContentIntoParagraphs(safeText(activity1.content) || 'Chưa có nội dung'),
      parseTitle(safeText(activity2.title) || 'Hoạt động 2'),
      ...splitContentIntoParagraphs(safeText(activity2.content) || 'Chưa có nội dung'),
      parseTitle(safeText(activity3.title) || 'Hoạt động 3'),
      ...splitContentIntoParagraphs(safeText(activity3.content) || 'Chưa có nội dung'),
      parseTitle(safeText(activity4.title) || 'Hoạt động 4'),
      ...splitContentIntoParagraphs(safeText(activity4.content) || 'Chưa có nội dung')
    );

    // Add IV. ĐIỀU CHỈNH SAU BÀI DẠY if exists
    if (adjustment && (adjustment.nhanXet || (adjustment.huongDieuChinh && adjustment.huongDieuChinh.length > 0))) {
      children.push(
        createParagraph('', { spacing: { after: 1 } }),
        createParagraph('IV. ĐIỀU CHỈNH SAU BÀI DẠY', {
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 1, after: 1 },
        })
      );

      if (adjustment.nhanXet) {
        children.push(
          createParagraph('Nhận xét chung:', {
            bold: true,
            spacing: { before: 0.5, after: 0.3 },
          }),
          createParagraph(safeText(adjustment.nhanXet), {
            spacing: { after: 0.5 },
            indent: { left: 0.5 },
          })
        );
      }
    }

    // Create DOCX document
    const doc = new Document({
      sections: [
        {
          children,
        },
      ],
    });

    // Generate buffer
    const buffer = await Packer.toBuffer(doc);

    // Set headers for download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    );
    
    // Sanitize filename
    const sanitizedTitle = safeText(lessonPlan.lessonTitle)
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100); // Limit length
    
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Giao-An-${sanitizedTitle || 'lesson-plan'}.docx"`
    );

    res.send(buffer);
  } catch (error: any) {
    console.error('Error downloading lesson plan:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải xuống giáo án',
      error: error.message,
    });
  }
};

