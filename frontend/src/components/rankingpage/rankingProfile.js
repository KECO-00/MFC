import styles from "./rankingProfile.module.css";
import baseProfile from "../../images/baseProfile.png";
import { Row, Col } from "react-bootstrap";

function RankingProfile({ rank, userData }) {
  return (
    <div className={styles.profileBox}>
      <Row className="w-100 m-0">
        <Col>
          <p className={styles.rankProfileText}>{rank}</p>
        </Col>
        <Col xs={5} className={styles.rankTitle}>
          <Row>
            <Col xs={6} className={`mx-0 px-0 ${styles.profileImgBox}`}>
              <img
                className={`${styles.radiusImg}`}
                src={
                  userData.profile
                    ? `https://goldenteam.site/profiles/${userData.profile}`
                    : baseProfile
                }
                alt="profileImage"
              />
            </Col>
            <Col className={`mx-0 p-0`}>
              <p
                className={`${styles.nickalign} ${styles.rankProfileText} m-0`}
              >
                {userData.nickName}
              </p>
            </Col>
          </Row>
        </Col>
        <Col className={styles.rankTitle}>
          <p className={styles.rankProfileText}>{userData.exp}</p>
        </Col>
        <Col className={styles.rankTitle}>
          <p className={styles.rankProfileText}>
            {userData.winRate.toFixed(2)}%
          </p>
        </Col>
      </Row>
      <hr className={`${styles.hrStyle} mx-auto`} />
    </div>
  );
}

export default RankingProfile;
