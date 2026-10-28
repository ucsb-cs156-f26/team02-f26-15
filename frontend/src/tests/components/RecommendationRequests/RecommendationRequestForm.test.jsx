import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import RecommendationRequestForm from "main/components/RecommendationRequests/RecommendationRequestForm";
import { recommendationRequestFixtures } from "fixtures/recommendationRequestFixtures";
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

describe("RecommendationRequestForm tests", () => {
  const testId = "RecommendationRequestForm";

  test("renders correctly", async () => {
    render(
      <Router>
        <RecommendationRequestForm />
      </Router>,
    );
    await screen.findByText(/Requester Email/);
    expect(screen.getByText(/Professor Email/)).toBeInTheDocument();
    expect(screen.getByText(/Explanation/)).toBeInTheDocument();
    expect(screen.getByText(/Date Requested/)).toBeInTheDocument();
    expect(screen.getByText(/Date Needed/)).toBeInTheDocument();
    expect(screen.getByText(/Done/)).toBeInTheDocument();
    expect(screen.getByText(/Create/)).toBeInTheDocument();
    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();
  });

  test("renders correctly when passing in a RecommendationRequest", async () => {
    render(
      <Router>
        <RecommendationRequestForm
          initialContents={
            recommendationRequestFixtures.oneRecommendationRequest
          }
          buttonLabel="Update"
        />
      </Router>,
    );
    await screen.findByTestId(`${testId}-id`);
    expect(screen.getByText(/Id/)).toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-id`)).toHaveValue("1");
    expect(screen.getByTestId(`${testId}-requesterEmail`)).toHaveValue(
      "cgaucho@ucsb.edu",
    );
    expect(screen.getByText(/Update/)).toBeInTheDocument();
  });

  test("Correct error messages on missing input", async () => {
    render(
      <Router>
        <RecommendationRequestForm />
      </Router>,
    );
    await screen.findByTestId(`${testId}-submit`);
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await screen.findByText(/Requester Email is required./);
    expect(
      screen.getByText(/Professor Email is required./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Explanation is required./)).toBeInTheDocument();
    expect(screen.getByText(/Date Requested is required./)).toBeInTheDocument();
    expect(screen.getByText(/Date Needed is required./)).toBeInTheDocument();

    expect(screen.getByTestId(`${testId}-requesterEmail`)).toHaveClass(
      "is-invalid",
    );
    expect(screen.getByTestId(`${testId}-professorEmail`)).toHaveClass(
      "is-invalid",
    );
    expect(screen.getByTestId(`${testId}-explanation`)).toHaveClass(
      "is-invalid",
    );
    expect(screen.getByTestId(`${testId}-dateRequested`)).toHaveClass(
      "is-invalid",
    );
    expect(screen.getByTestId(`${testId}-dateNeeded`)).toHaveClass(
      "is-invalid",
    );
  });

  test("No error messages on good input, and submit is called with values", async () => {
    const mockSubmitAction = vi.fn();

    render(
      <Router>
        <RecommendationRequestForm submitAction={mockSubmitAction} />
      </Router>,
    );
    await screen.findByTestId(`${testId}-requesterEmail`);

    fireEvent.change(screen.getByTestId(`${testId}-requesterEmail`), {
      target: { value: "cgaucho@ucsb.edu" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-professorEmail`), {
      target: { value: "phtcon@ucsb.edu" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
      target: { value: "BS/MS program" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-dateRequested`), {
      target: { value: "2022-04-20T00:00" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-dateNeeded`), {
      target: { value: "2022-05-01T00:00" },
    });
    fireEvent.click(screen.getByTestId(`${testId}-done`));
    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => expect(mockSubmitAction).toHaveBeenCalled());
    expect(mockSubmitAction).toHaveBeenCalledWith(
      expect.objectContaining({
        requesterEmail: "cgaucho@ucsb.edu",
        professorEmail: "phtcon@ucsb.edu",
        explanation: "BS/MS program",
        dateRequested: "2022-04-20T00:00",
        dateNeeded: "2022-05-01T00:00",
        done: true,
      }),
      expect.anything(),
    );

    expect(screen.queryByText(/is required./)).not.toBeInTheDocument();
    expect(screen.getByTestId(`${testId}-requesterEmail`)).not.toHaveClass(
      "is-invalid",
    );
  });

  test("that navigate(-1) is called when Cancel is clicked", async () => {
    render(
      <Router>
        <RecommendationRequestForm />
      </Router>,
    );
    await screen.findByTestId(`${testId}-cancel`);
    fireEvent.click(screen.getByTestId(`${testId}-cancel`));

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith(-1));
  });
});
