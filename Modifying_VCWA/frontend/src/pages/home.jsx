import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import "../App.css";
import {
  Button,
  IconButton,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)",
      }}
    >
      <Paper
        elevation={3}
        className="navBar"
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 3,
          py: 2,
          mb: 4,
          background: "#fff8e1",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <img
            src="/video_full_logo.gif"
            alt="Logo"
            style={{ height: 48, marginRight: 12 }}
          />
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#D97500" }}>
            A_CALL
          </Typography>
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            onClick={() => navigate("/history")}
            startIcon={<RestoreIcon />}
            sx={{
              color: "#333",
              borderColor: "#D97500",
              fontWeight: 500,
              textTransform: "none",
              background: "#fffbe6",
              "&:hover": { background: "#ffe0b2", borderColor: "#ed2424" },
            }}
            variant="outlined"
          >
            History
          </Button>

          <Button
            variant="outlined"
            color="error"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      <Box
        className="meetContainer"
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          px: 2,
          py: 4,
        }}
      >
        <Box
          className="leftPanel"
          sx={{ flex: 1, display: "flex", justifyContent: "center" }}
        >
          <Card
            elevation={6}
            sx={{
              p: 4,
              borderRadius: 4,
              minWidth: 320,
              maxWidth: 400,
              background: "#fff",
            }}
          >
            <CardContent>
              <Typography
                variant="h4"
                sx={{ fontWeight: 700, mb: 2, color: "#ed2424" }}
              >
                Welcome Back!
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: "#555" }}>
                Enter your meeting code to join a high-quality video call.
              </Typography>
              <Box sx={{ display: "flex", gap: 2 }}>
                <TextField
                  onChange={(e) => setMeetingCode(e.target.value)}
                  value={meetingCode}
                  label="Meeting Code"
                  variant="outlined"
                  fullWidth
                  sx={{ background: "#f3f4f6", borderRadius: 2 }}
                />
                <Button
                  onClick={handleJoinVideoCall}
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    px: 3,
                    background:
                      "linear-gradient(90deg, #D97500 0%, #ed2424 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    borderRadius: 2,
                    boxShadow: 2,
                    transition: "transform 0.1s",
                    "&:active": { transform: "scale(0.97)" },
                  }}
                >
                  Join
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
        <Box
          className="rightPanel"
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <img
            srcSet="/logo3.png"
            alt="Video Call Illustration"
            style={{
              width: "100%",
              maxWidth: 400,
              borderRadius: 24,
              boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
              background: "#fff",
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}

export default withAuth(HomeComponent);
