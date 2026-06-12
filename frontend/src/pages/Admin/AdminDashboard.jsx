export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-display">Overview Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: "0" },
          { label: "Total Dealers", value: "0" },
          { label: "Total Properties", value: "0" },
          { label: "Active Enquiries", value: "0" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-border shadow-soft">
            <p className="text-sm text-muted-foreground font-semibold">{stat.label}</p>
            <p className="text-3xl font-bold font-display mt-2">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
