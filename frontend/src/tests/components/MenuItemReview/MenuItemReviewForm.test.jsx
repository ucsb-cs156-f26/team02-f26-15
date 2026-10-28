import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";

const validReview = {
  itemId: 7,
  reviewerEmail: "reviewer@example.com",
  stars: 4,
  dateReviewed: "2026-10-27T15:30:15.000",
  comments: "Fresh and tasty",
};

function renderForm(props = {}) {
  const submitAction = vi.fn();
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={["/previous", "/form"]} initialIndex={1}>
      <Routes>
        <Route path="/previous" element={<h1>Previous page</h1>} />
        <Route
          path="/form"
          element={
            <MenuItemReviewForm submitAction={submitAction} {...props} />
          }
        />
      </Routes>
    </MemoryRouter>,
  );
  return { submitAction, user };
}

function fillReview(values = validReview) {
  for (const [field, value] of Object.entries(values)) {
    fireEvent.change(screen.getByTestId(`MenuItemReviewForm-${field}`), {
      target: { value: String(value) },
    });
  }
}

describe("MenuItemReviewForm", () => {
  test("shows labelled empty create controls and appropriate input types", () => {
    renderForm();
    expect(screen.queryByLabelText("ID")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toHaveAttribute(
      "type",
      "submit",
    );
    expect(screen.getByRole("button", { name: "Cancel" })).toHaveAttribute(
      "type",
      "button",
    );
    const controls = [
      ["Menu item ID", "itemId", "number", null],
      ["Reviewer email", "reviewerEmail", "email", ""],
      ["Stars", "stars", "number", null],
      ["Date reviewed", "dateReviewed", "datetime-local", ""],
    ];
    for (const [label, field, type, value] of controls) {
      const control = screen.getByLabelText(label);
      expect(control).toBe(screen.getByTestId(`MenuItemReviewForm-${field}`));
      expect(control).toHaveAttribute("type", type);
      expect(control).toHaveValue(value);
      expect(control).not.toHaveClass("is-invalid");
    }
    const comments = screen.getByLabelText("Comments");
    expect(comments).toBe(screen.getByTestId("MenuItemReviewForm-comments"));
    expect(comments.tagName).toBe("TEXTAREA");
    expect(comments).toHaveValue("");
    expect(comments).not.toHaveClass("is-invalid");
    expect(screen.getByLabelText("Menu item ID")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText("Menu item ID")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Stars")).toHaveAttribute("min", "0");
    expect(screen.getByLabelText("Stars")).toHaveAttribute("max", "5");
    expect(screen.getByLabelText("Stars")).toHaveAttribute("step", "1");
    expect(screen.getByLabelText("Date reviewed")).toHaveAttribute("step", "1");
    expect(
      screen.getByLabelText("Menu item ID").closest("form"),
    ).toHaveAttribute("novalidate");
  });

  test("submits all create values with numeric IDs and ratings", async () => {
    const { submitAction, user } = renderForm();
    fillReview();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(validReview);
  });

  test("prefills edit fields, preserves the read-only ID, and submits edits", async () => {
    const initialContents = menuItemReviewFixtures.oneMenuItemReview;
    const originalContents = { ...initialContents };
    const { submitAction, user } = renderForm({
      initialContents,
      buttonLabel: "Save changes",
    });
    const id = screen.getByLabelText("ID");
    expect(id).toBe(screen.getByTestId("MenuItemReviewForm-id"));
    expect(id).toHaveValue(1);
    expect(id).toHaveAttribute("readonly");
    expect(id).toBeEnabled();
    expect(screen.getByLabelText("Menu item ID")).toHaveValue(7);
    expect(screen.getByLabelText("Reviewer email")).toHaveValue(
      "first@example.com",
    );
    expect(screen.getByLabelText("Stars")).toHaveValue(5);
    expect(screen.getByLabelText("Date reviewed")).toHaveValue(
      "2026-10-20T18:00",
    );
    expect(screen.getByLabelText("Comments")).toHaveValue("Fresh and tasty");
    await user.type(id, "999");
    expect(id).toHaveValue(1);
    const edited = {
      ...validReview,
      itemId: 12,
      stars: 3,
      comments: "Updated review",
    };
    fillReview(edited);
    await user.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual({ ...edited, id: 1 });
    expect(initialContents).toEqual(originalContents);
  });

  test("shows every required error and blocks an empty submission", async () => {
    const { submitAction, user } = renderForm();
    await user.click(screen.getByRole("button", { name: "Create" }));
    for (const message of [
      "Menu item ID is required.",
      "Reviewer email is required.",
      "Stars are required.",
      "Date reviewed is required.",
      "Comments are required.",
    ]) {
      expect(await screen.findByText(message)).toBeVisible();
    }
    for (const field of Object.keys(validReview)) {
      expect(screen.getByTestId(`MenuItemReviewForm-${field}`)).toHaveClass(
        "is-invalid",
      );
    }
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each(["0", "-1", "1.5", "9007199254740992"])(
    "rejects invalid menu item ID %s",
    async (itemId) => {
      const { submitAction, user } = renderForm();
      fillReview({ ...validReview, itemId });
      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(
        await screen.findByText(
          "Menu item ID must be a positive whole number.",
        ),
      ).toBeVisible();
      expect(submitAction).not.toHaveBeenCalled();
    },
  );

  test.each([-1, 6, 2.5])("rejects invalid star rating %s", async (stars) => {
    const { submitAction, user } = renderForm();
    fillReview({ ...validReview, stars });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Stars must be a whole number from 0 to 5."),
    ).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each([0, 5])("accepts the star rating boundary %s", async (stars) => {
    const { submitAction, user } = renderForm();
    const expected = { ...validReview, itemId: 1, stars };
    fillReview(expected);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(expected);
  });

  test.each([
    "missing-at.example.com",
    "first@example",
    "@example.com",
    "first@.com",
    "first@example.",
    "first@@example.com",
    "first@exam@ple.com",
    "first@example.c@om",
    "first name@example.com",
    "first@exam ple.com",
    "first@example.c om",
    "prefix first@example.com",
    "first@example.com suffix",
  ])("rejects malformed email %s", async (reviewerEmail) => {
    const { submitAction, user } = renderForm();
    fillReview({ ...validReview, reviewerEmail });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Enter a valid reviewer email."),
    ).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("normalizes surrounding whitespace using the email input before submission", async () => {
    const { submitAction, user } = renderForm();
    fillReview({ ...validReview, reviewerEmail: "  reviewer@example.com  " });
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(validReview);
  });

  test("rejects an email that exceeds the database column limit", async () => {
    const { submitAction, user } = renderForm();
    fillReview({
      ...validReview,
      reviewerEmail: "a".repeat(244) + "@example.com",
    });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Reviewer email must be at most 255 characters."),
    ).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test.each(["   ", "\t\n"])(
    "rejects whitespace-only comments %j",
    async (comments) => {
      const { submitAction, user } = renderForm();
      fillReview({ ...validReview, comments });
      await user.click(screen.getByRole("button", { name: "Create" }));
      expect(
        await screen.findByText("Comments cannot be blank."),
      ).toBeVisible();
      expect(submitAction).not.toHaveBeenCalled();
    },
  );

  test("rejects comments that exceed the database column limit", async () => {
    const { submitAction, user } = renderForm();
    fillReview({ ...validReview, comments: "a".repeat(256) });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(
      await screen.findByText("Comments must be at most 255 characters."),
    ).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("accepts both string fields at their exact database length limit", async () => {
    const { submitAction, user } = renderForm();
    const expected = {
      ...validReview,
      reviewerEmail: "a".repeat(243) + "@example.com",
      comments: "a".repeat(255),
    };
    fillReview(expected);
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(expected);
  });

  test("blocks a malformed date rejected by the native date/time control", async () => {
    const { submitAction, user } = renderForm();
    fillReview({ ...validReview, dateReviewed: "2026-02-30T15:00" });
    await user.click(screen.getByRole("button", { name: "Create" }));
    expect(await screen.findByText("Date reviewed is required.")).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });

  test("clears validation errors after correction and then submits", async () => {
    const { submitAction, user } = renderForm();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await screen.findByText("Stars are required.");
    fillReview();
    await user.click(screen.getByRole("button", { name: "Create" }));
    await waitFor(() => expect(submitAction).toHaveBeenCalledTimes(1));
    expect(submitAction.mock.calls[0][0]).toEqual(validReview);
    expect(
      screen.queryByText(/is required\.|are required\./),
    ).not.toBeInTheDocument();
    for (const field of Object.keys(validReview)) {
      expect(screen.getByTestId(`MenuItemReviewForm-${field}`)).not.toHaveClass(
        "is-invalid",
      );
    }
  });

  test("cancel returns to the previous route without submitting even a valid form", async () => {
    const { submitAction, user } = renderForm();
    fillReview();
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      await screen.findByRole("heading", { name: "Previous page" }),
    ).toBeVisible();
    expect(submitAction).not.toHaveBeenCalled();
  });
});
