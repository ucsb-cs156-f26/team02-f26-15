import { fireEvent, render, waitFor, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import UCSBDiningCommonsMenuItemEditPage from "main/pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemEditPage";

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

describe("UCSBDiningCommonsMenuItemEditPage tests", () => {
  let axiosMock;

  const originalItem = {
    id: 17,
    diningCommonsCode: "carrillo",
    name: "Grilled Chicken",
    station: "Grill",
  };

  const updatedItem = {
    id: 17,
    diningCommonsCode: "dlg",
    name: "Roasted Chicken",
    station: "Entree",
  };

  const apiUrl = "/api/ucsbdiningcommonsmenuitems";
  const testId = "UCSBDiningCommonsMenuItemForm";

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
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <UCSBDiningCommonsMenuItemEditPage {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  test("renders header but not form when backend fails", async () => {
    const restoreConsole = mockConsole();

    axiosMock.onGet(apiUrl).timeout();

    renderPage();

    expect(
      await screen.findByText("Edit Dining Commons Menu Item"),
    ).toBeInTheDocument();

    expect(screen.queryByTestId(`${testId}-name`)).not.toBeInTheDocument();

    restoreConsole();
  });

  test("loads existing data and submits updated item", async () => {
    axiosMock.onGet(apiUrl, { params: { id: 17 } }).reply(200, originalItem);

    axiosMock.onPut(apiUrl).reply(200, updatedItem);

    renderPage();

    const idField = await screen.findByTestId(`${testId}-id`);
    const codeField = screen.getByTestId(`${testId}-diningCommonsCode`);
    const nameField = screen.getByTestId(`${testId}-name`);
    const stationField = screen.getByTestId(`${testId}-station`);
    const submitButton = screen.getByTestId(`${testId}-submit`);

    expect(idField).toHaveValue("17");
    expect(idField).toBeDisabled();

    expect(codeField).toHaveValue("carrillo");
    expect(nameField).toHaveValue("Grilled Chicken");
    expect(stationField).toHaveValue("Grill");

    expect(submitButton).toHaveTextContent("Update");

    fireEvent.change(codeField, {
      target: { value: "dlg" },
    });

    fireEvent.change(nameField, {
      target: { value: "Roasted Chicken" },
    });

    fireEvent.change(stationField, {
      target: { value: "Entree" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(axiosMock.history.put.length).toBe(1);
    });

    expect(axiosMock.history.put[0].url).toBe(apiUrl);

    expect(axiosMock.history.put[0].params).toEqual({
      id: 17,
    });

    expect(JSON.parse(axiosMock.history.put[0].data)).toEqual({
      diningCommonsCode: "dlg",
      name: "Roasted Chicken",
      station: "Entree",
    });

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Menu Item Updated - id: 17 name: Roasted Chicken",
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith({
      to: "/diningcommonsmenuitem",
    });
  });

  test("storybook mode does not redirect after updating", async () => {
    axiosMock.onGet(apiUrl, { params: { id: 17 } }).reply(200, originalItem);

    axiosMock.onPut(apiUrl).reply(200, updatedItem);

    renderPage({ storybook: true });

    const submitButton = await screen.findByTestId(`${testId}-submit`);

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith(
        "Menu Item Updated - id: 17 name: Roasted Chicken",
      );
    });

    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
