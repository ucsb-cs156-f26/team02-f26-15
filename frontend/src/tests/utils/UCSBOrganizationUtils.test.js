import {
  onDeleteSuccess,
  cellToAxiosParamsDelete,
} from "main/utils/UCSBOrganizationUtils";

const mockToast = vi.fn();
vi.mock("react-toastify", async () => {
  const originalModule = await vi.importActual("react-toastify");
  return {
    ...originalModule,
    toast: (x) => mockToast(x),
  };
});

describe("UCSBOrganizationUtils", () => {
  describe("onDeleteSuccess", () => {
    test("It puts the message on console.log and in a toast", () => {
      const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      onDeleteSuccess("abc");

      expect(mockToast).toHaveBeenCalledWith("abc");
      expect(logSpy).toHaveBeenCalledWith("abc");

      logSpy.mockRestore();
    });
  });

  describe("cellToAxiosParamsDelete", () => {
    test("It returns the correct params", () => {
      const cell = { row: { original: { orgCode: "ZPR" } } };

      const result = cellToAxiosParamsDelete(cell);

      expect(result).toEqual({
        url: "/api/ucsborganizations",
        method: "DELETE",
        params: { orgCode: "ZPR" },
      });
    });
  });
});
