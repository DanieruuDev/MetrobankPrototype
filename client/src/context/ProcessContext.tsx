import React, { createContext, useCallback, useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

// 🧱 Define the shape of your ProcessInfo
export interface ProcessInfo {
  process_id: number | null;
  current_stage: string;
}

// 🧱 Define the shape of your context value
interface ProcessContextType {
  processInfo: ProcessInfo;
  getProcessInfo: (sySemester: string) => Promise<void>;
  setProcessInfo: React.Dispatch<React.SetStateAction<ProcessInfo>>;
}

// 🧱 Create the context
const ProcessContext = createContext<ProcessContextType | undefined>(undefined);

// 🧱 Provider component
export const ProcessProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [processInfo, setProcessInfo] = useState<ProcessInfo>({
    process_id: null,
    current_stage: "",
  });

  const VITE_BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const getToastPosition = () => {
    return window.innerWidth < 768 ? "bottom-center" : "bottom-right";
  };

  // 🧩 Function to fetch process info
  const getProcessInfo = useCallback(
    async (sySemester: string) => {
      if (!sySemester) return;
      console.log("sample", sySemester);

      const [sy, semPart] = sySemester.split("_");
      const school_year = sy.replace("-", "");

      try {
        const result = await axios.get(
          `${VITE_BACKEND_URL}api/process/${school_year}/${semPart}`
        );

        if (!result || !result.data?.data) {
          toast.warn("No process information found.", {
            position: getToastPosition(),
            autoClose: 3000,
            toastId: "no-process-info",
          });
          console.warn("⚠️ Empty response received:", result);
          return;
        }

        setProcessInfo(result.data.data);
        console.log("✅ Process info fetched:", result.data.data);
      } catch (error) {
        console.error("❌ Error fetching process info:", error);
        toast.error(`Error fetching process info: ${error}`, {
          position: getToastPosition(),
          autoClose: 3000,
          toastId: "process-info-error",
        });
      }
    },
    [VITE_BACKEND_URL]
  );

  return (
    <ProcessContext.Provider
      value={{
        processInfo,
        getProcessInfo,
        setProcessInfo,
      }}
    >
      {children}
    </ProcessContext.Provider>
  );
};

// 🧩 Custom hook for easy access
export const useProcess = () => {
  const context = useContext(ProcessContext);
  if (!context) {
    throw new Error("useProcess must be used within a ProcessProvider");
  }
  return context;
};
