import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import { toast } from "react-toastify";
import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { useBackend } from "main/utils/useBackend";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

vi.mock("react-toastify", () => ({ toast: vi.fn() }));

const reviews = menuItemReviewFixtures.threeMenuItemReviews;
const headers = [
  "ID",
  "Menu item ID",
  "Reviewer email",
  "Stars",
  "Date reviewed",
  "Comments",
];
const fields = [
  "id",
  "itemId",
  "reviewerEmail",
  "stars",
  "dateReviewed",
  "comments",
];
let axiosMock;
let queryClient;

function EditTarget() {
  const { id } = useParams();
  return <h1>Editing review {id}</h1>;
}

function ReviewsFromBackend({ currentUser }) {
  const { data = [] } = useBackend(["/api/MenuItemReview/all"], {
    url: "/api/MenuItemReview/all",
    method: "GET",
  });
  return (
    <MenuItemReviewTable menuItemReviews={data} currentUser={currentUser} />
  );
}

function renderTable({
  menuItemReviews = reviews,
  currentUser,
  testIdPrefix,
  live = false,
} = {}) {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const table = live ? (
    <ReviewsFromBackend currentUser={currentUser} />
  ) : (
    <MenuItemReviewTable
      menuItemReviews={menuItemReviews}
      currentUser={currentUser}
      testIdPrefix={testIdPrefix}
    />
  );
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/menuitemreview"]}>
        <Routes>
          <Route path="/menuitemreview" element={table} />
          <Route path="/menuitemreview/edit/:id" element={<EditTarget />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return userEvent.setup();
}

beforeEach(() => {
  axiosMock = new AxiosMockAdapter(axios);
});

afterEach(() => {
  axiosMock.restore();
  queryClient.clear();
  vi.clearAllMocks();
});

describe("MenuItemReviewTable", () => {
  test("renders an empty table with all six friendly headings and no data rows", () => {
    renderTable({ menuItemReviews: [] });
    const table = screen.getByTestId("MenuItemReviewTable");
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((header) => header.textContent),
    ).toEqual(headers);
    expect(within(table).getAllByRole("row")).toHaveLength(1);
    expect(within(table).queryByRole("cell")).not.toBeInTheDocument();
  });

  test("renders every field of every review, including a zero-star rating", () => {
    renderTable({ currentUser: currentUserFixtures.userOnly });
    expect(screen.getAllByRole("row")).toHaveLength(4);
    for (const [index, review] of reviews.entries()) {
      const row = screen.getByTestId(`MenuItemReviewTable-row-${index}`);
      expect(
        within(row)
          .getAllByRole("cell")
          .map((cell) => cell.textContent),
      ).toEqual(fields.map((field) => String(review[field])));
      for (const field of fields) {
        expect(
          screen.getByTestId(
            `MenuItemReviewTable-cell-row-${index}-col-${field}`,
          ),
        ).toHaveTextContent(String(review[field]));
      }
    }
    expect(
      screen.getByTestId("MenuItemReviewTable-cell-row-2-col-stars"),
    ).toHaveTextContent(/^0$/);
  });

  test.each([
    ["ordinary user", currentUserFixtures.userOnly],
    ["logged-out user", currentUserFixtures.notLoggedIn],
    ["missing current user", undefined],
    ["null current user", null],
  ])("does not expose admin actions for %s", (_description, currentUser) => {
    renderTable({ currentUser });
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual(headers);
    expect(
      screen.queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Delete" }),
    ).not.toBeInTheDocument();
    expect(axiosMock.history.delete).toHaveLength(0);
  });

  test("shows edit and delete actions for each review only to admins", () => {
    renderTable({ currentUser: currentUserFixtures.adminUser });
    expect(
      screen.getAllByRole("columnheader").map((header) => header.textContent),
    ).toEqual([...headers, "Edit", "Delete"]);
    for (const index of [0, 1, 2]) {
      const row = screen.getByTestId(`MenuItemReviewTable-row-${index}`);
      expect(within(row).getByRole("button", { name: "Edit" })).toHaveClass(
        "btn-primary",
      );
      expect(within(row).getByRole("button", { name: "Delete" })).toHaveClass(
        "btn-danger",
      );
    }
  });

  test("uses a custom table prefix consistently for rows and action buttons", () => {
    renderTable({
      currentUser: currentUserFixtures.adminUser,
      testIdPrefix: "ReviewResults",
    });
    expect(screen.queryByTestId("MenuItemReviewTable")).not.toBeInTheDocument();
    expect(screen.getByTestId("ReviewResults")).toBe(screen.getByRole("table"));
    const row = screen.getByTestId("ReviewResults-row-0");
    expect(screen.getByTestId("ReviewResults-cell-row-0-col-Edit-button")).toBe(
      within(row).getByRole("button", { name: "Edit" }),
    );
    expect(
      screen.getByTestId("ReviewResults-cell-row-0-col-Delete-button"),
    ).toBe(within(row).getByRole("button", { name: "Delete" }));
  });

  test("sorts ratings in both directions without changing the supplied records", async () => {
    const original = structuredClone(reviews);
    const user = renderTable();
    const sortHeader = screen.getByTestId(
      "MenuItemReviewTable-header-stars-sort-header",
    );
    await user.click(sortHeader);
    expect(
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[3].textContent),
    ).toEqual(["5", "3", "0"]);
    await user.click(sortHeader);
    expect(
      screen
        .getAllByRole("row")
        .slice(1)
        .map((row) => within(row).getAllByRole("cell")[3].textContent),
    ).toEqual(["0", "3", "5"]);
    expect(reviews).toEqual(original);
  });

  test.each([0, 2])(
    "edit navigates using review ID from row %s, not its menu item ID",
    async (index) => {
      const user = renderTable({ currentUser: currentUserFixtures.adminUser });
      const row = screen.getByTestId(`MenuItemReviewTable-row-${index}`);
      await user.click(within(row).getByRole("button", { name: "Edit" }));
      expect(
        await screen.findByRole("heading", {
          name: `Editing review ${reviews[index].id}`,
        }),
      ).toBeVisible();
      expect(axiosMock.history.delete).toHaveLength(0);
    },
  );

  test("deletes the selected review by ID and reports the backend success message", async () => {
    axiosMock
      .onDelete("/api/MenuItemReview")
      .reply(200, { message: "record 3 deleted" });
    const user = renderTable({ currentUser: currentUserFixtures.adminUser });
    const row = screen.getByTestId("MenuItemReviewTable-row-2");
    await user.click(within(row).getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(axiosMock.history.delete).toHaveLength(1));
    expect(axiosMock.history.delete[0].params).toEqual({ id: 3 });
    await waitFor(() => expect(toast).toHaveBeenCalledWith("record 3 deleted"));
  });

  test("refreshes the active cached list after deletion and removes the deleted row", async () => {
    let serverReviews = [...reviews];
    axiosMock
      .onGet("/api/MenuItemReview/all")
      .reply(() => [200, serverReviews]);
    axiosMock.onDelete("/api/MenuItemReview").reply((config) => {
      serverReviews = serverReviews.filter(
        (review) => review.id !== config.params.id,
      );
      return [200, { message: "record 3 deleted" }];
    });
    const user = renderTable({
      currentUser: currentUserFixtures.adminUser,
      live: true,
    });
    await screen.findByText("third@example.com");
    queryClient.setQueryData(
      ["/api/restaurants/all"],
      [{ id: 99, name: "Unrelated restaurant" }],
    );
    expect(axiosMock.history.get).toHaveLength(1);
    await user.click(
      screen.getByTestId("MenuItemReviewTable-header-stars-sort-header"),
    );
    await user.click(
      screen.getByTestId("MenuItemReviewTable-header-stars-sort-header"),
    );
    const firstDataRow = screen.getAllByRole("row")[1];
    expect(within(firstDataRow).getByText("third@example.com")).toBeVisible();
    await user.click(
      within(firstDataRow).getByRole("button", { name: "Delete" }),
    );
    await waitFor(() =>
      expect(screen.queryByText("third@example.com")).not.toBeInTheDocument(),
    );
    expect(axiosMock.history.delete).toHaveLength(1);
    expect(axiosMock.history.delete[0].params).toEqual({ id: 3 });
    expect(axiosMock.history.get).toHaveLength(2);
    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(queryClient.getQueryData(["/api/MenuItemReview/all"])).toEqual(
      reviews.slice(0, 2),
    );
    expect(
      queryClient.getQueryState(["/api/restaurants/all"]).isInvalidated,
    ).toBe(false);
  });

  test("does not show a success message or remove a row when deletion fails", async () => {
    axiosMock
      .onDelete("/api/MenuItemReview")
      .reply(500, { message: "Deletion failed" });
    const user = renderTable({ currentUser: currentUserFixtures.adminUser });
    const row = screen.getByTestId("MenuItemReviewTable-row-0");
    await user.click(within(row).getByRole("button", { name: "Delete" }));
    await waitFor(() =>
      expect(toast).toHaveBeenCalledWith(expect.stringContaining("500")),
    );
    expect(axiosMock.history.delete).toHaveLength(1);
    expect(screen.getByText("first@example.com")).toBeVisible();
    expect(toast).not.toHaveBeenCalledWith("record 1 deleted");
  });
});
