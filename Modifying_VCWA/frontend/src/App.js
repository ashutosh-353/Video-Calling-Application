import "./App.css";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import LandingPage from "./pages/landing";
import Authentication from "./pages/authentication";
import { AuthProvider } from "./contexts/AuthContext";
import VideoMeetComponent from "./pages/VideoMeet";
import HomeComponent from "./pages/home";
import History from "./pages/history";
import "bootstrap/dist/css/bootstrap.min.css";
import VideoCalling from "./pages/VideoCalling";
import ConnectChat from "./pages/ConnectChat";
import SqueezingDistances from "./pages/SqueezingDistances";




function App() {
  return (
    <div className="App">
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            <Route path="/auth" element={<Authentication />} />

            <Route path="/home" s element={<HomeComponent />} />
            <Route path="/history" element={<History />} />
            <Route path="/:url" element={<VideoMeetComponent />} />

            <Route path="/video-calling" element={<VideoCalling/>}/>
            <Route path="/connect-chat" element={<ConnectChat/>}/>
            <Route path="/squeezing-distances" element={<SqueezingDistances/>}/>



            
          </Routes>
        </AuthProvider>
      </Router>
    </div>
  );
}

export default App;
