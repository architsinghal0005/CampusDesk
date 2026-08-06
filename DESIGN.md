# Design Decisions

## 1. Overlap-check logic

Whenever a booking request is received, the backend checks whether another booking for the same resource already exists whose time overlaps with the requested interval.

The overlap condition is:
existing.startTime < newEndTime
AND
existing.endTime > newStartTime

If any booking satisfies this condition, the request is rejected.
Back-to-back bookings are allowed because they do not overlap.

Example:

Booking A:
10:00 AM – 11:00 AM

Booking B:
11:00 AM – 12:00 PM

Since Booking A ends exactly when Booking B starts, there is no overlap, so Booking B is allowed.

## 2. When can a race condition occur?

A race condition can occur when two users submit bookings for the same resource at almost the exact same time.
Both requests may check availability before either booking has been written to the database.
If both checks succeed simultaneously, duplicate bookings could occur.
To solve this in production, I would:

- use database transactions,
- lock the resource while booking,
- or enforce overlap checks inside a transaction with an appropriate isolation level.

## 3. How does the app stay logged in after refresh?

After successful OTP verification, the backend issues a JWT.
The frontend stores the token in localStorage.
When the application reloads, it reads the stored JWT, restores the authentication state, and includes the token in future API requests.
The backend validates the token before allowing protected operations.

## 4. One issue I debugged

During deployment, I attempted to replace console OTP with email-based OTP using Resend.
The free Resend account only allows sending emails to the verified email address, so OTP delivery failed for other users.
After checking the deployment logs and API responses, I confirmed that the limitation was caused by the free Resend account rather than my implementation.
For the final project, I switched back to console OTP for development and documented that production deployments should use a verified email provider.