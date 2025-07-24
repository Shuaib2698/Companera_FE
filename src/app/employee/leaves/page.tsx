// app/employee/leaves/page.tsx
"use client";
import Layout from "@/app/components/Layout";
import Link from "next/link";
import api from "@/lib/api";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import Modal from "@/app/components/Modal";

interface Leave {
  _id: string;
  startDate: string;
  endDate: string;
  type: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
}

interface WFH {
  _id: string;
  date: string;
  reason: string;
  status: string;
  approvedBy?: { name: string };
}

interface User {
  name: string;
  position: string;
  profilePicture: string;
  leaveBalances: {
    casual: number;
    sick: number;
    earned: number;
    bereavement: number;
    compOff: number;
    unpaid: number;
    paternity: number;
    maternity: number;
    wfh: number;
  };
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<Leave[]>([]);
  const [wfhRequests, setWfhRequests] = useState<WFH[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"leaves" | "wfh">("leaves");
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showWFHModal, setShowWFHModal] = useState(false);
  const [leaveForm, setLeaveForm] = useState({
    startDate: "",
    endDate: "",
    type: "casual",
    reason: "",
  });
  const [wfhForm, setWfhForm] = useState({
    date: "",
    reason: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [leavesRes, wfhRes, userRes] = await Promise.all([
          api.get("/leaves/my-leaves"),
          api.get("/wfh/my-wfh"),
          api.get("/users/me"),
        ]);

        setLeaves(leavesRes.data);
        setWfhRequests(wfhRes.data);
        setUser(userRes.data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleLeaveSubmit = async () => {
    try {
      const res = await api.post("/leaves", leaveForm);
      setLeaves([res.data, ...leaves]);
      setShowLeaveModal(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error applying for leave");
    }
  };

  const handleWFHSubmit = async () => {
    try {
      const res = await api.post("/wfh", wfhForm);
      setWfhRequests([res.data, ...wfhRequests]);
      setShowWFHModal(false);
      setError("");
    } catch (err: any) {
      setError(err.response?.data?.message || "Error applying for WFH");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout allowedRoles={["employee"]}>
      <div className="space-y-6">
        {/* User Profile Section */}
        <div className="flex items-center space-x-4 bg-white p-4 rounded-lg shadow">
          <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden">
            {user?.profilePicture ? (
              <img
                src={user.profilePicture}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold text-gray-500">
                {user?.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold">{user?.name}</h2>
            <p className="text-gray-600">{user?.position}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Leave Balances */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Leave & WFH Balances</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border p-4 rounded">
              <h3 className="font-medium">Casual Leave</h3>
              <p>Available: {user?.leaveBalances?.casual ?? 0}</p>
              <p>
                Used:{" "}
                {(user?.leaveBalances?.casual ?? 0) -
                  leaves.filter((l) => l.type === "casual").length}
              </p>
            </div>
            <div className="border p-4 rounded">
              <h3 className="font-medium">Sick Leave</h3>
              <p>Available: {user?.leaveBalances?.sick ?? 0}</p>
              <p>
                Used:{" "}
                {(user?.leaveBalances?.sick ?? 0) -
                  leaves.filter((l) => l.type === "sick").length}
              </p>
            </div>
            <div className="border p-4 rounded">
              <h3 className="font-medium">Earned Leave</h3>
              <p>Available: {user?.leaveBalances?.earned ?? 0}</p>
              <p>
                Used:{" "}
                {(user?.leaveBalances?.earned ?? 0) -
                  leaves.filter((l) => l.type === "earned").length}
              </p>
            </div>
            <div className="border p-4 rounded">
              <h3 className="font-medium">WFH</h3>
              <p>Available: {user?.leaveBalances?.wfh ?? 0}</p>
              <p>Used: {wfhRequests.length}</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
