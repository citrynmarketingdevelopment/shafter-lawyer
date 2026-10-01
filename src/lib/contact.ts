import { z } from "zod";

export const MAX_CONTACT_BODY_BYTES = 20_000;

const singleLine = (value: string) => !/[\r\n\u0000]/.test(value);

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(100).refine(singleLine),
  email: z.string().trim().max(254).email(),
  phone: z.string().trim().max(50).refine(singleLine).optional().default(""),
  message: z.string().trim().min(10).max(5_000),
  website: z.string().trim().max(200).optional().default(""),
});

export type ContactSubmission = z.infer<typeof contactSchema>;
export type ContactEnvironment = Record<string, string | undefined>;

export class ContactRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ContactRequestError";
  }
}

/** Enforce the limit even when Content-Length is absent or inaccurate. */
export async function readContactJson(request: Request): Promise<unknown> {
  const declaredLength = Number(request.headers.get("content-length"));
  if (declaredLength > MAX_CONTACT_BODY_BYTES) {
    throw new ContactRequestError("Your message is too large.", 413);
  }

  if (!request.body) {
    throw new ContactRequestError("Please provide your contact details.", 400);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_CONTACT_BODY_BYTES) {
        await reader.cancel();
        throw new ContactRequestError("Your message is too large.", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new ContactRequestError("Please submit a valid contact form.", 400);
  }
}

function httpOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    ) {
      return null;
    }
    return url.origin;
  } catch {
    return null;
  }
}

/** Only configured/deployment origins are trusted; never trust Host headers. */
export function isAllowedContactOrigin(
  request: Request,
  env: ContactEnvironment,
): boolean {
  const suppliedOrigin = request.headers.get("origin");
  const origin = httpOrigin(suppliedOrigin ?? undefined);
  if (!origin || suppliedOrigin !== origin) return false;

  const allowed = new Set(
    [
      httpOrigin(env.NEXT_PUBLIC_SITE_URL),
      httpOrigin(env.VERCEL_URL ? `https://${env.VERCEL_URL}` : undefined),
      httpOrigin(
        env.VERCEL_PROJECT_PRODUCTION_URL
          ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`
          : undefined,
      ),
    ].filter((value): value is string => Boolean(value)),
  );

  if (env.NODE_ENV !== "production") {
    const localUrl = new URL(request.url);
    const submittedUrl = new URL(origin);
    const loopbackHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
    // Next can normalize its internal request URL to localhost even when the
    // browser uses a loopback IP. Keep protocol and port checks intact.
    if (
      loopbackHosts.has(localUrl.hostname) &&
      loopbackHosts.has(submittedUrl.hostname) &&
      localUrl.protocol === submittedUrl.protocol &&
      localUrl.port === submittedUrl.port
    ) {
      allowed.add(origin);
    }
  }

  return allowed.has(origin);
}

const smtpSchema = z.object({
  host: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[a-zA-Z0-9.-]+$/),
  port: z.coerce.number().int().min(1).max(65_535),
  secure: z.enum(["true", "false"]).transform((value) => value === "true"),
  user: z.string().min(1).max(320),
  password: z.string().min(1),
  from: z.string().email(),
  to: z.string().email(),
});

function isPlaceholder(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  // Match known template values in full. Real passwords may contain punctuation,
  // angle brackets, domains, or words that also occur in placeholder text.
  const token = value
    .trim()
    .replace(/^<([^<>]+)>$/, "$1")
    .replace(/^\$\{([A-Za-z_]+)\}$/, "$1");
  return /^(?:placeholder|change[-_ ]?me|replace[-_ ]?me|(?:your[-_ ]|replace[-_ ]with[-_ ](?:your[-_ ])?)(?:smtp[-_ ])?(?:credentials|user(?:name)?|password|host|email)|smtp[-_ ](?:user(?:name)?|password|host))$/i.test(
    token,
  );
}

function usesExampleDomain(value: string | undefined): boolean {
  if (!value) return false;
  const domain = value.trim().split("@").at(-1)?.replace(/\.$/, "") ?? "";
  return /(?:^|\.)example\.(?:com|org|net)$|(?:^|\.)(?:example|invalid)$/i.test(
    domain,
  );
}

export function getSmtpConfig(env: ContactEnvironment) {
  const requiredValues = [
    env.SMTP_HOST,
    env.SMTP_USER,
    env.SMTP_PASSWORD,
    env.SMTP_FROM,
    env.CONTACT_TO,
  ];
  if (requiredValues.some(isPlaceholder)) return null;
  if ([env.SMTP_HOST, env.SMTP_FROM, env.CONTACT_TO].some(usesExampleDomain))
    return null;

  const parsed = smtpSchema.safeParse({
    host: env.SMTP_HOST?.trim(),
    port: env.SMTP_PORT ?? "587",
    secure: env.SMTP_SECURE ?? "false",
    user: env.SMTP_USER?.trim(),
    password: env.SMTP_PASSWORD,
    from: env.SMTP_FROM?.trim(),
    to: env.CONTACT_TO?.trim(),
  });

  if (!parsed.success) return null;
  // Port 465 expects TLS immediately, while 587 uses STARTTLS.
  if (parsed.data.port === 465 && !parsed.data.secure) return null;
  return parsed.data;
}

export function contactEmailText(contact: ContactSubmission): string {
  return [
    "New website contact form submission",
    "",
    `Name: ${contact.name}`,
    `Email: ${contact.email}`,
    `Phone: ${contact.phone || "Not provided"}`,
    "",
    "Message:",
    contact.message,
  ].join("\n");
}
