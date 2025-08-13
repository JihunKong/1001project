import nodemailer from 'nodemailer'

// Create reusable transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
})

// Email templates
const getVerificationEmailHtml = (url: string) => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Verify your email - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
          }
          .link {
            color: #6366f1;
            word-break: break-all;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Verify your email address</h1>
            <p>Welcome to 1001 Stories! Click the button below to verify your email address and start your learning journey.</p>
            <a href="${url}" class="button">Verify Email</a>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              Or copy and paste this link in your browser:
            </p>
            <p class="link">${url}</p>
            <div class="footer">
              <p>This link will expire in 24 hours for security reasons.</p>
              <p>If you didn't create an account with 1001 Stories, you can safely ignore this email.</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

const getWelcomeEmailHtml = (name: string, role: string) => {
  const roleMessages = {
    LEARNER: "Ready to explore amazing stories from around the world? Your learning journey starts now!",
    TEACHER: "Welcome to our educator community! You can now create classrooms and manage student progress.",
    INSTITUTION: "Thank you for partnering with us! Let's make education accessible together.",
    VOLUNTEER: "Welcome to our volunteer family! Your contributions will help children worldwide.",
    ADMIN: "Welcome aboard! You have full access to manage the platform."
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Welcome to 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
            text-align: left;
          }
          .logo {
            font-size: 32px;
            font-weight: bold;
            color: white;
            margin-bottom: 20px;
            text-align: center;
          }
          h1 {
            color: #333;
            font-size: 24px;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
          .feature {
            padding: 15px;
            background: #f8f9fa;
            border-radius: 8px;
            margin: 10px 0;
          }
          .footer {
            margin-top: 40px;
            font-size: 14px;
            color: #666;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">📚 1001 Stories</div>
          <div class="content">
            <h1>Welcome${name ? `, ${name}` : ''}! 🎉</h1>
            <p>${roleMessages[role as keyof typeof roleMessages] || roleMessages.LEARNER}</p>
            
            <h2 style="margin-top: 30px;">What you can do now:</h2>
            <div class="feature">
              <strong>📖 Explore Stories</strong><br>
              Discover amazing stories from children around the world
            </div>
            <div class="feature">
              <strong>🎯 Track Progress</strong><br>
              Monitor your learning journey with personalized dashboards
            </div>
            <div class="feature">
              <strong>🌍 Join Community</strong><br>
              Connect with learners and educators globally
            </div>
            
            <div style="text-align: center;">
              <a href="${process.env.NEXTAUTH_URL}/dashboard" class="button">Go to Dashboard</a>
            </div>
            
            <div class="footer">
              <p>Need help? Visit our <a href="${process.env.NEXTAUTH_URL}/help" style="color: #6366f1;">Help Center</a></p>
              <p>Follow us on social media for updates and new stories!</p>
            </div>
          </div>
        </div>
      </body>
    </html>
  `
}

// Send verification email
export async function sendVerificationEmail(email: string, url: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Verify your email - 1001 Stories",
      html: getVerificationEmailHtml(url),
    })

    console.log("Verification email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending verification email:", error)
    throw new Error("Failed to send verification email")
  }
}

// Send welcome email
export async function sendWelcomeEmail(email: string, name: string, role: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Welcome to 1001 Stories! 🎉",
      html: getWelcomeEmailHtml(name, role),
    })

    console.log("Welcome email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending welcome email:", error)
    throw new Error("Failed to send welcome email")
  }
}

// Send password reset email
export async function sendPasswordResetEmail(email: string, url: string) {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Reset your password - 1001 Stories</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            padding: 40px;
            text-align: center;
          }
          .content {
            background: white;
            border-radius: 12px;
            padding: 40px;
            margin-top: 20px;
          }
          .button {
            display: inline-block;
            padding: 14px 32px;
            background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
            color: white;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div style="font-size: 32px; font-weight: bold; color: white; margin-bottom: 20px;">
            📚 1001 Stories
          </div>
          <div class="content">
            <h1>Reset your password</h1>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <a href="${url}" class="button">Reset Password</a>
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              This link will expire in 1 hour for security reasons.
            </p>
            <p style="font-size: 14px; color: #666;">
              If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>
        </div>
      </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"1001 Stories" <noreply@1001stories.org>',
      to: email,
      subject: "Reset your password - 1001 Stories",
      html,
    })

    console.log("Password reset email sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending password reset email:", error)
    throw new Error("Failed to send password reset email")
  }
}