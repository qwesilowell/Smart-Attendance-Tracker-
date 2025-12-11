package com.smartattendance.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/debug")
public class DebugController {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping("/hash")
    public String getHash(@RequestParam String password) {
        return passwordEncoder.encode(password);
    }
}