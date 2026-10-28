import OurTable, { ButtonColumn } from "main/components/OurTable";
import { useBackendMutation } from "main/utils/useBackend";
import { hasRole } from "main/utils/useCurrentUser";
import { useNavigate } from "react-router";
import { toast } from "react-toastify";

const cellToAxiosParamsDelete = (cell) => ({
  url: "/api/MenuItemReview",
  method: "DELETE",
  params: { id: cell.row.original.id },
});

export default function MenuItemReviewTable({
  menuItemReviews,
  currentUser,
  testIdPrefix = "MenuItemReviewTable",
}) {
  const navigate = useNavigate();
  const deleteMutation = useBackendMutation(
    cellToAxiosParamsDelete,
    { onSuccess: (response) => toast(response.message) },
    ["/api/MenuItemReview/all"],
  );

  const editCallback = (cell) => {
    navigate(`/menuitemreview/edit/${cell.row.original.id}`);
  };

  const deleteCallback = (cell) => {
    deleteMutation.mutate(cell);
  };

  const columns = [
    { header: "ID", accessorKey: "id" },
    { header: "Menu item ID", accessorKey: "itemId" },
    { header: "Reviewer email", accessorKey: "reviewerEmail" },
    { header: "Stars", accessorKey: "stars" },
    { header: "Date reviewed", accessorKey: "dateReviewed" },
    { header: "Comments", accessorKey: "comments" },
  ];

  if (hasRole(currentUser, "ROLE_ADMIN")) {
    columns.push(ButtonColumn("Edit", "primary", editCallback, testIdPrefix));
    columns.push(
      ButtonColumn("Delete", "danger", deleteCallback, testIdPrefix),
    );
  }

  return (
    <OurTable data={menuItemReviews} columns={columns} testid={testIdPrefix} />
  );
}
