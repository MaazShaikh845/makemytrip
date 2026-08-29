import axios from "axios";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "https://makemytrip-21z3.onrender.com";

export interface SignupPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  id: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  token: string;
}

export async function signup(
  firstName: string,
  lastName: string,
  phoneNumber: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await axios.post<AuthResponse>(`${BACKEND_URL}/user/signup`, {
    firstName,
    lastName,
    phoneNumber,
    email,
    password,
  });
  return response.data;
}

export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await axios.post<AuthResponse>(`${BACKEND_URL}/user/login`, {
    email,
    password,
  });
  return response.data;
}

export async function getuserbyemail(email: string) {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/user/search?email=${encodeURIComponent(email)}`
    );
    return response.data;
  } catch (error: any) {
    const status = error?.response?.status;
    const message = error?.response?.data?.message;
    if (status === 404) {
      throw new Error(message ?? `No user found with email: ${email}`);
    }
    throw new Error(message ?? "Failed to search user.");
  }
}

export const getflights = async () => {
  const res = await fetch(`${BACKEND_URL}/flights`);
  if (!res.ok) throw new Error(`Failed to fetch flights: ${res.status}`);
  return res.json() as Promise<any[]>;
};

export const gethotels = async () => {
  const res = await fetch(`${BACKEND_URL}/hotels`);
  if (!res.ok) throw new Error(`Failed to fetch hotels: ${res.status}`);
  return res.json() as Promise<any[]>;
};

export const gethotelbyid = async (id: string) => {
  const res = await fetch(`${BACKEND_URL}/hotels/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch hotel ${id}: ${res.status}`);
  return res.json() as Promise<any>;
};

export async function addflight(
  userId: string | undefined,
  airline: string,
  flightNumber: string,
  origin: string,
  destination: string,
  departureTime: string,
  arrivalTime: string,
  price: number,
  availableSeats: number,
  classType: string,
  durationMinutes: number
) {
  const response = await axios.post(
    `${BACKEND_URL}/flights`,
    {
      airline,
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      classType,
      durationMinutes,
    },
    {
      headers: {
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    }
  );
  return response.data;
}

export async function editflight(
  userId: string | undefined,
  id: string | undefined,
  airline: string,
  flightNumber: string,
  origin: string,
  destination: string,
  departureTime: string,
  arrivalTime: string,
  price: number,
  availableSeats: number,
  classType: string,
  durationMinutes: number
) {
  const response = await axios.put(
    `${BACKEND_URL}/flights/${id}`,
    {
      airline,
      flightNumber,
      origin,
      destination,
      departureTime,
      arrivalTime,
      price,
      availableSeats,
      classType,
      durationMinutes,
    },
    {
      headers: {
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    }
  );
  return response.data;
}

export async function addhotel(
  userId: string | undefined,
  name: string,
  city: string,
  address: string,
  pricePerNight: number,
  starRating: number,
  availableRooms: number,
  amenities: string
) {
  const response = await axios.post(
    `${BACKEND_URL}/hotels`,
    {
      name,
      city,
      address,
      pricePerNight,
      starRating,
      availableRooms,
      amenities,
    },
    {
      headers: {
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    }
  );
  return response.data;
}

export async function edithotel(
  userId: string | undefined,
  id: string | undefined,
  name: string,
  city: string,
  address: string,
  pricePerNight: number,
  starRating: number,
  availableRooms: number,
  amenities: string
) {
  const response = await axios.put(
    `${BACKEND_URL}/hotels/${id}`,
    {
      name,
      city,
      address,
      pricePerNight,
      starRating,
      availableRooms,
      amenities,
    },
    {
      headers: {
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    }
  );
  return response.data;
}

export async function bookFlightApi(
  userId: string,
  flightId: string,
  seats: number
) {
  const response = await axios.post(
    `${BACKEND_URL}/bookings/flight`,
    { flightId, seats },
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return response.data;
}

export async function bookHotelApi(
  userId: string,
  hotelId: string,
  rooms: number,
  nights: number = 1
) {
  const response = await axios.post(
    `${BACKEND_URL}/bookings/hotel`,
    { hotelId, rooms, nights },
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return response.data;
}

export async function getMyBookings(userId: string) {
  const response = await axios.get(`${BACKEND_URL}/bookings/my`, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
}

export async function cancelBookingApi(userId: string, bookingId: string) {
  const response = await axios.put(
    `${BACKEND_URL}/bookings/${bookingId}/cancel`,
    {},
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return response.data;
}

export async function updateUserProfile(
  userId: string,
  firstName: string,
  lastName: string,
  phoneNumber: string
) {
  const response = await axios.put(
    `${BACKEND_URL}/user/${userId}`,
    {
      firstName,
      lastName,
      phoneNumber,
    }
  );
  return response.data;
}
