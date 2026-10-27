import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import HelpRequestEditPage from "main/pages/HelpRequest/HelpRequestEditPage";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";
import mockConsole from "tests/testutils/mockConsole";

const mockToast = vi.fn();

vi.mock("react-toastify", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    toast: vi.fn((x) => mockToast(x)),
  };
});

const mockNavigate = vi.fn();

vi.mock("react-router", async (importOriginal) => {
  const originalModule = await importOriginal();
  return {
    ...originalModule,
    useParams: vi.fn(() => ({
      id: 17,
    })),
    Navigate: vi.fn((x) => {
      mockNavigate(x);
      return null;
    }),
  };
});

describe("HelpRequestEditPage tests", () => {
  let axiosMock;

  const apiUrl = "/api/helprequests";
  const testId = "HelpRequestForm";

  const originalHelpRequest = {
    id: 17,
    requesterEmail: "cgaucho@ucsb.edu",
    teamId: "s22-5pm-3",
    tableOrBreakoutRoom: "7",
    requestTime: "2022-04-20T17:35:00",
    explanation: "Need help with Swagger-ui",
    solved: false,
  };

  const updatedHelpRequest = {
    id: 17,
    requesterEmail: "ldelplaya@ucsb.edu",
    teamId: "s22-6pm-4",
    tableOrBreakoutRoom: "11",
    requestTime: "2022-04-21T18:31:00",
    explanation: "Dokku deployment is failing",
    solved: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    axiosMock = new AxiosMockAdapter(axios);

    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.userOnly);

    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  });

  afterEach(() => {
    axiosMock.restore();
  });

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HelpRequestEditPage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders the header but not the form when the backend fails", async () => {
    const restoreConsole = mockConsole();

    axiosMock.onGet(apiUrl).timeout();

    renderPage();

    expect(await screen.findByText("Edit HelpRequest")).toBeInTheDocument();
    expect(
      screen.queryByTestId(`${testId}-requesterEmail`),
    ).not.toBeInTheDocument();

    restoreConsole();
  });

  test("loads the existing data into the form", async () => {
    axiosMock
      .onGet(apiUrl, { params: { id: 17 } })
      .reply(200, originalHelpRequest);

    renderPage();

    const idField = await screen.findByTestId(`${testId}-id`);
    expect(idField).toHaveValue("17");
    expect(idField).toBeDisabled();

    expect(screen.getByTestId(`${testId}-requesterEmail`)).toHaveValue(
      "cgaucho@ucsb.edu",
    );
    expect(screen.getByTestId(`${testId}-teamId`)).toHaveValue("s22-5pm-3");
    expect(screen.getByTestId(`${testId}-tableOrBreakoutRoom`)).toHaveValue(
      "7",
    );
    expect(screen.getByTestId(`${testId}-requestTime`)).toHaveValue(
      "2022-04-20T17:35",
    );
    expect(screen.getByTestId(`${testId}-explanation`)).toHaveValue(
      "Need help with Swagger-ui",
    );
    expect(screen.getByTestId(`${testId}-solved`)).not.toBeChecked();
    expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent("Update");
  });

  test("submits the updated values, shows a toast and redirects", async () => {
    axiosMock
      .onGet(apiUrl, { params: { id: 17 } })
      .reply(200, originalHelpRequest);
    axiosMock.onPut(apiUrl).reply(200, updatedHelpRequest);

    renderPage();

    await screen.findByTestId(`${testId}-id`);

    fireEvent.change(screen.getByTestId(`${testId}-requesterEmail`), {
      target: { value: "ldelplaya@ucsb.edu" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-teamId`), {
      target: { value: "s22-6pm-4" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-tableOrBreakoutRoom`), {
      target: { value: "11" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-requestTime`), {
      target: { value: "2022-04-21T18:31" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
      target: { value: "Dokku deployment is failing" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-solved`));
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => {
      expect(axiosMock.history.put.length).toBe(1);
    });

    expect(axiosMock.history.put[0].url).toBe(apiUrl);
    expect(axiosMock.history.put[0].params).toEqual({ id: 17 });
    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual({
      requesterEmail: "ldelplaya@ucsb.edu",
      teamId: "s22-6pm-4",
      tableOrBreakoutRoom: "11",
      requestTime: "2022-04-21T18:31",
      explanation: "Dokku deployment is failing",
      solved: true,
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "HelpRequest Updated - id: 17 requesterEmail: ldelplaya@ucsb.edu",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/helprequest" });
  });

  test("does not save when a required field is cleared", async () => {
    axiosMock
      .onGet(apiUrl, { params: { id: 17 } })
      .reply(200, originalHelpRequest);
    axiosMock.onPut(apiUrl).reply(200, updatedHelpRequest);

    renderPage();

    await screen.findByTestId(`${testId}-id`);

    fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
      target: { value: "" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Explanation is required."),
    ).toBeInTheDocument();
    expect(axiosMock.history.put.length).toBe(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("Cancel goes back without saving", async () => {
    axiosMock
      .onGet(apiUrl, { params: { id: 17 } })
      .reply(200, originalHelpRequest);

    renderPage();

    await screen.findByTestId(`${testId}-id`);
    fireEvent.click(screen.getByTestId(`${testId}-cancel`));

    expect(axiosMock.history.put.length).toBe(0);
  });

  test("storybook mode does not redirect after updating", async () => {
    axiosMock
      .onGet(apiUrl, { params: { id: 17 } })
      .reply(200, originalHelpRequest);
    axiosMock.onPut(apiUrl).reply(200, updatedHelpRequest);

    renderPage({ storybook: true });

    fireEvent.click(await screen.findByTestId(`${testId}-submit`));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
