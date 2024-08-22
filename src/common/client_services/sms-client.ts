import { ConfigService } from '@nestjs/config';
import request = require('request');
import httpStatus = require('http-status');
import { Injectable } from '@nestjs/common';
var nodemailer = require('nodemailer');
const sgMail = require('@sendgrid/mail')

@Injectable()
export class SMSClient {
  maxRetries = 3;  
  delay = 1000;  
  apiKey = this.config.get('SENDGRID_API_KEY')
  fromEmail = this.config.get('SENDGRID_FROM_EMAIL')
  fromName = this.config.get('SENDGRID_FROM_NAME')
  constructor(private config: ConfigService) {}

  public async SendOtp(phone: string, tranId: string, otp: string): Promise<any> {
    const urlSMS = this.config.get('URL_SMS');
    const userSMS = this.config.get('USER_SMS');
    const passSMS = this.config.get('PASS_SMS');
    const linkApp = this.config.get('LINK_APP');
    const branchName = this.config.get('BRAND_NAME');
    const mess = `Nhap ma ${otp} lam mat khau de dang nhap tren ung dung Influencer, hoac dang nhap tai ung dung ${linkApp}`;

    const options = {
      url: urlSMS,
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
      },
      method: 'POST',
      body: JSON.stringify({
        phone: phone,
        mess: mess,
        user: userSMS,
        pass: passSMS,
        tranId: tranId,
        brandName: branchName,
        dataEncode: 0,
        sendTime: '',
        telcoCode: '',
      }),
    };

    const availableServices = new Promise((resolve, rejected) => {
      request(options, (error, response, body) => {
        if (error && error.code == 'ETIMEDOUT') {
          console.log(error);
          rejected(new ApiError(httpStatus.BAD_REQUEST, 'ETIMEDOUT'));
        } else if (!error && response.statusCode === 200) {
          const info = JSON.parse(body);
          resolve(info.data);
        } else {
          rejected(new ApiError(httpStatus.BAD_REQUEST, JSON.parse(body).message));
        }
      });
    });

