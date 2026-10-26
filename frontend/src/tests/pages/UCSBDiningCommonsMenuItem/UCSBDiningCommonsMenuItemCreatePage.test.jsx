import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import UCSBDiningCommonsMenuItemCreatePage from "main/pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemCreatePage";
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

describe("UCSBDiningCommonsMenuItemCreatePage tests", () => {
  const axiosMock = new AxiosMockAdapter(axios);

  const menuItem = {
    id: 3,
    diningCommonsCode: "carrillo",
    name: "Grilled Chicken",
    station: "Grill",
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
          <UCSBDiningCommonsMenuItemCreatePage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders without crashing", async () => {
    renderPage();

    expect(
      await screen.findByLabelText("Dining Commons Code"),
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Station")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeInTheDocument();
  });

  test("submits data to backend and redirects", async () => {
    axiosMock
      .onPost("/api/ucsbdiningcommonsmenuitems/post")
      .reply(202, menuItem);

    renderPage();

    fireEvent.change(screen.getByLabelText("Dining Commons Code"), {
      target: { value: "carrillo" },
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Grilled Chicken" },
    });

    fireEvent.change(screen.getByLabelText("Station"), {
      target: { value: "Grill" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(axiosMock.history.post.length).toBe(1);
    });

    expect(axiosMock.history.post[0].url).toBe(
      "/api/ucsbdiningcommonsmenuitems/post",
    );

    expect(axiosMock.history.post[0].params).toEqual({
      diningCommonsCode: "carrillo",
      name: "Grilled Chicken",
      station: "Grill",
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "New menu item Created - id: 3 name: Grilled Chicken",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/diningcommonsmenuitem",
    });
  });

  test("does not submit when required fields are missing", async () => {
    renderPage();

    fireEvent.click(screen.getByText("Create"));

    expect(
      await screen.findByText("Dining Commons Code is required."),
    ).toBeInTheDocument();

    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Station is required.")).toBeInTheDocument();

    expect(axiosMock.history.post.length).toBe(0);
  });

  test("storybook mode does not redirect after successful creation", async () => {
    axiosMock
      .onPost("/api/ucsbdiningcommonsmenuitems/post")
      .reply(202, menuItem);

    renderPage({ storybook: true });

    fireEvent.change(screen.getByLabelText("Dining Commons Code"), {
      target: { value: "carrillo" },
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Grilled Chicken" },
    });

    fireEvent.change(screen.getByLabelText("Station"), {
      target: { value: "Grill" },
    });

    fireEvent.click(screen.getByText("Create"));

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalled();
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
