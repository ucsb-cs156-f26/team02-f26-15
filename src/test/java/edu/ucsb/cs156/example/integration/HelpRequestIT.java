package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.HelpRequest;
import edu.ucsb.cs156.example.repositories.HelpRequestRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.services.CurrentUserService;
import edu.ucsb.cs156.example.services.GrantedAuthoritiesService;
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
public class HelpRequestIT {
  @Autowired public CurrentUserService currentUserService;

  @Autowired public GrantedAuthoritiesService grantedAuthoritiesService;

  @Autowired HelpRequestRepository helpRequestRepository;

  @Autowired public MockMvc mockMvc;

  @Autowired public ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"USER"})
  @Test
  public void test_that_logged_in_user_can_get_by_id_when_the_id_exists() throws Exception {
    // arrange

    HelpRequest helpRequest =
        HelpRequest.builder()
            .requesterEmail("cgaucho@ucsb.edu")
            .teamId("s22-5pm-3")
            .tableOrBreakoutRoom("7")
            .requestTime(LocalDateTime.parse("2022-04-20T17:35:00"))
            .explanation("Need help with Swagger-ui")
            .solved(false)
            .build();

    helpRequestRepository.save(helpRequest);

    // act
    MvcResult response =
        mockMvc.perform(get("/api/helprequests?id=1")).andExpect(status().isOk()).andReturn();

    // assert
    String expectedJson = mapper.writeValueAsString(helpRequest);
    String responseString = response.getResponse().getContentAsString();
    assertEquals(expectedJson, responseString);
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_post_a_new_helprequest() throws Exception {
    // arrange

    HelpRequest expected =
        HelpRequest.builder()
            .id(1L)
            .requesterEmail("ldelplaya@ucsb.edu")
            .teamId("s22-6pm-4")
            .tableOrBreakoutRoom("11")
            .requestTime(LocalDateTime.parse("2022-04-20T18:31:00"))
            .explanation("Dokku deployment is failing")
            .solved(true)
            .build();

    assertEquals(0, helpRequestRepository.count());

    // act
    MvcResult response =
        mockMvc
            .perform(
                post("/api/helprequests/post")
                    .param("requesterEmail", "ldelplaya@ucsb.edu")
                    .param("teamId", "s22-6pm-4")
                    .param("tableOrBreakoutRoom", "11")
                    .param("requestTime", "2022-04-20T18:31:00")
                    .param("explanation", "Dokku deployment is failing")
                    .param("solved", "true")
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    // assert
    String expectedJson = mapper.writeValueAsString(expected);
    String responseString = response.getResponse().getContentAsString();
    assertEquals(expectedJson, responseString);

    assertEquals(1, helpRequestRepository.count());
    assertEquals(expected, helpRequestRepository.findById(1L).orElseThrow());
  }

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_user_can_delete_a_helprequest() throws Exception {
    // arrange

    HelpRequest helpRequest =
        HelpRequest.builder()
            .requesterEmail("alovelace@ucsb.edu")
            .teamId("s22-6pm-1")
            .tableOrBreakoutRoom("5")
            .requestTime(LocalDateTime.parse("2022-04-21T18:15:00"))
            .explanation("Merge conflict on main")
            .solved(false)
            .build();

    helpRequestRepository.save(helpRequest);

    assertEquals(1, helpRequestRepository.count());
    assertTrue(helpRequestRepository.findById(1L).isPresent());

    // act
    mockMvc
        .perform(delete("/api/helprequests?id=1").with(csrf()))
        .andExpect(status().isOk())
        .andReturn();

    // assert
    assertEquals(0, helpRequestRepository.count());
    assertTrue(helpRequestRepository.findById(1L).isEmpty());
  }
}
