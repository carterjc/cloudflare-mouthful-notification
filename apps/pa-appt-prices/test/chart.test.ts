import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderTimelineChart } from "../src/chart";
import { makeTimelineRows, fakePng } from "./fixtures";

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(fakePng()),
    }),
  );
});

describe("renderTimelineChart", () => {
  it("sends correct chart config for multiple units", async () => {
    const rows = makeTimelineRows(3, 5, 1);
    await renderTimelineChart(rows, "price");

    expect(fetch).toHaveBeenCalledOnce();
    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);

    expect(body.chart.type).toBe("line");
    expect(body.chart.data.labels).toHaveLength(5);
    expect(body.chart.data.datasets).toHaveLength(3);
    expect(body.chart.options.title.text).toContain("All Units");
  });

  it("groups by move-in date for a single unit", async () => {
    const rows = makeTimelineRows(1, 5, 3);
    await renderTimelineChart(rows, "price");

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);

    expect(body.chart.data.datasets).toHaveLength(3);
    expect(body.chart.data.datasets[0].label).toContain("move-in");
    expect(body.chart.options.title.text).toContain("Unit 100");
  });

  it("uses net_effective metric when specified", async () => {
    const rows = makeTimelineRows(1, 2, 1);
    await renderTimelineChart(rows, "net_effective");

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);

    expect(body.chart.options.title.text).toContain("Net Effective");
    expect(body.chart.data.datasets[0].data[0]).toBe(rows[0].net_effective);
  });

  it("throws on QuickChart error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(renderTimelineChart(makeTimelineRows(1, 1, 1), "price")).rejects.toThrow(
      "QuickChart error: 500",
    );
  });

  it("skips duplicate scrape dates for multi-unit view", async () => {
    // 2 move-in dates per unit, multi-unit mode should pick first per scrape day
    const rows = makeTimelineRows(2, 3, 2);
    await renderTimelineChart(rows, "price");

    const body = JSON.parse((fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);

    // Should have 2 datasets (one per unit), not 4
    expect(body.chart.data.datasets).toHaveLength(2);
    // Each dataset should have 3 data points (one per scrape day)
    expect(body.chart.data.datasets[0].data).toHaveLength(3);
  });
});
