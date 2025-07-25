package com.gestao.evento.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:4200")
public class LoginController {



    @RequestMapping("/login/{email}/{password}")
    public ResponseEntity<?> login(@PathVariable("email") String email, @PathVariable("password") String password) {
//        UserDTO user = userService.buscarUsuarioPorEmailUnico(email);

//        if (user == null || !passwordEncoder.matches(password, user.getSenha())) {
//            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Credenciais inválidas.");
//        }

        // Retornar ID e nome do usuário autenticado
        Map<String, Object> response = new HashMap<>();
        response.put("id", 1);//user.getId());
        response.put("nome", "Master");//user.getNome());
        response.put("perfil_id", 1);//user.getPerfil_id());

        return ResponseEntity.ok(response);
    }
}
