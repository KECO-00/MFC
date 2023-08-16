import React, { useState, useRef, useEffect } from "react";
import { Row, Col, Button, ProgressBar } from "react-bootstrap";
import style from "../debatePage.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMicrophone } from "@fortawesome/free-solid-svg-icons";
import { AXIOS_BASE_URL } from "../../../config";
import axios from "axios";
import { useRecoilState } from "recoil";
import { userReadyState } from "../../../recoil/debateStateAtom";
import { useStompClient } from "../../../SocketContext";

function RoomInfo({
  status,
  playerStatus,
  role,
  onStatusChange,
  onRoleChange,
  debateRoomInfo,
  // userReady,
  // setUserReady,
  players,
  roomId,
  setPlayerAInfo,
  setPlayerBInfo,
  debateStart,
  ongoingRoomInfo,
  userInfo,
  turnChange,
  playerAInfo,
  userId,
}) {
  const stompClient = useStompClient();
  const total = debateRoomInfo.totalTime * 60;
  const talk = debateRoomInfo.talkTime * 60;
  const [userReady, setUserReady] = useRecoilState(userReadyState);

  const [totalTime, setTotalTime] = useState(total);
  const [speechTime, setSpeechTime] = useState(talk);
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    // return `${minutes}:${seconds < 10 ? `0${seconds}` : seconds}`;

    const hours = Math.floor(minutes / 60);
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes}:${remainingSeconds}`;
  };
  const speechformatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    const remainingMinutes = minutes % 60;
    const remainingSeconds = seconds;
    return `${remainingMinutes}:${remainingSeconds}`;
  };
  //===========================================================================
  // const stompRef = useRef(null);

  const handleReadyClick = (isATopic) => {
    if (stompClient) {
      const payload = {
        roomId: roomId,
        userId: userId,
        isATopic: isATopic,
        isReady: userReady[isATopic ? 0 : 1],
      };
      stompClient.send("/to/player/ready", JSON.stringify(payload));
    }
  };
  //===========================================================================

  const [user1HP, setUser1HP] = useState(100);
  const [user2HP, setUser2HP] = useState(100);
  const [playerAHistory, setPlayerAHistory] = useState(null);
  const [playerBHistory, setPlayerBHistory] = useState(null);

  const stompRef = useRef(null);

  useEffect(() => {
    if (status === "ongoing") {
      // 총 토론시간 타이머
      const totalTimer = setInterval(() => {
        const currentTime = new Date();
        const startTime = new Date(debateRoomInfo?.startTime);
        const timeDifferenceInMillis = currentTime - startTime;
        const seconds = Math.floor(timeDifferenceInMillis / 1000);
        const minutes = Math.floor(seconds / 60);
        if (minutes >= debateRoomInfo.totalTime) {
          // onStatusChange('done');
        } else {
          // const hours = Math.floor(minutes / 60);
          // const remainingSeconds = seconds % 60;
          // const remainingMinutes = minutes % 60;

          // console.log(`Remaining Time: ${hours} hours, ${remainingMinutes} minutes, ${remainingSeconds} seconds`);'
          setTotalTime(debateRoomInfo.totalTime * 60 - seconds);
        }
      }, 1000);
      // 1회 발언시간 타이머
      const speechTimer = setInterval(() => {
        const currentTime1 = new Date();
        // const startTime1 = new Date(ongoingRoomInfo?.startTalkTime);
        // const timeDifferenceInMillis1 = currentTime1 - startTime1;
        const timeDifferenceInMillis1 = 14000;
        const seconds1 = Math.floor(timeDifferenceInMillis1 / 1000);
        if (speechTime > 0 && totalTime > 0) {
          setSpeechTime(talk - seconds1);
        }
      }, 1000);

      if (speechTime === 0 && totalTime > 0) {
        // setSpeechTime(talk);
        if (userInfo.id === ongoingRoomInfo?.curUserId) {
          turnChange();
        }
      }

      return () => {
        clearInterval(totalTimer);
        clearInterval(speechTimer);
      };
    } // eslint-disable-next-line
  }, [
    status,
    onStatusChange,
    totalTime,
    speechTime,
    talk,
    debateRoomInfo.startTime,
    debateRoomInfo.totalTime,
  ]);

  //두 참가자가 모두 준비가 되면 토론 시작
  useEffect(() => {
    if (status === "waiting" && userReady[0] && userReady[1]) {
      onStatusChange("ongoing");
      if (userInfo.id === playerAInfo.viewerDto.userId) {
        debateStart();
      }
    }
    // eslint-disable-next-line
  }, [userReady, status, onStatusChange]);

  const playerGetHistory = async (userId) => {
    try {
      const response = await axios.get(`${AXIOS_BASE_URL}/record/${userId}`);
      return response.data.data;
    } catch (e) {
      console.log(`사용자 전적 불러오기 API 오류: ${e}`);
      return null;
    }
  };
  // null 값 처리
  useEffect(() => {
    for (const player of players) {
      if (player) {
        if (player.topicTypeA) {
          playerGetHistory(player.viewerDto.userId).then((promiseResult) => {
            setPlayerAInfo(player);
            setPlayerAHistory(promiseResult);
          });
        } else {
          playerGetHistory(player.viewerDto.userId).then((promiseResult) => {
            setPlayerBInfo(player);
            setPlayerBHistory(promiseResult);
          });
        }
      }
    }
    // eslint-disable-next-line
  }, [players]);

  useEffect(() => {
    if (stompClient) {
      stompClient.subscribe(`/from/player/status/${roomId}`, (message) => {
        const content = JSON.parse(message.body);
        if (content.isATopic) {
          setUser1HP(content.hp);
        } else {
          setUser2HP(content.hp);
        }
      });

      stompClient.subscribe(`/from/player/ready/${roomId}`, (message) => {
        const content = JSON.parse(message.body);
        console.log("ready하고 결과 받는 곳임");
        console.log(content);
        // 여기서 받은 데이터를 처리할 수 있습니다.
        console.log(`여기는 유저 1번 ${userReady[0]}`);
        console.log(`여기는 유저 2번 ${userReady[1]}`);
        console.log(`여기는 모두 다 레디 ${content.isAllReady}`);
        if (content.isAllReady) {
          onStatusChange("ongoing");
        }
      });
    }
  }, [stompClient, roomId]);

  // console.log(`여기는 유저 1번 ${userReady[0]}`)
  // console.log(`여기는 유저 2번 ${userReady[1]}`)

  return (
    <>
      <Row className={`${style.roomInfo} m-0`}>
        <Col id="option1" className={`${style.infoText} ${style.opinion1}`}>
          <span>{debateRoomInfo.atopic}</span>
        </Col>
        <Col xs={1} className={`${style.vs}`}>
          <span>VS</span>
        </Col>
        <Col id="option2" className={`${style.infoText} ${style.opinion2}`}>
          <span>{debateRoomInfo.btopic}</span>
        </Col>
      </Row>
      <Row className={`m-0`}>
        <Col className={style.userInfo}>
          {playerAHistory && playerAHistory.nickName ? (
            <span>{playerAHistory.nickName}&nbsp;</span>
          ) : (
            <span>사용자1&nbsp;</span>
          )}
          <span>
            <strong>승</strong>{" "}
            {playerAHistory && playerAHistory.nickName ? (
              <span>{playerAHistory.winCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            무&nbsp;{" "}
            {playerAHistory && playerAHistory.nickName ? (
              <span>{playerAHistory.drawCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            패&nbsp;{" "}
            {playerAHistory && playerAHistory.nickName ? (
              <span>{playerAHistory.loseCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            승률{" "}
            {playerAHistory && playerAHistory.nickName ? (
              <span>{playerAHistory.winRate.toFixed(0)}%&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
        </Col>
        <Col xs={1} className={`${style.debateTimer} mx-auto p-0 mt-1`}>
          <div>
            <p>남은 시간</p>
            {formatTime(totalTime)}
          </div>
        </Col>
        <Col className={style.userInfo}>
          {playerBHistory && playerBHistory.nickName ? (
            <span>{playerBHistory.nickName}&nbsp;</span>
          ) : (
            <span>사용자2&nbsp;</span>
          )}
          <span>
            <strong>승</strong>{" "}
            {playerBHistory && playerBHistory.nickName ? (
              <span>{playerBHistory.winCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            무&nbsp;{" "}
            {playerBHistory && playerBHistory.nickName ? (
              <span>{playerBHistory.drawCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            패&nbsp;{" "}
            {playerBHistory && playerBHistory.nickName ? (
              <span>{playerBHistory.loseCount}&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
          <span>
            승률{" "}
            {playerBHistory && playerBHistory.nickName ? (
              <span>{playerBHistory.winRate.toFixed(0)}%&nbsp;</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </span>
        </Col>
      </Row>
      <Row className={`${style.bottomBox} p-0 m-0`}>
        <Col className={style.userStatus}>
          {status === "waiting" && playerStatus[0] && (
            <Button
              className={
                userReady[0]
                  ? `${style.completeButton}`
                  : `${style.readyButton}`
              }
              onClick={() => {
                setUserReady((prevState) => [!prevState[0], prevState[1]]);
                handleReadyClick(true); // 왼쪽 준비 버튼 클릭 시 isATopic이 true
              }}
            >
              {userReady[0] ? "준비 완료" : "준비"}
            </Button>
          )}
          {status === "ongoing" && (
            <ProgressBar
              className={`${style.user1HP} ${style.hpBar} mx-auto`}
              now={user1HP}
              variant="danger"
              label={`${user1HP}`}
            />
          )}
        </Col>
        <Col xs={1} className={`${style.speechTimer} mx-auto p-0`}>
          <FontAwesomeIcon icon={faMicrophone} className={`${style.micIcon}`} />
          &nbsp;
          {speechformatTime(speechTime)}
        </Col>
        <Col className={style.userStatus}>
          {status === "waiting" && playerStatus[1] && (
            <Button
              className={
                userReady[1]
                  ? `${style.completeButton}`
                  : `${style.readyButton}`
              }
              onClick={() => {
                setUserReady((prevState) => [prevState[0], !prevState[1]]);
                handleReadyClick(false);
              }}
            >
              {userReady[1] ? "준비 완료" : "준비"}
            </Button>
          )}
          {status === "ongoing" && (
            <ProgressBar
              className={`${style.hpBar} mx-auto`}
              now={user2HP}
              variant="danger"
              label={`${user2HP}`}
            />
          )}
        </Col>
      </Row>
    </>
  );
}

export default RoomInfo;
