import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useLocation } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import MenuItemReviewEditPage from "main/pages/MenuItemReview/MenuItemReviewEditPage";

const mockToast = vi.fn();
vi.mock("react-toastify", async (original) => ({
  ...(await original()),
  toast: (...args) => mockToast(...args),
}));

const Location = () => (
  <div data-testid="location">{useLocation().pathname}</div>
);
const mock = new AxiosMockAdapter(axios);
const original = menuItemReviewFixtures.oneMenuItemReview;
const changed = {
  itemId: 12,
  reviewerEmail: "updated@example.com",
  stars: 3,
  dateReviewed: "2026-10-21T12:30",
  comments: "Updated review",
};

describe("MenuItemReviewEditPage", () => {
  beforeEach(() => {
    mock.reset();
    vi.clearAllMocks();
    mock.onGet("/api/currentUser").reply(200, apiCurrentUserFixtures.adminUser);
    mock.onGet("/api/systemInfo").reply(200, systemInfoFixtures.showingNeither);
    mock
      .onGet("/api/MenuItemReview", { params: { id: "1" } })
      .reply(200, original);
  });
  afterAll(() => mock.restore());
  const renderPage = (
    props = {},
    client = new QueryClient({ defaultOptions: { queries: { retry: false } } }),
  ) => {
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/previous", "/menuitemreview/edit/1"]}>
          <Location />
          <Routes>
            <Route
              path="/menuitemreview/edit/:id"
              element={<MenuItemReviewEditPage {...props} />}
            />
            <Route path="/menuitemreview" element={<div>Review list</div>} />
            <Route path="/previous" element={<div>Previous page</div>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
    return client;
  };
  const fill = () => {
    for (const [field, value] of Object.entries(changed))
      fireEvent.change(screen.getByTestId(`MenuItemReviewForm-${field}`), {
        target: { value: String(value) },
      });
  };
  test("loads the requested review into all form fields", async () => {
    renderPage();
    expect(await screen.findByLabelText("ID")).toHaveValue(1);
    expect(screen.getByLabelText("ID")).toHaveAttribute("readonly");
    expect(screen.getByLabelText("Menu item ID")).toHaveValue(7);
    expect(screen.getByLabelText("Reviewer email")).toHaveValue(
      original.reviewerEmail,
    );
    expect(screen.getByLabelText("Stars")).toHaveValue(5);
    expect(screen.getByLabelText("Date reviewed")).toHaveValue(
      "2026-10-20T18:00",
    );
    expect(screen.getByLabelText("Comments")).toHaveValue(original.comments);
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
  });
  test("saves edited fields, refreshes caches, and returns to the list", async () => {
    const saved = { id: 1, ...changed };
    mock.onPut("/api/MenuItemReview").reply(200, saved);
    const client = new QueryClient();
    client.setQueryData(["/api/MenuItemReview/all"], [original]);
    client.setQueryData(["/unrelated"], []);
    renderPage({}, client);
    await screen.findByLabelText("ID");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(await screen.findByText("Review list")).toBeInTheDocument();
    expect(mock.history.put).toHaveLength(1);
    expect(mock.history.put[0].params).toEqual({ id: "1" });
    expect(JSON.parse(mock.history.put[0].data)).toEqual(changed);
    expect(client.getQueryData(["/api/MenuItemReview", "1"])).toEqual(saved);
    expect(
      client.getQueryState(["/api/MenuItemReview/all"]).isInvalidated,
    ).toBe(true);
    expect(client.getQueryState(["/unrelated"]).isInvalidated).toBe(false);
    expect(mockToast).toHaveBeenCalledWith("Menu item review updated - id: 1");
  });
  test("invalid edits do not submit", async () => {
    renderPage();
    await screen.findByLabelText("ID");
    fireEvent.change(screen.getByLabelText("Stars"), {
      target: { value: "6" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(
      await screen.findByText("Stars must be a whole number from 0 to 5."),
    ).toBeInTheDocument();
    expect(mock.history.put).toHaveLength(0);
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/menuitemreview/edit/1",
    );
  });
  test("cancel returns to the previous page without saving", async () => {
    renderPage();
    await screen.findByLabelText("ID");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(await screen.findByText("Previous page")).toBeInTheDocument();
    expect(mock.history.put).toHaveLength(0);
  });
  test("storybook stays on the edit page after saving", async () => {
    mock.onPut("/api/MenuItemReview").reply(200, { id: 1, ...changed });
    renderPage({ storybook: true });
    await screen.findByLabelText("ID");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(
        "Menu item review updated - id: 1",
      ),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/menuitemreview/edit/1",
    );
  });
  test("failed GET reports the error without rendering a form", async () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    mock.onGet("/api/MenuItemReview", { params: { id: "1" } }).reply(404);
    renderPage();
    await waitFor(() =>
      expect(err).toHaveBeenCalledWith(
        "Error communicating with backend via GET on /api/MenuItemReview",
        expect.anything(),
      ),
    );
    expect(screen.queryByLabelText("ID")).not.toBeInTheDocument();
    err.mockRestore();
  });
  test("failed PUT stays on the edit page", async () => {
    mock.onPut("/api/MenuItemReview").reply(500);
    renderPage();
    await screen.findByLabelText("ID");
    fill();
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    await waitFor(() =>
      expect(mockToast).toHaveBeenCalledWith(expect.stringContaining("500")),
    );
    expect(screen.getByTestId("location")).toHaveTextContent(
      "/menuitemreview/edit/1",
    );
  });
});
