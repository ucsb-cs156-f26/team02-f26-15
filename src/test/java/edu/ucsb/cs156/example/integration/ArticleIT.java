package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.Articles;
import edu.ucsb.cs156.example.repositories.ArticlesRepository;
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
public class ArticleIT {

  @Autowired ArticlesRepository articlesRepository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_post_a_new_article() throws Exception {
    // arrange
    String title = "UCSB Research";
    String url = "https://www.ucsb.edu";
    String explanation = "An article about UCSB research";
    String email = "student@ucsb.edu";
    LocalDateTime dateAdded = LocalDateTime.of(2026, 10, 28, 12, 0);

    // act
    MvcResult response =
        mockMvc
            .perform(
                post("/api/articles/post")
                    .param("title", title)
                    .param("url", url)
                    .param("explanation", explanation)
                    .param("email", email)
                    .param("dateAdded", dateAdded.toString())
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    // assert: check the HTTP response
    Articles returnedArticle =
        mapper.readValue(response.getResponse().getContentAsString(), Articles.class);

    assertEquals(title, returnedArticle.getTitle());
    assertEquals(url, returnedArticle.getUrl());
    assertEquals(explanation, returnedArticle.getExplanation());
    assertEquals(email, returnedArticle.getEmail());
    assertEquals(dateAdded, returnedArticle.getDateAdded());

    // assert: check that the article was saved to the real test database
    assertEquals(1, articlesRepository.count());

    Articles savedArticle = articlesRepository.findById(returnedArticle.getId()).orElseThrow();

    assertEquals(title, savedArticle.getTitle());
    assertEquals(url, savedArticle.getUrl());
    assertEquals(explanation, savedArticle.getExplanation());
    assertEquals(email, savedArticle.getEmail());
    assertEquals(dateAdded, savedArticle.getDateAdded());
  }
}
