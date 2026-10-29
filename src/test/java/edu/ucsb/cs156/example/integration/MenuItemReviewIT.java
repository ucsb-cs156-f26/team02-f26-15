package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.MenuItemReview;
import edu.ucsb.cs156.example.repositories.MenuItemReviewRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.annotation.DirtiesContext.ClassMode;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@ExtendWith(SpringExtension.class)
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
@Import(TestConfig.class)
@DirtiesContext(classMode = ClassMode.BEFORE_EACH_TEST_METHOD)
public class MenuItemReviewIT {
  @Autowired MenuItemReviewRepository menuItemReviewRepository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_post_a_new_menu_item_review() throws Exception {
    // arrange
    MenuItemReview expectedReview =
        MenuItemReview.builder()
            .itemId(42L)
            .reviewerEmail("reviewer@example.com")
            .stars(5)
            .dateReviewed(LocalDateTime.parse("2026-10-29T12:30:00"))
            .comments("Great pasta!")
            .build();
    assertEquals(0L, menuItemReviewRepository.count());

    // act
    MvcResult response =
        mockMvc
            .perform(
                post("/api/MenuItemReview/post")
                    .param("itemId", "42")
                    .param("reviewerEmail", "reviewer@example.com")
                    .param("stars", "5")
                    .param("dateReviewed", "2026-10-29T12:30:00")
                    .param("comments", "Great pasta!")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    // assert
    MenuItemReview createdReview =
        mapper.readValue(response.getResponse().getContentAsString(), MenuItemReview.class);
    assertTrue(createdReview.getId() > 0);
    expectedReview.setId(createdReview.getId());
    assertEquals(expectedReview, createdReview);
    assertEquals(1L, menuItemReviewRepository.count());

    MenuItemReview savedReview =
        menuItemReviewRepository.findById(createdReview.getId()).orElseThrow();
    assertEquals(expectedReview, savedReview);
  }
}
