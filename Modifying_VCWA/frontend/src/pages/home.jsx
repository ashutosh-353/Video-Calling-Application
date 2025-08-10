import React, { useContext, useState } from "react";
import withAuth from "../utils/withAuth";
import { useNavigate } from "react-router-dom";
import {
  Button,
  TextField,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  Avatar,
  Fade,
  useMediaQuery,
} from "@mui/material";
import RestoreIcon from "@mui/icons-material/Restore";
import LogoutIcon from "@mui/icons-material/Logout";
import { AuthContext } from "../contexts/AuthContext";

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory, user } = useContext(AuthContext);
  const isMobile = useMediaQuery("(max-width:600px)");

  let handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) return;
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background:
          "linear-gradient(120deg, #eef2ff 0%, #f8fafc 60%, #ffe3d8 100%)",
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* NavBar */}
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 1.5, sm: 2, md: 3 },
          py: { xs: 1, sm: 2 },
          mb: { xs: 2, md: 4 },
          background: "rgba(255,255,255,0.93)",
          borderRadius: 0,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #eee",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center"}}>
          <img
            src="/generated-image.png"
            alt="Logo"
            style={{
              height: isMobile ? 32 : 48,
              marginRight: isMobile ? 8 : 14,
            }}
          />
          {/* <Typography
            variant={isMobile ? "h6" : "h5"}
            sx={{
              fontWeight: 800,
              color: "#D97500",
              letterSpacing: "1px",
              fontFamily: "'Montserrat', sans-serif"
            }}
          >
            A_CALL
          </Typography> */}
        </Box>
        <Box sx={{ display: "flex", alignItems: "center", gap: isMobile ? 1 : 2 }}>
          {user?.name && (
            <Avatar sx={{
              bgcolor: "#ed2424",
              width: isMobile ? 28 : 36,
              height: isMobile ? 28 : 36,
              fontSize: isMobile ? 16 : 20
            }}>
              {user.name[0]?.toUpperCase() || "A"}
            </Avatar>
          )}
          <Button
            onClick={() => navigate("/history")}
            startIcon={<RestoreIcon />}
            sx={{
              color: "#d97500",
              fontWeight: 500,
              fontSize: isMobile ? "0.93rem" : "1rem",
              background: "#fff8e1",
              borderColor: "#ffd6ad",
              borderWidth: 2,
              textTransform: "none",
              borderRadius: 2,
              minWidth: isMobile ? 0 : 100,
              px: isMobile ? 1.3 : 2,
              boxShadow: `0 2px 6px 0 rgba(217, 117, 0, 0.05)`,
              transition: "background 0.2s, color 0.2s",
              '&:hover': {
                background: "#fff0e0",
                borderColor: "#ed2424",
                color: "#ed2424",
              }
            }}
            variant="outlined"
          >
            {isMobile ? "" : "History"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
            sx={{
              fontWeight: 500,
              textTransform: "none",
              borderRadius: 2,
              minWidth: isMobile ? 0 : 82,
              bgcolor: "#fff",
              borderColor: "#ffd6ad",
              borderWidth: 2,
              "&:hover": {
                background: "#ffe6e6",
                borderColor: "#ed2424",
              },
            }}
          >
            {isMobile ? "" : "Logout"}
          </Button>
        </Box>
      </Paper>

      {/* Main content */}
      <Fade in timeout={900}>
        <Box
          className="meetContainer"
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: {
              xs: "column-reverse",
              sm: "column-reverse",
              md: "row"
            },
            alignItems: "center",
            justifyContent: "center",
            gap: { xs: 3, md: 7 },
            px: isMobile ? 1 : 2,
            py: isMobile ? 2 : 6,
            width: "100%",
            minHeight: 0,
          }}
        >
          {/* Join Card */}
          <Card
            elevation={8}
            sx={{
              minWidth: isMobile ? "90vw" : 320,
              maxWidth: isMobile ? "95vw" : 410,
              width: "100%",
              borderRadius: 6,
              p: { xs: 2, sm: 3, md: 4 },
              background: "rgba(252, 255, 252, 0.88)",
              boxShadow:
                "0 6px 45px 0 rgba(217, 117, 0, 0.07), 0 1.5px 5px rgba(237,36,36,0.09)",
              backdropFilter: "blur(8px)"
            }}
          >
            <CardContent>
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  fontWeight: 900,
                  mb: 1.5,
                  color: "#ed2424",
                  fontFamily: "'Montserrat', sans-serif",
                  letterSpacing: "1.5px"
                }}
              >
                Welcome!
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  mb: 2,
                  color: "#444",
                  letterSpacing: "0.02em"
                }}
              >
                Start or join a video call by entering your meeting code.
              </Typography>
              <Box sx={{ display: "flex", gap: 1, mb: 1 }}>
                <TextField
                  onChange={(e) => setMeetingCode(e.target.value)}
                  value={meetingCode}
                  label="Meeting Code"
                  variant="outlined"
                  fullWidth
                  autoFocus
                  sx={{
                    background: "#f3f4f6",
                    borderRadius: 2,
                    fontSize: isMobile ? 14 : 16,
                    "& .MuiInputBase-input": { py: isMobile ? 1.1 : 1.5 }
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleJoinVideoCall();
                  }}
                />
                <Button
                  onClick={handleJoinVideoCall}
                  type="submit"
                  variant="contained"
                  sx={{
                    px: isMobile ? 2 : 3,
                    fontWeight: 700,
                    background:
                      "linear-gradient(92deg, #D97500 5%, #ed2424 95%)",
                    color: "#fff",
                    borderRadius: 2,
                    boxShadow: "0 6px 24px 0 rgba(237,36,36, 0.13)",
                    height: isMobile ? "44px" : "56px",
                    minWidth: isMobile ? "auto" : "90px",
                    fontSize: isMobile ? "1rem" : "1.1rem",
                    transition: "transform 0.1s",
                    "&:hover": {
                      background:
                        "linear-gradient(92deg, #ed2424 20%, #D97500 80%)",
                      transform: "scale(1.04)",
                    },
                  }}
                  disabled={!meetingCode.trim()}
                >
                  {isMobile ? <>&#x27A4;</> : "Join"}
                </Button>
              </Box>
            </CardContent>
          </Card>
          {/* Illustration */}
          <Box
            className="rightPanel"
            sx={{
              display: "flex",
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              minWidth: 180,
              minHeight: 120,
              mb: { xs: 2, sm: 0 },
              width: "100%",
            }}
          >
            <img
              srcSet="/logo3.png"
              alt="Video Call Illustration"
              style={{
                width: "100%",
                maxWidth: isMobile ? 210 : 410,
                borderRadius: isMobile ? 20 : 28,
                boxShadow: "0 8px 24px 0 rgba(217,117,0,0.08)",
                background: "#fff",
                filter: "drop-shadow(0 2px 16px #f3f4f6)",
                transition: "transform .19s cubic-bezier(.34,2,0,1)",
                animation: "floatLogo 4s infinite ease-in-out",
              }}
            />
            {/* Anim keyframes */}
            <style>
              {`
                @keyframes floatLogo {
                  0%, 100% { transform: translateY(0px);}
                  50% { transform: translateY(-14px);}
                }
              `}
            </style>
          </Box>
        </Box>
      </Fade>
    </Box>
  );
}

export default withAuth(HomeComponent);
