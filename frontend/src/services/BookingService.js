import API from "./api";

// Create a new booking
export const createBooking = (bookingData) => {
    return API.post("/api/bookings/create", bookingData);
};

// Get bookings for calendar view
export const getCalendarBookings = (userId, start, end) => {
    return API.get("/api/bookings/calendar", {
        params: {
            userId,
            start,
            end,
        },
    });
};

// Update booking status
export const updateBookingStatus = (bookingId, status) => {
    return API.post(`/api/bookings/${bookingId}/status`, null, {
        params: {
            status,
        },
    });
};

// Get researcher dashboard data
export const getResearcherDashboard = (userId) => {
    return API.get(`/api/bookings/my-dashboard/${userId}`);
};