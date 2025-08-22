type ApproverRole =
  | "Applicant"
  | "Scholar"
  | "STI Registrar"
  | "MB Foundation"
  | "MBS HEAD"
  | "MB Financial"
  | "MB HR"
  | "SYSTEM_ADMIN";

interface Approver {
  id: number;
  name: ApproverRole;
}

interface ApprovalWorkflow {
  requestType: string;
  description: string;
  requiredApprovers: Approver[];
}

export const requiredApprovers: { [key: string]: ApprovalWorkflow } = {
  CR: {
    requestType: "CR",
    description: "Contract Renewal",
    requiredApprovers: [
      { id: 5, name: "MBS HEAD" },
      { id: 7, name: "MB HR" },
    ],
  },

  SFP: {
    requestType: "SFP",
    description: "Scholarship Fee Processing",
    requiredApprovers: [
      { id: 3, name: "STI Registrar" },
      { id: 4, name: "MB Foundation" },
      { id: 5, name: "MBS HEAD" },
    ],
  },

  SFD: {
    requestType: "SFD",
    description: "Scholarship Fee Disbursement",
    requiredApprovers: [
      { id: 6, name: "MB Financial" },
      { id: 5, name: "MBS HEAD" },
    ],
  },

  AFP: {
    requestType: "AFP",
    description: "Allowance Fee Processing",
    requiredApprovers: [
      { id: 3, name: "STI Registrar" },
      { id: 5, name: "MBS HEAD" },
    ],
  },

  AFD: {
    requestType: "AFD",
    description: "Allowance Fee Disbursement",
    requiredApprovers: [
      { id: 6, name: "MB Financial" },
      { id: 5, name: "MBS HEAD" },
    ],
  },

  TF: {
    requestType: "TF",
    description: "Thesis Fee",
    requiredApprovers: [
      { id: 3, name: "STI Registrar" },
      { id: 4, name: "MB Foundation" },
    ],
  },

  TFD: {
    requestType: "TFD",
    description: "Thesis Fee Disbursement",
    requiredApprovers: [{ id: 6, name: "MB Financial" }],
  },

  IA: {
    requestType: "IA",
    description: "Internship Allowance",
    requiredApprovers: [
      { id: 3, name: "STI Registrar" },
      { id: 7, name: "MB HR" },
      { id: 5, name: "MBS HEAD" },
    ],
  },

  IAD: {
    requestType: "IAD",
    description: "Internship Allowance Disbursement",
    requiredApprovers: [
      { id: 6, name: "MB Financial" },
      { id: 5, name: "MBS HEAD" },
    ],
  },
};
