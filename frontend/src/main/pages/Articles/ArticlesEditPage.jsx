import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import ArticlesForm from "main/components/Articles/ArticlesForm";
import { useParams, Navigate } from "react-router";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function ArticlesEditPage({ storybook = false }) {
  const { id } = useParams();

  const {
    data: article,
    error: _error,
    status: _status,
  } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/articles?id=${id}`],
    {
      // Stryker disable next-line all : GET is the default
      method: "GET",
      url: "/api/articles",
      params: {
        id,
      },
    },
  );

  const objectToAxiosPutParams = (updatedArticle) => ({
    url: "/api/articles",
    method: "PUT",
    params: {
      id: updatedArticle.id,
    },
    data: {
      title: updatedArticle.title,
      url: updatedArticle.url,
      explanation: updatedArticle.explanation,
      email: updatedArticle.email,
      dateAdded: updatedArticle.dateAdded,
    },
  });

  const onSuccess = (updatedArticle) => {
    toast(
      `Article Updated - id: ${updatedArticle.id} title: ${updatedArticle.title}`,
    );
  };

  const mutation = useBackendMutation(
    objectToAxiosPutParams,
    { onSuccess },
    // Stryker disable next-line all : hard to test internal caching
    [`/api/articles?id=${id}`, "/api/articles/all"],
  );

  const { isSuccess } = mutation;

  const onSubmit = async (data) => {
    mutation.mutate(data);
  };

  if (isSuccess && !storybook) {
    return <Navigate to="/articles" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit Article</h1>
        {article && (
          <ArticlesForm
            submitAction={onSubmit}
            buttonLabel="Update"
            initialContents={article}
          />
        )}
      </div>
    </BasicLayout>
  );
}
