import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

// [CURRENT] for some reason the webhook is super basic and bad
// https://github.com/vkuznecovas/mouthful/blob/master/api/router.go#L252-L266

// [FUTURE] payload is from CreateCommentBody struct in
// https://github.com/vkuznecovas/mouthful/blob/master/api/model/createCommentBody.go

interface MouthfulPayload {
  path: string;
  body: string;
  author: string;
  email?: string;
  replyTo?: string;
}

const PAYLOAD_DISABLED = true;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== "POST") return new Response("ok");

    const payload = (await request.json().catch(() => ({}))) as MouthfulPayload;

    // simple text email
    const msg = createMimeMessage();
    const fromAddr = env.SENDER_EMAIL;
    const toAddr = env.DESTINATION_EMAIL;

    const subject = `New comment on ${env.SITE_DOMAIN}`;
    const rawBody = [];
    if (PAYLOAD_DISABLED) rawBody.push("Payload not supported yet");
    else {
      rawBody.push(`New comment received on ${payload.path}`);
      rawBody.push("");
      rawBody.push(`Body: ${payload.body ?? "(unknown)"}`);
      rawBody.push(`Author: ${payload.author ?? "(anonymous)"}`);
      rawBody.push(`Email: ${payload.email ?? "(no content)"}`);
      rawBody.push(`ReplyTo: ${payload.replyTo ?? "(unknown)"}`);
    }
    const body = rawBody.join("\n");

    msg.setSender({ name: "Notifications", addr: fromAddr });
    msg.setRecipient(toAddr);
    msg.setSubject(subject);
    msg.addMessage({ contentType: "text/plain", data: body });

    // send with Cloudflare Email Service binding
    const email = new EmailMessage(fromAddr, toAddr, msg.asRaw());

    try {
      await env.SEND_EMAIL.send(email);
      return new Response("ok");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return new Response(`send failed: ${message}`, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;

export interface Env {
  SENDER_EMAIL: string;
  DESTINATION_EMAIL: string;
  SITE_DOMAIN: string;
  SEND_EMAIL: { send: (m: EmailMessage) => Promise<void> };
}
