package com.makemytrip.flight.status;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.makemytrip.flight.Flight;
import com.makemytrip.flight.FlightRepository;

@Service
public class FlightLiveStatusService {

    private final FlightRepository flightRepository;
    // In-memory cache for live telemetry state and user simulations
    private final Map<String, FlightLiveStatus> statusCache = new ConcurrentHashMap<>();
    private final Random rng = new Random();

    private static final DateTimeFormatter ISO_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    // ─── Airport Coordinate Registry ─────────────────────────────────────────
    private static final Map<String, double[]> AIRPORT_COORDS = new HashMap<>();
    static {
        AIRPORT_COORDS.put("DEL", new double[]{28.5562, 77.1000});
        AIRPORT_COORDS.put("NEW DELHI", new double[]{28.5562, 77.1000});
        AIRPORT_COORDS.put("DELHI", new double[]{28.5562, 77.1000});
        AIRPORT_COORDS.put("BOM", new double[]{19.0896, 72.8656});
        AIRPORT_COORDS.put("MUMBAI", new double[]{19.0896, 72.8656});
        AIRPORT_COORDS.put("MUMABI", new double[]{19.0896, 72.8656});
        AIRPORT_COORDS.put("BLR", new double[]{13.1986, 77.7066});
        AIRPORT_COORDS.put("BENGALURU", new double[]{13.1986, 77.7066});
        AIRPORT_COORDS.put("BANGALORE", new double[]{13.1986, 77.7066});
        AIRPORT_COORDS.put("HYD", new double[]{17.2403, 78.4294});
        AIRPORT_COORDS.put("HYDERABAD", new double[]{17.2403, 78.4294});
        AIRPORT_COORDS.put("MAA", new double[]{12.9941, 80.1709});
        AIRPORT_COORDS.put("CHENNAI", new double[]{12.9941, 80.1709});
        AIRPORT_COORDS.put("CCU", new double[]{22.6547, 88.4467});
        AIRPORT_COORDS.put("KOLKATA", new double[]{22.6547, 88.4467});
        AIRPORT_COORDS.put("GOI", new double[]{15.3800, 73.8314});
        AIRPORT_COORDS.put("GOA", new double[]{15.3800, 73.8314});
        AIRPORT_COORDS.put("DXB", new double[]{25.2532, 55.3657});
        AIRPORT_COORDS.put("DUBAI", new double[]{25.2532, 55.3657});
        // Additional airports
        AIRPORT_COORDS.put("COK", new double[]{10.1520, 76.4019});
        AIRPORT_COORDS.put("KOCHI", new double[]{10.1520, 76.4019});
        AIRPORT_COORDS.put("COCHIN", new double[]{10.1520, 76.4019});
        AIRPORT_COORDS.put("AMD", new double[]{23.0771, 72.6344});
        AIRPORT_COORDS.put("AHMEDABAD", new double[]{23.0771, 72.6344});
        AIRPORT_COORDS.put("PNQ", new double[]{18.5822, 73.9197});
        AIRPORT_COORDS.put("PUNE", new double[]{18.5822, 73.9197});
        AIRPORT_COORDS.put("JAI", new double[]{26.8242, 75.8122});
        AIRPORT_COORDS.put("JAIPUR", new double[]{26.8242, 75.8122});
        AIRPORT_COORDS.put("SXR", new double[]{33.9871, 74.7742});
        AIRPORT_COORDS.put("SRINAGAR", new double[]{33.9871, 74.7742});
    }

    // Weather delay context pool
    private static final List<String[]> WEATHER_SCENARIOS = Arrays.asList(
        new String[]{"Heavy monsoon rain and low visibility at origin airport causing ATC ground stop.", "Airport operations limited. Passengers advised to stay at gate area."},
        new String[]{"Dense fog advisory issued at destination. ILS Category III operations in effect.", "All inbound flights on holding pattern. Expect 45-90 minute wave delays."},
        new String[]{"Severe thunderstorm cell crossing flight corridor. Safety diversion in progress.", "Flight crew monitoring weather radar. Route re-evaluation underway."},
        new String[]{"Strong crosswinds at destination exceeding safe landing limits for current aircraft type.", "Alternate airport identified. Updates will follow every 20 minutes."},
        new String[]{"Hailstorm alert at departure gate area. Ground crews temporarily halted for safety.", "Pre-flight exterior inspection will resume once storm clears."}
    );

