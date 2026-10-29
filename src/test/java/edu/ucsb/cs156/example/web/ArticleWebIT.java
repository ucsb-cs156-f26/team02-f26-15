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
public class ArticleWebIT extends WebTestCase {

  @Test
  public void admin_user_can_create_article() throws Exception {
    // Log in as an administrator
    setupUser(true);

    // Navigate to the Articles page
    page.navigate("http://localhost:8080/articles");

    // Open the Create Article form
    page.getByText("Create Article").click();
    assertThat(page.getByText("Create New Article")).isVisible();

    // Fill out the form
    page.getByTestId("ArticlesForm-title").fill("UCSB Research");
    page.getByTestId("ArticlesForm-url").fill("https://www.ucsb.edu");
    page.getByTestId("ArticlesForm-explanation").fill("An article about UCSB research");
    page.getByTestId("ArticlesForm-email").fill("student@ucsb.edu");
    page.getByTestId("ArticlesForm-dateAdded").fill("2026-10-28T12:00");

    // Submit the form
    page.getByTestId("ArticlesForm-submit").click();

    // Verify the article appears in the Articles table
    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-title")).hasText("UCSB Research");

    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-url"))
        .hasText("https://www.ucsb.edu");

    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-explanation"))
        .hasText("An article about UCSB research");

    assertThat(page.getByTestId("ArticlesTable-cell-row-0-col-email")).hasText("student@ucsb.edu");
  }
}
