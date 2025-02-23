"use client";

import { useState } from "react";

export default function Pinata() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const uploadFile = async () => {
    if (!file) {
      alert("No file selected");
      return;
    }

    try {
      setUploading(true);
      const data = new FormData();
      data.set("file", file);

      const uploadRequest = await fetch("/api/files", {
        method: "POST",
        body: data,
      });

      const response = await uploadRequest.json();
      console.log("✅ File uploaded to IPFS:", response.ipfsUrl);
      // Handle IPFS response directly here if needed

    } catch (e) {
      console.error("❌ Error uploading file:", e);
      alert("Trouble uploading file");
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  return (
    <main className="w-full min-h-screen m-auto flex flex-col justify-center items-center space-y-4">
      <input type="file" onChange={handleChange} />
      <button
        type="button"
        disabled={uploading}
        onClick={uploadFile}
        className={`px-4 py-2 rounded-lg ${
          uploading ? "bg-gray-400" : "bg-blue-500 text-white"
        }`}
      >
        {uploading ? "Uploading..." : "Upload"}
      </button>
    </main>
  );
}
