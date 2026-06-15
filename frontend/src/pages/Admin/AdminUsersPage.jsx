import { useEffect, useState } from "react";
import { Users, Search, Loader2, Calendar, ShieldAlert, X, Home, Phone, Mail, UserCheck, Shield, Eye, Trash2, Heart } from "lucide-react";
import api from "@/utils/api";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Selected User Drawer details state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProperties, setUserProperties] = useState([]);
  const [userEnquiries, setUserEnquiries] = useState([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [updatingUserStatus, setUpdatingUserStatus] = useState(false);

  // Add User Form state
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState("user");
  const [newUserPassword, setNewUserPassword] = useState("");
  const [creatingUser, setCreatingUser] = useState(false);

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? All listed properties and callback enquiries will be permanently deleted.")) return;
    try {
      const { data } = await api.delete(`/users/${userId}`);
      if (data.success) {
        toast.success(data.message || "User account deleted successfully!");
        setUsers(prev => prev.filter(u => u._id !== userId));
        if (selectedUser?._id === userId) {
          setSelectedUser(null);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserPhone.trim()) {
      toast.error("Name and Phone number are required.");
      return;
    }
    if ((newUserRole === 'admin' || newUserRole === 'superadmin') && !newUserPassword.trim()) {
      toast.error("Password is required for administrators.");
      return;
    }
    setCreatingUser(true);
    try {
      const { data } = await api.post("/users", {
        name: newUserName,
        phone: newUserPhone,
        email: newUserEmail || undefined,
        role: newUserRole,
        password: newUserPassword || undefined
      });
      if (data.success) {
        toast.success(data.message || "User created successfully!");
        setUsers(prev => [data.data, ...prev]);
        // Reset and close
        setShowAddUserModal(false);
        setNewUserName("");
        setNewUserPhone("");
        setNewUserEmail("");
        setNewUserRole("user");
        setNewUserPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user.");
    } finally {
      setCreatingUser(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenDetails = async (u) => {
    setSelectedUser(u);
    setDetailsLoading(true);
    setUserProperties([]);
    setUserEnquiries([]);

    try {
      // 1. Fetch properties and filter for user
      const { data: propData } = await api.get("/properties");
      if (propData.success) {
        const matchingProps = propData.data.filter(
          (p) => p.dealer === u._id || p.contactNumber === u.phone || p.dealerPhone === u.phone
        );
        setUserProperties(matchingProps);
      }

      // 2. Fetch enquiries and filter for user
      const { data: enqData } = await api.get("/enquiries");
      if (enqData.success) {
        const matchingEnquiries = enqData.data.filter(
          (e) => e.buyerPhone === u.phone || e.dealerPhone === u.phone
        );
        setUserEnquiries(matchingEnquiries);
      }
    } catch (err) {
      console.error("Failed to fetch user connections:", err);
      toast.error("Failed to sync connected properties/enquiries.");
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    setUpdatingUserStatus(true);
    try {
      const { data } = await api.put(`/users/${userId}`, { role: newRole });
      if (data.success) {
        setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: newRole } : u)));
        setSelectedUser((prev) => (prev?._id === userId ? { ...prev, role: newRole } : prev));
        toast.success(`User role updated to ${newRole}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update role");
    } finally {
      setUpdatingUserStatus(false);
    }
  };

  const handleToggleActiveState = async (u) => {
    const nextActiveState = !u.isActive;
    setUpdatingUserStatus(true);
    try {
      const { data } = await api.put(`/users/${u._id}`, { isActive: nextActiveState });
      if (data.success) {
        setUsers((prev) => prev.map((item) => (item._id === u._id ? { ...item, isActive: nextActiveState } : item)));
        setSelectedUser((prev) => (prev?._id === u._id ? { ...prev, isActive: nextActiveState } : prev));
        toast.success(`User ${nextActiveState ? "Activated" : "Suspended"} successfully`);
      }
    } catch (err) {
      toast.error("Failed to toggle status");
    } finally {
      setUpdatingUserStatus(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const nameMatch = u.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const phoneMatch = u.phone?.includes(searchQuery);
    const roleMatch = roleFilter === "all" || u.role === roleFilter;
    return (nameMatch || phoneMatch) && roleMatch;
  });

  return (
    <div className="space-y-8 relative">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-slate-900 tracking-tight">
            User Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Review details, modify authorization roles, and drill down into individual profiles.
          </p>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white hover:bg-slate-800 text-sm font-bold rounded-xl transition-all shadow-sm"
        >
          + Add User
        </button>
      </div>

      {/* Filters & Actions Panel */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 hover:bg-slate-100/50 focus:bg-white border-none focus:ring-2 focus:ring-slate-950 rounded-xl transition-all outline-none"
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
          {["all", "user", "dealer", "admin"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                roleFilter === role
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50"
              }`}
            >
              {role === "all" ? "All Roles" : `${role}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center h-48 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-sm text-slate-500 font-medium">Fetching registries...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50/75 border-b border-slate-100 text-xs uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Phone Number</th>
                  <th className="px-6 py-4">System Role</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">KYC Vetting</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">
                      No matching user records found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-slate-50/40 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{u.name || "Unnamed"}</span>
                            {u.role === "admin" && (
                              <span className="text-[10px] text-red-500 font-bold uppercase flex items-center gap-1 mt-0.5">
                                <ShieldAlert className="h-3 w-3" /> Root access
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        +91 {u.phone}
                      </td>
                      <td className="px-6 py-4 font-bold text-xs uppercase">
                        {u.role}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          u.isActive !== false
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {u.isActive !== false ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.role === "dealer" ? (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider ${
                            u.kycStatus === "approved"
                              ? "text-emerald-600"
                              : u.kycStatus === "rejected"
                              ? "text-red-500"
                              : "text-amber-500"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              u.kycStatus === "approved"
                                ? "bg-emerald-500"
                                : u.kycStatus === "rejected"
                                ? "bg-red-500"
                                : "bg-amber-500"
                            }`} />
                            {u.kycStatus || "Not Initiated"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenDetails(u)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-3 text-xs font-semibold transition-all shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Profile
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                            title="Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Profile Drawer (Right Drawer) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setSelectedUser(null)} />
          <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
            <div className="pointer-events-auto w-screen max-w-xl transform bg-white shadow-2xl transition-all flex flex-col h-full border-l border-slate-100">
              
              {/* Drawer Header */}
              <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950 font-display">User Profile Details</h2>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Profile Brief */}
                <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="h-16 w-16 rounded-full bg-slate-200 text-slate-700 font-bold text-2xl flex items-center justify-center">
                    {selectedUser.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{selectedUser.name || "Unnamed"}</h3>
                    <p className="text-sm font-mono text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" /> +91 {selectedUser.phone}
                    </p>
                    {selectedUser.email && (
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5" /> {selectedUser.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Operations Control Area */}
                <div className="space-y-4 border border-slate-150 p-4 rounded-2xl bg-white">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Administrative Actions</h4>
                  
                  <div className="flex flex-wrap gap-4 items-center justify-between pt-1">
                    <div>
                      <span className="text-xs text-slate-500 font-medium">Role assignment</span>
                      <div className="flex items-center gap-2 mt-1.5">
                        {["user", "dealer", "admin"].map((r) => (
                          <button
                            key={r}
                            onClick={() => handleUpdateUserRole(selectedUser._id, r)}
                            disabled={updatingUserStatus || selectedUser.role !== r}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition ${
                              selectedUser.role === r
                                ? "bg-slate-900 text-white shadow-sm cursor-default"
                                : "bg-slate-50 text-slate-350 cursor-not-allowed opacity-50"
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-medium">Account status</span>
                      <div className="mt-1.5">
                        <button
                          onClick={() => handleToggleActiveState(selectedUser)}
                          disabled={updatingUserStatus}
                          className={`w-full px-4 py-1.5 rounded-lg text-xs font-bold uppercase border transition ${
                            selectedUser.isActive !== false
                              ? "border-red-200 text-red-600 bg-red-50/20 hover:bg-red-50"
                              : "border-emerald-200 text-emerald-600 bg-emerald-50/20 hover:bg-emerald-50"
                          }`}
                        >
                          {selectedUser.isActive !== false ? "Block Account" : "Activate Account"}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-slate-500 font-medium">Danger Zone</span>
                      <div className="mt-1.5">
                        <button
                          onClick={() => handleDeleteUser(selectedUser._id)}
                          className="w-full px-4 py-1.5 rounded-lg text-xs font-bold uppercase border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-all flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete Account
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connections Data (Properties & Enquiries) */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Activity Log &amp; Inventory</h4>

                  {detailsLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin" />
                      <span className="text-xs">Fetching portfolio and leads...</span>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      
                      {/* Properties (Dealer only) */}
                      {selectedUser.role === "dealer" && (
                        <div className="space-y-3">
                          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                            <Home className="h-4 w-4 text-slate-400" />
                            Listed Properties ({userProperties.length})
                          </span>

                          {userProperties.length === 0 ? (
                            <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                              No property listings found for this dealer.
                            </p>
                          ) : (
                            <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                              {userProperties.map((p) => (
                                <div key={p._id || p.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                                  <div className="flex flex-col min-w-0">
                                    <span className="font-semibold text-slate-800 truncate">{p.title}</span>
                                    <span className="text-[10px] text-slate-400 mt-0.5">{p.locality}, {p.city}</span>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                                    p.verified ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                                  }`}>
                                    {p.verified ? "Verified" : "Pending"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Enquiries Received (if dealer) or Sent (if user) */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5">
                          <Mail className="h-4 w-4 text-slate-400" />
                          {selectedUser.role === "dealer" ? "Received Customer Leads" : "Sent Callbacks"} ({userEnquiries.length})
                        </span>

                        {userEnquiries.length === 0 ? (
                          <p className="text-xs text-slate-400 bg-slate-50 p-4 rounded-xl text-center">
                            No callback logs found.
                          </p>
                        ) : (
                          <div className="grid gap-2 max-h-48 overflow-y-auto pr-1">
                            {userEnquiries.map((e) => (
                              <div key={e._id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 text-xs space-y-1">
                                <div className="flex justify-between items-center font-semibold text-slate-800">
                                  <span>{selectedUser.role === "dealer" ? `From: ${e.buyerName}` : `To: Dealer (${e.dealerPhone})`}</span>
                                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-bold ${
                                    e.status === "Closed" ? "bg-slate-100 text-slate-400" : "bg-amber-50 text-amber-700"
                                  }`}>
                                    {e.status || "Pending"}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-500 italic">"{e.message}"</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={() => setShowAddUserModal(false)} />
          
          <div className="relative bg-white rounded-3xl border border-slate-100 max-w-md w-full p-6 shadow-xl space-y-6 z-10 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-bold text-slate-900">Create User Registry</h3>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Kunal Sahuji"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 rounded-xl transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Phone Number (10 digits) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-semibold">+91</span>
                  <input
                    required
                    type="tel"
                    pattern="[6-9][0-9]{9}"
                    placeholder="9876543210"
                    value={newUserPhone}
                    onChange={(e) => setNewUserPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    className="w-full pl-11 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 rounded-xl transition-all outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. kunal@example.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 rounded-xl transition-all outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Registry Role *</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 rounded-xl transition-all outline-none font-semibold text-slate-700"
                >
                  <option value="user">User (Buyer)</option>
                  <option value="dealer">Dealer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {(newUserRole === 'admin' || newUserRole === 'superadmin') && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="text-xs font-semibold text-slate-500 block mb-1">Password *</label>
                  <input
                    required
                    type="password"
                    placeholder="Password for admin login"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 focus:bg-white focus:border-slate-950 focus:ring-1 focus:ring-slate-950 rounded-xl transition-all outline-none font-medium"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5"
                >
                  {creatingUser && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
