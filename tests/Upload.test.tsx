import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import Upload from "../components/Upload";
import { PROGRESS_INTERVAL_MS, PROGRESS_STEP, REDIRECT_DELAY_MS } from "../components/lib/constants";

// Mock react-router's useOutletContext
vi.mock("react-router", () => ({
  useOutletContext: vi.fn(),
}));

// Mock lucide-react icons to avoid SVG rendering issues
vi.mock("lucide-react", () => ({
  UploadIcon: () => <svg data-testid="upload-icon" />,
  CheckCircle2: () => <svg data-testid="check-circle-icon" />,
  ImageIcon: () => <svg data-testid="image-icon" />,
}));

import { useOutletContext } from "react-router";

const mockUseOutletContext = vi.mocked(useOutletContext);

// Helper: create a class-based FileReader mock that calls onload synchronously
function createFileReaderMock(base64Result: string) {
  return class MockFileReader {
    onload: ((e: ProgressEvent<FileReader>) => void) | null = null;
    readAsDataURL(_file: Blob) {
      const event = {
        target: { result: base64Result },
      } as unknown as ProgressEvent<FileReader>;
      if (this.onload) this.onload(event);
    }
  } as unknown as typeof FileReader;
}

function renderUpload(props: { onComplete?: (base64: string) => void } = {}, isSignedIn = true) {
  mockUseOutletContext.mockReturnValue({ isSignedIn } as unknown as ReturnType<typeof useOutletContext>);
  return render(<Upload {...props} />);
}

