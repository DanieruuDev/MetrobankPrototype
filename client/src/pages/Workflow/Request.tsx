import axios from "axios";
import { useContext, useEffect, useState } from "react";
import SpecificRequest from "../../components/approval/SpecificRequest";
import {
  ApproverDetailedView,
  RequestApprovalList,
} from "../../Interface/IWorkflow";
import { approverStatusBadge } from "../../utils/StatusBadge";
import { AuthContext } from "../../context/AuthContext";

function Request() {
  const auth = useContext(AuthContext);
  const userId = auth?.user?.user_id; // your logged-in user's ID
  const [requestList, setRequestList] = useState<RequestApprovalList[] | null>(
    []
  );
  const [specificRequest, setSpecificRequest] =
    useState<ApproverDetailedView | null>(null);
  const [approverId, setApproverId] = useState<number>();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };
  const handleRowClick = (approval_id: number) => {
    console.log(approval_id);
    setApproverId(approval_id);
  };
  const getRequestApproval = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-request/${userId}`
      );

      setRequestList(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const getSpecificRequestApproval = async () => {
    if (!approverId) return console.log("No approval id yet");
    try {
      const response = await axios.get(
        `http://localhost:5000/api/workflow/get-specific-request/${approverId}`
      );
      setSpecificRequest(response.data);
    } catch (error) {
      console.log(error);
    }
  };
  const updateApproverResponse = (
    response: string,
    comment: string | null,
    approver_status: string
  ) => {
    setSpecificRequest((prevState) => {
      if (!prevState) return null;

      return {
        ...prevState,
        approver_response: response,
        approver_comment: comment,
        approver_status: approver_status,
      };
    });
  };
  useEffect(() => {
    getSpecificRequestApproval();
  }, [approverId]);

  useEffect(() => {
    getRequestApproval();
  }, []);
  useEffect(() => {
    getRequestApproval();
  }, [specificRequest]);

  console.log("updateApproverResponse type:", typeof updateApproverResponse);

  return (
    <div>
      {approverId ? (
        <SpecificRequest
          approver_id={approverId}
          specificRequest={specificRequest}
          goBack={() => setApproverId(undefined)}
          getSpecificRequestApproval={getSpecificRequestApproval}
        />
      ) : (
        <>
          <p>Current Account: daniel@gmail.com APPROVER</p>
          <div
            className="grid text-[#565656] text-[14px] font-bold rounded-md bg-[#EFEFEF] h-[58px] items-center"
            style={{
              gridTemplateColumns:
                "1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr  0.7fr min-content",
            }}
          >
            <div className="text-left px-6 max-w-[255px]">Request Title</div>
            <div className="text-left px-2 max-w-[100px] w-full">Status</div>
            <div className="text-left px-6">Requester</div>
            <div className="text-left px-4">Date Started</div>
            <div className="text-left px-4">Due Date</div>
            <div className="text-left px-4">School Year</div>
            <div className="text-left px-4">Year Level</div>
            <div className="text-left px-4">Semester</div>
            <div className="text-left p-5"></div>{" "}
            {/* Empty column for delete button */}
          </div>
          {requestList
            ? requestList.map((request) => (
                <div
                  key={request.approver_id}
                  onClick={() => handleRowClick(request.approver_id)}
                  className="grid text-[#565656] text-[14px] h-[52px] items-center border-b border-b-[#c7c7c792] hover:bg-[#f7f7f7] rounded-md cursor-pointer"
                  style={{
                    gridTemplateColumns:
                      "1.4fr 0.4fr 1fr 0.7fr 0.7fr 0.7fr 0.7fr 0.7fr min-content",
                  }}
                >
                  <div className="text-left px-6 max-w-[255px]">
                    {request.request_title}
                  </div>
                  <div
                    className={`text-left px-2 py-1 text-[12px] flex  justify-center rounded-xl ${approverStatusBadge(
                      request.approver_status
                    )}`}
                  >
                    {request.approver_status}
                  </div>
                  <div className="text-left px-6 max-w-[215px] truncate">
                    {request.requester}
                  </div>
                  <div className="text-left px-4">
                    {formatDate(request.date_started)}
                  </div>
                  <div className="text-left px-4">
                    {formatDate(request.approver_due_date)}
                  </div>
                  <div className="text-left px-4">{request.school_year}</div>
                  <div className="text-left px-4">{request.year_level}</div>
                  <div className="text-left px-4">{request.semester}</div>
                  <div className="text-left p-5"></div>{" "}
                  {/* Empty column for delete button */}
                </div>
              ))
            : ""}
        </>
      )}
    </div>
  );
}

export default Request;
