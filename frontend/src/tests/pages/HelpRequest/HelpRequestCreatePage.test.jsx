import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HelpRequestCreatePage from "main/pages/HelpRequest/HelpRequestCreatePage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";

import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

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
    Navigate: vi.fn((x) => {
      mockNavigate(x);
      return null;
    }),
  };
});

describe("HelpRequestCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const helpRequest = {
    id: 3,
    requesterEmail: "cgaucho@ucsb.edu",
    teamId: "s22-5pm-3",
    tableOrBreakoutRoom: "7",
    requestTime: "2022-04-20T17:35",
    explanation: "Need help with Swagger-ui",
    solved: true,
  };

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

  afterAll(() => {
    axiosMock.restore();
  });

  const renderPage = (props = {}) => {
    const queryClient = new QueryClient();

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <HelpRequestCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  const fillInForm = () => {
    fireEvent.change(screen.getByLabelText("Requester Email"), {
      target: { value: "cgaucho@ucsb.edu" },
    });
    fireEvent.change(screen.getByLabelText("Team Id"), {
      target: { value: "s22-5pm-3" },
    });
    fireEvent.change(screen.getByLabelText("Table Or Breakout Room"), {
      target: { value: "7" },
    });
    fireEvent.change(screen.getByLabelText("Request Time (iso format)"), {
      target: { value: "2022-04-20T17:35" },
    });
    fireEvent.change(screen.getByLabelText("Explanation"), {
      target: { value: "Need help with Swagger-ui" },
    });
    fireEvent.click(screen.getByLabelText("Solved"));
  };

  test("renders the page and form without crashing", async () => {
    renderPage();

    expect(
      await screen.findByText("Create New HelpRequest"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Requester Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Team Id")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  test("submits data to the backend, shows a toast and redirects", async () => {
    axiosMock.onPost("/api/helprequests/post").reply(202, helpRequest);

    renderPage();
    await screen.findByLabelText("Requester Email");

    fillInForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
    });

    expect(axiosMock.history.post[0].url).toBe("/api/helprequests/post");
    expect(axiosMock.history.post[0].params).toEqual({
      requesterEmail: "cgaucho@ucsb.edu",
      teamId: "s22-5pm-3",
      tableOrBreakoutRoom: "7",
      requestTime: "2022-04-20T17:35",
      explanation: "Need help with Swagger-ui",
      solved: true,
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "New helpRequest Created - id: 3 requesterEmail: cgaucho@ucsb.edu",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith({ to: "/helprequest" });
  });

  test("does not submit when required fields are missing", async () => {
    renderPage();
    await screen.findByLabelText("Requester Email");

    fireEvent.click(screen.getByText("Create"));

    expect(
      await screen.findByText("Requester Email is required."),
    ).toBeInTheDocument();
    expect(screen.getByText("Team Id is required.")).toBeInTheDocument();
    expect(axiosMock.history.post.length).toBe(0);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  test("storybook mode does not redirect after a successful create", async () => {
    axiosMock.onPost("/api/helprequests/post").reply(202, helpRequest);

    renderPage({ storybook: true });
    await screen.findByLabelText("Requester Email");

    fillInForm();
    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
