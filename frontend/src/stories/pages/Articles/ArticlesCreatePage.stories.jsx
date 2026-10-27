import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { http, HttpResponse } from "msw";

import ArticlesCreatePage from "main/pages/Articles/ArticlesCreatePage";

export default {
  title: "pages/Articles/ArticlesCreatePage",
  component: ArticlesCreatePage,
};

const Template = () => <ArticlesCreatePage storybook={true} />;

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
    http.post("/api/articles/post", () => {
      return HttpResponse.json(
        {
          id: 1,
          title: "UCSB Research News",
          url: "https://news.ucsb.edu",
          explanation: "An article about research at UCSB",
          email: "student@ucsb.edu",
          dateAdded: "2026-10-22T15:48:00",
        },
        { status: 200 },
      );
    }),
  ],
};
