import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import VisualizerId from "../app/routes/visualizer.$id";

describe("VisualizerId", () => {
  it("renders without crashing", () => {
    render(<VisualizerId />);
  });

  it("displays the 'Visualizer ID' text", () => {
    render(<VisualizerId />);
    expect(screen.getByText("Visualizer ID")).toBeInTheDocument();
  });

  it("renders a div wrapper", () => {
    const { container } = render(<VisualizerId />);
    expect(container.firstChild?.nodeName).toBe("DIV");
  });

  it("renders as a default export", () => {
    expect(VisualizerId).toBeDefined();
    expect(typeof VisualizerId).toBe("function");
  });
});