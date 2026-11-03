package com.vdl.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class SystemVdlApplication {
    //Subir robô do WhatsApp
    // docker compose -f docker-compose.whatsapp.yml up -d

    //Se já tiver criado: docker start evolution_postgres || docker start evolution_api

    //Interface para logar: http://localhost:8081/manager

    public static void main(String[] args) {
        SpringApplication.run(SystemVdlApplication.class, args);
    }
}