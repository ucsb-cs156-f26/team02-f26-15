import React from "react";
import { useBackend } from "main/utils/useBackend";

import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import HelpRequestTable from "main/components/HelpRequest/HelpRequestTable";
import { useCurrentUser, hasRole } from "main/utils/useCurrentUser";
import { Button } from "react-bootstrap";

export default function HelpRequestIndexPage() {
  const currentUser = useCurrentUser();

  const { data: helpRequests } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    ["/api/helprequests/all"],
    { method: "GET", url: "/api/helprequests/all" },
    // Stryker disable next-line all : don't test default value of empty list
    [],
  );

  const createButton = () => {
    if (hasRole(currentUser, "ROLE_ADMIN")) {
      return (
        <Button
          variant="primary"
          href="/helprequest/create"
          style={{ float: "right" }}
        >
          Create HelpRequest
        </Button>
      );
    }
  };

  return (
    <BasicLayout>
      <div className="pt-2">
        {createButton()}
        <h1>HelpRequests</h1>
        <HelpRequestTable
          helpRequests={helpRequests}
          currentUser={currentUser}
        />
      </div>
    </BasicLayout>
  );
}
