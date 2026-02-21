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
import ClosedCaptionIcon from '@mui/icons-material/ClosedCaption';
import ClosedCaptionDisabledIcon from '@mui/icons-material/ClosedCaptionDisabled';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';




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
  const videoRef = useRef(video);

  useEffect(() => {
    videoRef.current = video;
  }, [video]);

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

  // --- Screen Recording Logic ---
  const [isScreenRecording, setIsScreenRecording] = useState(false);
  const screenRecorderRef = useRef(null);
  const screenRecordingChunks = useRef([]);

  const handleScreenRecording = async () => {
    if (isScreenRecording) {
      // Stop Recording
      if (screenRecorderRef.current) {
        screenRecorderRef.current.stop();
      }
      setIsScreenRecording(false);
    } else {
      // Start Recording
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
          systemAudio: "include"
        });

        const mimeType = MediaRecorder.isTypeSupported("video/webm; codecs=vp9")
          ? "video/webm; codecs=vp9"
          : "video/webm";

        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        screenRecorderRef.current = mediaRecorder;
        screenRecordingChunks.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            screenRecordingChunks.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(screenRecordingChunks.current, { type: "video/webm" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.style.display = "none";
          a.href = url;
          a.download = `screen-recording-${new Date().toISOString()}.webm`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          setIsScreenRecording(false);
          // Stop all tracks to clear the "sharing" indicator
          stream.getTracks().forEach(track => track.stop());
        };

        // If user stops sharing from browser UI
        stream.getVideoTracks()[0].onended = () => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
        };

        mediaRecorder.start();
        setIsScreenRecording(true);
      } catch (err) {
        console.error("Error starting screen recording:", err);
      }
    }
  };
  // -----------------------


  let [videos, setVideos] = useState([]);

  // New state for inline error message
  const [usernameError, setUsernameError] = useState("");

  const chatContainerRef = useRef(null);

  const [remoteVideoStates, setRemoteVideoStates] = useState({});

  // --- Live Captions Logic ---
  const [showCaptions, setShowCaptions] = useState(false);
  const showCaptionsRef = useRef(false); // Track state for listeners
  const [captionText, setCaptionText] = useState("");
  const recognitionRef = useRef(null);

  // Sync Ref with State
  useEffect(() => {
    showCaptionsRef.current = showCaptions;
  }, [showCaptions]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = window.navigator.language || 'en-US';
      recognitionRef.current.maxAlternatives = 1;

      recognitionRef.current.onresult = (event) => {
        if (!showCaptionsRef.current) return; // Guard clause

        // Dynamically join the full set of interim results currently stored in the event
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }

        // Emit caption to peers only if enabled
        if (socketRef.current && transcript.trim() !== "") {
          socketRef.current.emit("send-caption", transcript, username);
        }
        // Show local caption
        if (transcript.trim() !== "") {
          setCaptionText(`${username}: ${transcript}`);
        }
      };

      recognitionRef.current.onend = () => {
        if (showCaptionsRef.current && recognitionRef.current) {
          try { recognitionRef.current.start(); } catch (e) { }
        }
      };
    }
  }, [username]); // Removed showCaptions dependency to avoid re-creation

  // Toggle Captions
  const handleCaptions = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Browser does not support Speech Recognition.");
      return;
    }

    setShowCaptions((prev) => {
      const newState = !prev;
      if (newState) {
        try {
          if (recognitionRef.current) recognitionRef.current.start();
        } catch (e) {
          // If already started, ignore error
          console.log("Speech recognition already started");
        }
      } else {
        if (recognitionRef.current) recognitionRef.current.stop();
        setCaptionText("");
      }
      return newState;
    });
  };

  // Socket Listener for Captions
  useEffect(() => {
    if (socketRef.current) {
      socketRef.current.on("receive-caption", (text, senderName) => {
        if (showCaptionsRef.current) {
          setCaptionText(`${senderName}: ${text}`);
          // Auto-clear after 5 seconds
          setTimeout(() => setCaptionText(""), 5000);
        }
      });
    }
  }, [socketRef.current]);
  // ---------------------------

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
  }, []);

  let getDisplayMedia = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({
            video: true,
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              sampleRate: 44100
            },
            systemAudio: "include"
          })
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
      // Stop any existing local stream tracks first
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }

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

    stream.getTracks().forEach((track) => {
      track.onended = () => {
        // Isolate behavior depending on what kind of track actually ended
        if (track.kind === "video") {
          setVideo(false);
        } else if (track.kind === "audio") {
          setAudio(false);
        }

        // We explicitly DO NOT call track.stop() on all tracks here
        // because losing the video should NOT destroy the microphone stream.

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
      };
    });
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

    if (signal.videoToggle !== undefined) {
      setRemoteVideoStates((prev) => ({
        ...prev,
        [fromId]: signal.videoToggle,
      }));
    }

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
        if (id !== socketIdRef.current) {
          // A new peer joined. Send them my current video state.
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ videoToggle: videoRef.current })
          );
        } else {
          // I just joined. Send my video state to everyone else in the room.
          clients.forEach((c) => {
            if (c !== socketIdRef.current) {
              socketRef.current.emit(
                "signal",
                c,
                JSON.stringify({ videoToggle: videoRef.current })
              );
            }
          });
        }

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
          connections[socketListId].ontrack = (event) => {
            console.log("ONTRACK:", event.streams[0]);
            console.log("FINDING ID: ", socketListId);

            const stream = event.streams[0];

            if (!stream) return; // robustness check

            setVideos((videos) => {
              const videoExists = videos.find(v => v.socketId === socketListId);

              if (videoExists) {
                console.log("FOUND EXISTING - UPDATING STREAM");
                return videos.map((video) =>
                  video.socketId === socketListId
                    ? { ...video, stream: stream }
                    : video
                );
              } else {
                console.log("CREATING NEW");
                let newVideo = {
                  socketId: socketListId,
                  stream: stream,
                  autoplay: true,
                  playsinline: true,
                };
                return [...videos, newVideo];
              }
            });
          };

          // Add the local video stream
          if (window.localStream !== undefined && window.localStream !== null) {
            window.localStream.getTracks().forEach(track => {
              connections[socketListId].addTrack(track, window.localStream);
            });
          } else {
            // let blackSilence = (...args) =>
            //   new MediaStream([black(...args), silence()]);
            // window.localStream = blackSilence();
            // connections[socketListId].addStream(window.localStream);
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections) {
            if (id2 === socketIdRef.current) continue;

            try {
              if (window.localStream) {
                window.localStream.getTracks().forEach(track => {
                  connections[id2].addTrack(track, window.localStream);
                });
              }
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
    const newVideo = !video; // Compute deterministically outside setter
    setVideo(newVideo); // Pure state update

    // Broadcast video state to peers
    for (let id in connections) {
      if (id !== socketIdRef.current) {
        socketRef.current.emit(
          "signal",
          id,
          JSON.stringify({ videoToggle: newVideo })
        );
      }
    }

    if (!newVideo) {
      // Turning Video OFF
      try {
        if (window.localStream) {
          window.localStream.getVideoTracks().forEach((track) => {
            // Only stop the video track, leave audio alone
            track.stop();
          });
        }
        if (localVideoref.current && localVideoref.current.srcObject) {
          localVideoref.current.srcObject.getVideoTracks().forEach((track) => {
            track.stop();
          });
        }
      } catch (e) {
        console.error("Error stopping video:", e);
      }
    } else {
      // Turning Video ON
      console.log("Turn video ON");
      // CRITICAL FIX: Only ask for video. Never request audio here to prevent duplicate mic feeds!
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((newStream) => {
          const newVideoTrack = newStream.getVideoTracks()[0];

          // 1. Update local stream
          if (window.localStream) {
            // Safely remove dead video tracks without touching audio
            window.localStream.getVideoTracks().forEach(t => window.localStream.removeTrack(t));
            window.localStream.addTrack(newVideoTrack);
          } else {
            window.localStream = newStream;
          }

          // 2. Update local view
          if (localVideoref.current) {
            localVideoref.current.srcObject = window.localStream;
          }

          // 3. Update Peer Connections
          for (let id in connections) {
            const sender = connections[id].getSenders().find((s) => s.track && s.track.kind === "video");

            if (sender) {
              console.log(`Replacing track for ${id}`);
              sender.replaceTrack(newVideoTrack).catch(e => console.error("Replace Track Error: ", e));
            } else {
              console.log(`Adding track for ${id} and renegotiating`);
              connections[id].addTrack(newVideoTrack, window.localStream);

              // Renegotiate - Create new offer
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
          }
        })
        .catch((e) => console.error("Error restarting video:", e));
    }
  };

  let handleAudio = () => {
    const newAudioState = !audio; // Compute deterministically
    setAudio(newAudioState); // Pure state update

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
            {videos.map((videoItem) => {
              const isVideoEnabled = remoteVideoStates[videoItem.socketId] !== false;

              return isVideoEnabled ? (
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
              ) : (
                <div key={videoItem.socketId} className={styles.videoPlaceholder}>
                  <FontAwesomeIcon icon={faUser} size="4x" color="#bdbdbd" />
                </div>
              );
            })}
            {/* Caption Overlay */}
            {captionText && (
              <div style={{
                position: 'fixed',
                bottom: '120px',
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '30px',
                fontSize: '1.2rem',
                zIndex: 1000,
                pointerEvents: 'none',
                maxWidth: '80%',
                textAlign: 'center',
                boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
                backdropFilter: 'blur(5px)'
              }}>
                {captionText}
              </div>
            )}
          </div>

          {/* Bottom Control Dock */}
          <div className={styles.buttonContainers}>
            <IconButton onClick={handleVideo} style={{ backgroundColor: video ? '#333' : '#ff4d4d', color: 'white' }}>
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleAudio} style={{ backgroundColor: audio ? '#333' : '#ff4d4d', color: 'white' }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} className={styles.endCallButton}>
              <CallEndIcon fontSize="medium" />
            </IconButton>

            <IconButton onClick={handleScreen} style={{ backgroundColor: screen ? '#0072FF' : '#333', color: 'white' }}>
              {screen ? <ScreenShareIcon /> : <StopScreenShareIcon />}
            </IconButton>

            <IconButton onClick={handleCaptions} style={{ backgroundColor: showCaptions ? '#0072FF' : '#333', color: 'white' }}>
              {showCaptions ? <ClosedCaptionIcon /> : <ClosedCaptionDisabledIcon />}
            </IconButton>

            <IconButton onClick={handleScreenRecording} style={{ backgroundColor: isScreenRecording ? '#ff4d4d' : '#333', color: 'white', animation: isScreenRecording ? 'pulse 1.5s infinite' : 'none' }}>
              <FiberManualRecordIcon />
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
