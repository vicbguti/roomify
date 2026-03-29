import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import Home from "../app/routes/home";

// Mock react-router hooks used by Home and its children
const mockNavigate = vi.fn();
vi.mock("react-router", () => ({
  useNavigate: () => mockNavigate,
  useOutletContext: vi.fn(),
}));

// Mock Upload component - expose onComplete so we can trigger it in tests
vi.mock("../components/Upload", () => ({
  default: ({ onComplete }: { onComplete?: (base64: string) => void }) => (
    <button
      data-testid="mock-upload"
      onClick={() => onComplete?.("data:image/png;base64,test")}
    />
  ),
}));

// Mock Navbar component - it has its own auth context dependency
vi.mock("../components/Navbar", () => ({
  default: () => <nav data-testid="mock-navbar" />,
}));

// Partially mock lucide-react - use importOriginal to avoid missing export errors
vi.mock("lucide-react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("lucide-react")>();
  return {
    ...actual,
    ArrowRight: () => <svg data-testid="arrow-right" />,
    ArrowUpRight: () => <svg data-testid="arrow-up-right" />,
    Clock: () => <svg data-testid="clock-icon" />,
    Layers: () => <svg data-testid="layers-icon" />,
  };
});

import { useOutletContext } from "react-router";

const mockUseOutletContext = vi.mocked(useOutletContext);

function renderHome() {
  mockUseOutletContext.mockReturnValue({
    isSignedIn: true,
    userName: "testuser",
    userId: "123",
    refreshAuth: vi.fn(),
    signIn: vi.fn(),
    signOut: vi.fn(),
  } as unknown as ReturnType<typeof useOutletContext>);

  return render(<Home />);
}

describe("Home route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rendering", () => {
    it("renders without crashing", () => {
      renderHome();
    });

    it("renders the Navbar", () => {
      renderHome();
      expect(screen.getByTestId("mock-navbar")).toBeInTheDocument();
    });

    it("renders the Upload component", () => {
      renderHome();
      expect(screen.getByTestId("mock-upload")).toBeInTheDocument();
    });

    it("renders the hero heading", () => {
      renderHome();
      expect(
        screen.getByText("Build beautiful spaces at the speed of thought with Roomify")
      ).toBeInTheDocument();
    });

    it("renders 'Project Chicago' in the projects section", () => {
      renderHome();
      expect(screen.getByText("Project Chicago")).toBeInTheDocument();
    });

    it("renders the projects section heading", () => {
      renderHome();
      expect(screen.getByText("Projects")).toBeInTheDocument();
    });

    it("renders the upload floor plan heading", () => {
      renderHome();
      expect(screen.getByText("Upload your floor plan")).toBeInTheDocument();
    });

    it("renders the Roomify intro announcement", () => {
      renderHome();
      expect(screen.getByText("Introducing Roomify 2.0")).toBeInTheDocument();
    });
  });

  describe("handleUploadComplete", () => {
    it("calls navigate with a /visualizer/:id path when upload completes", async () => {
      renderHome();
      const uploadBtn = screen.getByTestId("mock-upload");

      await act(async () => {
        uploadBtn.click();
      });

      expect(mockNavigate).toHaveBeenCalledOnce();
      const navigateArg = mockNavigate.mock.calls[0][0] as string;
      expect(navigateArg).toMatch(/^\/visualizer\/\d+$/);
    });

    it("uses Date.now()-based id in the navigation path", async () => {
      const fixedTimestamp = 1700000000000;
      vi.spyOn(Date, "now").mockReturnValue(fixedTimestamp);

      renderHome();
      const uploadBtn = screen.getByTestId("mock-upload");

      await act(async () => {
        uploadBtn.click();
      });

      expect(mockNavigate).toHaveBeenCalledWith(`/visualizer/${fixedTimestamp}`);
    });

    it("navigation id is a string representation of the timestamp", async () => {
      const fixedTimestamp = 9999888877776;
      vi.spyOn(Date, "now").mockReturnValue(fixedTimestamp);

      renderHome();
      const uploadBtn = screen.getByTestId("mock-upload");

      await act(async () => {
        uploadBtn.click();
      });

      const arg = mockNavigate.mock.calls[0][0] as string;
      expect(arg).toBe(`/visualizer/${fixedTimestamp.toString()}`);
    });

    it("navigate is called exactly once per upload completion", async () => {
      renderHome();
      const uploadBtn = screen.getByTestId("mock-upload");

      await act(async () => {
        uploadBtn.click();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("handleUploadComplete navigates with unique ids on repeated calls", async () => {
      // Simulate two different timestamps for consecutive Date.now calls
      vi.spyOn(Date, "now")
        .mockReturnValueOnce(1000)
        .mockReturnValueOnce(2000);

      renderHome();
      const uploadBtn = screen.getByTestId("mock-upload");

      await act(async () => {
        uploadBtn.click();
      });

      await act(async () => {
        uploadBtn.click();
      });

      expect(mockNavigate).toHaveBeenCalledTimes(2);
      const paths = mockNavigate.mock.calls.map((c) => c[0] as string);
      expect(paths[0]).toMatch(/^\/visualizer\/\d+$/);
      expect(paths[1]).toMatch(/^\/visualizer\/\d+$/);
      expect(paths[0]).not.toBe(paths[1]);
    });
  });

  describe("meta function", () => {
    it("exports a meta function", async () => {
      const { meta } = await import("../app/routes/home");
      expect(typeof meta).toBe("function");
    });

    it("meta returns an array with two entries", async () => {
      const { meta } = await import("../app/routes/home");
      const result = meta({} as Parameters<typeof meta>[0]);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it("meta includes a title entry", async () => {
      const { meta } = await import("../app/routes/home");
      const result = meta({} as Parameters<typeof meta>[0]);
      const titleEntry = result.find((r: Record<string, unknown>) => "title" in r);
      expect(titleEntry).toBeDefined();
    });

    it("meta includes a description entry", async () => {
      const { meta } = await import("../app/routes/home");
      const result = meta({} as Parameters<typeof meta>[0]);
      const descEntry = result.find((r: Record<string, unknown>) => r.name === "description");
      expect(descEntry).toBeDefined();
    });
  });
});