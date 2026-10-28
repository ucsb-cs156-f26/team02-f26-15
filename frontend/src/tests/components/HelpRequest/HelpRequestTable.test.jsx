import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import HelpRequestTable from "main/components/HelpRequest/HelpRequestTable";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("HelpRequestTable tests", () => {
  const testId = "HelpRequestTable";

  const expectedHeaders = [
    "id",
    "Requester Email",
    "Team Id",
    "Table Or Breakout Room",
    "Request Time",
    "Explanation",
    "Solved",
  ];

  const expectedFields = [
    "id",
    "requesterEmail",
    "teamId",
    "tableOrBreakoutRoom",
    "requestTime",
    "explanation",
    "solved",
  ];

  const renderTable = (helpRequests, currentUser) => {
    const queryClient = new QueryClient();

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HelpRequestTable
            helpRequests={helpRequests}
            currentUser={currentUser}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders empty table correctly", () => {
    renderTable([], currentUserFixtures.adminUser);

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      expect(
        screen.queryByTestId(`${testId}-cell-row-0-col-${field}`),
      ).not.toBeInTheDocument();
    });
  });

  test("renders columns, data and buttons for admin user", () => {
    renderTable(
      helpRequestFixtures.threeHelpRequests,
      currentUserFixtures.adminUser,
    );

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expectedFields.forEach((field) => {
      expect(
        screen.getByTestId(`${testId}-cell-row-0-col-${field}`),
      ).toBeInTheDocument();
    });

    expect(screen.getByTestId(`${testId}-cell-row-0-col-id`)).toHaveTextContent(
      "1",
    );
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-requesterEmail`),
    ).toHaveTextContent("cgaucho@ucsb.edu");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-teamId`),
    ).toHaveTextContent("s22-5pm-3");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-tableOrBreakoutRoom`),
    ).toHaveTextContent("7");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-requestTime`),
    ).toHaveTextContent("2022-04-20T17:35:00");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-explanation`),
    ).toHaveTextContent("Need help with Swagger-ui");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-solved`),
    ).toHaveTextContent("false");
    expect(
      screen.getByTestId(`${testId}-cell-row-2-col-solved`),
    ).toHaveTextContent("true");
    expect(
      screen.getByTestId(`${testId}-cell-row-1-col-requesterEmail`),
    ).toHaveTextContent("ldelplaya@ucsb.edu");

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-Edit-button`),
    ).toHaveClass("btn-primary");
    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-Delete-button`),
    ).toHaveClass("btn-danger");
  });

  test("ordinary users do not see Edit or Delete buttons", () => {
    renderTable(
      helpRequestFixtures.threeHelpRequests,
      currentUserFixtures.userOnly,
    );

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expect(
      screen.getByTestId(`${testId}-cell-row-0-col-requesterEmail`),
    ).toHaveTextContent("cgaucho@ucsb.edu");

    expect(screen.queryByText("Edit")).not.toBeInTheDocument();
    expect(screen.queryByText("Delete")).not.toBeInTheDocument();
  });

  test("Edit button navigates to the edit page", async () => {
    renderTable(
      helpRequestFixtures.threeHelpRequests,
      currentUserFixtures.adminUser,
    );

    fireEvent.click(screen.getByTestId(`${testId}-cell-row-0-col-Edit-button`));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith("/helprequest/edit/1");
    });
  });

  test("Delete button sends a DELETE request", async () => {
    const axiosMock = new AxiosMockAdapter(axios);
    axiosMock
      .onDelete("/api/helprequests")
      .reply(200, { message: "Help request deleted" });

    renderTable(
      helpRequestFixtures.threeHelpRequests,
      currentUserFixtures.adminUser,
    );

    fireEvent.click(
      screen.getByTestId(`${testId}-cell-row-0-col-Delete-button`),
    );

    await waitFor(() => {
      expect(axiosMock.history.delete.length).toBe(1);
    });

    expect(axiosMock.history.delete[0].url).toBe("/api/helprequests");
    expect(axiosMock.history.delete[0].params).toEqual({ id: 1 });

    axiosMock.restore();
  });
});
