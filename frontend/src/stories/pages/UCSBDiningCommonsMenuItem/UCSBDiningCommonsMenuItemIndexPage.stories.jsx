import React from "react";
import { apiCurrentUserFixtures } from "fixtures/currentUserFixtures";
import { systemInfoFixtures } from "fixtures/systemInfoFixtures";
import { ucsbdiningcommonsmenuitemFixtures } from "fixtures/ucsbdiningcommonsmenuitemFixtures";
import { http, HttpResponse } from "msw";

import UCSBDiningCommonsMenuItemIndexPage from "main/pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemIndexPage";

export default {
  title: "pages/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemIndexPage",
  component: UCSBDiningCommonsMenuItemIndexPage,
};

const Template = () => <UCSBDiningCommonsMenuItemIndexPage />;

export const Empty = Template.bind({});

Empty.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.userOnly);
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither);
    }),
    http.get("/api/ucsbdiningcommonsmenuitems/all", () => {
      return HttpResponse.json([]);
    }),
  ],
};

export const ThreeItemsOrdinaryUser = Template.bind({});

ThreeItemsOrdinaryUser.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.userOnly);
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither);
    }),
    http.get("/api/ucsbdiningcommonsmenuitems/all", () => {
      return HttpResponse.json(
        ucsbdiningcommonsmenuitemFixtures.threeMenuItems,
      );
    }),
  ],
};

export const ThreeItemsAdminUser = Template.bind({});

ThreeItemsAdminUser.parameters = {
  msw: [
    http.get("/api/currentUser", () => {
      return HttpResponse.json(apiCurrentUserFixtures.adminUser);
    }),
    http.get("/api/systemInfo", () => {
      return HttpResponse.json(systemInfoFixtures.showingNeither);
    }),
    http.get("/api/ucsbdiningcommonsmenuitems/all", () => {
      return HttpResponse.json(
        ucsbdiningcommonsmenuitemFixtures.threeMenuItems,
      );
    }),
    http.delete("/api/ucsbdiningcommonsmenuitems", () => {
      return HttpResponse.json(
        { message: "Menu item deleted successfully" },
        { status: 200 },
      );
    }),
  ],
};
