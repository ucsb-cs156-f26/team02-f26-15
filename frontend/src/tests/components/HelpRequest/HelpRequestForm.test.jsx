import { render, waitFor, fireEvent, screen } from "@testing-library/react";
import HelpRequestForm from "main/components/HelpRequest/HelpRequestForm";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
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

describe("HelpRequestForm tests", () => {
  test("renders correctly with no initialContents", async () => {
    render(
      <Router>
        <HelpRequestForm />
      </Router>,
    );
    await screen.findByText(/Requester Email/);
    expect(screen.getByText(/Team Id/)).toBeInTheDocument();
    expect(screen.getByText(/Table Or Breakout Room/)).toBeInTheDocument();
    expect(screen.getByText(/Request Time/)).toBeInTheDocument();
    expect(screen.getByText(/Explanation/)).toBeInTheDocument();
    expect(screen.getByText(/Solved/)).toBeInTheDocument();
    expect(screen.getByText(/Create/)).toBeInTheDocument();
    expect(screen.queryByTestId("HelpRequestForm-id")).not.toBeInTheDocument();
  });

  test("renders correctly when passing in initialContents", async () => {
    render(
      <Router>
        <HelpRequestForm
          initialContents={helpRequestFixtures.oneHelpRequest[0]}
        />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-id");
    expect(screen.getByText("Id")).toBeInTheDocument();
    expect(screen.getByTestId("HelpRequestForm-id")).toHaveValue("1");
    expect(screen.getByTestId("HelpRequestForm-requesterEmail")).toHaveValue(
      "cgaucho@ucsb.edu",
    );
    expect(screen.getByTestId("HelpRequestForm-teamId")).toHaveValue(
      "s22-5pm-3",
    );
    expect(
      screen.getByTestId("HelpRequestForm-tableOrBreakoutRoom"),
    ).toHaveValue("7");
    expect(screen.getByTestId("HelpRequestForm-requestTime")).toHaveValue(
      "2022-04-20T17:35",
    );
    expect(screen.getByTestId("HelpRequestForm-explanation")).toHaveValue(
      "Need help with Swagger-ui",
    );
    expect(screen.getByTestId("HelpRequestForm-solved")).not.toBeChecked();
  });

  test("checks the solved box when the record is solved", async () => {
    render(
      <Router>
        <HelpRequestForm
          initialContents={helpRequestFixtures.threeHelpRequests[2]}
        />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-solved");
    expect(screen.getByTestId("HelpRequestForm-solved")).toBeChecked();
  });

  test("shows an error message for a bad email", async () => {
    render(
      <Router>
        <HelpRequestForm />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-requesterEmail");

    fireEvent.change(screen.getByTestId("HelpRequestForm-requesterEmail"), {
      target: { value: "not-an-email" },
    });
    fireEvent.click(screen.getByTestId("HelpRequestForm-submit"));

    await screen.findByText(/Requester Email must be a valid email address./);
    expect(
      screen.getByText(/Requester Email must be a valid email address./),
    ).toBeInTheDocument();
  });

  test("shows error messages on missing input", async () => {
    render(
      <Router>
        <HelpRequestForm />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-submit");

    fireEvent.click(screen.getByTestId("HelpRequestForm-submit"));

    await screen.findByText(/Requester Email is required./);
    expect(screen.getByText(/Team Id is required./)).toBeInTheDocument();
    expect(
      screen.getByText(/Table Or Breakout Room is required./),
    ).toBeInTheDocument();
    expect(screen.getByText(/Request Time is required./)).toBeInTheDocument();
    expect(screen.getByText(/Explanation is required./)).toBeInTheDocument();
  });

  test("calls submitAction with no error messages on good input", async () => {
    const mockSubmitAction = vi.fn();

    render(
      <Router>
        <HelpRequestForm submitAction={mockSubmitAction} />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-requesterEmail");

    fireEvent.change(screen.getByTestId("HelpRequestForm-requesterEmail"), {
      target: { value: "cgaucho@ucsb.edu" },
    });
    fireEvent.change(screen.getByTestId("HelpRequestForm-teamId"), {
      target: { value: "s22-5pm-3" },
    });
    fireEvent.change(
      screen.getByTestId("HelpRequestForm-tableOrBreakoutRoom"),
      {
        target: { value: "7" },
      },
    );
    fireEvent.change(screen.getByTestId("HelpRequestForm-requestTime"), {
      target: { value: "2022-04-20T17:35" },
    });
    fireEvent.change(screen.getByTestId("HelpRequestForm-explanation"), {
      target: { value: "Need help with Swagger-ui" },
    });
    fireEvent.click(screen.getByTestId("HelpRequestForm-solved"));
    fireEvent.click(screen.getByTestId("HelpRequestForm-submit"));

    await waitFor(() => expect(mockSubmitAction).toHaveBeenCalled());
    expect(mockSubmitAction.mock.calls[0][0]).toMatchObject({
      requesterEmail: "cgaucho@ucsb.edu",
      teamId: "s22-5pm-3",
      tableOrBreakoutRoom: "7",
      requestTime: "2022-04-20T17:35",
      explanation: "Need help with Swagger-ui",
      solved: true,
    });

    expect(screen.queryByText(/is required./)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/must be a valid email address./),
    ).not.toBeInTheDocument();
  });

  test("navigates back when Cancel is clicked", async () => {
    render(
      <Router>
        <HelpRequestForm />
      </Router>,
    );
    await screen.findByTestId("HelpRequestForm-cancel");

    fireEvent.click(screen.getByTestId("HelpRequestForm-cancel"));

    await waitFor(() => expect(mockedNavigate).toHaveBeenCalledWith(-1));
  });
});
