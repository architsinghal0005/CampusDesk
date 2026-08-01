import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';

function ResourceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [resource, setResource] = useState(null);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Booking Form State
  const [purpose, setPurpose] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState('');

  const fetchDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get(`/resources/${id}`);
      setResource(response.data.resource);
      setTodayBookings(response.data.todayBookings);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load resource details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Generate hourly time slots for 8:00 AM to 8:00 PM timeline
  const generateSlots = () => {
    const slots = [];
    const today = new Date();
    today.setMinutes(0, 0, 0);

    for (let hour = 8; hour < 20; hour++) {
      const slotStart = new Date(today);
      slotStart.setHours(hour);

      const slotEnd = new Date(today);
      slotEnd.setHours(hour + 1);

      // Check if slot is booked
      const isBooked = todayBookings.some((b) => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return slotStart < bEnd && slotEnd > bStart;
      });

      // Format ISO strings for local datetime-local input
      const pad = (n) => (n < 10 ? '0' + n : n);
      const startStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(hour)}:00`;
      const endStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}T${pad(hour + 1)}:00`;

      slots.push({
        label: `${hour % 12 || 12}:00 ${hour < 12 ? 'AM' : 'PM'} - ${(hour + 1) % 12 || 12}:00 ${hour + 1 < 12 ? 'AM' : 'PM'}`,
        isBooked,
        startStr,
        endStr
      });
    }
    return slots;
  };

  const handleSlotClick = (slot) => {
    if (slot.isBooked) return;
    setStartTime(slot.startStr);
    setEndTime(slot.endStr);
    setBookingError('');
    setBookingSuccess('');
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookingLoading(true);
    setBookingError('');
    setBookingSuccess('');

    try {
      await api.post('/bookings', {
        resourceId: id,
        purpose,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      });

      setBookingSuccess('Resource booked successfully!');
      setPurpose('');
      fetchDetails();
    } catch (err) {
      // Show backend error message without clearing form
      setBookingError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex items-center justify-center">
        <p className="text-center text-sm text-slate-500">Loading resource details...</p>
      </div>
    );
  }

  if (error || !resource) {
    return (
      <div className="page-shell flex flex-col items-center justify-center">
        <p className="mb-4 max-w-md text-center text-sm text-rose-600">{error || 'Resource not found'}</p>
        <button
          onClick={() => navigate('/resources')}
          className="btn-primary"
        >
          Back to Resources
        </button>
      </div>
    );
  }

  const slots = generateSlots();

  return (
    <div className="page-shell text-slate-800">
      <div className="page-container">
        <button
          onClick={() => navigate('/resources')}
          className="mb-4 inline-flex max-w-full text-sm font-medium text-blue-700 transition hover:text-blue-900"
        >
          ← Back to Resources
        </button>

        {/* Resource Header */}
        <div className="panel mb-6">
          <div className="mb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="max-w-[22rem] text-2xl font-semibold tracking-tight text-slate-900 sm:max-w-none">{resource.name}</h1>
            <span className="badge border-blue-100 bg-blue-50 text-blue-700">
              {resource.category}
            </span>
          </div>
          {resource.location && <p className="mb-1 text-sm text-slate-500">Location: {resource.location}</p>}
          {resource.capacity && <p className="mb-2 text-sm text-slate-500">Capacity: {resource.capacity} seats</p>}
          {resource.description && <p className="mt-2 text-sm leading-relaxed text-slate-600">{resource.description}</p>}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
          {/* Today's Schedule Timeline */}
          <div className="panel">
            <h2 className="section-title mb-2">Today's Schedule (8 AM - 8 PM)</h2>
            <p className="section-note mb-4">Click any available slot to prefill booking time.</p>

            <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
              {slots.map((slot, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={slot.isBooked}
                  onClick={() => handleSlotClick(slot)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition ${
                    slot.isBooked
                      ? 'cursor-not-allowed border-rose-200 bg-rose-50 text-rose-700'
                      : 'cursor-pointer border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  <span className="min-w-0 flex-1 whitespace-normal leading-relaxed">{slot.label}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide">
                    {slot.isBooked ? 'Booked' : 'Available'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Booking Form */}
          <div className="panel flex flex-col justify-between">
            <div>
              <h2 className="section-title mb-4">Book Resource</h2>

              {bookingError && (
                <div className="message-error mb-4 text-xs">
                  {bookingError}
                </div>
              )}

              {bookingSuccess && (
                <div className="message-success mb-4 text-xs">
                  {bookingSuccess}
                </div>
              )}

              <form onSubmit={handleBook} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="field-label" htmlFor="booking-purpose">Purpose / Details</label>
                  <input
                    id="booking-purpose"
                    type="text"
                    required
                    placeholder="e.g. Group study, Project meeting"
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="booking-start-time">Start Time</label>
                  <input
                    id="booking-start-time"
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="field-input"
                  />
                </div>

                <div>
                  <label className="field-label" htmlFor="booking-end-time">End Time</label>
                  <input
                    id="booking-end-time"
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="field-input"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bookingLoading}
                    className="btn-primary mt-2 w-full"
                >
                  {bookingLoading ? 'Booking...' : 'Book Resource'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResourceDetailsPage;
