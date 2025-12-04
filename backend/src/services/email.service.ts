import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export const sendActivationEmail = async (
  email: string,
  name: string,
  activationToken: string
): Promise<void> => {
  const transporter = createTransporter();
  const activationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${activationToken}`;

  const mailOptions = {
    from: `"AI Lesson Plan Generator" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Kích hoạt tài khoản - AI Lesson Plan Generator',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(45deg, #2563eb 30%, #6366f1 90%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 10px 10px 0 0;
            }
            .content {
              background: #f9fafb;
              padding: 30px;
              border-radius: 0 0 10px 10px;
            }
            .button {
              display: inline-block;
              padding: 12px 30px;
              background: linear-gradient(45deg, #2563eb 30%, #6366f1 90%);
              color: white;
              text-decoration: none;
              border-radius: 5px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 AI Lesson Plan Generator</h1>
            </div>
            <div class="content">
              <h2>Xin chào ${name}!</h2>
              <p>Cảm ơn bạn đã đăng ký tài khoản tại AI Lesson Plan Generator.</p>
              <p>Để hoàn tất đăng ký, vui lòng click vào nút bên dưới để kích hoạt tài khoản của bạn:</p>
              <div style="text-align: center;">
                <a href="${activationUrl}" class="button">Kích Hoạt Tài Khoản</a>
              </div>
              <p>Hoặc copy và paste link sau vào trình duyệt:</p>
              <p style="word-break: break-all; color: #2563eb;">${activationUrl}</p>
              <p><strong>Lưu ý:</strong> Link kích hoạt sẽ hết hạn sau 24 giờ.</p>
              <p>Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} AI Lesson Plan Generator. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `
      Xin chào ${name}!
      
      Cảm ơn bạn đã đăng ký tài khoản tại AI Lesson Plan Generator.
      
      Để hoàn tất đăng ký, vui lòng truy cập link sau để kích hoạt tài khoản:
      ${activationUrl}
      
      Lưu ý: Link kích hoạt sẽ hết hạn sau 24 giờ.
      
      Nếu bạn không tạo tài khoản này, vui lòng bỏ qua email này.
      
      © ${new Date().getFullYear()} AI Lesson Plan Generator
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Không thể gửi email kích hoạt');
  }
};

