// import React from "react";
import "../App.css";
import { useNavigate } from "react-router-dom";
import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import CardActionArea from "@mui/material/CardActionArea";

export default function LandingPage() {
  const router = useNavigate();

  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <img src="/video_full_logo.gif" alt="" />
        </div>

        <div className="navList">
          <p
            onClick={() => {
              router("/ash");
            }}
          >
            Join as Guest
          </p>
          <p
            onClick={() => {
              router("/auth?mode=signup");
            }}
          >
            Register
          </p>
          <div
            onClick={() => {
              router("/auth");
            }}
            role="button"
          >
            <p>Login</p>
          </div>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#D97500" }}>Connect</span> with your{" "}
            <span style={{ color: "#ed2424" }}>Loved</span> ones
          </h1>

          <p>Cover the distances by A_CALL</p>
          <div
            style={{ cursor: "pointer" }}
            onClick={() => router("/auth?mode=signup")}
            role="button"
            tabIndex={0}
            onKeyPress={(e) => {
              if (e.key === "Enter" || e.key === " ")
                router("/auth?mode=signup");
            }}
          >
            Get Started
          </div>
        </div>

        <div className="cardGrid">
          <Card sx={{ maxWidth: 345 }} className="card1">
            <CardActionArea onClick={() => router("/video-calling")}>
              <CardMedia
                component="img"
                height="170"
                image="https://cdn.prod.website-files.com/63d54e89026df83dc6107edc/67aeb1c26f527087c262b479_MirrorFly%20video.png"
                alt=""
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Realtime Video Calling
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Experience seamless, high-quality video calls with your
                  friends and family.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card sx={{ maxWidth: 345 }} className="card2">
            <CardActionArea onClick={() => router("/connect-chat")}>
              <CardMedia
                component="img"
                height="170"
                image="https://media.istockphoto.com/id/2139639798/photo/human-hand-using-smartphone-typing-live-chat-chatting-and-social-network-concepts-chatting.jpg?s=612x612&w=0&k=20&c=Lj8OdAFe2gvqtmR-Ik-7EeEHdAmK9TRYPA5Csbuqp0Q="
                alt=""
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Connect & Chat
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enhanced connectivity through instant messaging.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>

          <Card sx={{ maxWidth: 345 }} className="card3">
            <CardActionArea onClick={() => router("/squeezing-distances")}>
              <CardMedia
                component="img"
                height="170"
                image="https://thumbs.dreamstime.com/b/online-dating-app-concept-man-woman-meeting-social-network-virtual-love-long-distance-relationship-vector-illustration-202754350.jpg"
                alt=""
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="div">
                  Squeezing the Distances
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Bridge the gap between you and your loved ones.
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
