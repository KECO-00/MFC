import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Button,
  Modal,
  Form,
  OverlayTrigger,
  Tooltip,
} from "react-bootstrap";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCross,
  faHeartCirclePlus,
  faUserClock,
  faVolumeXmark,
  faHand,
} from "@fortawesome/free-solid-svg-icons";
import style from "../debatePage.module.css";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import { FiCameraOff, FiCamera } from "react-icons/fi";
import { AiOutlineAudioMuted, AiOutlineAudio } from "react-icons/ai";
import { FaUsers, FaFlag } from "react-icons/fa";
import { MdMoreTime } from "react-icons/md";

function DebateBtns({
  status,
  role,
  onRoleChange,
  debateRoomInfo,
  setPlayerStatus,
  setUserReady,
  roomId, //추가
  userId,
  itemCodeId, // 추가
  publisher,
  playerA,
  playerB,
  setPlayerA,
  setPlayerB,
  setResult,
}) {
  const [showModal, setShowModal] = useState(false);
  const [selectedTopic, setSelectedTopics] = useState([]);
  const [isVotingEnabled, setVotingEnabled] = useState(true);
  const votingCooldown = debateRoomInfo.talkTime * 120;
  const [remainingTime, setRemainingTime] = useState(votingCooldown);

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);

  //----------------------------------------------------------------------------------------
  const stompClient = useRef(null); // useRef를 사용하여 stompClient 선언

  useEffect(() => {
    // const socket = new SockJS("http://localhost:8081/mfc");
    const socket = new SockJS("https://goldenteam.site/mfc");
    stompClient.current = Stomp.over(socket);
    console.log("소켓 연결 완료");
    stompClient.current.connect({}, () => {
      stompClient.current.subscribe(`/from/player/${roomId}`, (response) => {
        const message = JSON.parse(response.body);
        console.log("Item response received:", message);
      });
    });

    return () => {
      if (stompClient.current) {
        stompClient.current.disconnect();
      }
    };
    // eslint-disable-next-line
  }, []);

  const sendItemRequest = (itemId) => {
    const requestUrl = "/to/player/item";
    const requestData = {
      roomId: `${roomId}`,
      // "userId": `${userId}`,
      userId: 2,
      // isTopicA: selectedTopic.includes('A'),
      isTopicA: selectedTopic.includes("A"),
      itemCodeId: itemId,
    };
    console.log("전송 데이터:", requestData);

    if (stompClient.current && stompClient.current.connected) {
      stompClient.current.send(requestUrl, JSON.stringify(requestData));
      console.log("전송성공");
    } else {
      console.error("소켓 연결이 아직 활성화되지 않았습니다.");
    }
  };
  //----------------------------------------------------------------------------------------
  const handleVote = async () => {
    // 투표 로직 구현
    console.log(`Selected ${selectedTopic}`);

    try {
      // rooId랑 userId 보내주셔서 넣어주세요 ( 충돌날까봐 우선 작성안했습니다 )
      // const roomId = 35;
      // const userId = 326;
      // const base_url = `http://localhost:8081/api/viewer/vote/${roomId}/${userId}`;
      const base_url = `https://goldenteam.site/mfc/viewer/vote/${roomId}/${userId}`;

      const response = await axios.patch(base_url, null, {
        params: { vote: selectedTopic },
      });
      if (response.data.status === "BAD_REQUEST") {
        console.log("투표 가능한 시간이 아닙니다");
      } else {
        console.log("투표 결과 전송 성공:", response.data);
      }
    } catch (e) {
      console.log("투표 결과 전송 실패:", e);
    }

    setShowModal(false);
    setVotingEnabled(false); // 투표 후 투표 비활성화
  };

  useEffect(() => {
    // const sock = new SockJS("http://localhost:8081/mfc");
    const sock = new SockJS("https://goldenteam.site/mfc");
    const stompClient = Stomp.over(sock);

    stompClient.connect({}, function () {
      console.log("WebSocket 연결 성공");
    });
  }, []);
  useEffect(() => {
    if (!isVotingEnabled) {
      // 투표 후 재투표 가능 시간 설정
      const timer = setInterval(() => {
        setRemainingTime((prevTime) => prevTime - 1);
      }, 1000);

      //일정 시간이 지나면 투표 가능하도록 활성화
      setTimeout(() => {
        setVotingEnabled(true);
        setRemainingTime(votingCooldown);
        clearInterval(timer);
      }, votingCooldown * 1000);

      //컴포넌트 언마운트 시 타이머 정리
      return () => {
        clearTimeout(timer);
      };
    }
  }, [isVotingEnabled, votingCooldown]);

  const handleVideoToggle = () => {
    setIsVideoOn(!isVideoOn);
    publisher.publishVideo(!isVideoOn);
  };

  const handleAudioToggle = () => {
    setIsAudioOn(!isAudioOn);
    publisher.publishAudio(!isAudioOn);
  };

  //--------------------------------------------------------------------------
  // 항복버튼 누르면?
  const stompRef = useRef(null);

  useEffect(() => {
    // const sock = new SockJS("http://localhost:8081/mfc");
    const sock = new SockJS("https://goldenteam.site/mfc");

    const stomp = Stomp.over(sock);

    stompRef.current = stomp;

    stomp.connect({}, function () {
      // 이 부분 조금 수상 재참조하고, 구독하는 부분
      stomp.subscribe(`/from/room/surrender/${roomId}`, (message) => {
        const modalData = JSON.parse(message.body);
        console.log(modalData);
        setResult(modalData);
      });
    });

    return () => {
      if (stompRef.current) {
        stompRef.current.disconnect();
      }
    };
    // eslint-disable-next-line
  }, [roomId, userId]);

  const handleSurrenderClick = () => {
    console.log(userId);
    const stompMessage = { userId: userId, roomId: parseInt(roomId) };
    stompRef.current.send(
      `/to/room/surrender/${roomId}/${userId}`,
      JSON.stringify(stompMessage)
    );
  };

  //==========================================================================
  const handleRoleChangeToSpectator = (stream) => {
    onRoleChange("spectator");
    setPlayerStatus([false, false]);
    setUserReady(false);
    if (playerA === stream) {
      setPlayerA(undefined);
    }
    if (playerB === stream) {
      setPlayerB(undefined);
    }
  };

  return (
    <div className={style.buttonsBox}>
      <Row>
        <Col>
          {
            // role === "participant" &&
            status === "ongoing" && (
              <>
                <OverlayTrigger
                  placement="top"
                  overlay={
                    <Tooltip>
                      시간 연장
                      <hr className={`m-0`} />
                      발언시간이 10초 연장됩니다 다만, 체력이 감소합니다.
                    </Tooltip>
                  }
                >
                  <Button variant="secondary">
                    발언 시간 연장&nbsp;
                    <span>
                      <MdMoreTime />
                    </span>
                  </Button>
                </OverlayTrigger>
                <Button
                  className={`mx-3`}
                  variant="danger"
                  onClick={handleSurrenderClick}
                >
                  항복하기&nbsp;
                  <FaFlag />
                </Button>
              </>
            )
          }
        </Col>
        {role === "participant" && status === "waiting" && (
          <Col className={style.return}>
            <button
              className={`${style.goSpectatorBtn} btn`}
              onClick={() => handleRoleChangeToSpectator(publisher)}
            >
              <FaUsers />
              &nbsp; 관전자로 돌아가기
            </button>
          </Col>
        )}
        {/* <Col className={style.items}>
          {status === "ongoing" && ( */}

        {role === "participant" && status === "ongoing" && (
          <>
            <Col className={style.items}>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    포션
                    <hr className={`m-0`} />
                    체력을 10 회복합니다
                  </Tooltip>
                }
              >
                <button
                  className={`${style.itemButton} btn`}
                  onClick={() => sendItemRequest(9)}
                >
                  <FontAwesomeIcon icon={faHeartCirclePlus} size="2x" />
                </button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    수호천사
                    <hr className={`m-0`} />
                    최후의 일격을 1회 무시합니다
                  </Tooltip>
                }
              >
                <button
                  className={`${style.itemButton} btn`}
                  onClick={sendItemRequest(8)}
                >
                  <FontAwesomeIcon icon={faCross} size="2x" />
                </button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    시간연장
                    <hr className={`m-0`} />
                    연장횟수와 상관없이 발언 시간을 연장합니다
                  </Tooltip>
                }
              >
                <button
                  className={`${style.itemButton} btn`}
                  onClick={sendItemRequest(10)}
                >
                  <FontAwesomeIcon icon={faUserClock} size="2x" />
                </button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    상대 음소거
                    <hr className={`m-0`} />
                    상대방 마이크를 10초간 끕니다
                  </Tooltip>
                }
              >
                <button
                  className={`${style.itemButton} btn`}
                  onClick={sendItemRequest(11)}
                >
                  <FontAwesomeIcon icon={faVolumeXmark} size="2x" />
                </button>
              </OverlayTrigger>
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    끼어들기
                    <hr className={`m-0`} />
                    상대 발언시간에 10초간 말할 수 있습니다
                  </Tooltip>
                }
              >
                <button
                  className={`${style.itemButton} btn`}
                  onClick={sendItemRequest(12)}
                >
                  <FontAwesomeIcon icon={faHand} size="2x" />
                </button>
              </OverlayTrigger>
            </Col>
          </>
        )}
        <Col className={style.onOff}>
          {role === "spectator" && status === "ongoing" && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              투표하기
            </Button>
          )}
          <button
            className={`${style.videoButton} btn `}
            onClick={handleVideoToggle}
          >
            {isVideoOn ? <FiCameraOff /> : <FiCamera />}
          </button>
          {role === "participant" && (
            <button
              className={`${style.videoButton} btn`}
              onClick={handleAudioToggle}
            >
              {isAudioOn ? <AiOutlineAudioMuted /> : <AiOutlineAudio />}
            </button>
          )}
        </Col>
      </Row>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Vote for Topics</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Check
              key="topicA"
              type="radio"
              label={debateRoomInfo.atopic}
              id="topicA"
              value="A"
              checked={selectedTopic === "A"}
              onChange={() => setSelectedTopics("A")}
              disabled={!isVotingEnabled}
            />
            <Form.Check
              key="topicB"
              type="radio"
              label={debateRoomInfo.btopic}
              id="topicB"
              value="B"
              checked={selectedTopic === "B"}
              onChange={() => setSelectedTopics("B")}
              disabled={!isVotingEnabled}
            />
          </Form>
          {!isVotingEnabled && (
            <p>{remainingTime}초 뒤에 재투표가 가능합니다.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleVote}>
            투표하기
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default DebateBtns;
