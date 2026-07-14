"use server";

import { Resend } from "resend";

type SendStudentQrPassArgs = {
  email: string;
  studentId: string;
  studentName: string;
  qrDataUrl: string;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getQrImageBuffer(qrDataUrl: string) {
  const match = qrDataUrl.match(/^data:image\/png;base64,(.+)$/);

  if (!match) {
    throw new Error("Invalid QR image data.");
  }

  return Buffer.from(match[1], "base64");
}

export async function sendStudentQrPassEmail({
  email,
  studentId,
  studentName,
  qrDataUrl,
}: SendStudentQrPassArgs) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured.");
  }

  if (!from) {
    throw new Error("RESEND_FROM_EMAIL is not configured.");
  }

  const resend = new Resend(apiKey);
  const attachment = getQrImageBuffer(qrDataUrl);
  const attachmentName = `${studentId.replaceAll("/", "-")}-reading-room-pass.png`;

  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `Your Reading Room QR Pass - ${studentId}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #4b1719;">
        <h2 style="margin: 0 0 12px;">Your Reading Room QR Pass</h2>
        <p style="margin: 0 0 12px;">Hello ${escapeHtml(studentName)},</p>
        <p style="margin: 0 0 12px;">Your QR pass for the library reading room has been created and is attached to this email.</p>
        <p style="margin: 0 0 12px;"><strong>Student ID:</strong> ${escapeHtml(studentId)}</p>
        <p style="margin: 0;">Please keep this QR code handy when entering the reading room.</p>
      </div>
    `,
    attachments: [
      {
        filename: attachmentName,
        content: attachment,
        contentType: "image/png",
      },
    ],
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    message: `QR pass sent successfully to ${email}.`,
  };
}