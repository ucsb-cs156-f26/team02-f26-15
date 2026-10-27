import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import UCSBOrganizationForm from "main/components/UCSBOrganization/UCSBOrganizationForm";
import { ucsbOrganizationFixtures } from "fixtures/ucsbOrganizationFixtures";
import { BrowserRouter as Router } from "react-router";
import { expect } from "vitest";

const mockedNavigate = vi.fn();
vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("UCSBOrganizationForm tests", () => {
  const testIdPrefix = "UCSBOrganizationForm";

  test("renders correctly with no initialContents", async () => {
    render(
      <Router>
        <UCSBOrganizationForm />
      </Router>,
    );

    await screen.findByText(/Create/);
    expect(screen.getByText(/Organization Code/)).toBeInTheDocument();
    expect(screen.getByText(/Short Name/)).toBeInTheDocument();
    expect(screen.getByText(/Full Name/)).toBeInTheDocument();
    expect(screen.getByText(/Inactive/)).toBeInTheDocument();

    // when creating, orgCode must be editable
    expect(screen.getByTestId(`${testIdPrefix}-orgCode`)).not.toHaveAttribute(
      "readonly",
    );
    expect(screen.getByTestId(`${testIdPrefix}-orgCode`)).toHaveValue("");
    expect(screen.getByTestId(`${testIdPrefix}-inactive`)).not.toBeChecked();
  });

  test("renders correctly when passing in an organization", async () => {
    render(
      <Router>
        <UCSBOrganizationForm
          initialContents={ucsbOrganizationFixtures.oneOrganization}
          buttonLabel="Update"
        />
      </Router>,
    );

    await screen.findByText(/Update/);

    const orgCodeField = screen.getByTestId(`${testIdPrefix}-orgCode`);
    expect(orgCodeField).toHaveValue("ZPR");
    expect(orgCodeField).toHaveAttribute("readonly");

    expect(
      screen.getByTestId(`${testIdPrefix}-orgTranslationShort`),
    ).toHaveValue("ZETA PHI RHO");
    expect(screen.getByTestId(`${testIdPrefix}-orgTranslation`)).toHaveValue(
      "ZETA PHI RHO",
    );
    expect(screen.getByTestId(`${testIdPrefix}-inactive`)).not.toBeChecked();
  });

  test("Correct error messages on missing input", async () => {
    render(
      <Router>
        <UCSBOrganizationForm />
      </Router>,
    );

    const submitButton = await screen.findByTestId(`${testIdPrefix}-submit`);
    fireEvent.click(submitButton);

    await screen.findByText(/Organization Code is required./);
    expect(screen.getByText(/Short Name is required./)).toBeInTheDocument();
    expect(screen.getByText(/Full Name is required./)).toBeInTheDocument();
  });

  test("Correct error messages on input that is too long", async () => {
    render(
      <Router>
        <UCSBOrganizationForm />
      </Router>,
    );

    await screen.findByTestId(`${testIdPrefix}-orgCode`);

    fireEvent.change(screen.getByTestId(`${testIdPrefix}-orgCode`), {
      target: { value: "a".repeat(11) },
    });
    fireEvent.change(
      screen.getByTestId(`${testIdPrefix}-orgTranslationShort`),
      { target: { value: "a".repeat(31) } },
    );
    fireEvent.change(screen.getByTestId(`${testIdPrefix}-orgTranslation`), {
      target: { value: "a".repeat(101) },
    });
    fireEvent.click(screen.getByTestId(`${testIdPrefix}-submit`));

    await screen.findByText(/Max length 10 characters/);
    expect(screen.getByText(/Max length 30 characters/)).toBeInTheDocument();
    expect(screen.getByText(/Max length 100 characters/)).toBeInTheDocument();
  });

  test("No error messages on good input, and submitAction is called with the data", async () => {
    const mockSubmitAction = vi.fn();

    render(
      <Router>
        <UCSBOrganizationForm submitAction={mockSubmitAction} />
      </Router>,
    );

    await screen.findByTestId(`${testIdPrefix}-orgCode`);

    fireEvent.change(screen.getByTestId(`${testIdPrefix}-orgCode`), {
      target: { value: "SKY" },
    });
    fireEvent.change(
      screen.getByTestId(`${testIdPrefix}-orgTranslationShort`),
      { target: { value: "SKY DIVING CLUB" } },
    );
    fireEvent.change(screen.getByTestId(`${testIdPrefix}-orgTranslation`), {
      target: { value: "SKY DIVING CLUB AT UCSB" },
    });
    fireEvent.click(screen.getByTestId(`${testIdPrefix}-inactive`));
    fireEvent.click(screen.getByTestId(`${testIdPrefix}-submit`));

    await waitFor(() => expect(mockSubmitAction).toHaveBeenCalled());

    expect(mockSubmitAction).toHaveBeenCalledWith(
      {
        orgCode: "SKY",
        orgTranslationShort: "SKY DIVING CLUB",
        orgTranslation: "SKY DIVING CLUB AT UCSB",
        inactive: true,
      },
      expect.anything(),
    );

    expect(screen.queryByText(/is required/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Max length/)).not.toBeInTheDocument();
  });

  test("that navigate(-1) is called when Cancel is clicked", async () => {
    render(
      <Router>
        <UCSBOrganizationForm />
      </Router>,
    );

    const cancelButton = await screen.findByTestId(`${testIdPrefix}-cancel`);
    fireEvent.click(cancelButton);

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith(-1));
  });
});
