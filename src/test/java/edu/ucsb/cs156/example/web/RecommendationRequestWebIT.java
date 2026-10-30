package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

import com.microsoft.playwright.Page;
import edu.ucsb.cs156.example.WebTestCase;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringExtension;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
@ActiveProfiles("integration")
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class RecommendationRequestWebIT extends WebTestCase {
  @Test
  public void admin_user_can_create_edit_delete_recommendation_request() throws Exception {
    setupUser(true);

    page.getByText("RecommendationRequest", new Page.GetByTextOptions().setExact(true)).click();

    page.getByText("Create RecommendationRequest").click();
    assertThat(page.getByText("Create New RecommendationRequest")).isVisible();
    page.getByTestId("RecommendationRequestForm-requesterEmail").fill("cgaucho@ucsb.edu");
    page.getByTestId("RecommendationRequestForm-professorEmail").fill("phtcon@ucsb.edu");
    page.getByTestId("RecommendationRequestForm-explanation").fill("BS/MS program");
    page.getByTestId("RecommendationRequestForm-dateRequested").fill("2022-04-20T00:00");
    page.getByTestId("RecommendationRequestForm-dateNeeded").fill("2022-05-01T00:00");
    page.getByTestId("RecommendationRequestForm-submit").click();

    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-requesterEmail"))
        .hasText("cgaucho@ucsb.edu");
    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-explanation"))
        .hasText("BS/MS program");

    page.getByTestId("RecommendationRequestTable-cell-row-0-col-Edit-button").click();
    assertThat(page.getByText("Edit RecommendationRequest")).isVisible();
    page.getByTestId("RecommendationRequestForm-explanation").fill("PhD CS Stanford");
    page.getByTestId("RecommendationRequestForm-submit").click();

    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-explanation"))
        .hasText("PhD CS Stanford");

    page.getByTestId("RecommendationRequestTable-cell-row-0-col-Delete-button").click();

    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-requesterEmail"))
        .not()
        .isVisible();
  }

  @Test
  public void regular_user_cannot_create_recommendation_request() throws Exception {
    setupUser(false);

    page.getByText("RecommendationRequest", new Page.GetByTextOptions().setExact(true)).click();

    assertThat(page.getByText("Create RecommendationRequest")).not().isVisible();
    assertThat(page.getByTestId("RecommendationRequestTable-cell-row-0-col-requesterEmail"))
        .not()
        .isVisible();
  }
}
