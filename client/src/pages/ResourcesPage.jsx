import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function ResourcesPage() {
  const [resources, setResources] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state for Admin Create / Update modal
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    capacity: "",
    location: "",
    description: "",
  });

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const isAdmin = user.role === "ADMIN";

  const fetchResources = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/resources", {
        params: { search, category, page, limit: 6 },
      });
      const { resources, pagination } = response.data.data;

      setResources(resources || []);
      setPagination(pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      console.error("Failed to fetch resources:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load resources. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources(1);
  }, [search, category]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditId(resource.id);
      setFormData({
        name: resource.name || "",
        category: resource.category || "",
        capacity: resource.capacity || "",
        location: resource.location || "",
        description: resource.description || "",
      });
    } else {
      setEditId(null);
      setFormData({
        name: "",
        category: "",
        capacity: "",
        location: "",
        description: "",
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editId) {
        await api.put(`/resources/${editId}`, formData);
      } else {
        await api.post("/resources", formData);
      }
      setShowModal(false);
      fetchResources(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Action failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?"))
      return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources(pagination.page);
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  return (
    <div className="page-shell text-slate-800">
      <div className="page-container-wide">
        {/* Top Header / Dashboard Navbar */}
        <header className="page-header">
          <div>
            <h1 className="page-title text-blue-700">CampusDesk</h1>
            <p className="page-subtitle">
              Logged in as {user.email || "User"} ({user.role || "STUDENT"})
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button
              onClick={() => navigate("/bookings")}
              className="btn-secondary text-xs sm:text-sm"
            >
              My Bookings
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => navigate("/admin")}
                  className="btn-muted text-xs text-blue-700 sm:text-sm"
                >
                  Admin Panel
                </button>
                <button
                  onClick={() => handleOpenModal()}
                  className="btn-primary text-xs sm:text-sm"
                >
                  + Add Resource
                </button>
              </>
            )}
            <button
              onClick={handleLogout}
              className="btn-secondary text-xs sm:text-sm"
            >
              Logout
            </button>
          </div>
        </header>

        {/* Search & Category Filter Bar */}
        <div className="surface mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex-1">
            <input
              id="resource-search"
              type="text"
              placeholder="Search by name, location, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="field-input"
            />
          </div>
          <div className="w-full sm:w-56 lg:w-48">
            <select
              id="resource-category-filter"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="field-select"
            >
              <option value="">All Categories</option>
              <option value="Lab">Lab</option>
              <option value="Hall">Hall</option>
              <option value="Equipment">Equipment</option>
              <option value="Classroom">Classroom</option>
            </select>
          </div>
        </div>

        {/* Content Area: Error State | Loading State | Empty State | Resource Cards */}
        {error ? (
          <div className="message-error my-6 text-center">
            <p className="text-sm font-medium">{error}</p>
            <button
              onClick={() => fetchResources(1)}
              className="btn-danger mt-4"
            >
              Retry
            </button>
          </div>
        ) : loading ? (
          <div className="panel my-6 text-center">
            <div className="mx-auto mb-3 inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
            <p className="text-sm text-slate-500">Loading resources...</p>
          </div>
        ) : (resources || []).length === 0? (
          <div className="empty-state my-6">
            <p className="text-base font-medium text-slate-700">
              No resources found
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Try adjusting your search or category filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 mb-6 md:grid-cols-2 xl:grid-cols-3">
            {(resources || []).map((res) => (
              <div key={res.id} className="card flex flex-col justify-between">
                <div>
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <h3 className="text-base font-semibold leading-tight text-slate-900">
                      {res.name}
                    </h3>
                    <span className="badge shrink-0 border-blue-100 bg-blue-50 text-blue-700">
                      {res.category}
                    </span>
                  </div>
                  {res.location && (
                    <p className="mb-1 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        Location:
                      </span>{" "}
                      {res.location}
                    </p>
                  )}
                  {res.capacity && (
                    <p className="mb-3 text-xs text-slate-500">
                      <span className="font-medium text-slate-600">
                        Capacity:
                      </span>{" "}
                      {res.capacity} seats
                    </p>
                  )}
                  {res.description && (
                    <p className="mb-4 text-xs leading-relaxed text-slate-600">
                      {res.description}
                    </p>
                  )}
                </div>

                <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    onClick={() => navigate(`/resources/${res.id}`)}
                    className="text-sm font-medium text-blue-700 transition hover:text-blue-900"
                  >
                    View Schedule & Book →
                  </button>

                  {isAdmin && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleOpenModal(res)}
                        className="text-sm font-medium text-slate-600 transition hover:text-slate-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="text-sm font-medium text-rose-600 transition hover:text-rose-800"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && !error && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 py-4">
            <button
              disabled={pagination.page <= 1}
              onClick={() => fetchResources(pagination.page - 1)}
              className="btn-secondary px-3.5 py-2 text-xs"
            >
              Previous
            </button>
            <span className="text-xs font-medium text-slate-600">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchResources(pagination.page + 1)}
              className="btn-secondary px-3.5 py-2 text-xs"
            >
              Next
            </button>
          </div>
        )}

        {/* Admin Create / Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="panel w-full max-w-md p-6 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">
                {editId ? "Edit Resource" : "Add Resource"}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="resource-name">
                    Name
                  </label>
                  <input
                    id="resource-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="field-input"
                  />
                </div>
                <div>
                  <label
                    className="field-label"
                    htmlFor="resource-category-input"
                  >
                    Category
                  </label>
                  <input
                    id="resource-category-input"
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    placeholder="e.g. Lab, Hall, Classroom, Equipment"
                    className="field-input"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="field-label" htmlFor="resource-capacity">
                      Capacity
                    </label>
                    <input
                      id="resource-capacity"
                      type="number"
                      value={formData.capacity}
                      onChange={(e) =>
                        setFormData({ ...formData, capacity: e.target.value })
                      }
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="resource-location">
                      Location
                    </label>
                    <input
                      id="resource-location"
                      type="text"
                      value={formData.location}
                      onChange={(e) =>
                        setFormData({ ...formData, location: e.target.value })
                      }
                      className="field-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="resource-description">
                    Description
                  </label>
                  <textarea
                    id="resource-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="field-textarea"
                    rows={3}
                  />
                </div>
                <div className="flex flex-col-reverse gap-2 pt-3 border-t border-slate-100 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary w-full sm:w-auto"
                  >
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResourcesPage;
