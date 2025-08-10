import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Card,
  Box,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Paper,
  Button,
  Avatar
} from "@mui/material";
import HomeIcon from "@mui/icons-material/Home";
import VideocamIcon from "@mui/icons-material/Videocam";
import LogoutIcon from "@mui/icons-material/Logout";

export default function History() {
  const { getHistoryOfUser, user } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // Snackbar can be implemented here
      }
    };
    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(120deg, #eef2ff 0%, #f8fafc 60%, #ffe3d8 100%)",
        pb: 6,
        display: "flex",
        flexDirection: "column"
      }}
    >
      {/* Nav Bar */}
      <Paper
        elevation={3}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 2, md: 3 },
          py: 2,
          mb: 4,
          background: "rgba(255,255,255,0.93)",
          borderRadius: 0,
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #eee",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton
            onClick={() => routeTo("/home")}
            sx={{
              bgcolor: "#fff8e1",
              border: "1px solid #ffd6ad",
              "&:hover": { bgcolor: "#fff0e0" }
            }}
          >
            <HomeIcon sx={{ color: "#D97500" }} />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#D97500" }}>
            Meeting History
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
          {user?.name && (
            <Avatar sx={{ bgcolor: "#ed2424", width: 34, height: 34 }}>
              {user.name[0]?.toUpperCase() || "A"}
            </Avatar>
          )}
          <Button
            variant="outlined"
            color="error"
            startIcon={<LogoutIcon />}
            onClick={() => {
              localStorage.removeItem("token");
              routeTo("/auth");
            }}
            sx={{
              fontWeight: 500,
              textTransform: "none",
              borderRadius: 2,
              bgcolor: "#fff",
              borderColor: "#ffd6ad",
              borderWidth: 2,
              "&:hover": {
                background: "#ffe6e6",
                borderColor: "#ed2424",
              },
            }}
          >
            Logout
          </Button>
        </Box>
      </Paper>

      <Box sx={{ maxWidth: 1100, mx: "auto", px: 2, width: "100%" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 2,
            color: "#ed2424",
            textAlign: "center",
            fontFamily: "'Montserrat', sans-serif"
          }}
        >
          Your Recent Meetings
        </Typography>
        <Typography
          variant="body1"
          sx={{ mb: 4, color: "#555", textAlign: "center" }}
        >
          Here you can find all your past high‑quality video call sessions.
        </Typography>

        {meetings.length === 0 ? (
          <Typography
            variant="h6"
            sx={{
              color: "#888",
              textAlign: "center",
              mt: 8,
              fontWeight: 400
            }}
          >
            No meeting history found.
          </Typography>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {meetings.map((e, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 4,
                    background: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(8px)",
                    boxShadow:
                      "0 4px 20px 0 rgba(217,117,0,0.07), 0 2px 6px rgba(0,0,0,0.05)",
                    transition: "transform 0.18s ease, box-shadow 0.18s ease",
                    "&:hover": {
                      transform: "translateY(-4px) scale(1.02)",
                      boxShadow:
                        "0 8px 24px 0 rgba(237,36,36,0.15), 0 2px 12px rgba(0,0,0,0.08)",
                      borderColor: "#D97500",
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        mb: 1,
                        flexWrap: "wrap"
                      }}
                    >
                      <VideocamIcon sx={{ color: "#ed2424", mr: 1 }} />
                      <Typography
                        sx={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: "#333",
                          wordBreak: "break-word"
                        }}
                      >
                        {e.meetingCode}
                      </Typography>
                    </Box>
                    <Typography
                      sx={{
                        mb: 1.5,
                        color: "#555",
                        fontSize: 14,
                      }}
                    >
                      Date: {formatDate(e.date)}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
}
