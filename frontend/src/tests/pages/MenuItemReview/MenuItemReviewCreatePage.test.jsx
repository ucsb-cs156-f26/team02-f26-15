import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import MenuItemReviewCreatePage from "main/pages/MenuItemReview/MenuItemReviewCreatePage";

const mockToast = vi.fn();
const mockNavigate = vi.fn();
vi.mock("react-toastify", async (importOriginal) => ({
  ...(await importOriginal()),
  toast: (...args) => mockToast(...args),
}));
vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal()),
  Navigate: (props) => {
    mockNavigate(props);
    return null;
  },
}));

describe("MenuItemReviewCreatePage", () => {
  const axiosMock = new AxiosMockAdapter(axios);
  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock.reset();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });
  afterAll(() => axiosMock.restore());

  const renderPage = (
    props = {},
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    }),
  ) =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <MenuItemReviewCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  const fillForm = () => {
    fireEvent.change(screen.getByLabelText("Menu item ID"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Reviewer email"), {
      target: { value: "reviewer@example.com" },
    });
    fireEvent.change(screen.getByLabelText("Stars"), {
      target: { value: "5" },
    });
    fireEvent.change(screen.getByLabelText("Date reviewed"), {
      target: { value: "2026-10-20T18:00" },
    });
    fireEvent.change(screen.getByLabelText("Comments"), {
      target: { value: "Fresh and tasty" },
    });
  };

  test("submits all fields to the backend and redirects on success", async () => {
    axiosMock.onPost("/api/MenuItemReview/post").reply(200, { id: 42 });
    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith({ to: "/menuitemreview" }),
    );
    expect(axiosMock.history.post).toHaveLength(1);
    expect(axiosMock.history.post[0].params).toEqual({
      itemId: 7,
      reviewerEmail: "reviewer@example.com",
      stars: 5,
      dateReviewed: "2026-10-20T18:00",
      comments: "Fresh and tasty",
    });
    expect(mockToast).toHaveBeenCalledWith(
      "New menu item review created - id: 42",
    );
  });

  test("refreshes cached reviews after a review is created", async () => {
    const queryClient = new QueryClient();
    const reviewListKey = ["/api/MenuItemReview/all"];
    const unrelatedKey = ["/api/restaurants/all"];
    queryClient.setQueryData(reviewListKey, [{ id: 1 }]);
    queryClient.setQueryData(unrelatedKey, [{ id: 2 }]);
    axiosMock.onPost("/api/MenuItemReview/post").reply(200, { id: 42 });

    renderPage({}, queryClient);
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() =>
      expect(queryClient.getQueryState(reviewListKey).isInvalidated).toBe(true),
    );
    expect(queryClient.getQueryState(unrelatedKey).isInvalidated).toBe(false);
  });

  test("invalid fields show errors without sending a request", async () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Menu item ID is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Reviewer email is required.")).toBeInTheDocument();
    expect(axiosMock.history.post).toHaveLength(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("storybook keeps the page visible after a successful submission", async () => {
    axiosMock.onPost("/api/MenuItemReview/post").reply(200, { id: 42 });
    renderPage({ storybook: true });
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        "New menu item review created - id: 42",
      ),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(
      screen.getByRole("heading", { name: "Create New Menu Item Review" }),
    ).toBeInTheDocument();
  });

  test("backend errors do not redirect", async () => {
    axiosMock.onPost("/api/MenuItemReview/post").reply(500);
    renderPage();
    fillForm();
    fireEvent.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
