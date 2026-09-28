package com.makemytrip.flight.status;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/flights")
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class FlightLiveStatusController {

    private final FlightLiveStatusService flightLiveStatusService;

    public FlightLiveStatusController(FlightLiveStatusService flightLiveStatusService) {
        this.flightLiveStatusService = flightLiveStatusService;
    }

    /**
     * Get live flight status for all flights or for a subset of flight IDs / flight numbers.
     * Example: GET /flights/live-status or GET /flights/live-status?flights=6E-101,AI-202
     */
    @GetMapping("/live-status")
    public List<FlightLiveStatus> getLiveStatuses(
            @RequestParam(value = "flights", required = false) String flightsParam) {
        List<String> flightIdsOrNumbers = null;
        if (flightsParam != null && !flightsParam.isBlank()) {
            flightIdsOrNumbers = Arrays.stream(flightsParam.split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList());
        }
        return flightLiveStatusService.getAllStatuses(flightIdsOrNumbers);
    }

    /**
     * Get live telemetry and status updates for a specific flight by database ID or flight number.
     * Example: GET /flights/6E-101/live-status
     */
    @GetMapping("/{idOrNumber}/live-status")
    public FlightLiveStatus getFlightLiveStatus(@PathVariable String idOrNumber) {
        return flightLiveStatusService.getStatus(idOrNumber)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Flight not found: " + idOrNumber));
    }

    /**
     * Simulate real-time flight updates, such as "Delayed by 1h", "Boarding", "On Time",
     * gate changes, revised estimated arrival, and delay reasons.
     * Supports special status values: WEATHER_DELAY, GATE_CLOSED, CANCELLED.
     * Example: POST /flights/6E-101/simulate-update
     */
    @PostMapping("/{idOrNumber}/simulate-update")
    public ResponseEntity<FlightLiveStatus> simulateUpdate(
            @PathVariable String idOrNumber,
            @RequestBody FlightLiveStatusService.SimulationRequest request) {
        try {
            FlightLiveStatus updated = flightLiveStatusService.updateStatusSimulation(idOrNumber, request);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, e.getMessage());
        }
    }

    /**
     * Advances simulated flight tracking clock and advances flight coordinates / status.
     * Produces realistic BOARDING → GATE_CLOSED → DEPARTED → IN_FLIGHT → LANDED chain.
     * Example: POST /flights/simulate-tick
     */
    @PostMapping("/simulate-tick")
    public List<FlightLiveStatus> simulateTick() {
        return flightLiveStatusService.simulateTick();
    }

    /**
     * Simulates a system-wide weather event that delays all ground-based flights.
     * Useful for testing multi-flight notification cascades.
     * Example: POST /flights/simulate-weather-event
     * Body: { "weatherDescription": "Dense fog advisory at all major airports" }
     */
    @PostMapping("/simulate-weather-event")
    public ResponseEntity<List<FlightLiveStatus>> simulateWeatherEvent(
            @RequestBody(required = false) FlightLiveStatusService.WeatherEventRequest request) {
        String description = (request != null) ? request.getWeatherDescription() : null;
        List<FlightLiveStatus> updated = flightLiveStatusService.simulateWeatherEvent(description);
        return ResponseEntity.ok(updated);
    }
}
