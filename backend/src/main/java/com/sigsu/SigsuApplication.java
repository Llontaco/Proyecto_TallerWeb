package com.sigsu;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SigsuApplication {

    public static void main(String[] args) {
        SpringApplication.run(SigsuApplication.class, args);
    }
}
