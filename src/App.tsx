// src/Main.tsx
import './assets/css/App.css';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import { ChakraProvider } from '@chakra-ui/react';
import initialTheme from './theme/theme';
import { useState, useEffect } from 'react';
import Dialogue from './views/Dialogue';
import SaveChat from 'views/Dialogue/SaveChat';
import Monologue from 'views/monologue';
import SaveChatMono from 'views/monologue/SaveChatMono';
import EditJournal from 'views/editjournal';
import DialogueHume from 'views/DialogueHume';
import SignOut from 'views/auth/signOut';
import Entries from 'views/admin/Journals/Entries';
import NotFound from './views/404'; // Import the 404 component
import Profile from 'views/admin/profile';
import LanguageSet from 'views/admin/profile/langSet';
import VoiceSet from 'views/admin/profile/voiceSet';
import TherapySet from 'views/admin/profile/therapySet';
import { OpenAIDialoguePage } from 'views/OpenAIDialogue';
import FetchPrompts from 'views/OpenAIDialogue/fetchPrompt';
import ConversationalAI from 'views/Dialogue11labs';
import FetchPromptsMono from 'views/monologue/fetchPromptMono';
import MonologueEng from 'views/monologue/MonoEngOnly';
import CreateTypeJournal from 'views/Type';
import SaveTypeChat from 'views/Chat/SaveTypeChat';
import TypeChatJournal from 'views/Chat';
import SaveTypeChat2 from 'views/Type/SaveTypeChat2';
import FetchLangForChat from 'views/Chat/fetchLangforChat';
import FetchLangForType from 'views/Type/fetchLangforType';

export default function Main() {
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  const location = useLocation();
  const navigate = useNavigate();

  // Authentication and browser detection logic
  useEffect(() => {
    const userDetails = JSON.parse(localStorage.getItem('userDetails'));

    const isAuthRoute = location.pathname.startsWith('/auth');
    
    if (!userDetails || !userDetails.email) {
      // If user is not authenticated and not on an auth route, redirect to sign-in
      if (!isAuthRoute) {
        navigate('/auth/sign-in', { replace: true });
      }
      return; // Allow auth routes to proceed
    }
  }, [location.pathname, navigate]); // Run on route change

  return (
    <ChakraProvider theme={currentTheme}>
      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route
          path="admin/*"
          element={
            <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
          }
        />
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/auth" element={<Navigate to="/admin" replace />} />
        {/* <Route path="dialogue/" element={<OpenAIDialoguePage />} /> */}
        <Route path="dialogue/" element={<NotFound />} />
        <Route path="monologue/" element={<Monologue />} />
        <Route path="monologue-new/" element={<MonologueEng />} />
        <Route path="savechat/" element={<SaveChat />} />
        <Route path="savechatmono/" element={<SaveChatMono />} />
        <Route path="save-type-chat/" element={<SaveTypeChat/>} />
        <Route path="save-type-journal/" element={<SaveTypeChat2 />} />
        <Route path="edit/" element={<EditJournal />} />
        {/* <Route path="dialoguepht/" element={<DialoguePht />} /> */}
        <Route path="sign-out/" element={<SignOut />} />
        <Route path="entries/" element={<Entries />} />
        <Route path="profile/" element={<Profile />} />
        <Route path="language/" element={<LanguageSet />} />
        <Route path="voice/" element={<VoiceSet />} />
        <Route path="therapy-type/" element={<TherapySet />} />
        <Route path="dialogue-new/" element={<DialogueHume />} />
        <Route path="fetching/" element={<FetchPrompts />} />
        <Route path="fetching-mono/" element={<FetchPromptsMono />} />
        <Route path="type-journal/" element={<CreateTypeJournal />} />
        <Route path="type-chat-journal/" element={<TypeChatJournal />} />
        <Route path="fetching-lang-for-chat/" element={<FetchLangForChat />} />
        <Route path="fetching-lang-for-type/" element={<FetchLangForType />} />
      </Routes>
    </ChakraProvider>
  );
}
