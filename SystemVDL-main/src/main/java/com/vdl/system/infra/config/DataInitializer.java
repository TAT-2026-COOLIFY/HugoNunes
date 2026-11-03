package com.vdl.system.infra.config;

import com.vdl.system.domain.model.Usuario;
import com.vdl.system.domain.repository.UsuarioRepository;
import com.vdl.system.domain.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Se não existir o usuário 'admin', ele cria automaticamente
            if (repository.findByUsername("admin").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setUsername("admin");
                // O próprio Spring criptografa do jeito certo!
                admin.setPassword(passwordEncoder.encode("admin"));
                admin.setNome("Administrador VDL");
                admin.setRole("ADMIN");

                repository.save(admin);
                System.out.println("✅ Usuário ADMIN criado com sucesso!");
            }
        };
    }
}