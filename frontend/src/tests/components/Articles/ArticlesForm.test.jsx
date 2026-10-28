import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter as Router } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ArticlesForm from "main/components/Articles/ArticlesForm";
import { articlesFixtures } from "fixtures/articlesFixtures";

const mockedNavigate = vi.fn();

vi.mock("react-router", async () => {
  const originalModule = await vi.importActual("react-router");
  return {
    ...originalModule,
    useNavigate: () => mockedNavigate,
  };
});

describe("ArticlesForm tests", () => {
  const queryClient = new QueryClient();
  const testId = "ArticlesForm";

  const expectedHeaders = [
    "Title",
    "URL",
    "Explanation",
    "Email",
    "Date Added",
  ];

  const renderForm = (props = {}) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <Router>
          <ArticlesForm {...props} />
        </Router>
      </QueryClientProvider>,
    );
  };

  test("renders correctly with no initialContents", () => {
    renderForm();

    expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent("Create");

    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument();
    });

    expect(screen.queryByTestId(`${testId}-id`)).not.toBeInTheDocument();
  });

  test("renders correctly with initialContents", () => {
    renderForm({
      initialContents: articlesFixtures.oneArticle,
      buttonLabel: "Update",
    });

    expect(screen.getByTestId(`${testId}-submit`)).toHaveTextContent("Update");

    const idInput = screen.getByTestId(`${testId}-id`);
    expect(idInput).toBeDisabled();
    expect(idInput).toHaveValue("1");

    expect(screen.getByTestId(`${testId}-title`)).toHaveValue(
      "UCSB Research News",
    );
    expect(screen.getByTestId(`${testId}-url`)).toHaveValue(
      "https://news.ucsb.edu",
    );
    expect(screen.getByTestId(`${testId}-email`)).toHaveValue(
      "student@ucsb.edu",
    );
    expect(screen.getByTestId(`${testId}-dateAdded`)).toHaveValue(
      "2026-10-22T15:48",
    );
  });

  test("Cancel navigates back", async () => {
    mockedNavigate.mockClear();
    renderForm();

    fireEvent.click(screen.getByTestId(`${testId}-cancel`));

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith(-1);
    });
  });

  test("requires all fields", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("URL is required.")).toBeInTheDocument();
    expect(screen.getByText("Explanation is required.")).toBeInTheDocument();
    expect(screen.getByText("Email is required.")).toBeInTheDocument();
    expect(screen.getByText("Date Added is required.")).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("rejects a blank title and explanation", async () => {
    renderForm({ submitAction: vi.fn() });

    fireEvent.change(screen.getByTestId(`${testId}-title`), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
      target: { value: "   " },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Title cannot be blank."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Explanation cannot be blank."),
    ).toBeInTheDocument();
  });

  test("rejects invalid URL and email values", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    fireEvent.change(screen.getByTestId(`${testId}-url`), {
      target: { value: "not-a-url" },
    });

    fireEvent.change(screen.getByTestId(`${testId}-email`), {
      target: { value: "not-an-email" },
    });

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    expect(
      await screen.findByText("Enter a valid HTTP or HTTPS URL."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Enter a valid email address."),
    ).toBeInTheDocument();

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("rejects URLs and emails with invalid prefixes and suffixes", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    const urlInput = screen.getByTestId(`${testId}-url`);
    const emailInput = screen.getByTestId(`${testId}-email`);
    const submitButton = screen.getByTestId(`${testId}-submit`);

    const invalidUrls = [
      "prefixhttps://example.com",
      "https://example.com trailing",
      "ftp://example.com",
    ];

    for (const url of invalidUrls) {
      fireEvent.change(urlInput, { target: { value: url } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText("Enter a valid HTTP or HTTPS URL."),
      ).toBeInTheDocument();
    }

    const invalidEmails = [
      "prefix student@example.com",
      "student@example.com suffix",
    ];

    for (const email of invalidEmails) {
      fireEvent.change(emailInput, { target: { value: email } });
      fireEvent.click(submitButton);

      expect(
        await screen.findByText("Enter a valid email address."),
      ).toBeInTheDocument();
    }

    expect(submitAction).not.toHaveBeenCalled();
  });

  test("submits valid article data", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    const article = articlesFixtures.oneArticle;

    for (const field of ["title", "url", "explanation", "email", "dateAdded"]) {
      fireEvent.change(screen.getByTestId(`${testId}-${field}`), {
        target: { value: article[field] },
      });
    }

    fireEvent.click(screen.getByTestId(`${testId}-submit`));

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          title: article.title,
          url: article.url,
          explanation: article.explanation,
          email: article.email,
        }),
        expect.anything(),
      );
    });
  });

  test("validates URL and email endings and accepts HTTP URLs", async () => {
    const submitAction = vi.fn();
    renderForm({ submitAction });

    const urlInput = screen.getByTestId(`${testId}-url`);
    const emailInput = screen.getByTestId(`${testId}-email`);
    const submitButton = screen.getByTestId(`${testId}-submit`);

    // A URL must not contain a trailing space
    fireEvent.change(urlInput, {
      target: { value: "https://example.com trailing" },
    });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Enter a valid HTTP or HTTPS URL."),
    ).toBeInTheDocument();

    // An email must not contain a trailing space
    fireEvent.change(urlInput, {
      target: { value: "https://example.com" },
    });
    fireEvent.change(emailInput, {
      target: { value: "student@example.com suffix" },
    });
    fireEvent.click(submitButton);

    expect(
      await screen.findByText("Enter a valid email address."),
    ).toBeInTheDocument();

    // HTTP (not only HTTPS) must be accepted
    fireEvent.change(urlInput, {
      target: { value: "http://example.com" },
    });
    fireEvent.change(emailInput, {
      target: { value: "student@example.com" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-title`), {
      target: { value: "Test Article" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-explanation`), {
      target: { value: "A valid explanation" },
    });
    fireEvent.change(screen.getByTestId(`${testId}-dateAdded`), {
      target: { value: "2026-10-22T15:48" },
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitAction).toHaveBeenCalledWith(
        expect.objectContaining({
          url: "http://example.com",
          email: "student@example.com",
        }),
        expect.anything(),
      );
    });
  });
});
