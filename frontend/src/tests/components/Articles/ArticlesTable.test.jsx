import React from "react";
import {
  render,
  screen,
  within,
  fireEvent,
  waitFor,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import ArticlesTable from "main/components/Articles/ArticlesTable";
import { articlesFixtures } from "fixtures/articlesFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    useNavigate: () => mockNavigate,
  };
});

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((message) => mockToast(message)),
  };
});

describe("ArticlesTable tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testIdPrefix = "ArticlesTable";

  const expectedHeaders = [
    "ID",
    "Title",
    "URL",
    "Explanation",
    "Email",
    "Date Added",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();
  });

  const renderTable = ({
    articles = [],
    currentUser = currentUserFixtures.userOnly,
    customTestIdPrefix = testIdPrefix,
  } = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArticlesTable
            articles={articles}
            currentUser={currentUser}
            testIdPrefix={customTestIdPrefix}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders an empty table with all six column headers", () => {
    renderTable();

    expect(screen.getByTestId(testIdPrefix)).toBeInTheDocument();

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  test("renders one article with the correct data", () => {
    renderTable({
      articles: [articlesFixtures.oneArticle],
    });

    const article = articlesFixtures.oneArticle;

    expect(screen.getByText(article.title)).toBeInTheDocument();
    expect(screen.getByText(article.url)).toBeInTheDocument();
    expect(screen.getByText(article.explanation)).toBeInTheDocument();
    expect(screen.getByText(article.email)).toBeInTheDocument();
    expect(screen.getByText(article.dateAdded)).toBeInTheDocument();
  });

  test("renders three articles for regular users without admin buttons", () => {
    renderTable({
      articles: articlesFixtures.threeArticles,
      currentUser: currentUserFixtures.userOnly,
    });

    const rows = screen.getAllByRole("row");

    expect(rows).toHaveLength(4);

    articlesFixtures.threeArticles.forEach((article, index) => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
      expect(screen.getByText(article.email)).toBeInTheDocument();

      expect(
        within(rows[index + 1]).getByText(String(article.id)),
      ).toBeInTheDocument();
    });

    expect(
      screen.queryByTestId(`${testIdPrefix}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testIdPrefix}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("renders Edit and Delete buttons for admin users", () => {
    renderTable({
      articles: articlesFixtures.threeArticles,
      currentUser: currentUserFixtures.adminUser,
    });

    expect(
      screen.getByTestId(`${testIdPrefix}-cell-row-0-col-Edit-button`),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(`${testIdPrefix}-cell-row-0-col-Delete-button`),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  });

  test("clicking Edit navigates to the correct article edit page", () => {
    renderTable({
      articles: articlesFixtures.threeArticles,
      currentUser: currentUserFixtures.adminUser,
    });

    const editButton = screen.getByTestId(
      `${testIdPrefix}-cell-row-0-col-Edit-button`,
    );

    fireEvent.click(editButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      `/articles/edit/${articlesFixtures.threeArticles[0].id}`,
    );
  });

  test("clicking Delete sends the correct backend request", async () => {
    const article = articlesFixtures.threeArticles[0];

    axiosMock
      .onDelete("/api/articles")
      .reply(200, `Articles with id ${article.id} deleted`);

    renderTable({
      articles: articlesFixtures.threeArticles,
      currentUser: currentUserFixtures.adminUser,
    });

    const deleteButton = screen.getByTestId(
      `${testIdPrefix}-cell-row-0-col-Delete-button`,
    );

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axiosMock.history.delete).toHaveLength(1);
    });

    expect(axiosMock.history.delete[0].url).toBe("/api/articles");
    expect(axiosMock.history.delete[0].params).toEqual({
      id: article.id,
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith("Article deleted successfully");
    });
  });

  test("supports a custom testIdPrefix", () => {
    renderTable({
      articles: articlesFixtures.threeArticles,
      customTestIdPrefix: "CustomArticlesTable",
    });

    const table = screen.getByTestId("CustomArticlesTable");

    expect(table).toBeInTheDocument();

    const rows = within(table).getAllByRole("row");

    expect(rows).toHaveLength(4);
  });
});
