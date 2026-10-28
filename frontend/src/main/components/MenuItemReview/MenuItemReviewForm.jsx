import { Button, Form } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function MenuItemReviewForm({
  initialContents,
  submitAction,
  buttonLabel = "Create",
}) {
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({ defaultValues: initialContents });
  const navigate = useNavigate();
  const testIdPrefix = "MenuItemReviewForm";

  return (
    <Form noValidate onSubmit={handleSubmit(submitAction)}>
      {initialContents && (
        <Form.Group className="mb-3">
          <Form.Label htmlFor="id">ID</Form.Label>
          <Form.Control
            data-testid={testIdPrefix + "-id"}
            id="id"
            type="number"
            readOnly
            {...register("id", { valueAsNumber: true })}
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label htmlFor="itemId">Menu item ID</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-itemId"}
          id="itemId"
          type="number"
          min="1"
          step="1"
          isInvalid={Boolean(errors.itemId)}
          {...register("itemId", {
            required: "Menu item ID is required.",
            valueAsNumber: true,
            validate: (value) =>
              (Number.isSafeInteger(value) && value > 0) ||
              "Menu item ID must be a positive whole number.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.itemId?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="reviewerEmail">Reviewer email</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-reviewerEmail"}
          id="reviewerEmail"
          type="email"
          isInvalid={Boolean(errors.reviewerEmail)}
          {...register("reviewerEmail", {
            required: "Reviewer email is required.",
            maxLength: {
              value: 255,
              message: "Reviewer email must be at most 255 characters.",
            },
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: "Enter a valid reviewer email.",
            },
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.reviewerEmail?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="stars">Stars</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-stars"}
          id="stars"
          type="number"
          min="0"
          max="5"
          step="1"
          isInvalid={Boolean(errors.stars)}
          {...register("stars", {
            required: "Stars are required.",
            valueAsNumber: true,
            validate: (value) =>
              (Number.isInteger(value) && value >= 0 && value <= 5) ||
              "Stars must be a whole number from 0 to 5.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.stars?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="dateReviewed">Date reviewed</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-dateReviewed"}
          id="dateReviewed"
          type="datetime-local"
          step="1"
          isInvalid={Boolean(errors.dateReviewed)}
          {...register("dateReviewed", {
            required: "Date reviewed is required.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.dateReviewed?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="comments">Comments</Form.Label>
        <Form.Control
          data-testid={testIdPrefix + "-comments"}
          id="comments"
          as="textarea"
          rows={3}
          isInvalid={Boolean(errors.comments)}
          {...register("comments", {
            required: "Comments are required.",
            maxLength: {
              value: 255,
              message: "Comments must be at most 255 characters.",
            },
            validate: (value) =>
              value.trim().length > 0 || "Comments cannot be blank.",
          })}
        />
        <Form.Control.Feedback type="invalid">
          {errors.comments?.message}
        </Form.Control.Feedback>
      </Form.Group>

      <Button type="submit">{buttonLabel}</Button>
      <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
        Cancel
      </Button>
    </Form>
  );
}

export default MenuItemReviewForm;
