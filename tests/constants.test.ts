import { describe, it, expect } from "vitest";
import {
  STORAGE_PATHS,
  SHARE_STATUS_RESET_DELAY_MS,
  PROGRESS_INCREMENT,
  REDIRECT_DELAY_MS,
  PROGRESS_INTERVAL_MS,
  PROGRESS_STEP,
  GRID_OVERLAY_SIZE,
  GRID_COLOR,
  UNAUTHORIZED_STATUSES,
  IMAGE_RENDER_DIMENSION,
  ROOMIFY_RENDER_PROMPT,
} from "../components/lib/constants";

describe("constants", () => {
  describe("STORAGE_PATHS", () => {
    it("has the correct ROOT path", () => {
      expect(STORAGE_PATHS.ROOT).toBe("roomify");
    });

    it("has the correct SOURCES path", () => {
      expect(STORAGE_PATHS.SOURCES).toBe("roomify/sources");
    });

    it("has the correct RENDERS path", () => {
      expect(STORAGE_PATHS.RENDERS).toBe("roomify/renders");
    });

    it("SOURCES path is nested under ROOT", () => {
      expect(STORAGE_PATHS.SOURCES.startsWith(STORAGE_PATHS.ROOT)).toBe(true);
    });

    it("RENDERS path is nested under ROOT", () => {
      expect(STORAGE_PATHS.RENDERS.startsWith(STORAGE_PATHS.ROOT)).toBe(true);
    });
  });

  describe("Timing constants", () => {
    it("SHARE_STATUS_RESET_DELAY_MS is 1500", () => {
      expect(SHARE_STATUS_RESET_DELAY_MS).toBe(1500);
    });

    it("PROGRESS_INCREMENT is 15", () => {
      expect(PROGRESS_INCREMENT).toBe(15);
    });

    it("REDIRECT_DELAY_MS is 600", () => {
      expect(REDIRECT_DELAY_MS).toBe(600);
    });

    it("PROGRESS_INTERVAL_MS is 100", () => {
      expect(PROGRESS_INTERVAL_MS).toBe(100);
    });

    it("PROGRESS_STEP is 5", () => {
      expect(PROGRESS_STEP).toBe(5);
    });

    it("REDIRECT_DELAY_MS is a positive number", () => {
      expect(REDIRECT_DELAY_MS).toBeGreaterThan(0);
    });

    it("PROGRESS_INTERVAL_MS is a positive number", () => {
      expect(PROGRESS_INTERVAL_MS).toBeGreaterThan(0);
    });

    it("PROGRESS_STEP is between 1 and 100 (valid percentage step)", () => {
      expect(PROGRESS_STEP).toBeGreaterThan(0);
      expect(PROGRESS_STEP).toBeLessThanOrEqual(100);
    });
  });

  describe("UI constants", () => {
    it("GRID_OVERLAY_SIZE is '60px 60px'", () => {
      expect(GRID_OVERLAY_SIZE).toBe("60px 60px");
    });

    it("GRID_COLOR is the correct hex color", () => {
      expect(GRID_COLOR).toBe("#3B82F6");
    });

    it("GRID_COLOR is a valid hex color format", () => {
      expect(GRID_COLOR).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });

  describe("HTTP status codes", () => {
    it("UNAUTHORIZED_STATUSES contains 401", () => {
      expect(UNAUTHORIZED_STATUSES).toContain(401);
    });

    it("UNAUTHORIZED_STATUSES contains 403", () => {
      expect(UNAUTHORIZED_STATUSES).toContain(403);
    });

    it("UNAUTHORIZED_STATUSES has exactly two entries", () => {
      expect(UNAUTHORIZED_STATUSES).toHaveLength(2);
    });
  });

  describe("Image dimensions", () => {
    it("IMAGE_RENDER_DIMENSION is 1024", () => {
      expect(IMAGE_RENDER_DIMENSION).toBe(1024);
    });

    it("IMAGE_RENDER_DIMENSION is a power of two", () => {
      expect(Math.log2(IMAGE_RENDER_DIMENSION) % 1).toBe(0);
    });
  });

  describe("ROOMIFY_RENDER_PROMPT", () => {
    it("is a non-empty string", () => {
      expect(typeof ROOMIFY_RENDER_PROMPT).toBe("string");
      expect(ROOMIFY_RENDER_PROMPT.length).toBeGreaterThan(0);
    });

    it("does not start or end with whitespace (trim was applied)", () => {
      expect(ROOMIFY_RENDER_PROMPT).toBe(ROOMIFY_RENDER_PROMPT.trim());
    });

    it("mentions the core task of converting 2D floor plans", () => {
      expect(ROOMIFY_RENDER_PROMPT).toContain("2D floor plan");
    });

    it("includes the top-down view requirement", () => {
      expect(ROOMIFY_RENDER_PROMPT).toContain("TOP");
    });

    it("includes furniture mapping instructions", () => {
      expect(ROOMIFY_RENDER_PROMPT).toContain("FURNITURE");
    });
  });
});