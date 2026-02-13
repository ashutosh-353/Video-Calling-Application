import React, { useState, useRef, useEffect } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Typography from "@mui/material/Typography";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import styles from "../styles/videoComponent.module.css";

export default function Lobby({ onConnect }) {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(true); // start ON
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Start / stop camera
  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (!mounted || !cameraOn) {
          // If component unmounted or camera was turned off while loading
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setError(""); // Clear any previous errors
      } catch (err) {
        console.error("Error accessing camera:", err);
        if (mounted) {
          setError("Cannot access camera.");
          setCameraOn(false);
        }
      }
    };

    if (cameraOn) {
      startCamera();
    } else {
      stopStream();
    }

    // Cleanup function
    return () => {
      mounted = false;
      stopStream();
    };
  }, [cameraOn]);

  // Stop camera on browser/tab close or navigation
  useEffect(() => {
    const handleUnload = () => {
      stopStream();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const handleConnect = () => {
    if (!username.trim()) {
      setError("Username is required.");
      return;
    }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      stopStream(); // Stop camera before joining meeting
      if (onConnect) onConnect(username);
    }, 1000);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleConnect();
    }
  };

  const toggleCamera = () => {
    setCameraOn((prev) => !prev);
  };

  return (
    <div className={styles.lobbyWrapper}>
      
      <div className={styles.lobbyCard}>
        <img src="/video_full_logo.gif" alt="Logo" className={styles.lobbyLogo} />

        <Typography variant="h5" className={styles.lobbyTitle}>
          Enter into Lobby
        </Typography>
        <p className={styles.lobbySubtitle}>
          Please enter your name to join the video call.
        </p>

        <TextField
          className={styles.lobbyInput}
          label="Name"
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          autoFocus
          error={!!error}
          helperText={error}
        />

        <Button
          className={styles.lobbyButton}
          variant="contained"
          fullWidth
          onClick={handleConnect}
          disabled={loading}
          sx={{ mt: 1, mb: 2 }}
        >
          {loading ? <CircularProgress size={24} color="inherit" /> : "Connect"}
        </Button>

        <Button
          variant={cameraOn ? "contained" : "outlined"}
          color="primary"
          fullWidth
          onClick={toggleCamera}
          sx={{ mb: 2 }}
        >
          {cameraOn ? "Turn Camera Off" : "Turn Camera On"}
        </Button>

        <div className={styles.lobbyVideoPreview}>
          {cameraOn ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{
                width: "100%",
                height: "100%", 
                borderRadius: "16px",
                objectFit: "cover",
                transform: "scaleX(-1)",
              }}
            />
          ) : (
            <FontAwesomeIcon icon={faUser} size="4x" color="#bdbdbd" />
          )}
        </div>

        <Typography
          variant="caption"
          style={{ color: "#777", marginTop: 8, display: "block" }}
        >
          {cameraOn ? "Your video preview" : "Video preview will appear here"}
        </Typography>
      </div>
    </div>
  );
}
