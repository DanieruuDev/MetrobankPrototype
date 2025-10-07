import React, { useState } from "react";
import SearchWithDropdownFilter from "./SearchWithDropdownFilter";

// Example usage component to demonstrate the search with dropdown filter component
const SearchWithDropdownFilterDemo: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [schoolYear, setSchoolYear] = useState("");
  const [branch, setBranch] = useState("");
  const [yearLevel, setYearLevel] = useState("");

  const schoolYearOptions = [
    { value: "2023-2024", label: "2023-2024" },
    { value: "2022-2023", label: "2022-2023" },
    { value: "2021-2022", label: "2021-2022" },
  ];

  const branchOptions = [
    { value: "Main", label: "Main Campus" },
    { value: "North", label: "North Campus" },
    { value: "South", label: "South Campus" },
  ];

  const yearLevelOptions = [
    { value: "1", label: "1st Year" },
    { value: "2", label: "2nd Year" },
    { value: "3", label: "3rd Year" },
    { value: "4", label: "4th Year" },
  ];

  return (
    <div className="p-6 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">
          Search with Dropdown Filter Component Demo
        </h2>

        {/* Mobile Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">
            Mobile Layout (Horizontal)
          </h3>
          <div className="max-w-sm mx-auto">
            <SearchWithDropdownFilter
              searchValue={searchTerm}
              onSearchChange={setSearchTerm}
              searchPlaceholder="Search by name or student ID..."
              filters={{
                schoolYear: {
                  value: schoolYear,
                  options: schoolYearOptions,
                  onChange: setSchoolYear,
                  label: "School Year",
                },
                branch: {
                  value: branch,
                  options: branchOptions,
                  onChange: setBranch,
                  label: "Branch",
                },
                yearLevel: {
                  value: yearLevel,
                  options: yearLevelOptions,
                  onChange: setYearLevel,
                  label: "Year Level",
                },
              }}
            />
          </div>
        </div>

        {/* Desktop Preview */}
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Desktop Layout</h3>
          <SearchWithDropdownFilter
            searchValue={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search by name or student ID..."
            filters={{
              schoolYear: {
                value: schoolYear,
                options: schoolYearOptions,
                onChange: setSchoolYear,
                label: "School Year",
              },
              branch: {
                value: branch,
                options: branchOptions,
                onChange: setBranch,
                label: "Branch",
              },
              yearLevel: {
                value: yearLevel,
                options: yearLevelOptions,
                onChange: setYearLevel,
                label: "Year Level",
              },
            }}
          />
        </div>

        {/* Display current values */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg">
          <h4 className="font-medium mb-2">Current Values:</h4>
          <p>Search: {searchTerm || "None"}</p>
          <p>School Year: {schoolYear || "None"}</p>
          <p>Branch: {branch || "None"}</p>
          <p>Year Level: {yearLevel || "None"}</p>
        </div>
      </div>
    </div>
  );
};

export default SearchWithDropdownFilterDemo;