    return await availableServices;
  }

  sendEmail(email: string, otp: string, emailType: string) {
    try {
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASSWORD'),
        },
      });

      let subject = '[Influencer] Email Verification Code';
      let content = `Hi ${email},<br><br>Your Influencer verification code is: <strong>${otp}</strong><br><br>Best regards,<br>The A List Team`;
      // <br><br>The verification code is only valid for 24 hours. If it expires, you can resend it from your profile.

      if (emailType == 'CREATE') {
        subject = 'Welcome to Influencer!';
        content = `Congratulations! Your Influencer account has been successfully created. Login information:
        <br><br>Username: ${email}<br>Password: <strong>${otp}</strong><br><br>Best regards,<br>The A List Team`;
      }

      let mailOptions = {
        from: this.config.get('SMTP_USER'),
        to: email,
        subject: subject,
        html: content,
      };

      transporter.sendMail(mailOptions, (error) => {});
    } catch (error) {
      console.log(error);
    }
  }

  generateRandomString = (length: number): string => {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numericChars = '0123456789';
    const specialChars = '~`!@#$%^&*()-_+={}[]|;:"<>,./?';

    const allChars = lowercaseChars + uppercaseChars + numericChars + specialChars;
    let randomString = '';
    randomString += lowercaseChars[Math.floor(Math.random() * lowercaseChars.length)];
    randomString += uppercaseChars[Math.floor(Math.random() * uppercaseChars.length)];
    randomString += numericChars[Math.floor(Math.random() * numericChars.length)];

    for (let i = randomString.length; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * allChars.length);
      randomString += allChars[randomIndex];
    }

    return randomString;
  };

  generateRandomSimpleString = (length: number): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let randomString = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomString += charset[randomIndex];
    }
    return randomString;
  };

  sendEmailKOL(email: string, userName: string, req: any) {
    try {
      let transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: this.config.get('SMTP_USER'),
          pass: this.config.get('SMTP_PASSWORD'),
        },
      });

      let subject = 'Welcome to Influencer';
      let content = `
        <div style="font-family: Arial, sans-serif; font-size: 16px; line-height: 1.6; text-align: center;">
          <div style="display: inline-block; text-align: left; border: 1px solid #ccc; padding: 10px;">
            <p>Hi ${userName},</p>
            <p style="color: black;">Thank you for joining Influencer, your campaign information is as follows:</p>
            <ul style="list-style-type: none; padding: 0; border: 1px solid #ccc; padding: 10px;">
              <li style="color: black; margin-bottom: 5px;"><strong>Title:</strong> ${req.title}</li>
              <li style="color: black; margin-bottom: 5px;"><strong>Content:</strong> ${req.content}</li>
              <li style="color: black; margin-bottom: 5px;"><strong>Budget:</strong> ${(req.budget.toString()).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}</li>
            </ul>
            <p style="color: black;">Best regards,</p>
            <p style="color: black;">The A List Team</p>
          </div>
        </div>

      `;

      let mailOptions = {
        from: this.config.get('SMTP_USER'),
        to: email,
        subject: subject,
        html: content,
      };

      transporter.sendMail(mailOptions, (error) => {});
    } catch (error) {
      console.log(error);
    }
  }

  async sendGridEmailForget(recipients: any) {
    const templateId = this.config.get('SENDGRID_TEMPLATE_SEND_MAIL_FORGET_ID')
    sgMail.setApiKey(this.apiKey)
    
    let msg = {
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
       personalizations: recipients.map(recipient => ({
        to: [recipient],
        cc: recipient.cc || [],
        dynamic_template_data: recipient.dynamic_template_data
    })),
      template_id: templateId
    }

    await this.sendEmailWithRetry(msg);
  }

  async sendGridEmailRegister(recipients: any) {
    const templateId = this.config.get('SENDGRID_TEMPLATE_SEND_MAIL_REGISTER_ID')
    sgMail.setApiKey(this.apiKey)
    let msg = {
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
       personalizations: recipients.map(recipient => ({
        to: [recipient],
        cc: recipient.cc || [],
        dynamic_template_data: recipient.dynamic_template_data
    })),
      template_id: templateId
    }

    await this.sendEmailWithRetry(msg);
  }

  async sendGridEmailResetPass(recipients: any) {
    const templateId = this.config.get('SENDGRID_TEMPLATE_SEND_MAIL_RESET_PASSWORD_ID')
    sgMail.setApiKey(this.apiKey)
    let msg = {
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
       personalizations: recipients.map(recipient => ({
        to: [recipient],
        cc: recipient.cc || [],
        dynamic_template_data: recipient.dynamic_template_data
    })),
      template_id: templateId
    }

    await this.sendEmailWithRetry(msg);
  }

  async sendGridEmailKOL(recipients: any) {
    const apiKey = this.config.get('SENDGRID_API_KEY')
    const templateId = this.config.get('SENDGRID_TEMPLATE_SEND_MAIL_KOL_ID')
    const fromEmail = this.config.get('SENDGRID_FROM_EMAIL')
    const fromName = this.config.get('SENDGRID_FROM_NAME')
    sgMail.setApiKey(apiKey)
    const personalizations = recipients.map(recipient => ({
      to: {
        email: recipient.email,
        name: recipient.name
      },
      // cc: recipient.ccRecipients ? recipient.ccRecipients.map(cc => ({
      //     email: cc.email,
      //     name: cc.name
      // })) : [],
      dynamic_template_data: {
        name: recipient.name,
        campaign_name: recipient.campaign_name,
        campaign_title: recipient.campaign_title,
        campaign_content: recipient.campaign_content,
        campaign_budget: recipient.campaign_budget
      }
    }));
   
    const msg = {
      from: {
        email: fromEmail,
        name: fromName
      },
      personalizations: personalizations,
      template_id: templateId
    };
   
   await this.sendEmailWithRetry(msg); 
  }

  async sendGridEmailPaymentReminder(recipients: any) {
    const templateId = this.config.get('SENDGRID_TEMPLATE_SEND_MAIL_PAYMENT_REMINDER')
    sgMail.setApiKey(this.apiKey)
    
    let msg = {
      from: {
        email: this.fromEmail,
        name: this.fromName
      },
       personalizations: recipients.map(recipient => ({
        to: [recipient],
        cc: recipient.cc || [],
        dynamic_template_data: recipient.dynamic_template_data
    })),
      template_id: templateId
    }

    await this.sendEmailWithRetry(msg);
  }

  async sendEmailWithRetry(msg) {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await sgMail.send(msg, true); 
        break; 
      } catch (error) {
        console.log(`Attempt ${attempt} failed: ${error}`);
        if (attempt < this.maxRetries) {
          await new Promise(resolve => setTimeout(resolve, this.delay)); 
        } else {
          console.log('All attempts failed');
        }
      }
    }
  };

  async sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export class ApiError extends Error {
  constructor(statusCode, message, isOperational = true, stack = '') {
    super(message);
    // this.statusCode = statusCode;
    // this.isOperational = isOperational;
    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class ResponseSMS {
  public code: number;
  public mesage: string;
  public transId: string;
  public oper: string;
  public totalSMS: number;
}
