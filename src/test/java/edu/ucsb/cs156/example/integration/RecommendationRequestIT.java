package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.RecommendationRequest;
import edu.ucsb.cs156.example.repositories.RecommendationRequestRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.services.CurrentUserService;
import edu.ucsb.cs156.example.services.GrantedAuthoritiesService;
import edu.ucsb.cs156.example.testconfig.TestConfig;
import java.time.LocalDateTime;
import java.util.Map;
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
public class RecommendationRequestIT {
  @Autowired public CurrentUserService currentUserService;

  @Autowired public GrantedAuthoritiesService grantedAuthoritiesService;

  @Autowired RecommendationRequestRepository recommendationRequestRepository;

  @Autowired public MockMvc mockMvc;

  @Autowired public ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_post_a_new_recommendation_request() throws Exception {
    RecommendationRequest expected =
        RecommendationRequest.builder()
            .id(1L)
            .requesterEmail("cgaucho@ucsb.edu")
            .professorEmail("phtcon@ucsb.edu")
            .explanation("BS/MS program")
            .dateRequested(LocalDateTime.parse("2022-04-20T00:00:00"))
            .dateNeeded(LocalDateTime.parse("2022-05-01T00:00:00"))
            .done(false)
            .build();

    MvcResult response =
        mockMvc
            .perform(
                post("/api/recommendationrequests/post")
                    .param("requesterEmail", "cgaucho@ucsb.edu")
                    .param("professorEmail", "phtcon@ucsb.edu")
                    .param("explanation", "BS/MS program")
                    .param("dateRequested", "2022-04-20T00:00:00")
                    .param("dateNeeded", "2022-05-01T00:00:00")
                    .param("done", "false")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    assertEquals(mapper.writeValueAsString(expected), response.getResponse().getContentAsString());
    assertEquals(1, recommendationRequestRepository.count());
    assertEquals(expected, recommendationRequestRepository.findById(1L).get());
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_delete_a_recommendation_request() throws Exception {
    RecommendationRequest saved =
        recommendationRequestRepository.save(
            RecommendationRequest.builder()
                .requesterEmail("ldelplaya@ucsb.edu")
                .professorEmail("richert@ucsb.edu")
                .explanation("PhD CS Stanford")
                .dateRequested(LocalDateTime.parse("2022-05-20T00:00:00"))
                .dateNeeded(LocalDateTime.parse("2022-11-15T00:00:00"))
                .done(false)
                .build());
    long id = saved.getId();

    MvcResult response =
        mockMvc
            .perform(
                delete("/api/recommendationrequests").param("id", String.valueOf(id)).with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    Map<?, ?> json = mapper.readValue(response.getResponse().getContentAsString(), Map.class);
    assertEquals("RecommendationRequest with id %d deleted".formatted(id), json.get("message"));
    assertFalse(recommendationRequestRepository.findById(id).isPresent());
    assertEquals(0, recommendationRequestRepository.count());
  }
}
