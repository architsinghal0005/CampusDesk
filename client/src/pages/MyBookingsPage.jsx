import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.data?.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;

    // Save previous state for optimistic rollback
    const previousBookings = [...bookings];

    // Optimistically update UI
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: 'CANCELLED' } : b))
    );

    try {
      await api.put(`/bookings/${id}/cancel`);
      window.dispatchEvent(new Event('booking-updated'));
    } catch (err) {
      // Rollback state if API call fails
      setBookings(previousBookings);
      alert(err.response?.data?.message || 'Failed to cancel booking. Rolling back changes.');
    }
  };

  // Helper to categorize booking status dynamically
  const getDerivedStatus = (booking) => {
    if (booking.status === 'CANCELLED') return 'CANCELLED';
    const now = new Date();
    const endTime = new Date(booking.endTime);
    if (endTime < now) return 'COMPLETED';
    return 'UPCOMING';
  };

  const filteredBookings = (bookings || []).filter((b) => {
    const derivedStatus = getDerivedStatus(b);
    if (filter === 'UPCOMING') return derivedStatus === 'UPCOMING';
    if (filter === 'COMPLETED') return derivedStatus === 'COMPLETED';
    if (filter === 'CANCELLED') return derivedStatus === 'CANCELLED';
    return true;
  });

  return (
    <div className="page-shell text-slate-800">
      <div className="page-container">
        {/* Top Bar */}
        <div className="page-header">
          <div>
            <h1 className="page-title text-blue-700">My Bookings</h1>
            <p className="page-subtitle">Manage your campus resource reservations</p>
          </div>
          <button
            onClick={() => navigate('/resources')}
            className="btn-secondary text-blue-700"
          >
            ← Back to Resources
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6 flex gap-2 overflow-x-auto border-b border-slate-200 pb-px">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`shrink-0 px-3 pb-3 text-xs font-semibold border-b-2 transition-colors ${
                filter === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {error ? (
          <div className="message-error text-center">
            {error}
          </div>
        ) : loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading bookings...</div>
        ) : filteredBookings.length === 0 ? (
          <div className="empty-state">
            No bookings found for this filter.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredBookings.map((b) => {
              const derivedStatus = getDerivedStatus(b);
              return (
                <div
                  key={b.id}
                  className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <h3 className="max-w-[220px] truncate text-base font-semibold text-slate-900 sm:max-w-none">{b.resource?.name || 'Resource'}</h3>
                      <span className="badge">
                        {b.resource?.category}
                      </span>
                    </div>

                    <p className="mb-1 text-xs text-slate-600">
                      <span className="font-medium text-slate-700">Purpose:</span> {b.purpose || 'N/A'}
                    </p>

                    <p className="text-xs text-slate-500">
                      📅 {new Date(b.startTime).toLocaleString()} — {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex items-end justify-between gap-2 border-t border-slate-100 pt-2 sm:flex-col sm:justify-center sm:border-t-0 sm:pt-0">
                    <span
                      className={`status-badge ${
                        derivedStatus === 'UPCOMING'
                          ? 'status-upcoming'
                          : derivedStatus === 'COMPLETED'
                          ? 'status-completed'
                          : 'status-cancelled'
                      }`}
                    >
                      {derivedStatus}
                    </span>

                    {derivedStatus === 'UPCOMING' && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-xs font-medium text-rose-600 transition hover:text-rose-800 hover:underline"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyBookingsPage;
