package com.hermnet.api.config;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import java.io.IOException;

/**
 * Servlet filter that anonymizes client IP addresses for privacy compliance.
 * 
 * This filter intercepts all incoming HTTP requests and replaces the real IP
 * address
 * with a hashed anonymous identifier. The anonymous ID is stored as a request
 * attribute
 * that can be used throughout the application for logging and analytics without
 * compromising user privacy.
 * 
 * Executes with highest precedence to ensure IP anonymization happens before
 * any
 * other processing or logging.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class IpAnonymizationFilter implements Filter {

    /**
     * Intercepts each request to anonymize the client's IP address.
     * 
     * @param request  The incoming servlet request
     * @param response The outgoing servlet response
     * @param chain    The filter chain to continue processing
     * @throws IOException      If an I/O error occurs during filtering
     * @throws ServletException If a servlet error occurs during filtering
     */
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        String realIp = httpRequest.getRemoteAddr();

        String anonymousId = IpHasher.hash(realIp);

        request.setAttribute("CLIENT_ID", anonymousId);

        System.out.println("Request received from anonymous client: " + anonymousId);

        chain.doFilter(request, response);
    }
}
