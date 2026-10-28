import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import MenuItemReviewForm from "main/components/MenuItemReview/MenuItemReviewForm";
import { Navigate, useParams } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

export default function MenuItemReviewEditPage({ storybook = false }) {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const reviewKey = ["/api/MenuItemReview", id];
  const { data: review } = useBackend(reviewKey, {
    method: "GET",
    url: "/api/MenuItemReview",
    params: { id },
  });
  const mutation = useBackendMutation(
    (data) => ({
      url: "/api/MenuItemReview",
      method: "PUT",
      params: { id },
      data: {
        itemId: data.itemId,
        reviewerEmail: data.reviewerEmail,
        stars: data.stars,
        dateReviewed: data.dateReviewed,
        comments: data.comments,
      },
    }),
    {
      onSuccess: (saved) => {
        queryClient.setQueryData(reviewKey, saved);
        toast(`Menu item review updated - id: ${saved.id}`);
      },
    },
    ["/api/MenuItemReview/all"],
  );
  if (mutation.isSuccess && !storybook)
    return <Navigate to="/menuitemreview" />;
  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit Menu Item Review</h1>
        {review && (
          <MenuItemReviewForm
            initialContents={review}
            buttonLabel="Update"
            submitAction={(data) => mutation.mutate(data)}
          />
        )}
      </div>
    </BasicLayout>
  );
}
