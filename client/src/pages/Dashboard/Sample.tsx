import React, { useState } from "react";
import UploadGradesModal from "../../components/renewal/UploadGradesModal";

const Sample = () => {
  const [open, setOpen] = useState(false);
  return (
    <div className="p-6">
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Upload Grades
      </button>

      {open && <UploadGradesModal onClose={() => setOpen(false)} />}
    </div>
  );
};

export default Sample;
