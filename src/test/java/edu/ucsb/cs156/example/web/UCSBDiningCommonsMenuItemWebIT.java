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
public class UCSBDiningCommonsMenuItemWebIT extends WebTestCase {

  @Test
  public void admin_user_can_create_menu_item() throws Exception {

    // Arrange: log in as admin
    setupUser(true);

    // Navigate to the Menu Items page
    page.navigate("http://localhost:8080/diningcommonsmenuitem");

    // Click Create Menu Item
    page.getByText("Create Menu Item").click();

    // Verify Create page
    assertThat(page.getByText("Create New Dining Commons Menu Item")).isVisible();

    // Fill in the form
    page.getByTestId("UCSBDiningCommonsMenuItemForm-diningCommonsCode").fill("ortega");

    page.getByTestId("UCSBDiningCommonsMenuItemForm-name").fill("Pizza");

    page.getByTestId("UCSBDiningCommonsMenuItemForm-station").fill("Main");

    // Submit
    page.getByTestId("UCSBDiningCommonsMenuItemForm-submit").click();

    // Verify that the new menu item appears in the table
    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-name"))
        .hasText("Pizza");

    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-diningCommonsCode"))
        .hasText("ortega");

    assertThat(page.getByTestId("UCSBDiningCommonsMenuItemTable-cell-row-0-col-station"))
        .hasText("Main");
  }
}
