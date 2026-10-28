import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import HelpRequestIndexPage from "main/pages/HelpRequest/HelpRequestIndexPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import mockConsole from "tests/testutils/mockConsole";

import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("HelpRequestIndexPage tests", () => {
  const apiUrl = "/api/helprequests";
  const testId = "HelpRequestTable";

  let axiosMock;

  beforeEach(() => {
    vi.clearAllMocks();
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
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HelpRequestIndexPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders the Create button and heading for an admin user", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock.onGet(`${apiUrl}/all`).reply(200, []);

    renderPage();

    const button = await screen.findByText("Create HelpRequest");
    expect(button).toHaveAttribute("href", "/helprequest/create");
    expect(button).toHaveAttribute("style", "float: right;");
    expect(
      screen.getByRole("heading", { name: "HelpRequests" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-id`),
    ).not.toBeInTheDocument();
  });

  test("renders three help requests for a regular user, without buttons", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    axiosMock
      .onGet(`${apiUrl}/all`)
      .reply(200, helpRequestFixtures.threeHelpRequests);

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
    expect(screen.getByText("Need help with Swagger-ui")).toBeInTheDocument();
    expect(screen.getByText("Dokku deployment is failing")).toBeInTheDocument();
    expect(screen.getByText("Merge conflict on main")).toBeInTheDocument();

    expect(screen.queryByText("Create HelpRequest")).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).not.toBeInTheDocument();
  });

  test("renders an empty table when the backend is unavailable", async () => {
    setupUser(apiCurrentUserFixtures.userOnly);
    axiosMock.onGet(`${apiUrl}/all`).timeout();

    const restoreConsole = mockConsole();

    try {
      renderPage();

      expect(
        screen.getByRole("heading", { name: "HelpRequests" }),
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

      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-id`),
      ).not.toBeInTheDocument();
    } finally {
      restoreConsole();
    }
  });

  test("admin can click Edit to go to the edit page", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet(`${apiUrl}/all`)
      .reply(200, helpRequestFixtures.threeHelpRequests);

    renderPage();

    const editButton = await screen.findByTestId(
      `${testId}-cell-row-0-col-Edit-button`,
    );
    fireEvent.click(editButton);

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/helprequest/edit/1");
    });
  });

  test("admin can delete an existing help request", async () => {
    setupUser(apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet(`${apiUrl}/all`)
      .reply(200, helpRequestFixtures.threeHelpRequests);
    axiosMock
      .onDelete(apiUrl)
      .reply(200, { message: "Help request deleted successfully" });

    renderPage();

    const deleteButton = await screen.findByTestId(
      `${testId}-cell-row-0-col-Delete-button`,
    );
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(axiosMock.history.delete.length).toBe(1);
    });

    expect(axiosMock.history.delete[0].url).toBe(apiUrl);
    expect(axiosMock.history.delete[0].params).toEqual({ id: 1 });
  });
});
