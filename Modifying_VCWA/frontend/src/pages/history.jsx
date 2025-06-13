// import React, { useContext, useEffect, useState } from 'react'
// import { AuthContext } from '../contexts/AuthContext'
// import { useNavigate } from 'react-router-dom';
// import Card from '@mui/material/Card';
// import Box from '@mui/material/Box';
// import CardActions from '@mui/material/CardActions';
// import CardContent from '@mui/material/CardContent';
// import Button from '@mui/material/Button';
// import Typography from '@mui/material/Typography';
// import HomeIcon from '@mui/icons-material/Home';

// import { IconButton } from '@mui/material';
// export default function History() {


//     const { getHistoryOfUser } = useContext(AuthContext);

//     const [meetings, setMeetings] = useState([])


//     const routeTo = useNavigate();

//     useEffect(() => {
//         const fetchHistory = async () => {
//             try {
//                 const history = await getHistoryOfUser();
//                 setMeetings(history);
//             } catch {
//                 // IMPLEMENT SNACKBAR
//             }
//         }

//         fetchHistory();
//     }, [])

//     let formatDate = (dateString) => {

//         const date = new Date(dateString);
//         const day = date.getDate().toString().padStart(2, "0");
//         const month = (date.getMonth() + 1).toString().padStart(2, "0")
//         const year = date.getFullYear();

//         return `${day}/${month}/${year}`

//     }

//     return (
//         <div>

//             <IconButton onClick={() => {
//                 routeTo("/home")
//             }}>
//                 <HomeIcon />
//             </IconButton >
//             {
//                 (meetings.length !== 0) ? meetings.map((e, i) => {
//                     return (

//                         <>


//                             <Card key={i} variant="outlined">


//                                 <CardContent>
//                                     <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
//                                         Code: {e.meetingCode}
//                                     </Typography>

//                                     <Typography sx={{ mb: 1.5 }} color="text.secondary">
//                                         Date: {formatDate(e.date)}
//                                     </Typography>

//                                 </CardContent>


//                             </Card>


//                         </>
//                     )
//                 }) : <></>

//             }

//         </div>
//     )
// }









import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom';
import {
  Card, Box, CardContent, Typography, IconButton, Grid, Paper, Button
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VideocamIcon from '@mui/icons-material/Videocam';

export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history);
      } catch {
        // IMPLEMENT SNACKBAR
      }
    }
    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const year = date.getFullYear();
    return `${day}/${month}/${year}`
  }

  return (
    <Box sx={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #f8fafc 0%, #e0e7ff 100%)",
      pb: 6
    }}>
      <Paper elevation={3} className="navBar" sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        px: 3, py: 2, mb: 4,
        background: "#fff8e1"
      }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <IconButton onClick={() => routeTo("/home")} color="primary">
            <HomeIcon />
          </IconButton>
          <Typography variant="h6" sx={{ fontWeight: 700, color: "#D97500" }}>
            Meeting History
          </Typography>
        </Box>
        <Button
          variant="outlined"
          color="error"
          onClick={() => {
            localStorage.removeItem("token");
            routeTo("/auth");
          }}
        >
          Logout
        </Button>
      </Paper>

      <Box sx={{ maxWidth: 900, mx: "auto", px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: "#ed2424", textAlign: "center" }}>
          Your Recent Meetings
        </Typography>
        <Typography variant="body1" sx={{ mb: 4, color: "#555", textAlign: "center" }}>
          Here you can find all your recent video call sessions.
        </Typography>

        {meetings.length === 0 ? (
          <Typography variant="h6" sx={{ color: "#888", textAlign: "center", mt: 8 }}>
            No meeting history found.
          </Typography>
        ) : (
          <Grid container spacing={3} justifyContent="center">
            {meetings.map((e, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    boxShadow: 2,
                    transition: "transform 0.15s",
                    "&:hover": { transform: "scale(1.03)", boxShadow: 6, borderColor: "#D97500" }
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                      <VideocamIcon sx={{ color: "#ed2424", mr: 1 }} />
                      <Typography sx={{ fontSize: 16, fontWeight: 600, color: "#333" }}>
                        {e.meetingCode}
                      </Typography>
                    </Box>
                    <Typography sx={{ mb: 1.5, color: "#555" }}>
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
  )
}