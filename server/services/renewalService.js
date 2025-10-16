function computeScholarshipStatus(row) {
  const validationFields = [
    "gpa_validation_stat",
    "no_failing_grd_validation",
    "no_other_scholar_validation",
    "goodmoral_validation",
    "no_derogatory_record",
    "full_load_validation",
    "withdrawal_change_course_validation",
    "enrollment_validation",
  ];

  const statuses = validationFields.map((field) => row[field]);

  if (statuses.every((s) => s === "Passed")) return "Passed";
  if (statuses.includes("Failed") && statuses.every((s) => s !== "Not Started"))
    return "Delisted";
  return "Not Started";
}

module.exports = { computeScholarshipStatus };
