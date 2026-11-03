package com.vdl.system.controllers;

import com.vdl.system.domain.model.Gramatura;
import com.vdl.system.domain.repository.GramaturaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gramaturas")
@CrossOrigin(origins = "*")
public class GramaturaController {

    @Autowired
    private GramaturaRepository gramaturaRepository;

    @GetMapping
    public ResponseEntity<List<Gramatura>> listarTodas() {
        List<Gramatura> gramaturas = gramaturaRepository.findAll();
        return ResponseEntity.ok(gramaturas);
    }
}
