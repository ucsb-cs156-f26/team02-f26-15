import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
<<<<<<< HEAD

export default function ArticlesCreatePage() {
  // Stryker disable all : placeholder for future implementation
  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Create page not yet implemented</h1>
=======
import ArticlesForm from "main/components/Articles/ArticlesForm";
import { Navigate } from "react-router";
import { useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function ArticlesCreatePage({ storybook = false }) {
  const objectToAxiosParams = (article) => ({
    url: "/api/articles/post",
    method: "POST",
    params: {
      title: article.title,
      url: article.url,
      explanation: article.explanation,
      email: article.email,
      dateAdded: article.dateAdded,
    },
  });

  const onSuccess = (article) => {
    toast(`New article created - id: ${article.id} title: ${article.title}`);
  };

  const mutation = useBackendMutation(
    objectToAxiosParams,
    { onSuccess },
    // Stryker disable next-line all : hard to set up test for caching
    ["/api/articles/all"],
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
        <h1>Create New Article</h1>
        <ArticlesForm submitAction={onSubmit} />
>>>>>>> origin/grace-articles-form
      </div>
    </BasicLayout>
  );
}
