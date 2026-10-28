import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import UCSBDiningCommonsMenuItemIndexPage from "main/pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemIndexPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import mockConsole from "tests/testutils/mockConsole";

import { ucsbdiningcommonsmenuitemFixtures } from "fixtures/ucsbdiningcommonsmenuitemFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

describe("UCSBDiningCommonsMenuItemIndexPage tests", () => {
  const apiUrl = "/api/ucsbdiningcommonsmenuitems";
  const testId = "UCSBDiningCommonsMenuItemTable";

  let axiosMock;

  beforeEach(() => {
    axiosMock = new AxiosMockAdapter(axios);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  const setupUser = (user) => {
    axiosMock.onGet("/api/currentUser").reply(200, user);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  };

  const renderPage = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UCSBDiningCommonsMenuItemIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders Create button for admin user", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock.onGet(`${apiUrl}/all`).reply(200, []);

    renderPage();

    const button = await screen.findByText("Create Menu Item");

    expect(button).toHaveAttribute("href", "/diningcommonsmenuitem/create");

    expect(button).toHaveAttribute("style", "float: right;");

    expect(
      screen.getByRole("heading", {
        name: "Dining Commons Menu Items",
      }),
    ).toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();
  });

  test("renders three menu items for regular user", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);

    axiosMock
      .onGet(`${apiUrl}/all`)
      .reply(200, ucsbdiningcommonsmenuitemFixtures.threeMenuItems);

    renderPage();

    expect(
      await screen.findByTestId(`${testId}-cell-row-0-col-id`),
    ).toHaveTextContent("1");

    expect(screen.getByTestId(`${testId}-cell-row-1-col-id`)).toHaveTextContent(
      "2",
    );

    expect(screen.getByTestId(`${testId}-cell-row-2-col-id`)).toHaveTextContent(
      "3",
    );

    expect(screen.getByText("Grilled Chicken")).toBeInTheDocument();
    expect(screen.getByText("Cheese Pizza")).toBeInTheDocument();
    expect(screen.getByText("Vegetable Stir Fry")).toBeInTheDocument();

    expect(screen.getByText("carrillo")).toBeInTheDocument();
    expect(screen.getByText("Grill")).toBeInTheDocument();

    expect(screen.queryByText("Create Menu Item")).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();

    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("renders empty table when backend unavailable", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    axiosMock.onGet(`${apiUrl}/all`).timeout();

    const restoreConsole = mockConsole();

    try {
      renderPage();

      expect(
        screen.getByRole("heading", {
          name: "Dining Commons Menu Items",
        }),
      ).toBeInTheDocument();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalled();

        const messages = console.error.mock.calls
          .map((call) => call.join(" "))
          .join(" ");

        expect(messages).toContain(
          `Error communicating with backend via GET on ${apiUrl}/all`,
        );
      });
    } finally {
      restoreConsole();
    }
  });

  test("admin can delete an existing menu item", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);

    axiosMock
      .onGet(`${apiUrl}/all`)
      .reply(200, ucsbdiningcommonsmenuitemFixtures.threeMenuItems);

    axiosMock
      .onDelete(apiUrl)
      .reply(200, { message: "Menu item deleted successfully" });

    renderPage();

    expect(
      await screen.findByTestId(`${testId}-cell-row-0-col-id`),
    ).toHaveTextContent("1");

    const deleteButton = screen.getByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );

    expect(deleteButton).toBeInTheDocument();

    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axiosMock.history.delete.length).toBe(1);
    });

    expect(axiosMock.history.delete[0].url).toBe(apiUrl);

    expect(axiosMock.history.delete[0].params).toEqual({
      id: 1,
    });
  });
});