describe("Upload component", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("initial render (dropzone state)", () => {
    it("renders the dropzone when no file is selected", () => {
      renderUpload();
      expect(screen.getByText("Click to upload or just drag and drop")).toBeInTheDocument();
    });

    it("shows sign-in prompt when user is not signed in", () => {
      renderUpload({}, false);
      expect(screen.getByText("Sign in or sign up with Puter to upload")).toBeInTheDocument();
    });

    it("shows upload instructions when signed in", () => {
      renderUpload();
      expect(screen.getByText("Click to upload or just drag and drop")).toBeInTheDocument();
    });

    it("shows maximum file size hint", () => {
      renderUpload();
      expect(screen.getByText("Maximum file size 50MB.")).toBeInTheDocument();
    });

    it("renders the upload icon", () => {
      renderUpload();
      expect(screen.getByTestId("upload-icon")).toBeInTheDocument();
    });

    it("renders file input with correct accept attribute", () => {
      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input).not.toBeNull();
      expect(input.accept).toBe(".jpg,.jpeg,.png");
    });

    it("disables file input when not signed in", () => {
      const { container } = renderUpload({}, false);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.disabled).toBe(true);
    });

    it("enables file input when signed in", () => {
      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;
      expect(input.disabled).toBe(false);
    });

    it("renders the outer upload div", () => {
      const { container } = renderUpload();
      expect(container.querySelector(".upload")).toBeInTheDocument();
    });
  });

  describe("drag and drop behavior", () => {
    it("adds is-dragging class on dragover when signed in", () => {
      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      fireEvent.dragOver(dropzone, { preventDefault: vi.fn() });

      expect(dropzone.classList.contains("is-dragging")).toBe(true);
    });

    it("does not add is-dragging class on dragover when not signed in", () => {
      const { container } = renderUpload({}, false);
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      fireEvent.dragOver(dropzone);

      expect(dropzone.classList.contains("is-dragging")).toBe(false);
    });

    it("removes is-dragging class on dragleave", () => {
      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      fireEvent.dragOver(dropzone);
      expect(dropzone.classList.contains("is-dragging")).toBe(true);

      fireEvent.dragLeave(dropzone);
      expect(dropzone.classList.contains("is-dragging")).toBe(false);
    });

    it("ignores non-image files dropped when signed in", () => {
      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      const textFile = new File(["content"], "document.txt", { type: "text/plain" });
      const dataTransfer = { files: [textFile] };

      fireEvent.drop(dropzone, { dataTransfer });

      // Should still show dropzone, not upload status
      expect(container.querySelector(".dropzone")).toBeInTheDocument();
      expect(container.querySelector(".upload-status")).not.toBeInTheDocument();
    });

    it("does nothing when file is dropped and user is not signed in", () => {
      const { container } = renderUpload({}, false);
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      const imageFile = new File(["image"], "photo.png", { type: "image/png" });
      const dataTransfer = { files: [imageFile] };

      fireEvent.drop(dropzone, { dataTransfer });

      expect(container.querySelector(".dropzone")).toBeInTheDocument();
      expect(container.querySelector(".upload-status")).not.toBeInTheDocument();
    });

    it("clears isDragging state on drop regardless of file type", () => {
      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      fireEvent.dragOver(dropzone);
      expect(dropzone.classList.contains("is-dragging")).toBe(true);

      // Drop a non-image so no file processing but isDragging should clear
      const textFile = new File(["txt"], "doc.txt", { type: "text/plain" });
      fireEvent.drop(dropzone, { dataTransfer: { files: [textFile] } });

      expect(dropzone.classList.contains("is-dragging")).toBe(false);
    });
  });

  describe("file processing via input change", () => {
    it("does not process file when not signed in", () => {
      const { container } = renderUpload({}, false);
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["image"], "floor.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });
      fireEvent.change(input);

      expect(container.querySelector(".upload-status")).not.toBeInTheDocument();
    });

    it("transitions to upload-status view after selecting a valid image when signed in", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/png;base64,abc123"));

      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["image"], "floor.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
      });

      expect(container.querySelector(".upload-status")).toBeInTheDocument();
      expect(screen.getByText("floor.png")).toBeInTheDocument();
    });

    it("shows 'Analyzing Floor Plan...' when progress is below 100", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/png;base64,abc"));

      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["image"], "plan.jpg", { type: "image/jpeg" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
      });

      // Progress starts at 0, so text should be 'Analyzing Floor Plan...'
      expect(screen.getByText("Analyzing Floor Plan...")).toBeInTheDocument();
    });

    it("shows 'Redirecting...' and CheckCircle2 icon when progress reaches 100", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/png;base64,abc"));

      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["image"], "plan.jpg", { type: "image/jpeg" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
        // Need ceil(100/PROGRESS_STEP) intervals to hit 100%
        const intervalsToFull = Math.ceil(100 / PROGRESS_STEP);
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * (intervalsToFull + 2));
      });

      expect(screen.getByText("Redirecting...")).toBeInTheDocument();
      expect(screen.getByTestId("check-circle-icon")).toBeInTheDocument();
    });

    it("calls onComplete with base64 string after progress reaches 100 and redirect delay elapses", async () => {
      const onComplete = vi.fn();
      const base64 = "data:image/png;base64,testpayload";
      vi.stubGlobal("FileReader", createFileReaderMock(base64));

      const { container } = renderUpload({ onComplete });
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["image"], "plan.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
      });

      // Advance timers step by step, flushing React updates in between
      const intervalsToFull = Math.ceil(100 / PROGRESS_STEP) + 2;
      for (let i = 0; i < intervalsToFull; i++) {
        await act(async () => {
          vi.advanceTimersByTime(PROGRESS_INTERVAL_MS);
        });
      }

      await act(async () => {
        vi.advanceTimersByTime(REDIRECT_DELAY_MS + 100);
      });

      expect(onComplete).toHaveBeenCalledOnce();
      expect(onComplete).toHaveBeenCalledWith(base64);
    });

    it("does not call onComplete when no onComplete prop is provided", async () => {
      const base64 = "data:image/png;base64,test";
      vi.stubGlobal("FileReader", createFileReaderMock(base64));

      const { container } = renderUpload({});
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["img"], "plan.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      // Should not throw even without onComplete
      await act(async () => {
        fireEvent.change(input);
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * 25 + REDIRECT_DELAY_MS + 100);
      });
    });
  });

  describe("progress bar rendering", () => {
    it("renders progress bar div with correct percentage style during upload", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/png;base64,x"));

      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["img"], "plan.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
        // Advance one interval so progress > 0
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS);
      });

      const bar = container.querySelector(".bar") as HTMLElement;
      expect(bar).toBeInTheDocument();
      expect(bar.style.width).toMatch(/^\d+(\.\d+)?%$/);
    });

    it("progress bar width reaches 100% after sufficient intervals", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/png;base64,x"));

      const { container } = renderUpload();
      const input = container.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(["img"], "plan.png", { type: "image/png" });
      Object.defineProperty(input, "files", { value: [imageFile], configurable: true });

      await act(async () => {
        fireEvent.change(input);
        const intervalsToFull = Math.ceil(100 / PROGRESS_STEP);
        vi.advanceTimersByTime(PROGRESS_INTERVAL_MS * (intervalsToFull + 2));
      });

      const bar = container.querySelector(".bar") as HTMLElement;
      expect(bar.style.width).toBe("100%");
    });
  });

  describe("file drop with image type", () => {
    it("processes a valid image file dropped onto the dropzone", async () => {
      vi.stubGlobal("FileReader", createFileReaderMock("data:image/jpeg;base64,drop"));

      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      const imageFile = new File(["img"], "dropped.jpg", { type: "image/jpeg" });

      await act(async () => {
        fireEvent.drop(dropzone, { dataTransfer: { files: [imageFile] } });
      });

      expect(container.querySelector(".upload-status")).toBeInTheDocument();
      expect(screen.getByText("dropped.jpg")).toBeInTheDocument();
    });

    it("does not process file with non-image MIME type on drop", async () => {
      const { container } = renderUpload();
      const dropzone = container.querySelector(".dropzone") as HTMLElement;

      const pdfFile = new File(["pdf"], "blueprint.pdf", { type: "application/pdf" });

      await act(async () => {
        fireEvent.drop(dropzone, { dataTransfer: { files: [pdfFile] } });
      });

      expect(container.querySelector(".upload-status")).not.toBeInTheDocument();
    });
  });
});