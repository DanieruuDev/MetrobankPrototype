import { useEffect } from "react";
import { useNavigate, useLocation, usePrompt } from "react-router-dom";

function useUnsavedChanges(hasEdits: boolean) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!hasEdits) return;

    const handleWindowClose = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handleWindowClose);

    return () => window.removeEventListener("beforeunload", handleWindowClose);
  }, [hasEdits]);

  usePrompt(
    "You have unsaved changes. Do you want to discard them?",
    hasEdits
  );
}

export useUnsavedChanges