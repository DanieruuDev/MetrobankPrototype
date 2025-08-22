import { useEffect, useState } from "react";
import { WorkflowFormData } from "../../Interface/IWorkflow";
import { Calendar, File } from "lucide-react";
import axios from "axios";

interface WorkflowSummaryProps {
  formData: WorkflowFormData;
}

function WorkflowSummary({ formData }: WorkflowSummaryProps) {
  //put a backend getter for approver information
  //Make sure that the approver is the same role in the required approver
  //Make sure that the account existed
  //Make an automated suggestion for various accounts

  const [approverInfo, setApproverInfo] = useState<
    {
      asmin_id: number;
      admin_name: string;
      admin_email: string;
      admin_job: string;
      role_id: number;
    }[]
  >([]);

  useEffect(() => {
    const fetchApproverInfo = async () => {
      try {
        const res = await Promise.all(
          formData.approvers.map((approver) =>
            axios.get(
              `http://localhost:5000/api/workflow/find-email/${approver.email}`
            )
          )
        );
        const approverInfos = res.map((r) => r.data.data);
        console.log(approverInfos);
        setApproverInfo(approverInfos);
      } catch (error) {
        console.error("Error fetching approver:", error);
        return null;
      }
    };

    fetchApproverInfo();
  }, []);
  console.log(approverInfo);

  return (
    <div className="bg-[#F2F2F2] p-4 rounded-md">
      <h1 className="font-medium text-[20px]">Workflow Summary</h1>
      <div className="mt-4 space-y-4 px-4">
        <div className="grid grid-cols-3 ">
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">Title</div>
            <div>{formData?.request_title}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">Workflow Type</div>
            <div>{formData?.req_type_id}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">YR-SY-SEM</div>
            <div>
              {formData?.scholar_level} | {formData?.school_year} |
              {formData?.semester}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 ">
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">Created by</div>
            <div>{formData?.requester_id}</div>
          </div>
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">Start Date</div>
            <div>
              {new Date().toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-[#808080] text-[16px]">Due Date</div>
            <div>{formData?.due_date}</div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-[20px] font-medium">Approvers</h1>
        <div className="space-y-2 mt-1">
          {formData.approvers.map((approver, index) => (
            <div className="grid grid-cols-3">
              <div className="flex gap-2 items-center col-span-2">
                <div className="w-8 h-8 flex items-center justify-center bg-[#10B981] text-white rounded-[20px]">
                  {index + 1}
                </div>
                <div>
                  <div className="font-medium">
                    {approverInfo[index]?.admin_name}
                  </div>
                  <div>
                    <div className="text-[#A3A3A3] font-medium text-[14px]">
                      {approverInfo[index]?.admin_job}| {approver.email}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 items-center col-span-1">
                <Calendar color="#A3A3A3" size={25} />
                <div className="text-[#2e2e2e] text-[14px]">
                  Due date: {approver.date}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h1 className="text-[20px] font-medium">Attachment</h1>

        <div className="flex gap-2 items-center mt-2">
          <File color="#A3A3A3" size={30} />

          {formData.file && (
            <a
              href={URL.createObjectURL(formData.file)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {formData.file.name}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export default WorkflowSummary;
