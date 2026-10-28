import React from "react";
import UCSBDiningCommonsMenuItemTable from "main/components/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemTable";
import { ucsbdiningcommonsmenuitemFixtures } from "fixtures/ucsbdiningcommonsmenuitemFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemTable",
  component: UCSBDiningCommonsMenuItemTable,
};

const Template = (args) => {
  return <UCSBDiningCommonsMenuItemTable {...args} />;
};

export const Empty = Template.bind({});

Empty.args = {
  menuItems: [],
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsOrdinaryUser = Template.bind({});

ThreeItemsOrdinaryUser.args = {
  menuItems: ucsbdiningcommonsmenuitemFixtures.threeMenuItems,
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeItemsAdminUser = Template.bind({});

ThreeItemsAdminUser.args = {
  menuItems: ucsbdiningcommonsmenuitemFixtures.threeMenuItems,
  currentUser: currentUserFixtures.adminUser,
};

ThreeItemsAdminUser.parameters = {
  msw: [
    http.delete("/api/ucsbdiningcommonsmenuitems", () => {
      return HttpResponse.json(
        { message: "Menu item deleted successfully" },
        { status: 200 },
      );
    }),
  ],
};
