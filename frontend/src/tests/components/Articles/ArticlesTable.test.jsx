import React from "react";
import { render, screen, within } from "@testing-library/react";

import ArticlesTable from "main/components/Articles/ArticlesTable";
import { articlesFixtures } from "fixtures/articlesFixtures";

describe("ArticlesTable tests", () => {
  const expectedHeaders = [
    "ID",
    "Title",
    "URL",
    "Explanation",
    "Email",
    "Date Added",
  ];

  test("renders an empty table with all column headers", () => {
    render(<ArticlesTable articles={[]} />);

    expect(screen.getByTestId("ArticlesTable")).toBeInTheDocument();

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });
  });

  test("renders one article with the correct data", () => {
    render(<ArticlesTable articles={[articlesFixtures.oneArticle]} />);

    const article = articlesFixtures.oneArticle;

    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getByText(article.url)).toBeInTheDocument();
    expect(screen.getByText(article.explanation)).toBeInTheDocument();
    expect(screen.getByText(article.email)).toBeInTheDocument();
    expect(screen.getByText(article.dateAdded)).toBeInTheDocument();
  });

  test("renders three articles", () => {
    render(<ArticlesTable articles={articlesFixtures.threeArticles} />);

    const rows = screen.getAllByRole("row");

    // One header row plus three article rows
    expect(rows).toHaveLength(4);

    articlesFixtures.threeArticles.forEach((article, index) => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
      expect(screen.getByText(article.email)).toBeInTheDocument();

      // Verify the ID column contains the correct article ID
      expect(
        within(rows[index + 1]).getByText(String(article.id)),
      ).toBeInTheDocument();
    });
  });

  test("supports a custom testIdPrefix", () => {
    render(
      <ArticlesTable
        articles={articlesFixtures.threeArticles}
        testIdPrefix="CustomArticlesTable"
      />,
    );

    const table = screen.getByTestId("CustomArticlesTable");
    expect(table).toBeInTheDocument();

    const rows = within(table).getAllByRole("row");
    expect(rows).toHaveLength(4);
  });
});
