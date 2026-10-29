package edu.ucsb.cs156.example.web;

import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

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
public class MenuItemReviewWebIT extends WebTestCase {
  @Test
  public void admin_user_can_create_menu_item_review() throws Exception {
    // Log in and open the create form.
    setupUser(true);
    page.getByText("MenuItemReview").click();
    page.getByText("Create Menu Item Review").click();
    assertThat(page.getByText("Create New Menu Item Review")).isVisible();

    // Create a review through the real user interface.
    page.getByTestId("MenuItemReviewForm-itemId").fill("42");
    page.getByTestId("MenuItemReviewForm-reviewerEmail").fill("reviewer@example.com");
    page.getByTestId("MenuItemReviewForm-stars").fill("5");
    page.getByTestId("MenuItemReviewForm-dateReviewed").fill("2026-10-29T12:30");
    page.getByTestId("MenuItemReviewForm-comments").fill("Great pasta!");
    page.locator("button[type='submit']").click();

    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-comments"))
        .hasText("Great pasta!");

    // Reload to verify the saved review is fetched from the backend.
    page.reload();
    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-itemId")).hasText("42");
    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-reviewerEmail"))
        .hasText("reviewer@example.com");
    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-stars")).hasText("5");
    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-dateReviewed"))
        .hasText("2026-10-29T12:30:00");
    assertThat(page.getByTestId("MenuItemReviewTable-cell-row-0-col-comments"))
        .hasText("Great pasta!");
  }
}