    public FlightLiveStatusService(FlightRepository flightRepository) {
        this.flightRepository = flightRepository;
    }

    // ─── Public API ──────────────────────────────────────────────────────────

    public List<FlightLiveStatus> getAllStatuses(List<String> flightIdsOrNumbers) {
        List<Flight> allFlights = flightRepository.findAll();
        List<FlightLiveStatus> result = new ArrayList<>();

        for (Flight flight : allFlights) {
            FlightLiveStatus status = getOrCreateStatus(flight);
            if (flightIdsOrNumbers == null || flightIdsOrNumbers.isEmpty()) {
                result.add(status);
            } else {
                boolean matches = flightIdsOrNumbers.stream().anyMatch(filter ->
                        (flight.getId() != null && flight.getId().equalsIgnoreCase(filter)) ||
                        (flight.getFlightNumber() != null && flight.getFlightNumber().equalsIgnoreCase(filter))
                );
                if (matches) {
                    result.add(status);
                }
            }
        }
        return result;
    }

    public Optional<FlightLiveStatus> getStatus(String idOrNumber) {
        if (idOrNumber == null || idOrNumber.isBlank()) return Optional.empty();

        // Check cache first
        for (FlightLiveStatus cached : statusCache.values()) {
            if (idOrNumber.equalsIgnoreCase(cached.getFlightId()) ||
                idOrNumber.equalsIgnoreCase(cached.getFlightNumber())) {
                return Optional.of(cached);
            }
        }

        // Search repository
        Optional<Flight> byId = flightRepository.findById(idOrNumber);
        if (byId.isPresent()) {
            return Optional.of(getOrCreateStatus(byId.get()));
        }

        for (Flight f : flightRepository.findAll()) {
            if (idOrNumber.equalsIgnoreCase(f.getFlightNumber())) {
                return Optional.of(getOrCreateStatus(f));
            }
        }

        return Optional.empty();
    }

    public FlightLiveStatus updateStatusSimulation(String idOrNumber, SimulationRequest req) {
        FlightLiveStatus status = getStatus(idOrNumber).orElseThrow(() ->
            new IllegalArgumentException("Flight not found with ID or flight number: " + idOrNumber));

        String nowStr = LocalDateTime.now().format(ISO_FORMATTER);

        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            status.setStatus(req.getStatus().toUpperCase());
        }

        if (req.getDelayMinutes() != null) {
            status.setDelayMinutes(req.getDelayMinutes());
            // Dynamically recalculate estimated departure & arrival times
            adjustSchedulesForDelay(status, req.getDelayMinutes());
        }

        if (req.getDelayReason() != null && !req.getDelayReason().isBlank()) {
            status.setDelayReason(req.getDelayReason());
        } else if ("ON_TIME".equalsIgnoreCase(req.getStatus())) {
            status.setDelayReason(null);
        }

        if (req.getContextNote() != null && !req.getContextNote().isBlank()) {
            status.setContextNote(req.getContextNote());
        }

        if (req.getGate() != null && !req.getGate().isBlank()) {
            status.setGate(req.getGate());
        }

        if (req.getTerminal() != null && !req.getTerminal().isBlank()) {
            status.setTerminal(req.getTerminal());
        }

        if (req.getProgressPercentage() != null) {
            status.setProgressPercentage(Math.max(0, Math.min(100, req.getProgressPercentage())));
            updateCoordinatesForProgress(status);
        }

        // Handle weather delay scenario injection
        if ("WEATHER_DELAY".equalsIgnoreCase(req.getStatus())) {
            status.setStatus("DELAYED");
            String[] scenario = WEATHER_SCENARIOS.get(rng.nextInt(WEATHER_SCENARIOS.size()));
            status.setDelayReason(scenario[0]);
            status.setContextNote(scenario[1]);
            int weatherDelayMins = 30 + rng.nextInt(60); // 30-90 min
            status.setDelayMinutes(weatherDelayMins);
            adjustSchedulesForDelay(status, weatherDelayMins);
        }

        // Handle gate closed
        if ("GATE_CLOSED".equalsIgnoreCase(req.getStatus())) {
            status.setStatus("GATE_CLOSED");
            if (req.getContextNote() == null || req.getContextNote().isBlank()) {
                status.setContextNote("Gate doors have been closed. Flight is preparing for pushback.");
            }
        }

