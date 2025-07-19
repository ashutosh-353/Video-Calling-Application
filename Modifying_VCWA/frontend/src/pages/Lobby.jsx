import React, { useState, useRef } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/videoComponent.module.css";

export default function Lobby({ onConnect }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);

  // Simulate video preview (replace with actual stream if available)
  // useEffect(() => { ... });

  const handleConnect = () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (onConnect) onConnect(username);
    }, 1200); // Simulate network delay
  };

  return (
    <div className={styles.lobbyContainer}>
      <div className={styles.lobbyCard}>
        <img src="/video_full_logo.gif" alt="Logo" className={styles.lobbyLogo} />
        <h2 className={styles.lobbyTitle}>Enter into Lobby</h2>
        <p style={{ color: "#3949ab", marginBottom: 12 }}>
          Please enter your username to join the video call.
        </p>
        <TextField
          className={styles.lobbyInput}
          label="Username"
          variant="outlined"
          value={username}
          onChange={e => setUsername(e.target.value)}
          fullWidth
          autoFocus
          error={!!error}
          helperText={error}
        />
        <Button
          className={styles.lobbyButton}
          variant="contained"
          color="primary"
          fullWidth
          onClick={handleConnect}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Connect"}
        </Button>
        <div className={styles.lobbyVideoPreview}>
          {/* Replace with actual video preview if available */}
          <div className={styles.videoPlaceholder}>
            <FontAwesomeIcon icon={faUser} size="3x" color="#bdbdbd" />
          </div>
        </div>
      </div>
    </div>
  );
}