package com.makemytrip;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Application-wide security configuration for MakeMy Tour.
 *
 * <p>This configuration class establishes the security posture for the REST API:
 * <ul>
 *   <li>CSRF protection is disabled because the API is stateless (no session cookies).</li>
 *   <li>All HTTP endpoints are publicly accessible; route-level access control is
 *       enforced at the service layer through the {@code X-User-Id} header.</li>
 *   <li>CORS is configured to accept requests from any origin so that both the
 *       locally-running Next.js dev server and the Render-hosted frontend can reach
 *       the backend without pre-flight failures.</li>
 *   <li>Passwords are hashed with {@link BCryptPasswordEncoder} (strength 10).</li>
 * </ul>
 * </p>
 *
 * @author Maaz Shaikh
 * @since 2025
 */
@Configuration
public class SecurityConfig {

    /**
     * Defines the HTTP security filter chain.
     *
     * <p>CSRF is disabled because the client sends JSON and uses the
     * {@code X-User-Id} custom header instead of session cookies.
     * Every request is permitted at the HTTP layer; individual endpoints
     * perform their own identity validation.</p>
     *
     * @param http the {@link HttpSecurity} builder provided by Spring Security
     * @return the fully built {@link SecurityFilterChain}
     * @throws Exception if the security configuration cannot be applied
     */
    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Apply the CORS policy defined in corsConfigurationSource()
                .cors(Customizer.withDefaults())
                // Stateless API — CSRF tokens are not needed
                .csrf(csrf -> csrf.disable())
                // All route-level access control is handled in service / controller layers
                .authorizeHttpRequests(authorize -> authorize.anyRequest().permitAll());
        return http.build();
    }

    /**
     * Provides the CORS configuration used by the security filter chain.
     *
     * <p>Wildcard origin patterns are used to support both local development
     * ({@code http://localhost:3000}) and the production Render deployment without
     * maintaining a hard-coded allow-list that could break on environment changes.</p>
     *
     * @return a {@link CorsConfigurationSource} applied to all URL patterns
     */
    @Bean
    CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        // Accept requests from any origin (covers localhost and Render URLs)
        configuration.setAllowedOriginPatterns(List.of("*"));

        // Permit standard REST verbs plus PATCH and OPTIONS (for pre-flight)
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        // Allow all headers so custom headers like X-User-Id pass through
        configuration.setAllowedHeaders(List.of("*"));

        // Required for browsers sending credentials (e.g., cookies or auth headers)
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    /**
     * Exposes a BCrypt password encoder as a managed Spring bean.
     *
     * <p>BCrypt is a slow, adaptive hashing function designed for passwords.
     * The default strength of 10 rounds is used, which strikes a practical
     * balance between security and response latency on the Render free tier.</p>
     *
     * @return a {@link BCryptPasswordEncoder} instance
     */
    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
