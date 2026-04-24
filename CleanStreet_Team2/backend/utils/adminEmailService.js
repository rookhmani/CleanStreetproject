const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { getAdminClientUrl } = require('./config');

// Create reusable transporter
const createTransporter = () => {
  // Check if nodemailer is properly loaded
  if (!nodemailer || typeof nodemailer.createTransport !== 'function') {
    console.error('❌ Nodemailer not properly initialized');
    return null;
  }
  
  if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send password reset email to admin
exports.sendAdminPasswordResetEmail = async (admin, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email service not configured - skipping email');
      return true; // Return true to not block the process
    }

    const message = {
      from: process.env.EMAIL_FROM || `"CleanStreet Admin" <${process.env.EMAIL_USERNAME}>`,
      to: admin.email,
      subject: 'Admin Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${admin.name}</strong>,</p>
              <p>You have requested to reset your admin account password. Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #3b82f6;">${resetUrl}</p>
              <p><strong>This link will expire in 10 minutes.</strong></p>
              <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">For security reasons, never share your password with anyone.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CleanStreet Admin Portal. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(message);
    console.log('✅ Password reset email sent to admin:', admin.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Send volunteer assignment notification
exports.sendVolunteerAssignmentEmail = async (volunteer, complaint) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email service not configured - skipping assignment email');
      return true;
    }

    const message = {
      from: process.env.EMAIL_FROM || `"CleanStreet Admin" <${process.env.EMAIL_USERNAME}>`,
      to: volunteer.email,
      subject: 'New Complaint Assigned to You',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .complaint-box { background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 5px; }
            .priority { display: inline-block; padding: 5px 10px; border-radius: 3px; font-size: 12px; font-weight: bold; text-transform: uppercase; }
            .priority-urgent { background-color: #dc2626; color: white; }
            .priority-high { background-color: #f97316; color: white; }
            .priority-medium { background-color: #fbbf24; color: white; }
            .priority-low { background-color: #10b981; color: white; }
            .button { display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 New Assignment</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${volunteer.name}</strong>,</p>
              <p>A new complaint has been assigned to you by the admin team.</p>
              
              <div class="complaint-box">
                <h3 style="margin-top: 0; color: #1f2937;">Complaint Details</h3>
                <p><strong>Title:</strong> ${complaint.title}</p>
                <p><strong>Description:</strong> ${complaint.description}</p>
                <p><strong>Location:</strong> ${complaint.address}</p>
                <p><strong>Priority:</strong> <span class="priority priority-${complaint.priority}">${complaint.priority}</span></p>
                <p><strong>Status:</strong> Assigned</p>
                <p><strong>Reported on:</strong> ${new Date(complaint.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>

              <p>Please log in to your volunteer dashboard to view full details and update the status:</p>
              <p style="text-align: center;">
                <a href="${getAdminClientUrl()}/volunteer/login" class="button">Go to Dashboard</a>
              </p>
              
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for your service in keeping our streets clean!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CleanStreet. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(message);
    console.log('✅ Assignment email sent to volunteer:', volunteer.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending assignment email:', error);
    return false;
  }
};

// Send volunteer approval notification
exports.sendVolunteerApprovalEmail = async (volunteer) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email service not configured - skipping approval email');
      return true;
    }

    const message = {
      from: process.env.EMAIL_FROM || `"CleanStreet Admin" <${process.env.EMAIL_USERNAME}>`,
      to: volunteer.email,
      subject: 'Your Volunteer Application has been Approved',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Application Approved!</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${volunteer.name}</strong>,</p>
              <p>Congratulations! Your volunteer application has been approved by the admin.</p>
              <p>You can now log in to your volunteer dashboard and start helping to keep our streets clean!</p>
              <p style="text-align: center;">
                <a href="${getAdminClientUrl()}/volunteer/login" class="button">Login Now</a>
              </p>
              <p>Use your registered email and password to access your dashboard.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">Thank you for joining our community service initiative!</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CleanStreet. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(message);
    console.log('✅ Approval email sent to volunteer:', volunteer.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending approval email:', error);
    return false;
  }
};

// Send volunteer password reset email
exports.sendVolunteerPasswordResetEmail = async (volunteer, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.log('⚠️  Email service not configured - skipping password reset email');
      return true;
    }

    const message = {
      from: process.env.EMAIL_FROM || `"CleanStreet" <${process.env.EMAIL_USERNAME}>`,
      to: volunteer.email,
      subject: 'Volunteer Password Reset Request',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #10b981; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 5px 5px; }
            .button { display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello <strong>${volunteer.name}</strong>,</p>
              <p>You have requested to reset your volunteer account password. Click the button below to reset your password:</p>
              <p style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </p>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; color: #10b981;">${resetUrl}</p>
              <p><strong>This link will expire in 10 minutes.</strong></p>
              <p>If you did not request this password reset, please ignore this email.</p>
              <hr style="border: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #6b7280; font-size: 14px;">For security reasons, never share your password with anyone.</p>
            </div>
            <div class="footer">
              <p>&copy; 2025 CleanStreet. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(message);
    console.log('✅ Password reset email sent to volunteer:', volunteer.email);
    return true;
  } catch (error) {
    console.error('❌ Error sending password reset email:', error);
    return false;
  }
};

// Generate reset token
exports.generateResetToken = () => {
  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expireTime = Date.now() + 10 * 60 * 1000; // 10 minutes
  
  return { resetToken, hashedToken, expireTime };
};
