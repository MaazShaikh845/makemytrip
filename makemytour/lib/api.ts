/**
 * @file api.ts
 * @description Centralised HTTP client for the MakeMy Tour frontend.
 *
 * All communication with the Spring Boot backend passes through this module.
 * Using a single file as the API boundary means that the base URL, error handling,
 * and header injection are defined in one place and re-used consistently across
 * every page and component.
 *
 * @author Maaz Shaikh
 * @module lib/api
 */

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
  seats: number,
  flightDetails?: {
    airline?: string;
    flightNumber?: string;
    origin?: string;
    destination?: string;
    departureTime?: string;
    arrivalTime?: string;
    price?: number;
    availableSeats?: number;
    classType?: string;
    durationMinutes?: number;
  }
) {
  const response = await axios.post(
    `${BACKEND_URL}/bookings/flight`,
    {
      flightId,
      seats,
      ...(flightDetails || {}),
    },
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

export async function cancelBookingApi(
  userId: string,
  bookingId: string,
  reason: string = "Change of plans"
) {
  const response = await axios.put(
    `${BACKEND_URL}/bookings/${bookingId}/cancel`,
    { reason },
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

export async function deleteFlight(userId: string, flightId: string) {
  const response = await axios.delete(`${BACKEND_URL}/flights/${flightId}`, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
}

export async function deleteHotel(userId: string, hotelId: string) {
  const response = await axios.delete(`${BACKEND_URL}/hotels/${hotelId}`, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return response.data;
}

// ─── Reviews & Ratings API ───────────────────────────────────────────────────

export interface ReviewReply {
  id: string;
  userId: string;
  userName: string;
  userRole?: string;
  comment: string;
  createdAt: string;
}

export interface Review {
  id: string;
  targetType: "HOTEL" | "FLIGHT";
  targetId: string;
  targetName?: string;
  userId: string;
  userName: string;
  userEmail?: string;
  rating: number;
  title?: string;
  comment: string;
  photos: string[];
  helpfulUserIds?: string[];
  helpfulCount: number;
  isFlagged?: boolean;
  flagReason?: string;
  flaggedBy?: string[];
  flagCount?: number;
  replies: ReviewReply[];
  createdAt: string;
  updatedAt?: string;
}

export interface ReviewSummary {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  recommendationRate: number;
}

export async function getReviews(
  targetType: "HOTEL" | "FLIGHT",
  targetId: string
): Promise<ReviewSummary> {
  const res = await axios.get<ReviewSummary>(`${BACKEND_URL}/reviews`, {
    params: { targetType, targetId },
  });
  return res.data;
}

export async function createReview(
  userId: string,
  payload: {
    targetType: "HOTEL" | "FLIGHT";
    targetId: string;
    targetName?: string;
    rating: number;
    title?: string;
    comment: string;
    photos?: string[];
  }
): Promise<Review> {
  const res = await axios.post<Review>(`${BACKEND_URL}/reviews`, payload, {
    headers: {
      "X-User-Id": userId,
    },
  });
  return res.data;
}

export async function replyToReview(
  userId: string,
  reviewId: string,
  comment: string
): Promise<Review> {
  const res = await axios.post<Review>(
    `${BACKEND_URL}/reviews/${reviewId}/reply`,
    { comment },
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return res.data;
}

export async function toggleHelpfulReview(
  userId: string,
  reviewId: string
): Promise<Review> {
  const res = await axios.post<Review>(
    `${BACKEND_URL}/reviews/${reviewId}/helpful`,
    {},
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return res.data;
}

export async function flagReview(
  userId: string,
  reviewId: string,
  reason?: string
): Promise<Review> {
  const res = await axios.post<Review>(
    `${BACKEND_URL}/reviews/${reviewId}/flag`,
    { reason },
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return res.data;
}

export async function getFlaggedReviews(adminUserId: string): Promise<Review[]> {
  const res = await axios.get<Review[]>(`${BACKEND_URL}/reviews/flagged`, {
    headers: {
      "X-User-Id": adminUserId,
    },
  });
  return res.data;
}

export async function unflagReview(
  adminUserId: string,
  reviewId: string
): Promise<Review> {
  const res = await axios.put<Review>(
    `${BACKEND_URL}/reviews/${reviewId}/unflag`,
    {},
    {
      headers: {
        "X-User-Id": adminUserId,
      },
    }
  );
  return res.data;
}

export async function deleteReview(
  userId: string,
  reviewId: string
): Promise<void> {
  await axios.delete(`${BACKEND_URL}/reviews/${reviewId}`, {
    headers: {
      "X-User-Id": userId,
    },
  });
}

export async function deleteReviewReply(
  userId: string,
  reviewId: string,
  replyId: string
): Promise<Review> {
  const res = await axios.delete<Review>(
    `${BACKEND_URL}/reviews/${reviewId}/reply/${replyId}`,
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return res.data;
}

export async function updateReview(
  userId: string,
  reviewId: string,
  payload: {
    rating?: number;
    title?: string;
    comment?: string;
    photos?: string[];
  }
): Promise<Review> {
  const res = await axios.put<Review>(
    `${BACKEND_URL}/reviews/${reviewId}`,
    payload,
    {
      headers: {
        "X-User-Id": userId,
      },
    }
  );
  return res.data;
}

export interface FlightLiveStatus {
  flightId: string;
  flightNumber: string;
  airline: string;
  origin: string;
  destination: string;
  status: "ON_TIME" | "DELAYED" | "BOARDING" | "DEPARTED" | "IN_FLIGHT" | "LANDED" | "GATE_CLOSED" | "CANCELLED" | string;
  statusDisplay: string;
  statusColor: "green" | "amber" | "red" | "blue" | "purple" | string;
  delayMinutes: number;
  delayReason?: string;
  contextNote?: string;
  scheduledDepartureTime: string;
  estimatedDepartureTime: string;
  actualDepartureTime?: string;
  scheduledArrivalTime: string;
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  terminal: string;
  gate: string;
  baggageCarousel: string;
  aircraftModel: string;
  altitudeFt: number;
  speedKnots: number;
  progressPercentage: number;
  remainingMinutes: number;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  currentLat: number;
  currentLng: number;
  lastUpdated: string;
  timeline: {
    timestamp: string;
    title: string;
    description: string;
    severity: "INFO" | "WARNING" | "SUCCESS" | "CRITICAL";
  }[];
}

export interface SimulationPayload {
  status?: string;
  delayMinutes?: number;
  delayReason?: string;
  contextNote?: string;
  gate?: string;
  terminal?: string;
  progressPercentage?: number;
}

export async function getLiveFlightStatuses(flights?: string[]): Promise<FlightLiveStatus[]> {
  const query = flights && flights.length > 0 ? `?flights=${encodeURIComponent(flights.join(","))}` : "";
  const res = await fetch(`${BACKEND_URL}/flights/live-status${query}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch live flight statuses: ${res.status}`);
  return res.json();
}

export async function getSingleFlightLiveStatus(idOrNumber: string): Promise<FlightLiveStatus> {
  const res = await fetch(`${BACKEND_URL}/flights/${encodeURIComponent(idOrNumber)}/live-status`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch flight live status for ${idOrNumber}: ${res.status}`);
  return res.json();
}

export async function simulateFlightUpdate(
  idOrNumber: string,
  payload: SimulationPayload
): Promise<FlightLiveStatus> {
  const res = await axios.post<FlightLiveStatus>(
    `${BACKEND_URL}/flights/${encodeURIComponent(idOrNumber)}/simulate-update`,
    payload
  );
  return res.data;
}

export async function simulateTickTelemetry(): Promise<FlightLiveStatus[]> {
  const res = await axios.post<FlightLiveStatus[]>(`${BACKEND_URL}/flights/simulate-tick`);
  return res.data;
}

export async function simulateWeatherEvent(weatherDescription?: string): Promise<FlightLiveStatus[]> {
  const res = await axios.post<FlightLiveStatus[]>(`${BACKEND_URL}/flights/simulate-weather-event`, {
    weatherDescription: weatherDescription ?? null,
  });
  return res.data;
}
