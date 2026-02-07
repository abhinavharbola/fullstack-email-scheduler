"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import { format } from "date-fns";
import { LogOut, Plus, RefreshCw, Send, Clock, AlertCircle, CheckCircle } from "lucide-react";

type EmailJob = {
  id: string;
  recipient: string;
  subject: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  scheduledAt: string;
  sentAt?: string;
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [emails, setEmails] = useState<EmailJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"scheduled" | "sent">("scheduled");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    recipient: "",
    subject: "",
    body: "",
    scheduledTime: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") router.push("/");
    if (status === "authenticated") fetchEmails();
  }, [status, router]);

  const fetchEmails = async () => {
    try {
      setLoading(true);
      const res = await api.get("/emails");
      setEmails(res.data);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/emails/schedule", formData);
      setIsModalOpen(false);
      setFormData({ recipient: "", subject: "", body: "", scheduledTime: "" });
      fetchEmails();
      alert("Email Scheduled Successfully!");
    } catch (err) {
      alert("Failed to schedule email");
    }
  };

  if (status === "loading") return <div className="flex h-screen items-center justify-center">Loading...</div>;

  const filteredEmails = emails.filter((email) => 
    activeTab === "scheduled" ? email.status === "PENDING" : email.status !== "PENDING"
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-2">
            <div className="rounded-lg bg-blue-600 p-2 text-white">
              <Send size={20} />
            </div>
            <span className="text-xl font-bold text-gray-800">ReachInbox</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              Welcome, {session?.user?.name}
            </span>
            <button onClick={() => signOut()} className="text-gray-500 hover:text-red-500">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            <Plus size={20} />
            <span>Compose Email</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex space-x-1 rounded-lg bg-gray-200 p-1 w-fit">
          <button
            onClick={() => setActiveTab("scheduled")}
            className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "scheduled" ? "bg-white text-blue-600 shadow" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock size={16} />
            <span>Scheduled</span>
          </button>
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium ${
              activeTab === "sent" ? "bg-white text-blue-600 shadow" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CheckCircle size={16} />
            <span>Sent / Failed</span>
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">To</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  {activeTab === "scheduled" ? "Scheduled For" : "Sent At"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr><td colSpan={4} className="p-6 text-center">Loading...</td></tr>
              ) : filteredEmails.length === 0 ? (
                <tr><td colSpan={4} className="p-6 text-center text-gray-500">No emails found.</td></tr>
              ) : (
                filteredEmails.map((email) => (
                  <tr key={email.id}>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">{email.recipient}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">{email.subject}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                      {email.scheduledAt ? format(new Date(email.scheduledAt), "PPp") : "-"}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm">
                      <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                        email.status === "COMPLETED" ? "bg-green-100 text-green-800" : 
                        email.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {email.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      {/* Compose Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-bold">Schedule New Email</h3>
            <form onSubmit={handleSchedule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Recipient</label>
                <input
                  type="email"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.recipient}
                  onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Subject</label>
                <input
                  type="text"
                  required
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Body</label>
                <textarea
                  required
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Schedule Time (Optional)</label>
                <input
                  type="datetime-local"
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={formData.scheduledTime}
                  onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                />
                <p className="mt-1 text-xs text-gray-500">Leave blank to send immediately.</p>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}