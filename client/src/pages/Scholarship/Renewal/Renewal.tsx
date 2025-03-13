import Sidebar from "../../../components/Sidebar";
import Navbar from "../../../components/Navbar";
import { useEffect, useState } from "react";
import ScholarshipRenewalModal from "../../../components/ScholarshipRenewalModal";
import { RenewalDetails } from "../../../Interface/IRenewal";
import axios from "axios";

function Renewal() {
  const [isRenewalBtnOpen, SetIsRenewalBtnOpen] = useState(false);
  const [renewalData, setRenewalData] = useState<RenewalDetails[] | null>([]);
  const tableHead = {
    school_id: "School ID",
    scholar_name: "Scholar Name",
    campus: "Campus",
    batch: "Batch",
    renewal_date: "Renewal Date",
    renewal_year_lvl_basis: "Renewal Year Level Basis",
    renewal_semester_basis: "Renewal Semester Basis",
    renewal_school_year_basis: "Renewal School Year Basis",
    gpa: "GPA",
    gpa_validation: "GPA Validation",
    no_failing_grades: "No Failing Grades",
    no_other_scholarship: "No Other Scholarship",
    goodmoral: "Good Moral",
    no_police_record: "No Police Record",
    no_full_load: "No Full Load",
    withdrawal_change_course: "Withdrawal/Change of Course",
    enrollment_validation: "Enrollment Validation",
    scholarship_status: "Scholarship Status",
    year_lvl: "Year Level",
    semester: "Semester",
    school_year: "School Year",
    delisted_year: "Delisted Year",
    delisting_root_cause: "Delisting Root Cause",
  };
  const getRenewalData = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/admin/fetch-renewals"
      );
      if (response.status === 200) {
        console.log("Renewal Data:", response.data);
        setRenewalData(response.data.data);
      } else {
        console.error("Unexpected response status:", response.status);
      }
    } catch (error) {
      console.error("Error fetching renewal data:", error);
    }
  };

  useEffect(() => {
    getRenewalData();
  }, []);

  console.log(renewalData);
  return (
    <div className="pl-[300px]">
      <nav className="h-[80px] border-b-1">
        <Navbar />
      </nav>
      <Sidebar />
      <div className="mt-10 mx-[10px]">
        <div className="flex justify-between ">
          <div className="flex gap-2">
            <button className="text-[14px] text-[#CCCCCC] bg-[#EFEFEF] px-4 py-2  rounded-sm cursor-pointer">
              Filter
            </button>
            <button className="text-[14px] text-[#CCCCCC] bg-[#EFEFEF] px-4 py-2  rounded-sm cursor-pointer">
              Search
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="text-white bg-[#3B89FD] text-[14px] font-medium px-4 py-2 rounded-sm cursor-pointer"
              onClick={() => SetIsRenewalBtnOpen(true)}
            >
              Add Renewal
            </button>
            <button className="text-white text-[14px] font-medium px-4 py-2 bg-[#3B89FD]  rounded-sm cursor-pointer">
              Generate Report
            </button>
          </div>
        </div>
        <ScholarshipRenewalModal
          isOpen={isRenewalBtnOpen}
          onClose={() => SetIsRenewalBtnOpen(false)}
        />
        <div className="overflow-x-auto mt-10">
          <table>
            <thead className="bg-[#EFEFEF] h-[58px]">
              <tr className="text-[#565656]">
                {Object.entries(tableHead).map(([key, value]) => (
                  <th
                    className={`min-w-[180px] px-4 border border-[#D9D9D9] ${
                      key === "scholar_name"
                        ? "sticky left-0 bg-[#EFEFEF] z-10"
                        : ""
                    }`}
                    key={key}
                  >
                    {value}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {renewalData && renewalData.length > 0 ? (
                renewalData?.map((data, index) => (
                  <tr
                    key={index}
                    className="text-[14px] font-medium text-[#565656] inset-1 cursor-pointer group hover:bg-[#f4f4f4]"
                  >
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9] py-3 bg-white group-hover:bg-[#f4f4f4]">
                      {data.student_id}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9] sticky left-0 bg-white group-hover:bg-[#f4f4f4]">
                      {data.scholar_name}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.campus}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.batch_number}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.renewal_date}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.renewal_year_level_basis}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.renewal_semester_basis}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.renewal_school_year_basis}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.gpa || "null"}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.gpa_validation_stat}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.no_failing_grd_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.no_other_scholar_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.goodmoral_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.no_police_record_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.full_load_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.withdrawal_change_course_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.enrollment_validation}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.scholarship_status}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.year_level}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.semester}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.school_year}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.delisted_date}
                    </td>
                    <td className="min-w-[180px] px-4 border border-[#D9D9D9]">
                      {data.delisting_root_cause}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td>No renewal here</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div></div>
      </div>
    </div>
  );
}

export default Renewal;
