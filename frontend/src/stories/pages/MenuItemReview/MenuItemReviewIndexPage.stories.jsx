import React from "react";
import { http, HttpResponse } from "msw";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import MenuItemReviewIndexPage from "main/pages/MenuItemReview/MenuItemReviewIndexPage";

export default {
  title: "pages/MenuItemReview/MenuItemReviewIndexPage",
  component: MenuItemReviewIndexPage,
};
const Template = () => <MenuItemReviewIndexPage />;
const handlers = (user, reviews) => [
  http.get("/api/currentUser", () => HttpResponse.json(user)),
  http.get("/api/systemInfo", () =>
    HttpResponse.json(systemInfoFixtures.showingNeither),
  ),
  http.get("/api/MenuItemReview/all", () => HttpResponse.json(reviews)),
  http.delete("/api/MenuItemReview", () =>
    HttpResponse.json({ message: "Review deleted" }),
  ),
];
export const Empty = Template.bind({});
Empty.parameters = { msw: handlers(apiCurrentUserFixtures.userOnly, []) };
export const ThreeItemsOrdinaryUser = Template.bind({});
ThreeItemsOrdinaryUser.parameters = {
  msw: handlers(
    apiCurrentUserFixtures.userOnly,
    menuItemReviewFixtures.threeMenuItemReviews,
  ),
};
export const ThreeItemsAdminUser = Template.bind({});
ThreeItemsAdminUser.parameters = {
  msw: handlers(
    apiCurrentUserFixtures.adminUser,
    menuItemReviewFixtures.threeMenuItemReviews,
  ),
};
