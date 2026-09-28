export interface FlightSeatPreference {
  preferredPosition: "window" | "aisle" | "middle" | "any";
  preferredClass: "Economy" | "Premium Economy" | "Business";
  extraLegroom: boolean;
  forwardCabin: boolean;
  quietZone: boolean;
}

export interface HotelRoomPreference {
  bedType: "King Bed" | "Twin Beds" | "Queen Bed";
  floorLevel: "High Floor" | "Low Floor" | "Any";
  viewType: "City View" | "Ocean View" | "Garden View" | "Pool View";
  smoking: boolean;
  workDesk: boolean;
  balcony: boolean;
  quietRoom: boolean;
}

export interface UserTravelPreferences {
  flight: FlightSeatPreference;
  hotel: HotelRoomPreference;
  lastUpdated?: string;
}

const STORAGE_KEY = "mmt_user_travel_preferences";

export const DEFAULT_PREFERENCES: UserTravelPreferences = {
  flight: {
    preferredPosition: "window",
    preferredClass: "Economy",
    extraLegroom: true,
    forwardCabin: true,
    quietZone: false,
  },
  hotel: {
    bedType: "King Bed",
    floorLevel: "High Floor",
    viewType: "City View",
    smoking: false,
    workDesk: true,
    balcony: true,
    quietRoom: true,
  },
};

export function getSavedPreferences(): UserTravelPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw);
    return {
      flight: { ...DEFAULT_PREFERENCES.flight, ...(parsed.flight || {}) },
      hotel: { ...DEFAULT_PREFERENCES.hotel, ...(parsed.hotel || {}) },
      lastUpdated: parsed.lastUpdated,
    };
  } catch (e) {
    console.error("Failed to read user travel preferences:", e);
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: Partial<UserTravelPreferences>): UserTravelPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const current = getSavedPreferences();
    const updated: UserTravelPreferences = {
      flight: { ...current.flight, ...(prefs.flight || {}) },
      hotel: { ...current.hotel, ...(prefs.hotel || {}) },
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("mmt_preferences_updated", { detail: updated }));
    return updated;
  } catch (e) {
    console.error("Failed to save user travel preferences:", e);
    return DEFAULT_PREFERENCES;
  }
}
