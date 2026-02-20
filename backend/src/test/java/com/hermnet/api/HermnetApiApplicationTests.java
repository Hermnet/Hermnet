package com.hermnet.api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import com.google.firebase.FirebaseApp; 

@SpringBootTest
class HermnetApiApplicationTests {

	@MockBean(name = "firebaseApp")
	private FirebaseApp firebaseApp; 

	@Test
	void contextLoads() {
	}

}
