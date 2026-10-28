import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";
import { menuItemReviewFixtures } from "fixtures/menuItemReviewFixtures";

export default {
  title: "components/MenuItemReview/MenuItemReviewForm",
  component: MenuItemReviewForm,
  args: {
    submitAction: (data) => {
      console.log("Submit was clicked with data: ", data);
      window.alert("Submit was clicked with data: " + JSON.stringify(data));
    },
  },
};

export const Create = {
  args: { buttonLabel: "Create" },
};

export const Update = {
  args: {
    initialContents: menuItemReviewFixtures.oneMenuItemReview,
    buttonLabel: "Update",
  },
};
