import React from "react";
import HelpRequestTable from "main/components/HelpRequest/HelpRequestTable";
import { helpRequestFixtures } from "fixtures/helpRequestFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/HelpRequest/HelpRequestTable",
  component: HelpRequestTable,
};

const Template = (args) => {
  return <HelpRequestTable {...args} />;
};

export const Empty = Template.bind({});

Empty.args = {
  helpRequests: [],
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeHelpRequestsOrdinaryUser = Template.bind({});

ThreeHelpRequestsOrdinaryUser.args = {
  helpRequests: helpRequestFixtures.threeHelpRequests,
  currentUser: currentUserFixtures.userOnly,
};

export const ThreeHelpRequestsAdminUser = Template.bind({});

ThreeHelpRequestsAdminUser.args = {
  helpRequests: helpRequestFixtures.threeHelpRequests,
  currentUser: currentUserFixtures.adminUser,
};

ThreeHelpRequestsAdminUser.parameters = {
  msw: [
    http.delete("/api/helprequests", () => {
      return HttpResponse.json(
        { message: "Help request deleted successfully" },
        { status: 200 },
      );
    }),
  ],
};
