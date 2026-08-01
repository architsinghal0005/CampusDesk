import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('RESOURCES'); // 'RESOURCES' | 'BOOKINGS'

  // Resources state
  const [resources, setResources] = useState([]);
  const [resourceSearch, setResourceSearch] = useState('');
  const [showResourceModal, setShowResourceModal] = useState(false);
  const [editResourceId, setEditResourceId] = useState(null);
  const [resourceFormData, setResourceFormData] = useState({
    name: '',
    category: '',
    capacity: '',
    location: '',
    description: ''
  });

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [selectedResource, setSelectedResource] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'ADMIN') {
      navigate('/resources');
    }
  }, []);

  // Fetch Resources
  const fetchResources = async () => {
    setLoading(true);
    try {
      const response = await api.get('/resources', {
        params: { search: resourceSearch, limit: 100 }
      });
      setResources(response.data.resources);
    } catch (err) {
      console.error('Failed to fetch resources:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Bookings
  const fetchBookings = async () => {
    setLoading(true);
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.bookings);
    } catch (err) {
      console.error('Failed to fetch bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'RESOURCES') {
      fetchResources();
    } else {
      fetchResources(); // to populate resource filter options
      fetchBookings();
    }
  }, [activeTab, resourceSearch]);

  // Resource CRUD Actions
  const handleOpenResourceModal = (res = null) => {
    if (res) {
      setEditResourceId(res.id);
      setResourceFormData({
        name: res.name || '',
        category: res.category || '',
        capacity: res.capacity || '',
        location: res.location || '',
        description: res.description || ''
      });
    } else {
      setEditResourceId(null);
      setResourceFormData({ name: '', category: '', capacity: '', location: '', description: '' });
    }
    setShowResourceModal(true);
  };

  const handleSaveResource = async (e) => {
    e.preventDefault();
    try {
      if (editResourceId) {
        await api.put(`/resources/${editResourceId}`, resourceFormData);
      } else {
        await api.post('/resources', resourceFormData);
      }
      setShowResourceModal(false);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save resource');
    }
  };

  const handleDeleteResource = async (id) => {
    if (!window.confirm('Delete this resource?')) return;
    try {
      await api.delete(`/resources/${id}`);
      fetchResources();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await api.put(`/bookings/${id}/cancel`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  // Filter bookings
  const filteredBookings = bookings.filter((b) => {
    if (selectedResource && b.resourceId !== Number(selectedResource)) return false;
    if (selectedStatus && b.status !== selectedStatus) return false;
    if (selectedDate) {
      const bDate = new Date(b.startTime).toISOString().split('T')[0];
      if (bDate !== selectedDate) return false;
    }
    return true;
  });

  return (
    <div className="page-shell text-slate-800">
      <div className="page-container-wide">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-blue-700">Admin Dashboard</h1>
            <p className="page-subtitle">Logged in as {user.email} (ADMIN)</p>
          </div>
          <button
            onClick={() => navigate('/resources')}
            className="btn-secondary self-start text-xs sm:text-sm"
          >
            ← Public View
          </button>
        </div>

        {/* Top Tabs */}
        <div className="mb-6 flex gap-4 overflow-x-auto border-b border-slate-200 pb-px">
          <button
            onClick={() => setActiveTab('RESOURCES')}
            className={`shrink-0 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'RESOURCES' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Manage Resources
          </button>
          <button
            onClick={() => setActiveTab('BOOKINGS')}
            className={`shrink-0 pb-3 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === 'BOOKINGS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            All Bookings
          </button>
        </div>

        {/* TAB 1: RESOURCES CRUD */}
        {activeTab === 'RESOURCES' && (
          <div>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <input
                id="admin-resource-search"
                type="text"
                placeholder="Search resources..."
                value={resourceSearch}
                onChange={(e) => setResourceSearch(e.target.value)}
                className="field-input w-full sm:w-72"
              />
              <button
                onClick={() => handleOpenResourceModal()}
                className="btn-primary w-full self-start text-xs sm:w-auto sm:self-auto sm:text-sm"
              >
                + Add Resource
              </button>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading resources...</div>
            ) : (
              <div className="table-shell overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="table-head border-b border-slate-200">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">Name</th>
                      <th className="p-4">Category</th>
                      <th className="p-4">Location</th>
                      <th className="p-4">Capacity</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {resources.map((r) => (
                      <tr key={r.id} className="transition hover:bg-slate-50/80">
                        <td className="p-4 font-mono text-xs text-slate-500">{r.id}</td>
                        <td className="p-4 font-medium text-slate-900">
                          <div className="max-w-[220px] truncate sm:max-w-none">{r.name}</div>
                        </td>
                        <td className="p-4"><span className="badge border-blue-100 bg-blue-50 text-blue-700">{r.category}</span></td>
                        <td className="p-4 text-xs text-slate-500">
                          <div className="max-w-[180px] truncate">{r.location || '-'}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-500">{r.capacity || '-'}</td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button onClick={() => handleOpenResourceModal(r)} className="text-sm font-medium text-blue-700 transition hover:text-blue-900">Edit</button>
                            <button onClick={() => handleDeleteResource(r.id)} className="text-sm font-medium text-rose-600 transition hover:text-rose-800">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: BOOKINGS MANAGEMENT */}
        {activeTab === 'BOOKINGS' && (
          <div>
            {/* Filters */}
            <div className="surface-soft mb-4 grid grid-cols-1 gap-3 p-4 sm:grid-cols-3">
              <div>
                <label className="field-label">Filter by Resource</label>
                <select
                  id="admin-filter-resource"
                  value={selectedResource}
                  onChange={(e) => setSelectedResource(e.target.value)}
                  className="field-select"
                >
                  <option value="">All Resources</option>
                  {resources.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label">Filter by Status</label>
                <select
                  id="admin-filter-status"
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="field-select"
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>

              <div>
                <label className="field-label">Filter by Date</label>
                <input
                  id="admin-filter-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="field-input"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-8 text-center text-sm text-slate-500">Loading bookings...</div>
            ) : (
              <div className="table-shell overflow-x-auto">
                <table className="w-full min-w-[900px] text-left text-sm">
                  <thead className="table-head border-b border-slate-200">
                    <tr>
                      <th className="p-4">User</th>
                      <th className="p-4">Resource</th>
                      <th className="p-4">Purpose</th>
                      <th className="p-4">Start Time</th>
                      <th className="p-4">End Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="transition hover:bg-slate-50/80">
                        <td className="p-4 text-xs text-slate-600">
                          <div className="max-w-[180px] truncate">{b.user?.name || b.user?.email}</div>
                        </td>
                        <td className="p-4 font-medium text-slate-900">
                          <div className="max-w-[220px] truncate">{b.resource?.name}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-600">
                          <div className="max-w-[220px] truncate">{b.purpose || '-'}</div>
                        </td>
                        <td className="p-4 text-xs text-slate-600">{new Date(b.startTime).toLocaleString()}</td>
                        <td className="p-4 text-xs text-slate-600">{new Date(b.endTime).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`status-badge ${
                            b.status === 'CANCELLED'
                              ? 'status-cancelled'
                              : b.status === 'COMPLETED'
                              ? 'status-completed'
                              : 'status-upcoming'
                          }`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {b.status !== 'CANCELLED' && (
                            <button onClick={() => handleCancelBooking(b.id)} className="text-sm font-medium text-rose-600 transition hover:text-rose-800 hover:underline">
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Modal for Resource Add/Edit */}
        {showResourceModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="panel w-full max-w-md">
              <h2 className="mb-4 text-lg font-semibold tracking-tight text-slate-900">{editResourceId ? 'Edit Resource' : 'Add Resource'}</h2>
              <form onSubmit={handleSaveResource} className="space-y-4">
                <div>
                  <label className="field-label" htmlFor="admin-resource-name">Name</label>
                  <input id="admin-resource-name" type="text" required value={resourceFormData.name} onChange={(e) => setResourceFormData({ ...resourceFormData, name: e.target.value })} className="field-input" />
                </div>
                <div>
                  <label className="field-label" htmlFor="admin-resource-category">Category</label>
                  <input id="admin-resource-category" type="text" required value={resourceFormData.category} onChange={(e) => setResourceFormData({ ...resourceFormData, category: e.target.value })} className="field-input" />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="field-label" htmlFor="admin-resource-capacity">Capacity</label>
                    <input id="admin-resource-capacity" type="number" value={resourceFormData.capacity} onChange={(e) => setResourceFormData({ ...resourceFormData, capacity: e.target.value })} className="field-input" />
                  </div>
                  <div>
                    <label className="field-label" htmlFor="admin-resource-location">Location</label>
                    <input id="admin-resource-location" type="text" value={resourceFormData.location} onChange={(e) => setResourceFormData({ ...resourceFormData, location: e.target.value })} className="field-input" />
                  </div>
                </div>
                <div>
                  <label className="field-label" htmlFor="admin-resource-description">Description</label>
                  <textarea id="admin-resource-description" value={resourceFormData.description} onChange={(e) => setResourceFormData({ ...resourceFormData, description: e.target.value })} className="field-textarea" rows={3} />
                </div>
                <div className="flex flex-col-reverse gap-2 pt-3 border-t border-slate-100 sm:flex-row sm:justify-end">
                  <button type="button" onClick={() => setShowResourceModal(false)} className="btn-secondary w-full sm:w-auto">Cancel</button>
                  <button type="submit" className="btn-primary w-full sm:w-auto">Save</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDashboardPage;
