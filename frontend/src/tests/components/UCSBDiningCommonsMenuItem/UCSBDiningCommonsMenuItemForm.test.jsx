import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router";

import UCSBDiningCommonsMenuItemForm from "main/components/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemForm";
import { ucsbdiningcommonsmenuitemFixtures } from "fixtures/ucsbdiningcommonsmenuitemFixtures";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("UCSBDiningCommonsMenuItemForm tests", () => {
  const queryClient = new QueryClient();
  const testId = "UCSBDiningCommonsMenuItemForm";

  const expectedHeaders = ["Dining Commons Code", "Name", "Station"];

  const renderForm = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Router>
          <UCSBDiningCommonsMenuItemForm {...props} />
        </Router>
      </QueryClientProvider>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders correctly with no initialContents", async () => {
    renderForm();

    expect(screen.getByText("Create")).toBeInTheDocument();

    expectedHeaders.forEach((headerText) => {
      expect(screen.getByText(headerText)).toBeInTheDocument();
    });

    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();
  });

  test("renders correctly with initialContents", async () => {
    renderForm({
      initialContents: ucsbdiningcommonsmenuitemFixtures.oneMenuItem[0],
      buttonLabel: "Update",
    });

    expect(screen.getByText("Update")).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-id`)).toBeDisabled();
    expect(screen.getByTestId(`${testId}-name`)).toHaveValue("Grilled Chicken");
    expect(screen.getByTestId(`${testId}-station`)).toHaveValue("Grill");
    expect(screen.getByTestId(`${testId}-diningCommonsCode`)).toHaveValue(
      "carrillo",
    );
  });

  test("Cancel navigates back", async () => {
    renderForm();

    fireEvent.click(screen.getByTestId(`${testId}-cancel`));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });
  });

  test("validates required fields", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Dining Commons Code is required."),
    ).toBeInTheDocument();

    expect(screen.getByText("Name is required.")).toBeInTheDocument();

    expect(screen.getByText("Station is required.")).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("submits valid form data", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.change(screen.getByTestId(`${testId}-diningCommonsCode`), {
      target: { value: "carrillo" },
    });

    fireEvent.change(screen.getByTestId(`${testId}-name`), {
      target: { value: "Grilled Chicken" },
    });

    fireEvent.change(screen.getByTestId(`${testId}-station`), {
      target: { value: "Grill" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        {
          diningCommonsCode: "carrillo",
          name: "Grilled Chicken",
          station: "Grill",
        },
        expect.anything(),
      );
    });
  });
});
