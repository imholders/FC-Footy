/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Redis } from "@upstash/redis";
import { useEffect, useState } from "react";

const redis = new Redis({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});

export default function AdminPage() {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [responseMessage, setResponseMessage] = useState("");
  const [totalNumberOfUsers, setTotalNumberOfUsers] = useState(0);

  const [loading, setLoading] = useState(false);

async function getTotalNumberOfUsers(): Promise<number> {
  const keys = await redis.keys("fc-footy:user:*");

  return keys.length;
}
  const fetchTotalNumberOfUsers = async () => {
    
    const totalNumber = await getTotalNumberOfUsers();
    setTotalNumberOfUsers(totalNumber);
  }
  
  useEffect(() => {
    fetchTotalNumberOfUsers();
  }, []);

  const handleAuthenticate = () => {
    if (apiKeyInput === process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY) {
      setAuthenticated(true);
    } else {
      alert("Invalid Pass key");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResponseMessage(""); // Clear previous response message
    setLoading(true); // Start loading
    try {
      const response = await fetch("/api/notify-all", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.NEXT_PUBLIC_NOTIFICATION_API_KEY || "",
        },
        body: JSON.stringify({ title, body }),
      });

      if (response.ok) {
        setResponseMessage("Notification sent successfully!");
        setTitle("");
        setBody("");
        
      } else {
        const errorData = await response.json();
        setResponseMessage(`Error: ${errorData.error || "Failed to send notification"}`);
      }
    } catch (error: any) {
      setResponseMessage(`Error: ${error.message}`);
    } finally {
        setLoading(false); // Stop loading
      }

  };

  if (!authenticated) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="w-full max-w-sm p-6 bg-white rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-700 text-center mb-4">
            Admin Login
          </h2>
          <input
            type="password"
            placeholder="Enter Pass Key"
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full text-black p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-darkPurple"
          />
          <button
            onClick={handleAuthenticate}
            className="w-full mt-4 bg-deepPink text-white p-2 rounded-md hover:bg-darkPurple"
          >
            Authenticate
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 bg-white rounded-lg shadow-md">

        <div className="mb-6 p-4 bg-blue-100 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-black">Dashboard Analytics</h3>
          <div className="mt-2">
            <p className="text-sm text-black">Total Number of Users: {totalNumberOfUsers}</p>
          </div>
        </div>

        <h2 className="text-2xl font-semibold text-black text-center mb-6">
          Send Notification to All Users
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black">
              Notification Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full p-2 border text-black rounded-md focus:outline-none focus:ring-2 focus:bg-gray-200"
            />
          </div>
          <div>
            <label htmlFor="body" className="block text-sm font-medium text-black">
              Notification Body
            </label>
            <textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={4}
              className="w-full p-2 border text-black rounded-md focus:outline-none focus:ring-2 focus:bg-gray-200"
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-deepPink text-white p-2 rounded-md hover:bg-darkPurple flex items-center justify-center"
            disabled={loading}
          >
            {loading ? (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              "Send Notification"
            )}
          </button>
        </form>
        {responseMessage && (
          <div
            className={`mt-4 text-center p-2 rounded-md ${
              responseMessage.startsWith("Error")
                ? "bg-red-100 text-red-600"
                : "bg-green-100 text-green-600"
            }`}
          >
            {responseMessage}
          </div>
        )}
      </div>
    </div>
  );
}
