import React from "react";
import { render, screen } from "@testing-library/react";
import Decks from "./Decks";

test("renders learn react", () => {
  render(<Decks />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
