import assert from "node:assert/strict";
import test from "node:test";
import {
  ContactRequestError,
  contactSchema,
  getSmtpConfig,
  isAllowedContactOrigin,
  MAX_CONTACT_BODY_BYTES,
  readContactJson,
} from "../src/lib/contact";

const validContact = {
  name: "A Visitor",
  email: "visitor@client.test",
  message: "Please call me about scheduling an appointment.",
};

const validSmtp = {
  SMTP_HOST: "smtp.mail-service.test",
  SMTP_USER: "account",
  SMTP_PASSWORD: "a-real-secret",
  SMTP_FROM: "office@law-office.test",
  CONTACT_TO: "inbox@law-office.test",
};

test("contact validation trims fields and supports an omitted phone", () => {
  const result = contactSchema.parse({ ...validContact, name: "  A Visitor  " });
  assert.equal(result.name, "A Visitor");
  assert.equal(result.phone, "");
  assert.equal(result.website, "");
});

test("contact validation rejects invalid addresses, header injection and large messages", () => {
  assert.equal(contactSchema.safeParse({ ...validContact, email: "not-an-email" }).success, false);
  assert.equal(contactSchema.safeParse({ ...validContact, name: "Name\r\nBcc: spam" }).success, false);
  assert.equal(contactSchema.safeParse({ ...validContact, message: "x".repeat(5_001) }).success, false);
});

test("origin checks only trust site/deployment environment, never incoming Host headers", () => {
  const env = {
    NODE_ENV: "production",
    NEXT_PUBLIC_SITE_URL: "https://law-office.test",
    VERCEL_URL: "law-office-preview.vercel.app",
  };
  assert.equal(isAllowedContactOrigin(new Request("https://internal.test/api/contact", {
    headers: { origin: "https://law-office.test" },
  }), env), true);
  assert.equal(isAllowedContactOrigin(new Request("https://internal.test/api/contact", {
    headers: { origin: "https://law-office-preview.vercel.app" },
  }), env), true);
  assert.equal(isAllowedContactOrigin(new Request("https://attacker.test/api/contact", {
    headers: { origin: "https://attacker.test", host: "attacker.test", "x-forwarded-host": "attacker.test" },
  }), env), false);
  assert.equal(isAllowedContactOrigin(new Request("https://law-office.test/api/contact"), env), false);
});

test("localhost is only automatically allowed outside production", () => {
  const request = new Request("http://localhost:3001/api/contact", {
    headers: { origin: "http://localhost:3001" },
  });
  assert.equal(isAllowedContactOrigin(request, { NODE_ENV: "development" }), true);
  assert.equal(isAllowedContactOrigin(request, { NODE_ENV: "production" }), false);
});

test("development accepts equivalent loopback hosts only on the same protocol and port", () => {
  const env = { NODE_ENV: "development" };
  for (const origin of ["http://127.0.0.1:3000", "http://[::1]:3000", "http://localhost:3000"]) {
    const request = new Request("http://localhost:3000/api/contact", { headers: { origin } });
    assert.equal(isAllowedContactOrigin(request, env), true);
    assert.equal(isAllowedContactOrigin(request, { NODE_ENV: "production" }), false);
  }
  for (const origin of ["http://127.0.0.1:3001", "https://127.0.0.1:3000", "http://attacker.test:3000"]) {
    const request = new Request("http://localhost:3000/api/contact", { headers: { origin } });
    assert.equal(isAllowedContactOrigin(request, env), false);
  }
  assert.equal(isAllowedContactOrigin(new Request("http://attacker.test:3000/api/contact", {
    headers: { origin: "http://localhost:3000" },
  }), env), false);
});

test("missing and placeholder SMTP credentials remain unconfigured", () => {
  assert.equal(getSmtpConfig({}), null);
  assert.equal(getSmtpConfig({
    SMTP_HOST: "smtp.example.com",
    SMTP_USER: "your-smtp-user",
    SMTP_PASSWORD: "replace-me",
    SMTP_FROM: "office@example.com",
    CONTACT_TO: "office@example.com",
  }), null);
});

test("SMTP configuration parses TLS settings and preserves password whitespace", () => {
  const env = {
    SMTP_HOST: "smtp.mail-service.test",
    SMTP_USER: "account",
    SMTP_PASSWORD: " leading-and-trailing ",
    SMTP_FROM: "office@law-office.test",
    CONTACT_TO: "inbox@law-office.test",
    SMTP_PORT: "465",
    SMTP_SECURE: "true",
  };
  const config = getSmtpConfig(env);
  assert.ok(config);
  assert.equal(config.port, 465);
  assert.equal(config.secure, true);
  assert.equal(config.password, " leading-and-trailing ");
  assert.equal(getSmtpConfig({ ...env, SMTP_SECURE: "false" }), null);
  assert.equal(getSmtpConfig({ ...env, SMTP_PORT: "invalid" }), null);
});

test("SMTP passwords accept punctuation and placeholder-like substrings unchanged", () => {
  for (const password of [
    "<Str0ng>!P@ss",
    "prefix-placeholder-your-password-suffix",
    "secret-containing-example.com-and-.invalid",
    "prefix${SMTP_PASSWORD}suffix",
    "<entirely-valid-secret>",
  ]) {
    const config = getSmtpConfig({ ...validSmtp, SMTP_PASSWORD: password });
    assert.ok(config, `Should accept this password format: ${password}`);
    assert.equal(config.password, password);
  }
});

test("SMTP rejects whole credential placeholders without matching real username substrings", () => {
  for (const placeholder of ["your-smtp-password", "replace-me", "<SMTP_PASSWORD>", "${SMTP_PASSWORD}", "placeholder"]) {
    assert.equal(getSmtpConfig({ ...validSmtp, SMTP_PASSWORD: placeholder }), null);
  }
  assert.ok(getSmtpConfig({ ...validSmtp, SMTP_USER: "your-office-account" }));
});

test("SMTP rejects reserved example domains only in host and email configuration", () => {
  assert.equal(getSmtpConfig({ ...validSmtp, SMTP_HOST: "smtp.example.com" }), null);
  assert.equal(getSmtpConfig({ ...validSmtp, SMTP_FROM: "office@example.org" }), null);
  assert.equal(getSmtpConfig({ ...validSmtp, CONTACT_TO: "office@domain.invalid" }), null);
  assert.ok(getSmtpConfig({ ...validSmtp, SMTP_HOST: "smtp.example.com.mail-service.test" }));
});

test("JSON body reader rejects excessive bodies even without Content-Length", async () => {
  const request = new Request("http://localhost/api/contact", {
    method: "POST",
    body: JSON.stringify({ message: "x".repeat(MAX_CONTACT_BODY_BYTES) }),
  });
  await assert.rejects(readContactJson(request), (error: unknown) =>
    error instanceof ContactRequestError && error.status === 413,
  );
});

test("JSON body reader accepts valid JSON and rejects malformed JSON", async () => {
  assert.deepEqual(await readContactJson(new Request("http://localhost/api/contact", {
    method: "POST", body: JSON.stringify(validContact),
  })), validContact);
  await assert.rejects(readContactJson(new Request("http://localhost/api/contact", {
    method: "POST", body: "{",
  })), (error: unknown) => error instanceof ContactRequestError && error.status === 400);
});
