import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import {} from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import {
  ChakraProvider,
  // extendTheme
} from '@chakra-ui/react';
import initialTheme from './theme/theme'; //  { themeGreen }
import { useState } from 'react';
import Dialogue from './views/Dialogue';
import SaveChat from 'views/Dialogue/SaveChat';
import Monologue from 'views/monologue';
import SaveChatMono from 'views/monologue/SaveChatMono';
// Chakra imports

export default function Main() {
  // eslint-disable-next-line
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
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
        <Route
					path="dialogue/"
					element={<Dialogue />} // Only pass theme
				/>
        <Route
					path="monologue/"
					element={<Monologue />} // Only pass theme
				/>
         <Route
					path="savechat/"
					element={<SaveChat />} // Only pass theme
				/>
        <Route
					path="savechatmono/"
					element={<SaveChatMono />} // Only pass theme
				/>
        

      </Routes>
    </ChakraProvider>
  );
}
