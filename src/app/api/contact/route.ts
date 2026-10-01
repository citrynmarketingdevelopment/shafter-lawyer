import nodemailer from "nodemailer";
import {
  contactEmailText,
  ContactRequestError,
  contactSchema,
  getSmtpConfig,
  isAllowedContactOrigin,
  readContactJson,
} from "@/lib/contact";

export const runtime = "nodejs";
export const maxDuration = 30;

function respond(body: { success: boolean; message: string }, status: number) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!isAllowedContactOrigin(request, process.env)) {
    return respond(
      { success: false, message: "Please submit this form from our website." },
      403,
    );
  }

  const contentType = request.headers.get("content-type")?.split(";")[0].trim();
  if (contentType !== "application/json") {
    return respond(
      { success: false, message: "Please submit a valid contact form." },
      415,
    );
  }

  let input: unknown;
  try {
    input = await readContactJson(request);
  } catch (error) {
    if (error instanceof ContactRequestError) {
      return respond({ success: false, message: error.message }, error.status);
    }
    return respond(
      { success: false, message: "We could not read your submission." },
      400,
    );
  }

  const parsed = contactSchema.safeParse(input);
  if (!parsed.success || parsed.data.website) {
    return respond(
      {
        success: false,
        message:
          "Please enter your name, a valid email address, and a message between 10 and 5,000 characters.",
      },
      400,
    );
  }

  const config = getSmtpConfig(process.env);
  if (!config) {
    return respond(
      {
        success: false,
        message:
          "Online messages are currently unavailable. Please contact the office by phone.",
      },
      503,
    );
  }

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    requireTLS: !config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 5_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
    dnsTimeout: 5_000,
    disableFileAccess: true,
    disableUrlAccess: true,
    logger: false,
    debug: false,
  });

  try {
    const result = await transport.sendMail({
      from: config.from,
      to: config.to,
      replyTo: { name: parsed.data.name, address: parsed.data.email },
      subject: "New website contact request",
      text: contactEmailText(parsed.data),
    });

    if (!result.accepted?.length)
      throw new Error("SMTP did not accept the message.");

    return respond(
      {
        success: true,
        message: "Thank you. Your message has been sent to our office.",
      },
      200,
    );
  } catch {
    // SMTP errors can contain credentials or message details. Do not log them.
    return respond(
      {
        success: false,
        message:
          "Your message could not be sent. Please try again or contact the office by phone.",
      },
      502,
    );
  } finally {
    transport.close();
  }
}
