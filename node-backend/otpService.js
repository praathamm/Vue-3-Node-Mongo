const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password, not your real password
    },
});

function generateOtp() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function escapeHtml(value) {
    return String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatMailDate(value) {
    return new Date(value).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

async function sendOtpEmail(toEmail, otp) {
    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: toEmail,
        subject: 'CourierLive verification code',
        text: `Welcome to CourierLive. Your verification code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#183b3b">
                <div style="padding:24px;background:#163b46;color:#fff;border-radius:14px 14px 0 0">
                    <h1 style="margin:0;font-size:26px">CourierLive</h1>
                    <p style="margin:8px 0 0;color:#c8e5e2">Reliable delivery, clearly tracked.</p>
                </div>
                <div style="padding:28px;background:#f7faf9;border:1px solid #e0eae5;border-top:0;border-radius:0 0 14px 14px">
                    <h2 style="margin-top:0">Verify your email</h2>
                    <p>Use the verification code below to finish creating your CourierLive account.</p>
                    <div style="margin:24px 0;padding:16px;text-align:center;background:#e1f2ec;border-radius:10px;font-size:32px;font-weight:700;letter-spacing:8px;color:#1c746d">${escapeHtml(otp)}</div>
                    <p style="color:#66817d">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
                </div>
            </div>`,
    });
}

async function sendDeliveryConfirmationEmail(toEmail, shipment, customerName) {
    const details = [
        ['Tracking number', shipment.trackingNumber],
        ['Status', shipment.status],
        ['Delivery type', shipment.deliveryType],
        ['Sender', `${shipment.senderName} - ${shipment.senderAddress}`],
        ['Recipient', `${shipment.recipientName} - ${shipment.recipientAddress}`],
        ['Sender contact', shipment.senderContactNumber],
        ['Recipient contact', shipment.recipientContactNumber],
        ['Package weight', shipment.packageWeight],
        ['Description', shipment.packageDescription || 'Not provided'],
        ['Delivered at', formatMailDate(shipment.deliveredAt || shipment.updatedAt)],
    ];
    const textDetails = details.map(([label, value]) => `${label}: ${value}`).join('\n');
    const htmlDetails = details.map(([label, value]) => `
        <tr>
            <td style="padding:9px 0;color:#66817d;width:38%">${escapeHtml(label)}</td>
            <td style="padding:9px 0;font-weight:600">${escapeHtml(value)}</td>
        </tr>`).join('');

    await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: toEmail,
        subject: `CourierLive delivery confirmation - ${shipment.trackingNumber}`,
        text: `Hello ${customerName || 'Customer'},\n\nYour CourierLive shipment has been delivered.\n\n${textDetails}\n\nThank you for using CourierLive.`,
        html: `
            <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#183b3b">
                <div style="padding:24px;background:#163b46;color:#fff;border-radius:14px 14px 0 0">
                    <h1 style="margin:0;font-size:26px">CourierLive</h1>
                    <p style="margin:8px 0 0;color:#c8e5e2">Delivery confirmation</p>
                </div>
                <div style="padding:28px;background:#f7faf9;border:1px solid #e0eae5;border-top:0;border-radius:0 0 14px 14px">
                    <h2 style="margin-top:0">Your package has been delivered</h2>
                    <p>Hello ${escapeHtml(customerName || 'Customer')}, your shipment details are below.</p>
                    <table style="width:100%;border-collapse:collapse;margin-top:20px">${htmlDetails}</table>
                    <p style="margin-bottom:0;color:#66817d">Thank you for using CourierLive.</p>
                </div>
            </div>`,
    });
}

module.exports = { generateOtp, sendOtpEmail, sendDeliveryConfirmationEmail };
