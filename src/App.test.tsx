/**
 * @fileoverview Test file for the App component.
 *
 * This file includes tests to ensure that the App component
 * renders correctly. It uses Vitest for testing and the
 * @testing-library/react library for rendering React components
 * in a test environment.
 */

import { render } from "@testing-library/react";
import App from "./App";
import { test, expect, vi } from "vitest";
import { act } from "react-dom/test-utils";

// Mock global fetch API with a response that simulates a successful request
// and returns an empty object as JSON.
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true, // Simulate a successful answer
    json: () => Promise.resolve({}), // Empty answer
  } as Response)
);

/**
 * Tests that the App component renders without crashing.
 *
 * This test renders the App component using React Testing Library's render method
 * and then checks if the base element of the rendered component is defined,
 * indicating successful rendering.
 */
test("renders without crashing", async () => {
  let baseElement;
  await act(async () => {
    const { baseElement: renderedBaseElement } = render(<App />);
    baseElement = renderedBaseElement;
  });
  expect(baseElement).toBeDefined();
});
