import Approver from "../pages/Approvers/AllWorkflows/Approver";

interface Approver {
  approverType: string;
  selectedScholarYear: string;
  selectedSchoolYear: string;
  selectedSemester: string;
  selectedFile: File | null;
  selectedDueDate: string;
  selectedStartDate: string;
  ReqDescription: string;
  approverEmail: string;
}

interface CreateApproverProps {
  approvals: Approver[];
}

const CreateApprover = ({ approvals }: CreateApproverProps) => {
  return (
    <div className="w-full mt-6">
      {approvals.length > 0 && (
        <div className="bg-white border-none overflow-x-auto">
          {approvals.map((approval, index) => (
            <div key={index} className="flex items-center py-4">
              <div className="flex-1 px-6 whitespace-nowrap mr-10">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 -ml-2  text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-7 text-sm font-medium text-gray-500">
                    {approval.approverType}
                  </span>
                </div>
              </div>
              <div className="flex-1 px-2 -ml-11 whitespace-nowrap text-sm text-gray-500">
                Pending
              </div>
              <div className="flex-1 px-2 -ml-22 whitespace-nowrap text-sm text-gray-500">
                {approval.approverEmail}
              </div>
              <div className="flex-1 px-2 whitespace-nowrap text-sm text-gray-500">
                {approval.selectedFile?.name || "No file"}
              </div>
              <div className="flex items-center px-20 gap-10">
                <div className="flex-1 px-2 whitespace-nowrap text-sm text-gray-500">
                  {approval.selectedStartDate}
                </div>
                <div className="flex-1 px-2 whitespace-nowrap text-sm text-gray-500">
                  {approval.selectedDueDate}
                </div>
                <div className="flex-1 px-2 text-sm text-gray-500">
                  {approval.ReqDescription}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CreateApprover;
