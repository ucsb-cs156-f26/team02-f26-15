import BasicLayout from "main/layouts/BasicLayout/BasicLayout";
import { useParams, Navigate } from "react-router";
import UCSBDiningCommonsMenuItemForm from "main/components/UCSBDiningCommonsMenuItem/UCSBDiningCommonsMenuItemForm";
import { useBackend, useBackendMutation } from "main/utils/useBackend";
import { toast } from "react-toastify";

export default function UCSBDiningCommonsMenuItemEditPage({
  storybook = false,
}) {
  const { id } = useParams();

  const { data: menuItem } = useBackend(
    // Stryker disable next-line all : don't test internal caching of React Query
    [`/api/ucsbdiningcommonsmenuitems?id=${id}`],
    {
      // Stryker disable next-line all : GET is the default method
      method: "GET",
      url: "/api/ucsbdiningcommonsmenuitems",
      params: {
        id,
      },
    },
  );

  const objectToAxiosPutParams = (item) => ({
    url: "/api/ucsbdiningcommonsmenuitems",
    method: "PUT",
    params: {
      id: menuItem.id,
    },
    data: {
      diningCommonsCode: item.diningCommonsCode,
      name: item.name,
      station: item.station,
    },
  });

  const onSuccess = (item) => {
    toast(`Menu Item Updated - id: ${item.id} name: ${item.name}`);
  };

  const mutation = useBackendMutation(
    objectToAxiosPutParams,
    { onSuccess },
    // Stryker disable next-line all : hard to test query caching
    [`/api/ucsbdiningcommonsmenuitems?id=${id}`],
  );

  const { isSuccess } = mutation;

  const onSubmit = async (data) => {
    mutation.mutate(data);
  };

  if (isSuccess && !storybook) {
    return <Navigate to="/diningcommonsmenuitem" />;
  }

  return (
    <BasicLayout>
      <div className="pt-2">
        <h1>Edit Dining Commons Menu Item</h1>
        {menuItem && (
          <UCSBDiningCommonsMenuItemForm
            submitAction={onSubmit}
            buttonLabel="Update"
            initialContents={menuItem}
          />
        )}
      </div>
    </BasicLayout>
  );
}
