import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route, useParams } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import MenuItemReviewIndexPage from "main/pages/MenuItemReview/MenuItemReviewIndexPage";

const mock = new AxiosMockAdapter(axios);
const reviews = menuItemReviewFixtures.threeMenuItemReviews;
const prefix = "MenuItemReviewTable";
const EditDestination = () => <div>Edit destination {useParams().id}</div>;

describe("MenuItemReviewIndexPage", () => {
  beforeEach(() => {
    mock.reset();
    mock.onGet("/api/systemInfo").reply(200, systemInfoFixtures.showingNeither);
  });
  afterAll(() => mock.restore());
  const renderPage = (user) => {
    mock.onGet("/api/currentUser").reply(200, user);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/menuitemreview"]}>
          <Routes>
            <Route
              path="/menuitemreview"
              element={<MenuItemReviewIndexPage />}
            />
            <Route
              path="/menuitemreview/edit/:id"
              element={<EditDestination />}
            />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("regular users see all reviews without admin controls", async () => {
    mock.onGet("/api/MenuItemReview/all").reply(200, reviews);
    renderPage(apiCurrentUserFixtures.userOnly);
    expect(await screen.findByText("Fresh and tasty")).toBeInTheDocument();
    expect(
      screen.getByText("Good flavor, but served cold"),
    ).toBeInTheDocument();
    expect(screen.getByText("Would choose something else")).toBeInTheDocument();
    expect(
      screen.queryByText("Create Menu Item Review"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${prefix}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${prefix}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("admins can navigate to create and edit pages", async () => {
    mock.onGet("/api/MenuItemReview/all").reply(200, reviews);
    renderPage(apiCurrentUserFixtures.adminUser);
    expect(await screen.findByText("Fresh and tasty")).toBeInTheDocument();
    expect(await screen.findByText("Create Menu Item Review")).toHaveAttribute(
      "href",
      "/menuitemreview/create",
    );
    fireEvent.click(screen.getByTestId(`${prefix}-cell-row-0-col-Edit-button`));
    expect(await screen.findByText("Edit destination 1")).toBeInTheDocument();
  });

  test("deleting a review refetches and removes it from the table", async () => {
    let current = [...reviews];
    mock.onGet("/api/MenuItemReview/all").reply(() => [200, current]);
    mock.onDelete("/api/MenuItemReview").reply((config) => {
      current = current.filter((review) => review.id !== config.params.id);
      return [200, { message: "Review deleted" }];
    });
    renderPage(apiCurrentUserFixtures.adminUser);
    expect(await screen.findByText("Fresh and tasty")).toBeInTheDocument();
    fireEvent.click(
      screen.getByTestId(`${prefix}-cell-row-0-col-Delete-button`),
    );
    await waitFor(() =>
      expect(screen.queryByText("Fresh and tasty")).not.toBeInTheDocument(),
    );
    expect(
      screen.getByText("Good flavor, but served cold"),
    ).toBeInTheDocument();
    expect(mock.history.delete[0].params).toEqual({ id: 1 });
    expect(
      mock.history.get.filter(
        (request) => request.url === "/api/MenuItemReview/all",
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  test("starts with an empty table while reviews are loading", () => {
    mock.onGet("/api/MenuItemReview/all").reply(() => new Promise(() => {}));
    renderPage(apiCurrentUserFixtures.userOnly);
    expect(
      screen.getByRole("heading", { name: "Menu Item Reviews" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`${prefix}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();
  });

  test("reports a backend GET error", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    mock.onGet("/api/MenuItemReview/all").reply(500);
    renderPage(apiCurrentUserFixtures.userOnly);
    await waitFor(() =>
      expect(consoleError).toHaveBeenCalledWith(
        "Error communicating with backend via GET on /api/MenuItemReview/all",
        expect.anything(),
      ),
    );
    consoleError.mockRestore();
  });

  test("an empty response renders an empty table", async () => {
    mock.onGet("/api/MenuItemReview/all").reply(200, []);
    renderPage(apiCurrentUserFixtures.userOnly);
    expect(
      await screen.findByRole("heading", { name: "Menu Item Reviews" }),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(
        mock.history.get.some((r) => r.url === "/api/MenuItemReview/all"),
      ).toBe(true),
    );
    expect(screen.queryByText("Fresh and tasty")).not.toBeInTheDocument();
  });
});
