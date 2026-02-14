import React, { useEffect, useRef } from 'react';
import styles from "../styles/videoComponent.module.css";

const VideoPlayer = ({ stream, isLocal = false, isVideoOn = true }) => {
    const videoRef = useRef(null);
    const [isVideoTrackEnabled, setIsVideoTrackEnabled] = React.useState(isVideoOn);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }

        // Listen for track events to handle remote video toggling
        if (stream) {
            const videoTracks = stream.getVideoTracks();
            if (videoTracks.length > 0) {
                const track = videoTracks[0];

                // Set initial state
                setIsVideoTrackEnabled(track.enabled && track.readyState === 'live');

                const handleMute = () => setIsVideoTrackEnabled(false);
                const handleUnmute = () => setIsVideoTrackEnabled(true);
                const handleEnded = () => setIsVideoTrackEnabled(false);

                track.addEventListener('mute', handleMute);
                track.addEventListener('unmute', handleUnmute);
                track.addEventListener('ended', handleEnded);

                return () => {
                    track.removeEventListener('mute', handleMute);
                    track.removeEventListener('unmute', handleUnmute);
                    track.removeEventListener('ended', handleEnded);
                };
            }
        }
    }, [stream]);

    // Update local state if prop changes (for local user)
    useEffect(() => {
        setIsVideoTrackEnabled(isVideoOn);
    }, [isVideoOn]);

    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={isLocal} // Mute local video to prevent feedback
            className={styles.meetUserVideo}
            style={{
                display: isVideoTrackEnabled ? 'block' : 'none',
                transform: isLocal ? 'scaleX(-1)' : 'none'
            }}
        />
    );
};

export default VideoPlayer;
