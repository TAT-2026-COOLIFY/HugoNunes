package com.vdl.system.controllers;

import com.vdl.system.domain.dto.autenticacao.LoginRequestDTO;
import com.vdl.system.domain.dto.autenticacao.LoginResponseDTO;
import com.vdl.system.domain.repository.UsuarioRepository;
import com.vdl.system.security.TokenService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder; // Import do PasswordEncoder
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final TokenService tokenService;
    private final PasswordEncoder passwordEncoder; // 1. Adicionado o PasswordEncoder

    public AuthController(UsuarioRepository usuarioRepository, TokenService tokenService, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tokenService = tokenService;
        this.passwordEncoder = passwordEncoder; // 2. Injetado no construtor
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO data) {
        // 1. Busca o usuário pelo username
        var usuarioOpt = usuarioRepository.findByUsername(data.username());

        // 2. Se não existir, retorna 401
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário ou senha inválidos");
        }

        var usuario = usuarioOpt.get();

        // 3. Valida a senha usando BCrypt (CORRIGIDO)
        if (!passwordEncoder.matches(data.password(), usuario.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Usuário ou senha inválidos");
        }

        // 4. Gera o token e retorna
        var token = tokenService.generateToken(usuario);
        return ResponseEntity.ok(new LoginResponseDTO(token, usuario.getUsername()));
    }
}