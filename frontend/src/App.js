import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import Profile from './pages/Profile';
import MentorDetail from './pages/MentorDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import AdminPanel from './pages/AdminPanel';
import Messages from './pages/Messages';
import Lessons from './pages/Lessons';
import LessonRoom from './pages/LessonRoom';
import ChatBot from './components/ChatBot';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
          <Route path='/verify-email' element={<VerifyEmail />} />
          <Route path='/profile' element={<Profile />} />
          <Route path='/mentors/:id' element={<MentorDetail />} />
          <Route path='/about' element={<About />} />
          <Route path='/contact' element={<Contact />} />
          <Route path='/admin-panel' element={<AdminPanel />} />
          <Route path='/messages' element={<Messages />} />
          <Route path='/lessons' element={<Lessons />} />
          <Route path='/lessons/room/:code' element={<LessonRoom />} />
        </Routes>
        <ChatBot />
      </BrowserRouter>
    </AuthProvider>
  );
}
