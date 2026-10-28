import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

import HelpRequestCreatePage from "main/pages/HelpRequest/HelpRequestCreatePage";

export default {
  title: "pages/HelpRequest/HelpRequestCreatePage",
  component: HelpRequestCreatePage,
};

const Template = () => <HelpRequestCreatePage storybook={true} />;

export const Default = Template.bind({});

Default.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.userOnly, {
        status: 200,
      });
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither, {
        status: 200,
      });
    }),
    http.post("/api/helprequests/post", () => {
      return HttpResponse.json(
        {
          id: 1,
          requesterEmail: "cgaucho@ucsb.edu",
          teamId: "s22-5pm-3",
          tableOrBreakoutRoom: "7",
          requestTime: "2022-04-20T17:35",
          explanation: "Need help with Swagger-ui",
          solved: false,
        },
        { status: 202 },
      );
    }),
  ],
};
