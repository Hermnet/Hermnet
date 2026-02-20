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
        String realIp = "192.168.1.100";
        when(request.getRemoteAddr()).thenReturn(realIp);

        filter.doFilter(request, response, chain);

        String expectedHash = IpHasher.hash(realIp);

        verify(request).setAttribute("CLIENT_ID", expectedHash);

        verify(chain).doFilter(request, response);
    }

    @Test
    public void testDoFilterHandlesNullIp() throws IOException, ServletException {
        when(request.getRemoteAddr()).thenReturn(null);

        filter.doFilter(request, response, chain);

        verify(request).setAttribute("CLIENT_ID", "unknown");
        verify(chain).doFilter(request, response);
    }
}
