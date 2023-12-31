package com.ssafy.backend.entity;

import javax.persistence.Column;
import javax.persistence.ConstraintMode;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.ForeignKey;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;

import lombok.*;
import org.hibernate.annotations.ColumnDefault;

@Entity(name = "history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
@Setter
public class History {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  @Column(name = "history_id", updatable = false)
  private Long id;

  @Column(name = "coin", nullable = false, columnDefinition = "integer default 0")
  private int coin;

  @Column(name = "experience", nullable = false, columnDefinition = "integer default 0")
  private int experience;

  @Column(name = "win_count", nullable = false)
  @ColumnDefault("0")
  private int winCount;

  @Column(name = "lose_count", nullable = false, columnDefinition = "integer default 0")
  private int loseCount;

  @Column(name = "draw_count", nullable = false, columnDefinition = "integer default 0")
  private int drawCount;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
  private User user;

}
