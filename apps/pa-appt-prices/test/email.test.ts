import { describe, it, expect, vi } from "vitest";

// Mock cloudflare:email before importing email module
vi.mock("cloudflare:email", () => ({
  EmailMessage: class {
    constructor(
      public from: string,
      public to: string,
      public raw: string,
    ) {}
  },
}));

import { sendReport } from "../src/email";
import { fakePng } from "./fixtures";

describe("sendReport", () => {
  it("sends an email with chart attachments", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);
    const charts = [
      { filename: "all-units.png", data: fakePng() },
      { filename: "Unit 101.png", data: fakePng() },
    ];

    await sendReport(
      "test@example.com",
      "dest@example.com",
      { send: mockSend },
      charts,
      "2026-04-05: avg $3100 (5 units)",
    );

    expect(mockSend).toHaveBeenCalledOnce();
    const email = mockSend.mock.calls[0][0];
    expect(email.from).toBe("test@example.com");
    expect(email.to).toBe("dest@example.com");

    // Check MIME content includes expected parts
    const raw = email.raw;
    expect(raw).toContain("Daily Price Report");
    expect(raw).toContain("avg $3100");
    expect(raw).toContain("all-units");
    expect(raw).toContain("Unit 101");
    expect(raw).toContain("Content-ID");
  });

  it("handles empty chart list", async () => {
    const mockSend = vi.fn().mockResolvedValue(undefined);

    await sendReport(
      "test@example.com",
      "dest@example.com",
      { send: mockSend },
      [],
      "no data",
    );

    expect(mockSend).toHaveBeenCalledOnce();
    const raw = mockSend.mock.calls[0][0].raw;
    expect(raw).toContain("no data");
  });
});
