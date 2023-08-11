package com.ssafy.backend.dto.socket.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PlayerItemInfoDto {

    private Long userId;
    private String nickname;
    private boolean isTopicA;
    private Long itemCodeId;
}
