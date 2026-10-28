import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { useBackend } from "main/utils/useBackend";
import { hasRole, useCurrentUser } from "main/utils/useCurrentUser";
import { Button } from "react-bootstrap";

export default function MenuItemReviewIndexPage() {
  const currentUser = useCurrentUser();
  const { data: reviews } = useBackend(
    ["/api/MenuItemReview/all"],
    { method: "GET", url: "/api/MenuItemReview/all" },
    [],
  );

  return (
    <BasicLayout>
      <div className="pt-2">
        {hasRole(currentUser, "ROLE_ADMIN") && (
          <Button href="/menuitemreview/create">Create Menu Item Review</Button>
        )}
        <h1>Menu Item Reviews</h1>
        <MenuItemReviewTable
          menuItemReviews={reviews}
          currentUser={currentUser}
        />
      </div>
    </BasicLayout>
  );
}
