import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import { Badge, IconButton, TextField } from "@mui/material";
import { Button } from "@mui/material";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from "@mui/icons-material/CallEnd";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
import ChatIcon from "@mui/icons-material/Chat";
import server from "../environment";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser } from "@fortawesome/free-solid-svg-icons";
import Lobby from "./Lobby";

const server_url = server;

var connections = {};

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();

  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);

  let [audioAvailable, setAudioAvailable] = useState(true);

  let [video, setVideo] = useState(true);

  let [audio, setAudio] = useState(true);

  let [screen, setScreen] = useState();

  let [showModal, setModal] = useState(true);

  const [showChat, setShowChat] = useState(false);

  let [screenAvailable, setScreenAvailable] = useState();

  let [messages, setMessages] = useState([]);

  let [message, setMessage] = useState("");

  let [newMessages, setNewMessages] = useState(0);

  let [askForUsername, setAskForUsername] = useState(true);

  let [username, setUsername] = useState("");

  const videoRef = useRef([]);

  let [videos, setVideos] = useState([]);

  // New state for inline error message
  const [usernameError, setUsernameError] = useState("");

  const chatContainerRef = useRef(null);

  // TODO
  // if(isChrome() === false) {

  // }
  const stopLocalMedia = () => {
    try {
      if (localVideoref.current?.srcObject) {
        localVideoref.current.srcObject.getTracks().forEach((t) => t.stop());
        localVideoref.current.srcObject = null;
      }
      if (window.localStream) {
        window.localStream.getTracks().forEach((t) => t.stop());
        window.localStream = null;
      }
    } catch (err) {
      console.error("Error while stopping media tracks", err);
    }
  };

  useEffect(() => {
    console.log("HELLO");
    getPermissions();
  });

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then(getDisplayMediaSuccess)
          .catch((e) => {
            setScreen(false); // reset icon if cancelled
            console.log(e);
          });
      }
    }
  };

  const getPermissions = async () => {
    try {
      const videoPermission = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      if (videoPermission) {
        setVideoAvailable(true);
        console.log("Video permission granted");
      } else {
        setVideoAvailable(false);
        console.log("Video permission denied");
      }

      const audioPermission = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (audioPermission) {
        setAudioAvailable(true);
        console.log("Audio permission granted");
      } else {
        setAudioAvailable(false);
        console.log("Audio permission denied");
      }

      if (navigator.mediaDevices.getDisplayMedia) {
        setScreenAvailable(true);
      } else {
        setScreenAvailable(false);
      }

      if (videoAvailable || audioAvailable) {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({
          video: videoAvailable,
          audio: audioAvailable,
        });
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Removed useEffect on [video, audio] to prevent re-negotiation

  let getMedia = () => {
    // setVideo(videoAvailable);
    // setAudio(audioAvailable);
    connectToSocketServer();
    getUserMedia(); // Explicitly call getUserMedia once on join
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    if (stream.getVideoTracks().length > 0) {
      stream.getVideoTracks()[0].enabled = video;
    }
    if (stream.getAudioTracks().length > 0) {
      stream.getAudioTracks()[0].enabled = audio;
    }

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        console.log(description);
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
      (track.onended = () => {
        setVideo(false);
        setAudio(false);

        try {
          let tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        } catch (e) {
          console.log(e);
        }

        // let blackSilence = (...args) =>
        //   new MediaStream([black(...args), silence()]);
        // window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;

        for (let id in connections) {
          connections[id].addStream(window.localStream);

          connections[id].createOffer().then((description) => {
            connections[id]
              .setLocalDescription(description)
              .then(() => {
                socketRef.current.emit(
                  "signal",
                  id,
                  JSON.stringify({ sdp: connections[id].localDescription })
                );
              })
              .catch((e) => console.log(e));
          });
        }
      })
    );
  };

  let getUserMedia = () => {
    // Only get media if permissions allowed, using current state or passed constraints if needed
    if ((videoAvailable) || (audioAvailable)) {
      navigator.mediaDevices
        .getUserMedia({ video: videoAvailable, audio: audioAvailable })
        .then(getUserMediaSuccess)
        .then((stream) => { })
        .catch((e) => console.log(e));
    } else {
      try {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      } catch (e) { }
    }
  };

  let getDisplayMediaSuccess = (stream) => {
    console.log("HERE");
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    window.localStream = stream;
    localVideoref.current.srcObject = stream;

    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].addStream(window.localStream);

      connections[id].createOffer().then((description) => {
        connections[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections[id].localDescription })
            );
          })
          .catch((e) => console.log(e));
      });
    }

    stream.getTracks().forEach(
      (track) =>
      (track.onended = () => {
        setScreen(false);

        try {
          let tracks = localVideoref.current.srcObject.getTracks();
          tracks.forEach((track) => track.stop());
        } catch (e) {
          console.log(e);
        }

        // let blackSilence = (...args) =>
        //   new MediaStream([black(...args), silence()]);
        // window.localStream = blackSilence();
        localVideoref.current.srcObject = window.localStream;

        getUserMedia();
      })
    );
  };

  let gotMessageFromServer = (fromId, message) => {
    var signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections[fromId]
                .createAnswer()
                .then((description) => {
                  connections[fromId]
                    .setLocalDescription(description)
                    .then(() => {
                      socketRef.current.emit(
                        "signal",
                        fromId,
                        JSON.stringify({
                          sdp: connections[fromId].localDescription,
                        })
                      );
                    })
                    .catch((e) => console.log(e));
                })
                .catch((e) => console.log(e));
            }
          })
          .catch((e) => console.log(e));
      }

      if (signal.ice) {
        connections[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch((e) => console.log(e));
      }
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketRef.current.emit("join-call", window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on("chat-message", (data, sender, socketIdSender) => {
        if (socketIdSender !== socketIdRef.current) {
          addMessage(data, sender, socketIdSender);
        }
      });

      socketRef.current.on("user-left", (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          connections[socketListId] = new RTCPeerConnection(
            peerConfigConnections
          );
          // Wait for their ice candidate
          connections[socketListId].onicecandidate = function (event) {
            if (event.candidate != null) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate })
              );
            }
          };

          // Wait for their video stream
          connections[socketListId].onaddstream = (event) => {
            console.log("BEFORE:", videoRef.current);
            console.log("FINDING ID: ", socketListId);

            let videoExists = videoRef.current.find(
              (video) => video.socketId === socketListId
            );

            if (videoExists) {
              console.log("FOUND EXISTING");

              // Update the stream of the existing video
              setVideos((videos) => {
                const updatedVideos = videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: event.stream }
                    : video
                );
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            } else {
              // Create a new video
              console.log("CREATING NEW");
              let newVideo = {
                socketId: socketListId,
                stream: event.stream,
                autoplay: true,
                playsinline: true,
              };

              setVideos((videos) => {
                const updatedVideos = [...videos, newVideo];
                videoRef.current = updatedVideos;
                return updatedVideos;
              });
            }
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            connections[socketListId].addStream(window.localStream);
          } else {
            // let blackSilence = (...args) =>
            //   new MediaStream([black(...args), silence()]);
            // window.localStream = blackSilence();
            connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              connections[id2].addStream(window.localStream);
            } catch (e) { }

            connections[id2].createOffer().then((description) => {
              connections[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({ sdp: connections[id2].localDescription })
                  );
                })
                .catch((e) => console.log(e));
            });
          }
        }
      });
    });
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };
  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), {
      width,
      height,
    });
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  // Re-attach stream when user toggles video ON or permissions change
  useEffect(() => {
    if (video && videoAvailable && localVideoref.current && window.localStream) {
      localVideoref.current.srcObject = window.localStream;
    }
  }, [video, videoAvailable]);

  let handleVideo = () => {
    setVideo((prev) => {
      const newVideo = !prev;

      // If turning OFF: Stop all tracks and clear srcObject
      if (!newVideo) {
        try {
          if (localVideoref.current && localVideoref.current.srcObject) {
            localVideoref.current.srcObject.getTracks().forEach(t => t.stop());
            localVideoref.current.srcObject = null;
          }
          if (window.localStream) {
            window.localStream.getTracks().forEach(t => t.stop());
            // Don't nullify window.localStream immediately if we need it for later, 
            // but for "OFF" state, stopping tracks is key. 
          }
        } catch (e) {
          console.error("Error stopping video:", e);
        }
      }
      // If turning ON: Re-acquire media
      else {
        getPermissions();
      }

      return newVideo;
    });
  };

  let handleAudio = () => {
    setAudio((prevAudio) => {
      const newAudioState = !prevAudio;

      try {
        // Priority 1: Toggle window.localStream (sent to peers)
        if (window.localStream && window.localStream.getAudioTracks) {
          window.localStream.getAudioTracks().forEach((track) => {
            track.enabled = newAudioState;
          });
        }

        // Priority 2: Toggle local element (if different/preview)
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject.getAudioTracks().forEach((track) => {
            track.enabled = newAudioState;
          });
        }
      } catch (e) {
        console.error("Error toggling audio:", e);
      }

      return newAudioState;
    });
  };

  useEffect(() => {
    if (screen !== undefined) {
      getDisplayMedia();
    }
  }, [screen]);
  let handleScreen = () => {
    setScreen(!screen);
  };

  let handleEndCall = () => {
    stopLocalMedia();

    // Gracefully close every RTCPeerConnection
    Object.values(connections).forEach((pc) => {
      try {
        pc.close();
      } catch (_) { }
    });
    connections = {};

    // Close socket.io connection if it exists
    try {
      socketRef.current?.disconnect();
    } catch (_) { }

    // Check CURRENT authentication status (not initial state)
    const currentToken = localStorage.getItem("token");

    if (currentToken) {
      // User is currently authenticated - go to home
      window.location.href = "/home";
    } else {
      // User is not authenticated (guest) - go to landing page
      window.location.href = "/";
    }
  };

  let openChat = () => {
    setModal(true);
    setNewMessages(0);
  };
  let closeChat = () => {
    setModal(false);
  };
  let handleMessage = (e) => {
    setMessage(e.target.value);
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, socketIdSender: socketIdSender },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, showChat]);

  let sendMessage = () => {
    if (message.trim() === "") return;
    socketRef.current.emit("chat-message", message, username);
    // Optimistically add message to local state so sender sees it
    addMessage(message, username, socketIdRef.current);
    setMessage("");
  };

  let connect = () => {
    // Clear previous error
    setUsernameError("");

    const isValid = /^[a-zA-Z][a-zA-Z0-9\s_]*$/.test(username);

    if (!username) {
      setUsernameError("Username is required.");
      return;
    }

    if (!isValid) {
      setUsernameError("Username must start with a letter and can only contain letters, numbers, underscores, and spaces.");
      return;
    }
    setAskForUsername(false);
    getMedia();
  };

  const hasLiveVideoStream = (stream) => {
    if (!stream) return false;
    const tracks = stream.getVideoTracks();
    return (
      tracks.length > 0 &&
      tracks.some((track) => track.readyState === "live" && track.enabled)
    );
  };

  return (
    <div className={styles.meetVideoContainer}>
      {askForUsername ? (
        <div className={styles.lobbyWrapper}>
          <div className={styles.lobbyCard}>
            <h1 className={styles.lobbyTitle}>Join Meeting</h1>
            <p className={styles.lobbySubtitle}>Enter your name to get started</p>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
              <IconButton onClick={handleVideo} style={{ backgroundColor: video ? '#333' : '#ff4d4d', color: 'white', marginRight: '10px' }}>
                {video ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>
              <IconButton onClick={handleAudio} style={{ backgroundColor: audio ? '#333' : '#ff4d4d', color: 'white' }}>
                {audio ? <MicIcon /> : <MicOffIcon />}
              </IconButton>
            </div>
            <TextField
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  color: "white",
                  "& fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                  "&:hover fieldset": { borderColor: "white" },
                },
                "& .MuiInputLabel-root": { color: "#aaa" },
              }}
              fullWidth
              variant="outlined"
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  connect();
                }
              }}
            />
            {/* Inline Error Message */}
            {usernameError && (
              <p style={{ color: '#ff4d4d', fontSize: '0.9rem', marginTop: '-15px', marginBottom: '20px' }}>
                {usernameError}
              </p>
            )}
            <Button
              variant="contained"
              fullWidth
              onClick={connect}
              sx={{
                background: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)",
                height: 50,
                borderRadius: 2,
                fontSize: "1rem",
                textTransform: "none",
              }}
            >
              Join Now
            </Button>

            <div style={{ marginTop: 20, textAlign: 'center' }}>
              {video && videoAvailable ? (
                <video ref={localVideoref} autoPlay muted style={{ width: '100%', borderRadius: 10, marginTop: 10, background: '#000', transform: 'scaleX(-1)' }} />
              ) : (
                <div style={{
                  width: '100%',
                  height: '200px', // Approximate height of the video
                  borderRadius: 10,
                  marginTop: 10,
                  background: '#2a2a2a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#888'
                }}>
                  <FontAwesomeIcon icon={faUser} size="4x" color="#bdbdbd" />
                </div>
              )}
            </div>

          </div>
        </div>
      ) : (
        <>
          {/* Chat Sidebar */}
          <div className={`${styles.chatRoom} ${!showChat ? styles.chatRoomHidden : ""}`}>
            <div className={styles.chatContainer}>
              <h1>In-Call Messages</h1>

              <div className={styles.chattingDisplay} ref={chatContainerRef}>
                {messages.length > 0 ? (
                  messages.map((item, index) => {
                    const isSelf = item.socketIdSender === socketIdRef.current;
                    return (
                      <div key={index} className={isSelf ? styles.messageSelf : styles.messageOther}>
                        <p className={styles.msgSender}>{item.sender}</p>
                        <p className={styles.msgText}>{item.data}</p>
                      </div>
                    )
                  })
                ) : (
                  <p style={{ color: "#888", textAlign: "center", marginTop: 20 }}>
                    No messages yet.
                  </p>
                )}
              </div>

              <div className={styles.chattingArea}>
                <TextField
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  variant="outlined"
                  placeholder="Type a message..."
                  fullWidth
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      color: "white",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      borderRadius: 2,
                      "& fieldset": { border: "none" },
                    },
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                />
                <Button
                  variant="contained"
                  onClick={sendMessage}
                  sx={{
                    ml: 1,
                    background: "linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)",
                    color: "white",
                    textTransform: "none",
                    fontWeight: 600
                  }}
                >
                  Send
                </Button>
              </div>
            </div>
          </div>

          {/* Main Video Area containing Grid */}
          {/* Main Video Area containing Grid */}
          <div className={styles.conferenceView}>
            {/* Local Video Pinned Top-Right - Only show when NOT alone */}
            {videos.length > 0 && (
              <div className={styles.mainVideoWrapper}>
                {video && videoAvailable ? (
                  <video
                    ref={localVideoref}
                    autoPlay
                    playsInline
                    muted
                    className={styles.meetUserVideo}
                  />
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <FontAwesomeIcon icon={faUser} size="4x" color="#bdbdbd" />
                  </div>
                )}
              </div>
            )}

            {/* If Alone: Show Local Video Centered Here */}
            {videos.length === 0 && (
              <div style={{ flex: '1 1 800px', maxWidth: '800px', display: 'flex', justifyContent: 'center' }}>
                {video && videoAvailable ? (
                  <video
                    ref={localVideoref}
                    autoPlay
                    playsInline
                    muted
                    style={{
                      width: '100%',
                      borderRadius: '16px',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      transform: 'scaleX(-1)', // Mirror local video
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  <div className={styles.videoPlaceholder} style={{ width: '100%', aspectRatio: '16/9' }}>
                    <FontAwesomeIcon icon={faUser} size="4x" color="#bdbdbd" />
                    <p style={{ marginTop: 20 }}>Waiting for others to join...</p>
                  </div>
                )}
              </div>
            )}

            {/* Remote Participants - Only show when NOT alone (implied by logic, but good to be explicit or just let map handle 0 items) */}
            {videos
              .filter((videoItem) => hasLiveVideoStream(videoItem.stream))
              .map((videoItem) => (
                <video
                  key={videoItem.socketId}
                  ref={(ref) => {
                    if (ref && videoItem.stream) {
                      ref.srcObject = videoItem.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              ))}
          </div>

          {/* Bottom Control Dock */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ backgroundColor: video ? '#333' : '#ff4d4d', color: 'white' }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleAudio} style={{ backgroundColor: audio ? '#333' : '#ff4d4d', color: 'white' }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ backgroundColor: '#ff4d4d', color: 'white', padding: 15, margin: '0 10px' }}>
              <CallEndIcon fontSize="medium" />
            </IconButton>

            <IconButton onClick={handleScreen} style={{ backgroundColor: screen ? '#0072FF' : '#333', color: 'white' }}>
              {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
            </IconButton>

            <IconButton onClick={() => setShowChat(!showChat)} style={{ backgroundColor: showChat ? '#0072FF' : '#333', color: 'white' }}>
              <Badge badgeContent={newMessages} color="secondary" invisible={newMessages === 0}>
                <ChatIcon />
              </Badge>
            </IconButton>
          </div>
        </>
      )}
    </div>
  );
}
