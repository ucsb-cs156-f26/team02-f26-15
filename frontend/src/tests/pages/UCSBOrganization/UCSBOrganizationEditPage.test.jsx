import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import UCSBOrganizationEditPage from "main/pages/UCSBOrganization/UCSBOrganizationEditPage";

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
      orgCode: "ZPR",
    })),
    Navigate: vi.fn((x) => {
      mockNavigate(x);
      return null;
    }),
  };
});

describe("UCSBOrganizationEditPage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const setupAdminUser = () => {
    axiosMock.reset();
    axiosMock.resetHistory();
    axiosMock
      .onGet("/api/currentUser")
      .reply(200, apiCurrentUserFixtures.adminUser);
    axiosMock
      .onGet("/api/systemInfo")
      .reply(200, systemInfoFixtures.showingNeither);
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("when the backend doesn't return data", () => {
    test("renders header but form is not present", async () => {
      setupAdminUser();
      axiosMock
        .onGet("/api/UCSBOrganization", { params: { orgCode: "ZPR" } })
        .timeout();
      const restoreConsole = mockConsole();

      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBOrganizationEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByText("Edit UCSBOrganization");
      expect(
        screen.queryByTestId("UCSBOrganizationForm-orgCode"),
      ).not.toBeInTheDocument();
      restoreConsole();
    });
  });

  describe("when the backend is working normally", () => {
    beforeEach(() => {
      setupAdminUser();
      axiosMock
        .onGet("/api/UCSBOrganization", { params: { orgCode: "ZPR" } })
        .reply(200, {
          orgCode: "ZPR",
          orgTranslationShort: "ZETA PHI RHO",
          orgTranslation: "ZETA PHI RHO",
          inactive: false,
        });
      axiosMock.onPut("/api/UCSBOrganization").reply(200, {
        orgCode: "ZPR",
        orgTranslationShort: "ZETA PHI RHO FRAT",
        orgTranslation: "ZETA PHI RHO FRATERNITY",
        inactive: true,
      });
    });

    test("is populated with the data provided", async () => {
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBOrganizationEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByTestId("UCSBOrganizationForm-orgCode");

      const orgCodeField = screen.getByTestId("UCSBOrganizationForm-orgCode");
      expect(orgCodeField).toHaveValue("ZPR");
      expect(orgCodeField).toHaveAttribute("readonly");
      expect(
        screen.getByTestId("UCSBOrganizationForm-orgTranslationShort"),
      ).toHaveValue("ZETA PHI RHO");
      expect(
        screen.getByTestId("UCSBOrganizationForm-orgTranslation"),
      ).toHaveValue("ZETA PHI RHO");
      expect(
        screen.getByTestId("UCSBOrganizationForm-inactive"),
      ).not.toBeChecked();
      expect(
        screen.getByTestId("UCSBOrganizationForm-submit"),
      ).toHaveTextContent("Update");
    });

    test("changes when you click Update", async () => {
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBOrganizationEditPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByTestId("UCSBOrganizationForm-orgCode");

      fireEvent.change(
        screen.getByTestId("UCSBOrganizationForm-orgTranslationShort"),
        { target: { value: "ZETA PHI RHO FRAT" } },
      );
      fireEvent.change(
        screen.getByTestId("UCSBOrganizationForm-orgTranslation"),
        { target: { value: "ZETA PHI RHO FRATERNITY" } },
      );
      fireEvent.click(screen.getByTestId("UCSBOrganizationForm-inactive"));
      fireEvent.click(screen.getByTestId("UCSBOrganizationForm-submit"));

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockToast).toBeCalledWith(
        "UCSBOrganization Updated - orgCode: ZPR orgTranslationShort: ZETA PHI RHO FRAT",
      );
      expect(mockNavigate).toBeCalledWith({ to: "/ucsborganization" });

      expect(axiosMock.history.put.length).toBe(1);
      expect(axiosMock.history.put[0].params).toEqual({ orgCode: "ZPR" });
      expect(JSON.parse(axiosMock.history.put[0].data)).toEqual({
        orgTranslationShort: "ZETA PHI RHO FRAT",
        orgTranslation: "ZETA PHI RHO FRATERNITY",
        inactive: true,
      });
    });

    test("does not navigate away when storybook is true", async () => {
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter>
            <UCSBOrganizationEditPage storybook={true} />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      await screen.findByTestId("UCSBOrganizationForm-orgCode");
      fireEvent.click(screen.getByTestId("UCSBOrganizationForm-submit"));

      await waitFor(() => expect(mockToast).toBeCalled());
      expect(mockNavigate).not.toBeCalled();
    });
  });
});
