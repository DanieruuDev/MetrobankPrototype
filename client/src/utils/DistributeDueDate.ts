const distributeDueDates = (
  dueDate: string,
  approvers: { id: number; email: string; role: string }[]
) => {
  const totalApprovers = approvers.length;
  const today = new Date();
  const due = new Date(dueDate);

  const totalDays = Math.ceil(
    (due.getTime() - today.getTime()) / (1000 * 3600 * 24)
  );

  const daysPerApprover = Math.floor(totalDays / totalApprovers);

  const remainingDays = totalDays % totalApprovers;

  const distributedDueDates = approvers.map((approver, index) => {
    const endDate = new Date(today);

    endDate.setDate(endDate.getDate() + (index + 1) * daysPerApprover);

    if (index < remainingDays) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const formattedDate = `${
      endDate.getMonth() + 1
    }/${endDate.getDate()}/${endDate.getFullYear()}`;

    return {
      ...approver,
      dueDateForApproval: formattedDate, // Return the due date in MM/DD/YYYY format
    };
  });

  return distributedDueDates;
};

export default distributeDueDates;
