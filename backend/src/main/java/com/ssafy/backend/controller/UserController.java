package com.ssafy.backend.controller;

import com.ssafy.backend.dto.*;
import com.ssafy.backend.dto.response.*;
import com.ssafy.backend.entity.*;
import com.ssafy.backend.security.*;
import com.ssafy.backend.service.*;
import java.util.*;
import javax.validation.*;

import com.ssafy.backend.dto.request.UserRegistDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.*;
import org.springframework.http.*;
import org.springframework.validation.*;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user")
@Slf4j
@CrossOrigin(origins = "*", allowedHeaders = "*")
public class UserController {

    private final UserService userService;
    private final SecurityService securityService;
    private final EmailService emailService;

    @PostMapping("/login")
    public Message login(@RequestBody @Valid LoginForm loginForm, BindingResult result){
        if(result.hasErrors()){
            return new Message(HttpStatus.BAD_REQUEST, "로그인 형식이 올바르지 않습니다.", null);
        }

        Long loginId = userService.login(loginForm);
        if(loginId == null){
            return new Message(HttpStatus.OK, "일치하는 사용자가 없습니다.", null);
        }
        String jwtToken = securityService.createJwtToken(String.valueOf(loginId));
        return new Message(HttpStatus.OK, "로그인 성공", new LoginResultDto(loginId,jwtToken));
    }

    @GetMapping("/logout/{id}")
    public Message logout(@RequestHeader("Authorization") String token, @PathVariable Long id){
        String subject = securityService.getSubject(token);
        if(subject.equals(String.valueOf(id))){
            securityService.logout(id,token);
            return new Message(HttpStatus.OK, "로그아웃 성공", null);
        }
        return new Message(HttpStatus.BAD_REQUEST, "사용자가 일치하지 않습니다.", null);
    }

    @PostMapping
    public ResponseEntity<Message> regist(@RequestBody @Valid UserRegistDto user, BindingResult result){
        if(result.hasErrors()){
            return ResponseEntity.ok(new Message( HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다.", null));
        }
        String email = user.getEmail();
        String token = UUID.randomUUID().toString();
        emailService.saveToken(email, token,user);

        String message = "Please click the following link to verify your email: " +
                "<a href='http://i9a605.p.ssafy.io:8081/api/user/verify?email="+email+"&token=" + token + "'>Verify</a>";
        emailService.sendMail(user.getEmail(), "Please verify your email", message);
        return ResponseEntity.ok(new Message(HttpStatus.ACCEPTED, "이메일 인증번호를 발송하였습니다.",null));

    }

    @GetMapping("/verify")
    public ResponseEntity<Message> email_verify(@RequestParam String email, @RequestParam String token) {
        if(emailService.getEmailToken(email).equals(token)){
            UserRegistDto user = emailService.getRegistUserInfo(token);
            Long savedId = userService.regist(user);
            return ResponseEntity.ok( new Message( HttpStatus.OK, "회원가입 성공", savedId));
        }
        return ResponseEntity.ok( new Message( HttpStatus.BAD_REQUEST, "회원가입 실패", null));

    }

    @GetMapping
    public ResponseEntity<Message> info(@RequestHeader("Authorization") String token){
        System.out.println(securityService.getSubject(token));
        Long userId = Long.valueOf(securityService.getSubject(token));
        User user = userService.findUser(userId);

        return ResponseEntity.ok(new Message(HttpStatus.OK, "success", user));
    }

    @DeleteMapping
    public ResponseEntity<Message> delete(@RequestHeader("Authorization") String token){
        Long userId = Long.valueOf(securityService.getSubject(token));
        User user = userService.findUser(userId);

        return ResponseEntity.ok(new Message(HttpStatus.OK, "success", user));
    }


}
