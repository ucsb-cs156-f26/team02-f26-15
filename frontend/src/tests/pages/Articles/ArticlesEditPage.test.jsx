import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import ArticlesEditPage from "main/pages/Articles/ArticlesEditPage";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { articlesFixtures } from "fixtures/articlesFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import mockConsole from "tests/testutils/mockConsole";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((message) => mockToast(message)),
  };
});

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    useParams: vi.fn(() => ({
      id: "1",
    })),
    Navigate: vi.fn((props) => {
      mockNavigate(props);
      return null;
    }),
  };
});

describe("ArticlesEditPage tests", () => {
  let axiosMock;

  const originalArticle = articlesFixtures.oneArticle;

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArticlesEditPage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    axiosMock = new AxiosMockAdapter(axios);

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  test("renders heading without form when backend is unavailable", async () => {
    axiosMock.onGet("/api/articles").timeout();

    const restoreConsole = mockConsole();

    try {
      renderPage();

      expect(
        await screen.findByRole("heading", { name: "Edit Article" }),
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId("ArticlesForm-title"),
      ).not.toBeInTheDocument();

      await waitFor(() => {
        expect(
          axiosMock.history.get.some(
            (request) => request.url === "/api/articles",
          ),
        ).toBe(true);
      });
    } finally {
      restoreConsole();
    }
  });

  test("loads the existing article and populates all fields", async () => {
    axiosMock.onGet("/api/articles").reply(200, originalArticle);

    renderPage();

    const idField = await screen.findByTestId("ArticlesForm-id");

    expect(idField).toHaveValue(String(originalArticle.id));
    expect(idField).toBeDisabled();

    expect(screen.getByTestId("ArticlesForm-title")).toHaveValue(
      originalArticle.title,
    );
    expect(screen.getByTestId("ArticlesForm-url")).toHaveValue(
      originalArticle.url,
    );
    expect(screen.getByTestId("ArticlesForm-explanation")).toHaveValue(
      originalArticle.explanation,
    );
    expect(screen.getByTestId("ArticlesForm-email")).toHaveValue(
      originalArticle.email,
    );
    expect(screen.getByTestId("ArticlesForm-dateAdded")).toHaveValue(
      originalArticle.dateAdded.slice(0, 16),
    );

    expect(screen.getByTestId("ArticlesForm-submit")).toHaveTextContent(
      "Update",
    );

    expect(
      axiosMock.history.get.find((request) => request.url === "/api/articles")
        .params,
    ).toEqual({ id: "1" });
  });

  test("updates all fields, sends PUT request, and redirects", async () => {
    axiosMock.onGet("/api/articles").reply(200, originalArticle);

    const updatedArticle = {
      ...originalArticle,
      title: "Updated UCSB Research News",
      url: "https://news.ucsb.edu",
      explanation: "Updated article explanation",
      email: "updated@ucsb.edu",
      dateAdded: "2026-10-26T18:30",
    };

    axiosMock.onPut("/api/articles").reply(200, {
      ...updatedArticle,
      dateAdded: "2026-10-26T18:30:00",
    });

    renderPage();

    await screen.findByTestId("ArticlesForm-id");

    fireEvent.change(screen.getByTestId("ArticlesForm-title"), {
      target: { value: updatedArticle.title },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-url"), {
      target: { value: updatedArticle.url },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-explanation"), {
      target: { value: updatedArticle.explanation },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-email"), {
      target: { value: updatedArticle.email },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-dateAdded"), {
      target: { value: updatedArticle.dateAdded },
    });

    fireEvent.click(screen.getByTestId("ArticlesForm-submit"));

    await waitFor(() => {
      expect(axiosMock.history.put).toHaveLength(1);
    });

    const request = axiosMock.history.put[0];

    expect(request.url).toBe("/api/articles");
    expect(request.method).toBe("put");
    expect(request.params).toEqual({ id: originalArticle.id });
    expect(JSON.parse(request.data)).toEqual({
      title: updatedArticle.title,
      url: updatedArticle.url,
      explanation: updatedArticle.explanation,
      email: updatedArticle.email,
      dateAdded: updatedArticle.dateAdded,
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        `Article Updated - id: ${originalArticle.id} title: ${updatedArticle.title}`,
      );
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/articles" });
    });
  });

  test("invalid data does not send PUT request or redirect", async () => {
    axiosMock.onGet("/api/articles").reply(200, originalArticle);

    renderPage();

    await screen.findByTestId("ArticlesForm-id");

    fireEvent.change(screen.getByTestId("ArticlesForm-title"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-url"), {
      target: { value: "not-a-valid-url" },
    });
    fireEvent.change(screen.getByTestId("ArticlesForm-email"), {
      target: { value: "invalid-email" },
    });

    fireEvent.click(screen.getByTestId("ArticlesForm-submit"));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid HTTP or HTTPS URL."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();

    expect(axiosMock.history.put).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("storybook mode does not redirect after a successful update", async () => {
    axiosMock.onGet("/api/articles").reply(200, originalArticle);
    axiosMock.onPut("/api/articles").reply(200, originalArticle);

    renderPage({ storybook: true });

    await screen.findByTestId("ArticlesForm-id");

    fireEvent.click(screen.getByTestId("ArticlesForm-submit"));

    await waitFor(() => {
      expect(axiosMock.history.put).toHaveLength(1);
      expect(mockToast).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();

    expect(
      screen.getByRole("heading", { name: "Edit Article" }),
    ).toBeInTheDocument();
  });
});
