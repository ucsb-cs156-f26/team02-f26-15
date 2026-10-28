import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { ucsbdiningcommonsmenuitemFixtures } from "fixtures/ucsbdiningcommonsmenuitemFixtures";
import { http, HttpResponse } from "msw";

import UCSBDiningCommonsMenuItemEditPage from "main/pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemEditPage";

export default {
  title: "pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemEditPage",
  component: UCSBDiningCommonsMenuItemEditPage,
};

const Template = () => <UCSBDiningCommonsMenuItemEditPage storybook={true} />;

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

    http.get("/api/ucsbdiningcommonsmenuitems", () => {
      return HttpResponse.json(
        ucsbdiningcommonsmenuitemFixtures.oneMenuItem[0],
        { status: 200 },
      );
    }),

    http.put("/api/ucsbdiningcommonsmenuitems", async ({ request }) => {
      const data = await request.json();

      return HttpResponse.json(
        {
          ...data,
          id: ucsbdiningcommonsmenuitemFixtures.oneMenuItem[0].id,
        },
        { status: 200 },
      );
    }),
  ],
};
