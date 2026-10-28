import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import RecommendationRequestEditPage from "main/pages/RecommendationRequests/RecommendationRequestEditPage";

import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import axios from "axios";
import AxiosMockAdapter from "axios-mock-adapter";

import mockConsole from "tests/testutils/mockConsole";
import { beforeEach, afterEach } from "vitest";

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

const testId = "RecommendationRequestForm";

let axiosMock;
describe("RecommendationRequestEditPage tests", () => {
  describe("when the backend doesn't return data", () => {
    beforeEach(() => {
      axiosMock = new AxiosMockAdapter(axios);
      axiosMock
        .onGet("/api/currentUser")
        .reply(200, apiCurrentUserFixtures.userOnly);
      axiosMock
        .onGet("/api/systemInfo")
        .reply(200, systemInfoFixtures.showingNeither);
      axiosMock
        .onGet("/api/recommendationrequests", { params: { id: 17 } })
        .timeout();
    });

    afterEach(() => {
      mockToast.mockClear();
      mockNavigate.mockClear();
      axiosMock.restore();
      axiosMock.resetHistory();
    });

    const queryClient = new QueryClient();
    test("renders header but form is not present", async () => {
      const restoreConsole = mockConsole();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <RecommendationRequestEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByText(/Welcome/);
      await screen.findByText("Edit RecommendationRequest");
      expect(
        screen.queryByTestId(`${testId}-requesterEmail`),
      ).not.toBeInTheDocument();
      restoreConsole();
    });
  });

  describe("tests where backend is working normally", () => {
    beforeEach(() => {
      axiosMock = new AxiosMockAdapter(axios);
      axiosMock.reset();
      axiosMock.resetHistory();
      axiosMock
        .onGet("/api/currentUser")
        .reply(200, apiCurrentUserFixtures.userOnly);
      axiosMock
        .onGet("/api/systemInfo")
        .reply(200, systemInfoFixtures.showingNeither);
      axiosMock
        .onGet("/api/recommendationrequests", { params: { id: 17 } })
        .reply(200, {
          id: 17,
          requesterEmail: "cgaucho@ucsb.edu",
          professorEmail: "phtcon@ucsb.edu",
          explanation: "BS/MS program",
          dateRequested: "2022-04-20T00:00",
          dateNeeded: "2022-05-01T00:00",
          done: false,
        });
      axiosMock.onPut("/api/recommendationrequests").reply(200, {
        id: "17",
        requesterEmail: "ldelplaya@ucsb.edu",
        professorEmail: "richert@ucsb.edu",
        explanation: "PhD CS Stanford",
        dateRequested: "2022-05-20T00:00",
        dateNeeded: "2022-11-15T00:00",
        done: true,
      });
    });

    afterEach(() => {
      mockToast.mockClear();
      mockNavigate.mockClear();
      axiosMock.restore();
      axiosMock.resetHistory();
    });

    const renderPage = (props = {}) =>
      render(
        <QueryClientProvider client={new QueryClient()}>
          <MemoryRouter>
            <RecommendationRequestEditPage {...props} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

    const changeAndSubmit = () => {
      fireEvent.change(screen.getByTestId(`${testId}-requesterEmail`), {
        target: { value: "ldelplaya@ucsb.edu" },
      });
      fireEvent.change(screen.getByTestId(`${testId}-professorEmail`), {
        target: { value: "richert@ucsb.edu" },
      });
      fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
        target: { value: "PhD CS Stanford" },
      });
      fireEvent.change(screen.getByTestId(`${testId}-dateRequested`), {
        target: { value: "2022-05-20T00:00" },
      });
      fireEvent.change(screen.getByTestId(`${testId}-dateNeeded`), {
        target: { value: "2022-11-15T00:00" },
      });
      fireEvent.click(screen.getByTestId(`${testId}-done`));
      fireEvent.click(screen.getByTestId(`${testId}-submit`));
    };

    test("renders without crashing", async () => {
      renderPage();
      await screen.findByText(/Welcome/);
      await screen.findByTestId(`${testId}-requesterEmail`);
      expect(
        screen.getByTestId(`${testId}-requesterEmail`),
      ).toBeInTheDocument();
    });

    test("Is populated with the data provided", async () => {
      renderPage();

      await screen.findByTestId(`${testId}-requesterEmail`);

      expect(screen.getByTestId(`${testId}-id`)).toHaveValue("17");
      expect(screen.getByTestId(`${testId}-requesterEmail`)).toHaveValue(
        "cgaucho@ucsb.edu",
      );
      expect(screen.getByTestId(`${testId}-professorEmail`)).toHaveValue(
        "phtcon@ucsb.edu",
      );
      expect(screen.getByTestId(`${testId}-explanation`)).toHaveValue(
        "BS/MS program",
      );
      expect(screen.getByTestId(`${testId}-dateRequested`)).toHaveValue(
        "2022-04-20T00:00",
      );
      expect(screen.getByTestId(`${testId}-dateNeeded`)).toHaveValue(
        "2022-05-01T00:00",
      );
      expect(screen.getByTestId(`${testId}-done`)).not.toBeChecked();
      expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent(
        "Update",
      );
    });

    test("Changes when you click Update", async () => {
      renderPage();

      await screen.findByTestId(`${testId}-requesterEmail`);
      changeAndSubmit();

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockToast).toBeCalledWith(
        "RecommendationRequest Updated - id: 17 requesterEmail: ldelplaya@ucsb.edu",
      );
      expect(mockNavigate).toBeCalledWith({ to: "/recommendationrequest" });

      expect(axiosMock.history.put.length).toBe(1);
      expect(axiosMock.history.put[0].params).toEqual({ id: 17 });
      expect(axiosMock.history.put[0].data).toBe(
        JSON.stringify({
          requesterEmail: "ldelplaya@ucsb.edu",
          professorEmail: "richert@ucsb.edu",
          explanation: "PhD CS Stanford",
          dateRequested: "2022-05-20T00:00",
          dateNeeded: "2022-11-15T00:00",
          done: true,
        }),
      );
    });

    test("in storybook mode, does not navigate after update", async () => {
      renderPage({ storybook: true });

      await screen.findByTestId(`${testId}-requesterEmail`);
      changeAndSubmit();

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(
        screen.getByText("Edit RecommendationRequest"),
      ).toBeInTheDocument();
    });
  });
});
