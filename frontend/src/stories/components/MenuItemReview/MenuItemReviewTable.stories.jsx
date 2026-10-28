import MenuItemReviewTable from "main/components/MenuItemReview/MenuItemReviewTable";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";
import { currentUserFixtures } from "fixtures/currentUserFixtures";
import { http, HttpResponse } from "msw";

export default {
  title: "components/MenuItemReview/MenuItemReviewTable",
  component: MenuItemReviewTable,
};

export const Empty = {
  args: {
    menuItemReviews: [],
    currentUser: currentUserFixtures.userOnly,
  },
};

export const ThreeItemsOrdinaryUser = {
  args: {
    menuItemReviews: menuItemReviewFixtures.threeMenuItemReviews,
    currentUser: currentUserFixtures.userOnly,
  },
};

export const ThreeItemsAdminUser = {
  args: {
    menuItemReviews: menuItemReviewFixtures.threeMenuItemReviews,
    currentUser: currentUserFixtures.adminUser,
  },
  parameters: {
    msw: {
      handlers: [
        http.delete("/api/MenuItemReview", ({ request }) => {
          const id = new URL(request.url).searchParams.get("id");
          return HttpResponse.json({ message: `record ${id} deleted` });
        }),
      ],
    },
  },
};
