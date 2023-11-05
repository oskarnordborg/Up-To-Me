import React from "react";
import { render, screen } from "@testing-library/react";
import Cards from "./Cards";

test("renders learn react", () => {
  render(<Cards />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