        // Handle cancellation
        if ("CANCELLED".equalsIgnoreCase(req.getStatus())) {
            status.setStatus("CANCELLED");
            status.setProgressPercentage(0);
            status.setAltitudeFt(0);
            status.setSpeedKnots(0);
            if (req.getDelayReason() == null || req.getDelayReason().isBlank()) {
                status.setDelayReason("Flight cancelled due to operational reasons. Passengers will be rebooked on the next available service.");
            }
            if (req.getContextNote() == null || req.getContextNote().isBlank()) {
                status.setContextNote("Please proceed to the airline helpdesk for rebooking assistance.");
            }
        }

        // Refresh human readable display
        refreshStatusDisplayAndColor(status);
        status.setLastUpdated(nowStr);

        // Append to timeline
        String eventTitle = buildEventTitle(status, req);
        String eventDesc = req.getDelayReason() != null && !req.getDelayReason().isBlank() ?
                req.getDelayReason() : (status.getContextNote() != null ? status.getContextNote() :
                "Live operational update received from airport operations center.");
        String severity = determineSeverity(status);

        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(nowStr, eventTitle, eventDesc, severity));

        statusCache.put(status.getFlightId(), status);
        return status;
    }

    /**
     * Simulates a weather delay event across all (or a subset of) flights simultaneously.
     */
    public List<FlightLiveStatus> simulateWeatherEvent(String weatherDescription) {
        List<FlightLiveStatus> all = getAllStatuses(null);
        String nowStr = LocalDateTime.now().format(ISO_FORMATTER);
        String[] scenario = WEATHER_SCENARIOS.get(rng.nextInt(WEATHER_SCENARIOS.size()));
        String reason = weatherDescription != null && !weatherDescription.isBlank() ? weatherDescription : scenario[0];
        String note = scenario[1];

        for (FlightLiveStatus status : all) {
            // Only affect ground flights (not already in-air or landed)
            String st = status.getStatus();
            boolean isGround = "ON_TIME".equalsIgnoreCase(st) || "BOARDING".equalsIgnoreCase(st) ||
                               "DELAYED".equalsIgnoreCase(st) || "GATE_CLOSED".equalsIgnoreCase(st);
            if (!isGround) continue;

            int delayMins = 30 + rng.nextInt(45);
            status.setStatus("DELAYED");
            status.setDelayMinutes(delayMins);
            status.setDelayReason(reason);
            status.setContextNote(note);
            adjustSchedulesForDelay(status, delayMins);
            refreshStatusDisplayAndColor(status);
            status.setLastUpdated(nowStr);
            status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(nowStr,
                "⛈ Weather Delay – " + formatDelayDisplay(delayMins), reason, "WARNING"));
            statusCache.put(status.getFlightId(), status);
        }
        return all;
    }

    /**
     * Advances simulated flight tracking clock.
     * Produces realistic BOARDING→DEPARTED→IN_FLIGHT→LANDED chain.
     * Adds ETA drift for in-flight flights to simulate realistic variability.
     */
    public List<FlightLiveStatus> simulateTick() {
        List<FlightLiveStatus> all = getAllStatuses(null);
        String nowStr = LocalDateTime.now().format(ISO_FORMATTER);

        for (FlightLiveStatus status : all) {
            String st = status.getStatus() != null ? status.getStatus().toUpperCase() : "ON_TIME";

            switch (st) {
                case "IN_FLIGHT":
                case "DEPARTED": {
                    int nextProg = Math.min(100, status.getProgressPercentage() + 4 + rng.nextInt(4));
                    status.setProgressPercentage(nextProg);
                    updateCoordinatesForProgress(status);

                    // Realistic cruising telemetry variation
                    status.setAltitudeFt(33000 + rng.nextInt(4000));
                    status.setSpeedKnots(440 + rng.nextInt(80));
                    int remainingMins = Math.max(0, (int) Math.round((100 - nextProg) * 1.25));
                    status.setRemainingMinutes(remainingMins);

                    // ETA drift: ±3 min variance to simulate real-world variability
                    int drift = rng.nextInt(7) - 3; // -3 to +3
                    if (drift != 0) {
                        adjustEtaByMinutes(status, drift);
                    }

                    if (nextProg >= 100) {
                        status.setStatus("LANDED");
                        status.setStatusDisplay("Landed — Arrived at Gate");
                        status.setStatusColor("green");
                        status.setAltitudeFt(0);
                        status.setSpeedKnots(0);
                        status.setRemainingMinutes(0);
                        status.setActualArrivalTime(nowStr);
                        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                            nowStr, "✅ Flight Landed Safely",
                            "Aircraft has touched down and is taxiing to terminal gate.", "SUCCESS"));
                    } else {
                        status.setStatusDisplay("In Flight (" + nextProg + "%)");
                        status.setStatusColor("purple");
                    }
                    break;
                }

                case "BOARDING": {
                    // 60% chance to transition to GATE_CLOSED → DEPARTED
                    if (rng.nextInt(10) < 6) {
                        status.setStatus("GATE_CLOSED");
                        status.setStatusDisplay("Gate Closed — Pushback");
                        status.setStatusColor("blue");
                        status.setProgressPercentage(8);
                        status.setContextNote("Doors closed. Aircraft pushing back from gate " + status.getGate() + ".");
                        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                            nowStr, "Gate Closed – Pushback Initiated",
                            "All passengers boarded. Gate doors sealed.", "SUCCESS"));
                    }
                    break;
                }

                case "GATE_CLOSED": {
                    // Transition to DEPARTED
                    status.setStatus("DEPARTED");
                    status.setStatusDisplay("Departed — Airborne");
                    status.setStatusColor("purple");
                    status.setProgressPercentage(12);
                    status.setAltitudeFt(5000 + rng.nextInt(10000));
                    status.setSpeedKnots(200 + rng.nextInt(150));
                    status.setActualDepartureTime(nowStr);
                    status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                        nowStr, "✈ Aircraft Departed",
                        "Flight airborne. Climbing to cruising altitude.", "INFO"));
                    break;
                }

                case "DELAYED": {
                    // Small chance (15%) of recovering to ON_TIME from minor delays
                    if (status.getDelayMinutes() <= 30 && rng.nextInt(100) < 15) {
                        status.setStatus("ON_TIME");
                        status.setDelayMinutes(0);
                        status.setDelayReason(null);
                        status.setContextNote("Delay resolved. Flight back on schedule.");
                        adjustSchedulesForDelay(status, 0);
                        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                            nowStr, "✅ Delay Resolved – Back On Schedule",
                            "Operations normalized. Flight proceeding on original schedule.", "SUCCESS"));
                    }
                    // Small chance (8%) of delay escalation
                    else if (rng.nextInt(100) < 8 && status.getDelayMinutes() < 120) {
                        int extra = 15 + rng.nextInt(16);
                        int newDelay = status.getDelayMinutes() + extra;
                        status.setDelayMinutes(newDelay);
                        adjustSchedulesForDelay(status, newDelay);
                        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                            nowStr, "⚠ Delay Updated — +" + extra + " min",
                            "ATC has issued an extended holding instruction. Revised departure slot assigned.", "WARNING"));
                    }
                    break;
                }

                case "ON_TIME": {
                    // Small chance (10%) of spontaneous minor delay
                    if (rng.nextInt(100) < 10) {
                        int spontaneousDelay = 15 + rng.nextInt(21);
                        status.setStatus("DELAYED");
                        status.setDelayMinutes(spontaneousDelay);
                        status.setDelayReason("Late arrival of inbound aircraft from previous sector.");
                        status.setContextNote("Turnaround team en route. Expected to be brief.");
                        adjustSchedulesForDelay(status, spontaneousDelay);
                        status.getTimeline().add(0, new FlightLiveStatus.StatusEvent(
                            nowStr, "⚠ Minor Delay – " + spontaneousDelay + " min",
                            status.getDelayReason(), "WARNING"));
                    }
                    break;
                }

                case "LANDED":
                case "CANCELLED":
                    // Terminal states — no further ticking
                    break;

                default:
                    break;
            }

            refreshStatusDisplayAndColor(status);
            status.setLastUpdated(nowStr);
            statusCache.put(status.getFlightId(), status);
        }
        return all;
    }

    // ─── Private Helpers ─────────────────────────────────────────────────────

    private FlightLiveStatus getOrCreateStatus(Flight flight) {
        String flightId = flight.getId();
        if (flightId != null && statusCache.containsKey(flightId)) {
            return statusCache.get(flightId);
        }

        FlightLiveStatus status = initializeStatusFromFlight(flight);
        if (flightId != null) {
            statusCache.put(flightId, status);
        }
        return status;
    }

    private FlightLiveStatus initializeStatusFromFlight(Flight flight) {
        FlightLiveStatus s = new FlightLiveStatus();
        s.setFlightId(flight.getId());
        s.setFlightNumber(flight.getFlightNumber() != null ? flight.getFlightNumber() : "FL-" + (100 + (int)(Math.random() * 899)));
        s.setAirline(flight.getAirline() != null ? flight.getAirline() : "MakeMyTour Air");
        s.setOrigin(flight.getOrigin() != null ? flight.getOrigin() : "DEL");
        s.setDestination(flight.getDestination() != null ? flight.getDestination() : "BOM");

        s.setScheduledDepartureTime(flight.getDepartureTime() != null ? flight.getDepartureTime() : LocalDateTime.now().plusHours(1).format(ISO_FORMATTER));
        s.setEstimatedDepartureTime(s.getScheduledDepartureTime());
        s.setScheduledArrivalTime(flight.getArrivalTime() != null ? flight.getArrivalTime() : LocalDateTime.now().plusHours(3).format(ISO_FORMATTER));
        s.setEstimatedArrivalTime(s.getScheduledArrivalTime());

        // Assign realistic airport coordinates
        double[] origCoords = resolveCoordinates(s.getOrigin());
        double[] destCoords = resolveCoordinates(s.getDestination());
        s.setOriginLat(origCoords[0]);
        s.setOriginLng(origCoords[1]);
        s.setDestLat(destCoords[0]);
        s.setDestLng(destCoords[1]);

        // Seed realistic variations based on flight number hash
        int hash = Math.abs(s.getFlightNumber().hashCode());
        int variant = hash % 6;

        s.setAircraftModel(hash % 3 == 0 ? "Airbus A321neo" : hash % 3 == 1 ? "Boeing 787-9 Dreamliner" : "Airbus A320");
        s.setTerminal("T" + (1 + (hash % 3)));
        s.setGate((12 + (hash % 30)) + (hash % 2 == 0 ? "A" : "B"));
        s.setBaggageCarousel("Belt " + (1 + (hash % 8)));

        String now = LocalDateTime.now().format(ISO_FORMATTER);

        switch (variant) {
            case 0:
                // Delayed by 1 hour (ATC)
                s.setStatus("DELAYED");
                s.setDelayMinutes(60);
                s.setDelayReason("Air Traffic Control hold due to runway maintenance and airspace congestion.");
                s.setContextNote("Revised departure slot confirmed. Passenger gate area remains open.");
                adjustSchedulesForDelay(s, 60);
                s.setProgressPercentage(0);
                s.setAltitudeFt(0);
                s.setSpeedKnots(0);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? flight.getDurationMinutes() : 120);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "⚠ Departure Delayed by 1h", s.getDelayReason(), "WARNING"));
                break;
            case 1:
                // Boarding
                s.setStatus("BOARDING");
                s.setDelayMinutes(0);
                s.setDelayReason(null);
                s.setContextNote("Now boarding Zones 1 to 3 at Gate " + s.getGate() + ". Have boarding pass ready.");
                s.setProgressPercentage(5);
                s.setAltitudeFt(0);
                s.setSpeedKnots(0);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? flight.getDurationMinutes() : 130);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "🚀 Gate Open & Boarding", "Final call for premium and priority passengers.", "SUCCESS"));
                break;
            case 2:
                // In Flight / Cruising
                s.setStatus("IN_FLIGHT");
                s.setDelayMinutes(0);
                s.setDelayReason(null);
                s.setContextNote("Cruising smoothly at 35,000 ft. Smooth flight conditions.");
                s.setProgressPercentage(55);
                s.setAltitudeFt(35000);
                s.setSpeedKnots(480);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? (int)(flight.getDurationMinutes() * 0.45) : 55);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "✈ En Route / Cruising", "Aircraft reaching cruising altitude on schedule.", "INFO"));
                break;
            case 3:
                // Delayed by 35 mins (aircraft turnaround)
                s.setStatus("DELAYED");
                s.setDelayMinutes(35);
                s.setDelayReason("Late turnaround of inbound aircraft from previous sector.");
                s.setContextNote("Refueling and ground baggage loading in final stages.");
                adjustSchedulesForDelay(s, 35);
                s.setProgressPercentage(0);
                s.setAltitudeFt(0);
                s.setSpeedKnots(0);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? flight.getDurationMinutes() : 95);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "⚠ Delayed by 35m", s.getDelayReason(), "WARNING"));
                break;
            case 4:
                // Weather delay
                String[] weatherScenario = WEATHER_SCENARIOS.get(hash % WEATHER_SCENARIOS.size());
                s.setStatus("DELAYED");
                s.setDelayMinutes(45);
                s.setDelayReason(weatherScenario[0]);
                s.setContextNote(weatherScenario[1]);
                adjustSchedulesForDelay(s, 45);
                s.setProgressPercentage(0);
                s.setAltitudeFt(0);
                s.setSpeedKnots(0);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? flight.getDurationMinutes() : 110);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "⛈ Weather Delay — 45m", s.getDelayReason(), "WARNING"));
                break;
            default:
                // On Time
                s.setStatus("ON_TIME");
                s.setDelayMinutes(0);
                s.setDelayReason(null);
                s.setContextNote("Scheduled on time. Pre-flight preparations in order.");
                s.setProgressPercentage(0);
                s.setAltitudeFt(0);
                s.setSpeedKnots(0);
                s.setRemainingMinutes(flight.getDurationMinutes() > 0 ? flight.getDurationMinutes() : 110);
                s.getTimeline().add(new FlightLiveStatus.StatusEvent(now, "✅ Flight Scheduled On Time", "Pre-flight checks and gate assignment confirmed.", "INFO"));
                break;
        }

        updateCoordinatesForProgress(s);
        refreshStatusDisplayAndColor(s);
        s.setLastUpdated(now);
        return s;
    }

    private void adjustSchedulesForDelay(FlightLiveStatus s, int delayMins) {
        try {
            if (s.getScheduledDepartureTime() != null) {
                LocalDateTime dep = LocalDateTime.parse(s.getScheduledDepartureTime().substring(0, 19));
                s.setEstimatedDepartureTime(dep.plusMinutes(delayMins).format(ISO_FORMATTER));
            }
            if (s.getScheduledArrivalTime() != null) {
                LocalDateTime arr = LocalDateTime.parse(s.getScheduledArrivalTime().substring(0, 19));
                s.setEstimatedArrivalTime(arr.plusMinutes(delayMins).format(ISO_FORMATTER));
            }
        } catch (Exception ignored) {
            // Fallback: keep string intact
        }
    }

    private void adjustEtaByMinutes(FlightLiveStatus s, int driftMins) {
        try {
            if (s.getEstimatedArrivalTime() != null) {
                LocalDateTime eta = LocalDateTime.parse(s.getEstimatedArrivalTime().substring(0, 19));
                s.setEstimatedArrivalTime(eta.plusMinutes(driftMins).format(ISO_FORMATTER));
            }
        } catch (Exception ignored) {}
    }

    private void updateCoordinatesForProgress(FlightLiveStatus s) {
        double t = s.getProgressPercentage() / 100.0;
        s.setCurrentLat(s.getOriginLat() + (s.getDestLat() - s.getOriginLat()) * t);
        s.setCurrentLng(s.getOriginLng() + (s.getDestLng() - s.getOriginLng()) * t);
    }

    private void refreshStatusDisplayAndColor(FlightLiveStatus s) {
        String st = s.getStatus() != null ? s.getStatus().toUpperCase() : "ON_TIME";
        switch (st) {
            case "DELAYED":
                s.setStatusDisplay(formatDelayDisplay(s.getDelayMinutes()));
                s.setStatusColor("amber");
                break;
            case "BOARDING":
                s.setStatusDisplay("Boarding — Gate " + (s.getGate() != null ? s.getGate() : "Ready"));
                s.setStatusColor("blue");
                break;
            case "GATE_CLOSED":
                s.setStatusDisplay("Gate Closed — Pushback");
                s.setStatusColor("blue");
                break;
            case "IN_FLIGHT":
                s.setStatusDisplay("In Flight (" + s.getProgressPercentage() + "%)");
                s.setStatusColor("purple");
                break;
            case "DEPARTED":
                s.setStatusDisplay("Departed — Airborne");
                s.setStatusColor("purple");
                break;
            case "LANDED":
                s.setStatusDisplay("Landed — Arrived");
                s.setStatusColor("green");
                break;
            case "CANCELLED":
                s.setStatusDisplay("Flight Cancelled");
                s.setStatusColor("red");
                break;
            case "ON_TIME":
            default:
                s.setStatusDisplay("On Time");
                s.setStatusColor("green");
                break;
        }
    }

    private String formatDelayDisplay(int delayMins) {
        if (delayMins >= 60) {
            int h = delayMins / 60;
            int m = delayMins % 60;
            return m > 0 ? String.format("Delayed by %dh %dm", h, m) : String.format("Delayed by %dh", h);
        }
        return String.format("Delayed by %dm", Math.max(delayMins, 15));
    }

    private String buildEventTitle(FlightLiveStatus status, SimulationRequest req) {
        if (req.getStatus() != null) {
            switch (req.getStatus().toUpperCase()) {
                case "DELAYED": return "⚠ Status: " + status.getStatusDisplay();
                case "WEATHER_DELAY": return "⛈ Weather Delay Issued";
                case "BOARDING": return "🚀 Boarding Call Announced";
                case "GATE_CLOSED": return "🚪 Gate Closed — Pushback";
                case "IN_FLIGHT": return "✈ Flight Airborne";
                case "LANDED": return "✅ Flight Landed";
                case "CANCELLED": return "❌ Flight Cancelled";
                case "ON_TIME": return "✅ Back On Time";
                default: return "Status Updated to " + status.getStatusDisplay();
            }
        }
        if (req.getGate() != null) return "🚪 Gate Changed to " + req.getGate();
        return "📋 Schedule Adjusted";
    }

    private String determineSeverity(FlightLiveStatus status) {
        if (status.getDelayMinutes() > 0) return "WARNING";
        String st = status.getStatus() != null ? status.getStatus().toUpperCase() : "";
        if ("BOARDING".equals(st) || "ON_TIME".equals(st) || "LANDED".equals(st)) return "SUCCESS";
        if ("CANCELLED".equals(st)) return "CRITICAL";
        return "INFO";
    }

    private double[] resolveCoordinates(String loc) {
        if (loc == null) return new double[]{20.5937, 78.9629};
        String clean = loc.toUpperCase();
        for (Map.Entry<String, double[]> entry : AIRPORT_COORDS.entrySet()) {
            if (clean.contains(entry.getKey())) {
                return entry.getValue();
            }
        }
        return new double[]{20.5937, 78.9629};
    }

    // ─── Inner DTOs ───────────────────────────────────────────────────────────

    public static class SimulationRequest {
        private String status;
        private Integer delayMinutes;
        private String delayReason;
        private String contextNote;
        private String gate;
        private String terminal;
        private Integer progressPercentage;
        private String weatherDescription;

        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }

        public Integer getDelayMinutes() { return delayMinutes; }
        public void setDelayMinutes(Integer delayMinutes) { this.delayMinutes = delayMinutes; }

        public String getDelayReason() { return delayReason; }
        public void setDelayReason(String delayReason) { this.delayReason = delayReason; }

        public String getContextNote() { return contextNote; }
        public void setContextNote(String contextNote) { this.contextNote = contextNote; }

        public String getGate() { return gate; }
        public void setGate(String gate) { this.gate = gate; }

        public String getTerminal() { return terminal; }
        public void setTerminal(String terminal) { this.terminal = terminal; }

        public Integer getProgressPercentage() { return progressPercentage; }
        public void setProgressPercentage(Integer progressPercentage) { this.progressPercentage = progressPercentage; }

        public String getWeatherDescription() { return weatherDescription; }
        public void setWeatherDescription(String weatherDescription) { this.weatherDescription = weatherDescription; }
    }

    public static class WeatherEventRequest {
        private String weatherDescription;
        public String getWeatherDescription() { return weatherDescription; }
        public void setWeatherDescription(String weatherDescription) { this.weatherDescription = weatherDescription; }
    }
}
