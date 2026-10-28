import React from "react";
import OurTable, { ButtonColumn } from "main/components/OurTable";
import { useBackendMutation } from "main/utils/useBackend";
import { useNavigate } from "react-router";
import { hasRole } from "main/utils/useCurrentUser";

const API_PATH = "/api/ucsbdiningcommonsmenuitems";

const cellToAxiosParamsDelete = (cell) => ({
  method: "DELETE",
  url: API_PATH,
  params: { id: cell.row.original.id },
});

export default function UCSBDiningCommonsMenuItemTable({
  menuItems,
  currentUser,
  testIdPrefix = "UCSBDiningCommonsMenuItemTable",
}) {
  const navigate = useNavigate();

  const editCallback = (cell) => {
    navigate(`/diningcommonsmenuitem/edit/${cell.row.original.id}`);
  };

  // Stryker disable all : hard to test for query caching
  const deleteMutation = useBackendMutation(cellToAxiosParamsDelete, {}, [
    `${API_PATH}/all`,
  ]);
  // Stryker restore all

  // Stryker disable next-line all : callback uses mutation
  const deleteCallback = async (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    {
      header: "id",
      accessorKey: "id",
    },
    {
      header: "Dining Commons Code",
      accessorKey: "diningCommonsCode",
    },
    {
      header: "Name",
      accessorKey: "name",
    },
    {
      header: "Station",
      accessorKey: "station",
    },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return <OurTable data={menuItems} columns={columns} testid={testIdPrefix} />;
}
