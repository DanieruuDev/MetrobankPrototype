import { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx"; // Import xlsx library
import GeneratePeriodModal from "../../../components/invoice/internship-allowance/GeneratePeriodModal";
import PaginationControl from "../../../components/shared/PaginationControl";
import { Student } from "../../../Interface/ITuitionInvoice";
import { X } from "lucide-react";

interface InternshipAllowanceUploadProps {
  students: Student[];
  filteredStudents: Student[];
  fetchStudents: () => void;
  schoolYear: string;
  semester: string;
  role: number | undefined;
  isLoading: boolean;
  setSelectedBranch: React.Dispatch<React.SetStateAction<string>>;
  setSelectedYearLevel: React.Dispatch<React.SetStateAction<string>>;
  setSelectedProgram: React.Dispatch<React.SetStateAction<string>>;
  type: string;
}

interface InternshipAllowanceRecord extends Student {
  disb_detail_id: number;
  disbursement_status: string;
  covered_date: string;
}

interface ExcelData {
  name: string;
  hoursRequired: number;
  startPayPeriod: string;
  endPayPeriod: string;
  hoursRendered: number;
}

interface UploadPayload {
  disb_detail_id: number;
  covered_date: string;
  amount: number;
  number_of_hours: number;
  startPayPeriod: string;
  endPayPeriod: string;
  name: string;
}

function InternshipAllowanceUpload({
  schoolYear,
  semester,
}: InternshipAllowanceUploadProps) {
  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false); // New state for match modal
  const [isLoading, setIsLoading] = useState(true);
  const [records, setRecords] = useState<InternshipAllowanceRecord[]>([]);
  const [coveredDates, setCoveredDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(""); // ✅ active tab
  const [selectedDateToDelete, setSelectedDateToDelete] = useState<string>("");
  const [page, setPage] = useState(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [matchedData, setMatchedData] = useState<UploadPayload[]>([]); // Store matched data for modal
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const [ratePerHour, setRatePerHour] = useState<string>("");

  const itemsPerPage = 10;
  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;
  const handlePageChange = (newPage: number) => setPage(newPage);

  // ✅ Fetch Internship Allowance Records for a specific covered date
  const fetchEligibleInternshipAllowance = async (coveredDate: string) => {
    try {
      setIsLoading(true);
      const school_year = Number(schoolYear.replace("-", ""));
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/internship/list`,
        {
          params: { school_year, coveredDate },
        }
      );
      setRecords(response.data.data || []);
      setSelectedDate(coveredDate); // ✅ mark active
      console.log("✅ Internship Allowance Data:", response.data);
    } catch (error) {
      console.error("❌ Error fetching internship allowance:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch Covered Dates
  const fetchCoveredDate = async () => {
    try {
      const school_year = Number(schoolYear.replace("-", ""));
      const response = await axios.get(
        `${VITE_BACKEND_URL}api/invoice/internship-covered-date`,
        {
          params: { school_year },
        }
      );

      const dates = response.data.data || [];
      const sortedDates = [...dates].sort(
        (a, b) => new Date(b).getTime() - new Date(a).getTime()
      );
      setCoveredDates(sortedDates);

      if (sortedDates.length > 0) {
        await fetchEligibleInternshipAllowance(sortedDates[0]); // default to most recent
      }
    } catch (error) {
      console.error("❌ Error fetching covered dates:", error);
      setCoveredDates([]);
    }
  };

  // ✅ Delete Covered Date
  const handleDelete = async () => {
    if (!selectedDateToDelete) return;

    try {
      setErrorMessage(null);
      const response = await axios.delete(
        `${VITE_BACKEND_URL}api/invoice/delete-internship-allowance`,
        {
          data: {
            coveredDate: selectedDateToDelete,
          },
        }
      );
      console.log(response.data);
      console.log(`Deleted covered date: ${selectedDateToDelete}`);
      await fetchCoveredDate();
      setIsDeleteModalOpen(false);
      setSelectedDateToDelete("");
    } catch (error) {
      console.error("❌ Error deleting covered date:", error);
      setErrorMessage("Failed to delete covered date. Please try again.");
    }
  };

  // ✅ Handle Excel Upload
  const handleExcelUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    try {
      setUploadError(null);
      setIsLoading(true);

      // Read Excel file
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const excelData: ExcelData[] = [];

      // Process each sheet
      workbook.SheetNames.forEach((sheetName) => {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as any[][];

        // Find the data row (after headers)
        const dataRow = jsonData.find((row) => row[0] === "Start Pay Period");
        if (dataRow) {
          const nameRow = jsonData.find(
            (row) => row[0] === "Name of Student Trainee:"
          );
          const hoursRequiredRow = jsonData.find(
            (row) => row[0] === "No. Hours Required:"
          );
          const dataValues = jsonData[jsonData.indexOf(dataRow) + 1]; // Next row after headers

          if (
            nameRow &&
            hoursRequiredRow &&
            dataValues &&
            dataValues.length >= 3
          ) {
            const name = nameRow[1] || "";
            const hoursRequired = parseInt(hoursRequiredRow[1] || "0", 10);
            const startPayPeriod = XLSX.SSF.format("yyyy-mm-dd", dataValues[0]);
            const endPayPeriod = XLSX.SSF.format("yyyy-mm-dd", dataValues[1]);
            const hoursRendered = parseInt(dataValues[2] || "0", 10);

            excelData.push({
              name,
              hoursRequired,
              startPayPeriod,
              endPayPeriod,
              hoursRendered,
            });
          }
        }
      });

      if (excelData.length === 0) {
        throw new Error("No valid data found in the Excel file.");
      }

      // Prepare payload for each record and match with existing records
      const payload: UploadPayload[] = excelData.map((data) => {
        const matchedRecord = records.find(
          (r) => r.scholar_name?.toLowerCase() === data.name.toLowerCase()
        );
        const disbDetailId = matchedRecord?.disb_detail_id || 0;

        // Combine startPayPeriod and endPayPeriod into covered_date
        const startDate = new Date(data.startPayPeriod);
        const endDate = new Date(data.endPayPeriod);
        const coveredDate = `${startDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
        })} - ${endDate.toLocaleString("en-US", {
          month: "short",
          day: "2-digit",
          year: "numeric",
        })}`;

        // Calculate amount using the rate per hour, default to 0 if rate is empty
        const rate = parseFloat(ratePerHour) || 0;
        const amount = data.hoursRendered * rate;

        return {
          disb_detail_id: disbDetailId,
          covered_date: coveredDate,
          amount,
          number_of_hours: data.hoursRendered,
          startPayPeriod: data.startPayPeriod,
          endPayPeriod: data.endPayPeriod,
          name: data.name, // Added to preserve name for display
        };
      });

      // ✅ Update the UI immediately (in memory)
      setRecords((prevRecords) =>
        prevRecords.map((record) => {
          const match = payload.find(
            (p) => p.disb_detail_id === record.disb_detail_id
          );
          if (!match) return record;

          // ✅ Overwrite previous file(s) and amount
          return {
            ...record,
            disbursement_amount: match.amount,
            disbursement_files: [
              {
                file_id: Date.now(), // temporary ID
                file_name: `${match.name}_Internship_${match.covered_date}.xlsx`,
                file_type:
                  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                size: 0,
                upload_at: new Date().toISOString(),
              },
            ],
          };
        })
      );

      setMatchedData(payload);
      setIsMatchModalOpen(true);
    } catch (error) {
      console.error("❌ Error uploading Excel:", error);
      setUploadError(
        "Failed to upload Excel file. Please check the file format and try again."
      );
    } finally {
      setIsLoading(false);
      event.target.value = ""; // Reset file input
    }
  };

  // ✅ Confirm Upload from Modal
  const handleConfirmUpload = async () => {
    try {
      setIsLoading(true);

      if (!uploadedFile) {
        setUploadError("No Excel file selected for upload.");
        setIsLoading(false);
        return;
      }

      const filteredData = matchedData.filter((p) => p.disb_detail_id !== 0);

      if (filteredData.length === 0) {
        setUploadError("No matched records to upload.");
        setIsLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("data", JSON.stringify(filteredData));

      const response = await axios.post(
        `${VITE_BACKEND_URL}api/invoice/upload-internship-allowance`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      console.log("✅ Upload response:", response.data);
      await fetchEligibleInternshipAllowance(selectedDate);
      setIsMatchModalOpen(false);
    } catch (error) {
      console.error("❌ Error confirming upload:", error);
      setUploadError("Failed to confirm upload. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async (coveredDate: string) => {
    try {
      const response = await axios.post(
        `${VITE_BACKEND_URL}api/invoice/add-internship-allowance`,
        {
          coveredDate,
          schoolYear,
        }
      );
      console.log(response.data);
      await fetchCoveredDate();
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchCoveredDate();
  }, []);

  console.log(records);

  // 🧾 Internship Allowance Table
  const InternshipTable = () => {
    if (isLoading)
      return (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          No data yet, generate data to see here
        </div>
      );

    if (records.length === 0)
      return (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 shadow-lg p-6">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            No Internship Allowance Data Found
          </p>
          <p className="text-sm text-gray-600">
            There are no internship allowances for {schoolYear} • {semester}
          </p>
        </div>
      );

    return (
      <div className="space-y-4">
        {/* Table Header with Upload Controls */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Period Information */}
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <p className="text-sm font-semibold text-gray-800">
                {schoolYear} • {semester} • {selectedDate || "No date selected"}
              </p>
            </div>

            {/* Upload Controls */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="excel-upload"
                  className={`px-4 py-2 rounded-lg text-sm font-medium shadow-sm cursor-pointer transition-colors ${
                    ratePerHour === ""
                      ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  Upload Excel
                </label>
                <input
                  id="excel-upload"
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleExcelUpload}
                  className="hidden"
                  disabled={ratePerHour === ""}
                />
                <span className="text-sm text-gray-700">
                  Total: <b>{records.length}</b>
                </span>
              </div>
              {uploadError && (
                <span className="text-sm text-red-600">{uploadError}</span>
              )}
            </div>
          </div>
        </div>

        {/* Table Container */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Mobile Cards - Small screens */}
          <div className="block md:hidden">
            <div className="p-4 space-y-3">
              {records
                .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                .map((r) => (
                  <div
                    key={r.disb_detail_id}
                    className="border rounded-lg p-4 bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all duration-200"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {r.student_id}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
                          {r.program}
                        </span>
                      </div>
                      <div className="text-sm font-bold text-gray-900">
                        {r.disbursement_amount
                          ? `₱${r.disbursement_amount.toLocaleString("en-PH", {
                              minimumFractionDigits: 2,
                            })}`
                          : "—"}
                      </div>
                    </div>

                    {/* Student Name */}
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">
                      {r.scholar_name}
                    </h3>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div>
                        <span className="text-gray-500">Campus:</span>
                        <span className="ml-1 font-medium text-gray-900">
                          {r.campus}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Date:</span>
                        <span className="ml-1 font-medium text-blue-700">
                          {r.covered_date}
                        </span>
                      </div>
                    </div>

                    {/* Files */}
                    <div className="border-t border-gray-200 pt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 font-medium">
                          Files
                        </span>
                      </div>
                      {r.disbursement_files &&
                      r.disbursement_files.length > 0 ? (
                        <div className="space-y-1">
                          {r.disbursement_files.map((file) => (
                            <a
                              key={file.file_id}
                              href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-800 text-xs font-medium"
                            >
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                              {file.file_name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-gray-400">
                          <svg
                            className="w-3 h-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                          <span className="text-xs">No files</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tablet View - Medium screens */}
          <div className="hidden md:block lg:hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3 text-left">Student</th>
                    <th className="px-4 py-3 text-left">Program</th>
                    <th className="px-4 py-3 text-left">Campus</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-left">Files</th>
                  </tr>
                </thead>
                <tbody className="text-gray-700">
                  {records
                    .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                    .map((r, index) => (
                      <tr
                        key={r.disb_detail_id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors duration-200`}
                      >
                        <td className="px-4 py-3">
                          <div>
                            <div className="font-mono text-xs text-gray-500">
                              {r.student_id}
                            </div>
                            <div className="font-semibold text-gray-900">
                              {r.scholar_name}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">{r.program}</td>
                        <td className="px-4 py-3">{r.campus}</td>
                        <td className="px-4 py-3 font-semibold text-blue-700">
                          {r.covered_date}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-800">
                          {r.disbursement_amount
                            ? `₱${r.disbursement_amount.toLocaleString(
                                "en-PH",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {r.disbursement_files &&
                          r.disbursement_files.length > 0 ? (
                            r.disbursement_files.map((file) => (
                              <a
                                key={file.file_id}
                                href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:underline truncate max-w-[120px] text-xs"
                                title={file.file_name}
                              >
                                {file.file_name}
                              </a>
                            ))
                          ) : (
                            <span className="text-gray-400 italic text-xs">
                              No file
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Desktop Table - Large screens */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead className="bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3 text-left">Student ID</th>
                    <th className="px-6 py-3 text-left">Scholar Name</th>
                    <th className="px-6 py-3 text-left">Program</th>
                    <th className="px-6 py-3 text-left">Campus</th>
                    <th className="px-6 py-3 text-left">Covered Date</th>
                    <th className="px-6 py-3 text-right">Amount (₱)</th>
                    <th className="px-6 py-3 text-left">File(s)</th>
                  </tr>
                </thead>

                <tbody className="text-gray-700 text-xs sm:text-sm">
                  {records
                    .slice((page - 1) * itemsPerPage, page * itemsPerPage)
                    .map((r, index) => (
                      <tr
                        key={r.disb_detail_id}
                        className={`${
                          index % 2 === 0 ? "bg-white" : "bg-gray-50"
                        } hover:bg-blue-50 transition-colors duration-200`}
                      >
                        <td className="px-6 py-4 font-mono">{r.student_id}</td>
                        <td className="px-6 py-4">{r.scholar_name}</td>
                        <td className="px-6 py-4">{r.program}</td>
                        <td className="px-6 py-4">{r.campus}</td>
                        <td className="px-6 py-4 font-semibold text-blue-700">
                          {r.covered_date}
                        </td>

                        {/* 💰 Amount */}
                        <td className="px-6 py-4 text-right font-semibold text-gray-800">
                          {r.disbursement_amount
                            ? `₱${r.disbursement_amount.toLocaleString(
                                "en-PH",
                                {
                                  minimumFractionDigits: 2,
                                }
                              )}`
                            : "—"}
                        </td>

                        {/* 📎 File(s) */}
                        <td className="px-6 py-4 space-y-1">
                          {r.disbursement_files &&
                          r.disbursement_files.length > 0 ? (
                            r.disbursement_files.map((file) => (
                              <a
                                key={file.file_id}
                                href={`${VITE_BACKEND_URL}api/document/download/${file.file_name}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-blue-600 hover:underline truncate max-w-[180px]"
                                title={file.file_name}
                              >
                                {file.file_name}
                              </a>
                            ))
                          ) : (
                            <span className="text-gray-400 italic">
                              No file
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="px-4 sm:px-6 py-4 bg-gray-50/50 border-t border-gray-200 flex justify-center">
            <PaginationControl
              currentPage={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>
      </div>
    );
  };

  // 🗑️ Delete Modal
  const DeleteModal = () => {
    if (!isDeleteModalOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative space-y-6">
          <button
            onClick={() => {
              setIsDeleteModalOpen(false);
              setErrorMessage(null);
            }}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-gray-900">
              Delete Covered Date
            </h2>
            <p className="text-sm text-gray-600">
              Select a covered date to delete. This action cannot be undone.
            </p>
          </div>

          <div className="space-y-3 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
            {coveredDates.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                No dates available.
              </p>
            ) : (
              coveredDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDateToDelete(date)}
                  className={`w-full text-left px-4 py-3 rounded-md text-sm ${
                    selectedDateToDelete === date
                      ? "bg-red-100 text-red-800 font-medium"
                      : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                  } transition-all duration-200`}
                >
                  {date}
                </button>
              ))
            )}
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{errorMessage}</p>
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => {
                setIsDeleteModalOpen(false);
                setErrorMessage(null);
              }}
              className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!selectedDateToDelete}
              className={`px-5 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                !selectedDateToDelete
                  ? "bg-red-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 📋 Match Modal
  const MatchModal = () => {
    if (!isMatchModalOpen) return null;

    // Separate matched and unmatched data
    const matchedDataFiltered = matchedData.filter(
      (p) => p.disb_detail_id !== 0
    );
    const unmatchedData = matchedData.filter((p) => p.disb_detail_id === 0);

    const totalMatched = matchedDataFiltered.length;
    const totalUnmatched = unmatchedData.length;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  Excel Upload Preview
                </h2>
                <p className="text-sm text-gray-600">
                  Review {totalMatched + totalUnmatched} extracted records.{" "}
                  <span className="font-medium text-green-600">
                    {totalMatched} matched
                  </span>{" "}
                  •{" "}
                  <span className="font-medium text-orange-600">
                    {totalUnmatched} unmatched
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsMatchModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Tabs */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="flex space-x-1">
                <button
                  onClick={() => {}}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-white text-green-700 border border-green-300 shadow-sm"
                >
                  Matched ({totalMatched})
                </button>
                <button
                  onClick={() => {}}
                  className={`px-4 py-2 text-sm font-medium rounded-md bg-white text-orange-700 border border-orange-300 shadow-sm ${
                    totalUnmatched === 0 ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Unmatched ({totalUnmatched})
                </button>
              </div>
            </div>

            {/* Table Container */}
            <div className="flex-1 overflow-auto p-6">
              {matchedDataFiltered.length === 0 &&
              unmatchedData.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <X className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No matching data found
                  </h3>
                  <p className="text-sm text-gray-500">
                    Please check the student names in your Excel file match the
                    existing records.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Matched Records Table */}
                  {matchedDataFiltered.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                        ✅ Matched Records ({matchedDataFiltered.length})
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-green-200 bg-green-50/50">
                        <table className="min-w-full divide-y divide-green-200">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">
                                Covered Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">
                                Hours
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">
                                Amount (₱)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-green-100">
                            {matchedDataFiltered.map((data, index) => (
                              <tr
                                key={index}
                                className="hover:bg-green-50 transition-colors duration-200"
                              >
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {data.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {data.covered_date}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {data.number_of_hours}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  ₱{data.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Unmatched Records Table */}
                  {unmatchedData.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wide">
                        ⚠️ Unmatched Records ({unmatchedData.length})
                      </h4>
                      <div className="overflow-x-auto rounded-lg border border-orange-200 bg-orange-50/50">
                        <table className="min-w-full divide-y divide-orange-200">
                          <thead className="bg-orange-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-900 uppercase tracking-wider">
                                Name
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-900 uppercase tracking-wider">
                                Covered Date
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-900 uppercase tracking-wider">
                                Hours
                              </th>
                              <th className="px-6 py-3 text-left text-xs font-semibold text-orange-900 uppercase tracking-wider">
                                Amount (₱)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-orange-100">
                            {unmatchedData.map((data, index) => (
                              <tr
                                key={index}
                                className="hover:bg-orange-50 transition-colors duration-200"
                              >
                                <td className="px-6 py-4 text-sm text-gray-900">
                                  {data.name}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {data.covered_date}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  {data.number_of_hours}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-700">
                                  ₱{data.amount.toFixed(2)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
            <button
              onClick={() => setIsMatchModalOpen(false)}
              className="px-6 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpload}
              disabled={matchedDataFiltered.length === 0}
              className={`px-6 py-2 text-sm font-medium text-white rounded-md transition-colors ${
                matchedDataFiltered.length === 0
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 hover:bg-green-700"
              }`}
            >
              Confirm Upload
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 🔽 Main Render
  return (
    <div className="px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Header Toolbar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
          {/* Left Section - Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            {coveredDates.length < 4 && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm"
              >
                Generate 15-Day Period
              </button>
            )}
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-sm"
            >
              Delete Covered Date
            </button>
          </div>

          {/* Right Section - Rate Input */}
          <div className="flex items-center gap-3">
            <label
              htmlFor="rate-per-hour"
              className="text-sm font-medium text-gray-700 whitespace-nowrap"
            >
              Rate/Hour (₱):
            </label>
            <input
              id="rate-per-hour"
              type="text"
              inputMode="decimal"
              value={ratePerHour}
              onChange={(e) => {
                const value = e.target.value;

                // ✅ Allow only digits and one decimal point
                if (!/^\d*\.?\d*$/.test(value)) return;

                // ✅ Limit to 7 digits before decimal and 2 after
                if (/^\d{0,7}(\.\d{0,2})?$/.test(value)) {
                  const numeric = parseFloat(value);
                  if (value === "" || isNaN(numeric) || numeric <= 1000000) {
                    setRatePerHour(value);
                  }
                }
              }}
              maxLength={10} // Safety net: 7 digits + "." + 2 decimals
              placeholder="0.00"
              className="w-24 p-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right"
              autoComplete="off"
            />
          </div>
        </div>

        {/* Covered Date Tabs */}
        {coveredDates.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {coveredDates.map((date) => (
                <button
                  key={date}
                  onClick={() => fetchEligibleInternshipAllowance(date)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedDate === date
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {date}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <GeneratePeriodModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGenerate={handleGenerate}
        existingCoveredDates={coveredDates}
      />
      <DeleteModal />
      <MatchModal />

      <InternshipTable />
    </div>
  );
}

export default InternshipAllowanceUpload;
