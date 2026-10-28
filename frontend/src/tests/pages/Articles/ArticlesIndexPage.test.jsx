import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ArticlesIndexPage from "main/pages/Articles/ArticlesIndexPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { articlesFixtures } from "fixtures/articlesFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((message) => mockToast(message)),
  };
});

describe("ArticlesIndexPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  const testId = "ArticlesTable";

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArticlesIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders Create Article button for an admin user", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock.onGet("/api/articles/all").reply(200, []);

    renderPage();

    const createButton = await screen.findByText("Create Article");

    expect(createButton).toHaveAttribute("href", "/articles/create");
    expect(createButton).toHaveAttribute("style", "float: right;");
    expect(
      screen.getByRole("heading", { name: "Articles" }),
    ).toBeInTheDocument();
  });

  test("regular users can view all articles but not admin controls", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/articles/all")
      .reply(200, articlesFixtures.threeArticles);

    renderPage();

    await waitFor(() => {
      expect(
        screen.getByTestId(`${testId}-cell-row-0-col-id`),
      ).toBeInTheDocument();
    });

    articlesFixtures.threeArticles.forEach((article) => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
      expect(screen.getByText(article.email)).toBeInTheDocument();
    });

    expect(screen.queryByText("Create Article")).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("admin users can see Edit and Delete buttons for each article", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/articles/all")
      .reply(200, articlesFixtures.threeArticles);

    renderPage();

    expect(
      await screen.findByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).toBeInTheDocument();

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).toBeInTheDocument();

    expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(3);
    expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(3);
  });

  test("deleting an article refreshes the table", async () => {
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);

    const originalArticles = [...articlesFixtures.threeArticles];
    const deletedArticle = originalArticles[0];
    const remainingArticles = originalArticles.slice(1);

    let articlesInDatabase = originalArticles;

    axiosMock.onGet("/api/articles/all").reply(() => {
      return [200, articlesInDatabase];
    });

    axiosMock.onDelete("/api/articles").reply((config) => {
      if (config.params.id === deletedArticle.id) {
        articlesInDatabase = remainingArticles;
        return [200, `Articles with id ${deletedArticle.id} deleted`];
      }

      return [404, { error: "Article not found" }];
    });

    renderPage();

    const deleteButton = await screen.findByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );

    expect(screen.getByText(deletedArticle.title)).toBeInTheDocument();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axiosMock.history.delete).toHaveLength(1);
    });

    expect(axiosMock.history.delete[0].params).toEqual({
      id: deletedArticle.id,
    });

    await waitFor(() => {
      expect(screen.queryByText(deletedArticle.title)).not.toBeInTheDocument();
    });

    remainingArticles.forEach((article) => {
      expect(screen.getByText(article.title)).toBeInTheDocument();
    });

    expect(
      axiosMock.history.get.filter(
        (request) => request.url === "/api/articles/all",
      ).length,
    ).toBeGreaterThanOrEqual(2);

    expect(mockToast).toHaveBeenCalledWith("Article deleted successfully");
  });
});
