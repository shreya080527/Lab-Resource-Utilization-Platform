import API from "./api";

/*
|--------------------------------------------------------------------------
| Booking APIs
|--------------------------------------------------------------------------
*/

export const createBooking = (bookingData) => {
    return API.post("/api/bookings/create", bookingData);
};

export const getResearcherDashboard = (userId) => {
    return API.get(`/api/bookings/my-dashboard/${userId}`);
};

export const getCalendar = (userId, start, end) => {
    return API.get("/api/bookings/calendar", {
        params: {
            userId,
            start,
            end,
        },
    });
};

export const updateBookingStatus = (bookingId, status) => {
    return API.post(
        `/api/bookings/${bookingId}/status`,
        null,
        {
            params: {
                status,
            },
        }
    );
};

/*
|--------------------------------------------------------------------------
| Equipment APIs
|--------------------------------------------------------------------------
| Your backend teammate may change these later.
| We'll only update these URLs if needed.
*/

export const getAllEquipment = () => {
    return API.get("/api/equipment/get-all-equipments");
};