package com.hermnet.api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;

import java.io.IOException;

import static org.mockito.Mockito.*;

public class IpAnonymizationFilterTest {

    private IpAnonymizationFilter filter;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain chain;

    @BeforeEach
    public void setUp() {
        MockitoAnnotations.openMocks(this);
        filter = new IpAnonymizationFilter();
    }

    @Test
    public void testDoFilterAnonymizesIp() throws IOException, ServletException {
        // Arrange
        String realIp = "192.168.1.100";
        when(request.getRemoteAddr()).thenReturn(realIp);

        // Act
        filter.doFilter(request, response, chain);

        // Assert
        // Verify that the IpHasher was called (implicitly by checking the result)
        String expectedHash = IpHasher.hash(realIp);

        // Verify that the attribute CLIENT_ID was set with the hashed IP
        verify(request).setAttribute("CLIENT_ID", expectedHash);

        // Verify that the filter chain continued execution
        verify(chain).doFilter(request, response);
    }

    @Test
    public void testDoFilterHandlesNullIp() throws IOException, ServletException {
        // Arrange
        when(request.getRemoteAddr()).thenReturn(null);

        // Act
        filter.doFilter(request, response, chain);

        // Assert
        // IpHasher returns "unknown" for null IPs
        verify(request).setAttribute("CLIENT_ID", "unknown");
        verify(chain).doFilter(request, response);
    }
}
