"use server";

import { Resend } from "resend";
import type { EmailType } from "@/types/email";

const resendClient = new Resend(process.env.RESEND_API_KEY);

export interface EmailSendResult {
  id: string;
}

export async function sendEmailToUser(
  recipient: string,
  category: EmailType,
  otp: string,
): Promise<{ ok: true; data: EmailSendResult } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.EMAIL_SENDER;

  if (!apiKey) {
    return { ok: false, error: "Missing RESEND_API_KEY environment variable" };
  }

  if (!sender) {
    return { ok: false, error: "Missing EMAIL_SENDER environment variable" };
  }

  if (!recipient || !recipient.includes("@")) {
    return { ok: false, error: "Invalid recipient address" };
  }

  if (!otp) {
    return { ok: false, error: "OTP value required" };
  }

  try {
    const payload = buildEmailPayload(sender, recipient, category, otp);
    const { data, error } = await resendClient.emails.send(payload);

    if (error) {
      console.error("Resend error:", error);
      return { ok: false, error: error.message ?? "Unknown API error" };
    }

    if (!data) {
      return { ok: false, error: "Empty response from Resend API" };
    }

    return { ok: true, data };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unexpected failure";
    console.error("Email send exception:", err);
    return { ok: false, error: msg };
  }
}

function buildEmailPayload(
  sender: string,
  recipient: string,
  category: EmailType,
  otp: string,
) {
  const common = {
    from: sender,
    to: [recipient],
  };

  switch (category) {
    case "email-verification":
      return {
        ...common,
        subject: "Verify your email",
        text: otp,
      };
    case "sign-in":
      return {
        ...common,
        subject: "Your Bitstacks sign-in code",
        text: otp,
      };
    case "forget-password":
      return {
        ...common,
        subject: "Password reset code",
        text: otp,
      };
    default:
      throw new Error(`Unsupported email type: ${category}`);
  }
}
