import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

interface ChartAttachment {
  filename: string;
  data: ArrayBuffer;
}

interface SendEmail {
  send: (m: EmailMessage) => Promise<void>;
}

export async function sendReport(
  sender: string,
  recipient: string,
  sendEmail: SendEmail,
  charts: ChartAttachment[],
  summary: string,
) {
  const msg = createMimeMessage();
  msg.setSender({ name: "Apt Price Tracker", addr: sender });
  msg.setRecipient(recipient);
  msg.setSubject(`Apt Price Report — ${new Date().toISOString().substring(0, 10)}`);

  // HTML body with inline chart images
  const imgTags = charts
    .map((c, i) => `<h3>${c.filename.replace(".png", "")}</h3><img src="cid:chart${i}" style="max-width:100%">`)
    .join("\n");

  msg.addMessage({
    contentType: "text/html",
    data: `<div style="font-family:sans-serif"><h2>Daily Price Report</h2><pre>${summary}</pre>${imgTags}</div>`,
  });

  for (let i = 0; i < charts.length; i++) {
    const b64 = arrayBufferToBase64(charts[i].data);
    msg.addAttachment({
      filename: charts[i].filename,
      contentType: "image/png",
      data: b64,
      headers: { "Content-ID": `<chart${i}>` },
    });
  }

  const email = new EmailMessage(sender, recipient, msg.asRaw());
  await sendEmail.send(email);
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
