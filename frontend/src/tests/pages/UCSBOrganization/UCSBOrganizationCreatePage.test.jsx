import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import UCSBOrganizationCreatePage from "main/pages/UCSBOrganization/UCSBOrganizationCreatePage";
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

describe("UCSBOrganizationCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

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

  test("renders without crashing", async () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UCSBOrganizationCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("UCSBOrganizationForm-orgCode"),
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Create New UCSBOrganization")).toBeInTheDocument();
  });

  test("when you fill in the form and hit submit, it makes a request to the backend", async () => {
    const queryClient = new QueryClient();
    const organization = {
      orgCode: "SKY",
      orgTranslationShort: "SKY DIVING CLUB",
      orgTranslation: "SKY DIVING CLUB AT UCSB",
      inactive: true,
    };

    axiosMock.onPost("/api/UCSBOrganization/post").reply(202, organization);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UCSBOrganizationCreatePage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("UCSBOrganizationForm-orgCode"),
      ).toBeInTheDocument();
    });

    const orgCodeField = screen.getByTestId("UCSBOrganizationForm-orgCode");
    const orgTranslationShortField = screen.getByTestId(
      "UCSBOrganizationForm-orgTranslationShort",
    );
    const orgTranslationField = screen.getByTestId(
      "UCSBOrganizationForm-orgTranslation",
    );
    const inactiveField = screen.getByTestId("UCSBOrganizationForm-inactive");
    const submitButton = screen.getByTestId("UCSBOrganizationForm-submit");

    fireEvent.change(orgCodeField, { target: { value: "SKY" } });
    fireEvent.change(orgTranslationShortField, {
      target: { value: "SKY DIVING CLUB" },
    });
    fireEvent.change(orgTranslationField, {
      target: { value: "SKY DIVING CLUB AT UCSB" },
    });
    fireEvent.click(inactiveField);

    expect(submitButton).toBeInTheDocument();

    fireEvent.click(submitButton);

    await waitFor(() => expect(axiosMock.history.post.length).toBe(1));

    expect(axiosMock.history.post[0].params).toEqual({
      orgCode: "SKY",
      orgTranslationShort: "SKY DIVING CLUB",
      orgTranslation: "SKY DIVING CLUB AT UCSB",
      inactive: true,
    });

    expect(mockToast).toBeCalledWith(
      "New UCSBOrganization Created - orgCode: SKY",
    );
    expect(mockNavigate).toBeCalledWith({ to: "/ucsborganizations" });
  });

  test("does not navigate away when storybook is true", async () => {
    const queryClient = new QueryClient();
    const organization = {
      orgCode: "SKY",
      orgTranslationShort: "SKY DIVING CLUB",
      orgTranslation: "SKY DIVING CLUB AT UCSB",
      inactive: false,
    };

    axiosMock.onPost("/api/UCSBOrganization/post").reply(202, organization);

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UCSBOrganizationCreatePage storybook={true} />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByTestId("UCSBOrganizationForm-orgCode"),
      ).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("UCSBOrganizationForm-orgCode"), {
      target: { value: "SKY" },
    });
    fireEvent.change(
      screen.getByTestId("UCSBOrganizationForm-orgTranslationShort"),
      { target: { value: "SKY DIVING CLUB" } },
    );
    fireEvent.change(
      screen.getByTestId("UCSBOrganizationForm-orgTranslation"),
      { target: { value: "SKY DIVING CLUB AT UCSB" } },
    );
    fireEvent.click(screen.getByTestId("UCSBOrganizationForm-submit"));

    await waitFor(() =>
      expect(mockToast).toBeCalledWith(
        "New UCSBOrganization Created - orgCode: SKY",
      ),
    );
    expect(mockNavigate).not.toBeCalled();
  });
});
