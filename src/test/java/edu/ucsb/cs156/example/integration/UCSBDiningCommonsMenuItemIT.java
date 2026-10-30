package edu.ucsb.cs156.example.integration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.fasterxml.jackson.databind.ObjectMapper;
import edu.ucsb.cs156.example.entities.UCSBDiningCommonsMenuItem;
import edu.ucsb.cs156.example.repositories.UCSBDiningCommonsMenuItemRepository;
import edu.ucsb.cs156.example.repositories.UserRepository;
import edu.ucsb.cs156.example.testconfig.TestConfig;
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
public class UCSBDiningCommonsMenuItemIT {

  @Autowired UCSBDiningCommonsMenuItemRepository repository;

  @Autowired MockMvc mockMvc;

  @Autowired ObjectMapper mapper;

  @MockitoBean UserRepository userRepository;

  @WithMockUser(roles = {"ADMIN", "USER"})
  @Test
  public void an_admin_can_post_a_new_menu_item() throws Exception {

    // Arrange
    String diningCommonsCode = "ortega";
    String name = "Pizza";
    String station = "Main";

    long countBefore = repository.count();

    // Act
    MvcResult response =
        mockMvc
            .perform(
                post("/api/ucsbdiningcommonsmenuitems/post")
                    .param("diningCommonsCode", diningCommonsCode)
                    .param("name", name)
                    .param("station", station)
                    .with(csrf()))
            .andExpect(status().isOk())
            .andReturn();

    // Assert
    String responseString = response.getResponse().getContentAsString();

    UCSBDiningCommonsMenuItem createdItem =
        mapper.readValue(responseString, UCSBDiningCommonsMenuItem.class);

    assertEquals(diningCommonsCode, createdItem.getDiningCommonsCode());
    assertEquals(name, createdItem.getName());
    assertEquals(station, createdItem.getStation());

    assertEquals(countBefore + 1, repository.count());

    assertTrue(repository.findById(createdItem.getId()).isPresent());

    UCSBDiningCommonsMenuItem savedItem = repository.findById(createdItem.getId()).orElseThrow();

    assertEquals(name, savedItem.getName());
    assertEquals(station, savedItem.getStation());
    assertEquals(diningCommonsCode, savedItem.getDiningCommonsCode());
  }
}
