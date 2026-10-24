import { Button, Form, Row, Col } from "react-bootstrap";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";

function UCSBOrganizationForm({
  initialContents,
  submitAction,
  buttonLabel = "Create",
}) {
  // Stryker disable all
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({ defaultValues: initialContents || {} });
  // Stryker restore all

  const navigate = useNavigate();
  const testIdPrefix = "UCSBOrganizationForm";

  return (
    <Form onSubmit={handleSubmit(submitAction)}>
      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="orgCode">Organization Code</Form.Label>
            <Form.Control
              data-testid={`${testIdPrefix}-orgCode`}
              id="orgCode"
              type="text"
              isInvalid={Boolean(errors.orgCode)}
              readOnly={Boolean(initialContents)}
              {...register("orgCode", {
                required: "Organization Code is required.",
                maxLength: {
                  value: 10,
                  message: "Max length 10 characters",
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.orgCode?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="orgTranslationShort">
              Short Name
            </Form.Label>
            <Form.Control
              data-testid={`${testIdPrefix}-orgTranslationShort`}
              id="orgTranslationShort"
              type="text"
              isInvalid={Boolean(errors.orgTranslationShort)}
              {...register("orgTranslationShort", {
                required: "Short Name is required.",
                maxLength: {
                  value: 30,
                  message: "Max length 30 characters",
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.orgTranslationShort?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="orgTranslation">Full Name</Form.Label>
            <Form.Control
              data-testid={`${testIdPrefix}-orgTranslation`}
              id="orgTranslation"
              type="text"
              isInvalid={Boolean(errors.orgTranslation)}
              {...register("orgTranslation", {
                required: "Full Name is required.",
                maxLength: {
                  value: 100,
                  message: "Max length 100 characters",
                },
              })}
            />
            <Form.Control.Feedback type="invalid">
              {errors.orgTranslation?.message}
            </Form.Control.Feedback>
          </Form.Group>
        </Col>

        <Col>
          <Form.Group className="mb-3">
            <Form.Check
              data-testid={`${testIdPrefix}-inactive`}
              id="inactive"
              type="checkbox"
              label="Inactive"
              {...register("inactive")}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button type="submit" data-testid={`${testIdPrefix}-submit`}>
            {buttonLabel}
          </Button>
          <Button
            variant="Secondary"
            onClick={() => navigate(-1)}
            data-testid={`${testIdPrefix}-cancel`}
          >
            Cancel
          </Button>
        </Col>
      </Row>
    </Form>
  );
}

export default UCSBOrganizationForm;