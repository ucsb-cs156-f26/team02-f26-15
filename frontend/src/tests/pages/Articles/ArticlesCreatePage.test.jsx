<<<<<<< HEAD
import { render, screen } from "@testing-library/react";
=======
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
>>>>>>> origin/grace-articles-form
import ArticlesCreatePage from "main/pages/Articles/ArticlesCreatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
<<<<<<< HEAD
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

describe("ArticlesCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const setupUserOnly = () => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  };

  const queryClient = new QueryClient();

  test("Renders expected content", async () => {
    setupUserOnly();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <ArticlesCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(
      await screen.findByText("Create page not yet implemented"),
    ).toBeInTheDocument();
=======

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

const mockNavigate = vi.fn();
vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    Navigate: vi.fn((props) => {
      mockNavigate(props);
      return null;
    }),
  };
});

describe("ArticlesCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock.resetHistory();

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

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
          <ArticlesCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const validArticle = {
    title: "UCSB Research News",
    url: "https://news.ucsb.edu",
    explanation: "An article about research at UCSB",
    email: "student@ucsb.edu",
    dateAdded: "2026-10-22T15:48",
  };

  const fillValidForm = () => {
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: validArticle.title },
    });
    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: validArticle.url },
    });
    fireEvent.change(screen.getByLabelText("Explanation"), {
      target: { value: validArticle.explanation },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: validArticle.email },
    });
    fireEvent.change(screen.getByLabelText("Date Added"), {
      target: { value: validArticle.dateAdded },
    });
  };

  test("renders the create page and all form fields", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Create New Article" }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("URL")).toBeInTheDocument();
    expect(screen.getByLabelText("Explanation")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Date Added")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  test("submits valid data to the backend and redirects to /articles", async () => {
    const createdArticle = {
      id: 3,
      ...validArticle,
      dateAdded: "2026-10-22T15:48:00",
    };

    axiosMock.onPost("/api/articles/post").reply(200, createdArticle);

    renderPage();

    await screen.findByRole("heading", { name: "Create New Article" });

    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axiosMock.history.post).toHaveLength(1);
    });

    expect(axiosMock.history.post[0].url).toBe("/api/articles/post");
    expect(axiosMock.history.post[0].method).toBe("post");
    expect(axiosMock.history.post[0].params).toEqual(validArticle);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "New article created - id: 3 title: UCSB Research News",
      );
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/articles" });
    });
  });

  test("rejects an empty form without sending a POST request", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Create New Article" });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("URL is required.")).toBeInTheDocument();
    expect(screen.getByText("Explanation is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Date Added is required.")).toBeInTheDocument();

    expect(axiosMock.history.post).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("rejects invalid URL and email without submitting", async () => {
    renderPage();

    await screen.findByRole("heading", { name: "Create New Article" });

    fillValidForm();

    fireEvent.change(screen.getByLabelText("URL"), {
      target: { value: "not-a-valid-url" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "not-an-email" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    expect(
      await screen.findByText("Enter a valid HTTP or HTTPS URL."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();

    expect(axiosMock.history.post).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("does not redirect in Storybook mode after successful creation", async () => {
    axiosMock.onPost("/api/articles/post").reply(200, {
      id: 3,
      ...validArticle,
    });

    renderPage({ storybook: true });

    await screen.findByRole("heading", { name: "Create New Article" });

    fillValidForm();

    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(axiosMock.history.post).toHaveLength(1);
      expect(mockToast).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
>>>>>>> origin/grace-articles-form
  });
});
