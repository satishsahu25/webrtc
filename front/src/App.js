import './App.css';
import { Route,Routes } from 'react-router-dom';
import Home from './Screens/Home/Home';
import VideoChat from './Screens/VideoChat/VideoChat';

function App() {
  return (
   <>
    <Routes>
    <Route path="/" element={<Home/>}/>
    <Route path="/video" element={<VideoChat/>}/>
    </Routes>
   </>
  );
}

export default App;
