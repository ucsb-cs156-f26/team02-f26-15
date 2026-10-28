import React from "react";
import { http, HttpResponse } from "msw";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import MenuItemReviewEditPage from "main/pages/MenuItemReview/MenuItemReviewEditPage";
export default {
  title: "pages/MenuItemReview/MenuItemReviewEditPage",
  component: MenuItemReviewEditPage,
};
export const Default = () => <MenuItemReviewEditPage storybook={true} />;
Default.parameters = {
  msw: [
    http.get("/api/currentUser", () =>
      HttpResponse.json(apiCurrentUserFixtures.adminUser),
    ),
    http.get("/api/systemInfo", () =>
      HttpResponse.json(systemInfoFixtures.showingNeither),
    ),
    http.get("/api/MenuItemReview", () =>
      HttpResponse.json(menuItemReviewFixtures.oneMenuItemReview),
    ),
    http.put("/api/MenuItemReview", async ({ request }) =>
      HttpResponse.json({ ...(await request.json()), id: 1 }),
    ),
  ],
};
