import { Icon } from '@chakra-ui/react';
import {
  MdHome,
  MdLock,
  MdRecordVoiceOver,
  MdNotes,
  MdFeedback,
  MdSentimentNeutral,
  MdDashboard,
  MdSettings,
  MdToday
} from 'react-icons/md';
import { FaDiscord } from 'react-icons/fa';
// Admin Imports
import MainDashboard from 'views/admin/default';
import Profile from 'views/admin/profile';
import StartSession from 'views/admin/StartSession';
import Journals from 'views/admin/Journals';

// Auth Imports
import SignInCentered from 'views/auth/signIn';
import SignUp from 'views/auth/signup';
import Feedback from 'views/admin/Feedback';
import LockedPage from 'views/admin/500';
import ReqFeatures from 'views/admin/ReqFeatures';
import Onboarding from 'views/auth/onboarding_comps/onboarding';
import ChooseCover from 'views/auth/onboarding_comps/chooseCover';
import Discord from 'views/admin/Feedback/discord';
import DailyStreak from 'views/Gamification/dailystreak';

// Utility to check if the user is logged in
const isUserLoggedIn = () => {
  const userDetails = localStorage.getItem('userDetails');
  return userDetails !== null;
};

// Routes for logged-in users (Admin routes)
const adminRoutes = [
  {
    name: 'Start Session',
    layout: '/admin',
    path: '/session',
    icon: <Icon as={MdRecordVoiceOver} width="20px" height="20px" color="inherit" />,
    component: <StartSession />,
    lock:false
  },
  {
    name: 'Journals',
    layout: '/admin',
    path: '/journals',
    icon: <Icon as={MdNotes} width="20px" height="20px" color="inherit" />,
    component: <Journals />,
    lock:false
  },
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdDashboard} width="20px" height="20px" color="inherit" />,
    component: <LockedPage />,
    lock:true
  },
  {
    name: 'Actions',
    layout: '/admin',
    path: '/action',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <LockedPage />,
    lock:true
  },
  {
    name: 'Mental Health Status',
    layout: '/admin',
    path: '/status',
    icon: <Icon as={MdSentimentNeutral} width="20px" height="20px" color="inherit" />,
    component: <LockedPage />,
    lock:true
  },
 

  {
    name: 'Feedback',
    layout: '/admin',
    path: '/feedback',
    icon: <Icon as={MdFeedback} width="20px" height="20px" color="inherit" />,
    component: <Feedback />,
    lock:false
  },
  {
    name: 'Settings',
    layout: '/admin',
    path: '/../profile',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <ReqFeatures />,
    lock:false
  },
  {
    name: 'My Journey',
    layout: '/admin',
    path: '/streak',
    icon: <Icon as={MdToday} width="20px" height="20px" color="inherit" />,
    component: <DailyStreak />,
    lock:false
  },
  {
    name: 'Join Discord Community',
    layout: '/admin',
    path: '/discord',
    icon: <Icon as={FaDiscord} width="20px" height="20px" color="inherit" />,
    component: <Discord />,
    lock:false
  }
];

// Routes for non-logged-in users (Auth routes)
const authRoutes = [
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
    lock:false
  },
  {
    name: 'Sign Up',
    layout: '/auth',
    path: '/sign-up',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignUp />,
    lock:false
  },
  {
    name: 'Onboarding',
    layout: '/auth',
    path: '/onboarding',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <Onboarding />,
    lock:false
  },
  {
    name: 'choose-cover',
    layout: '/auth',
    path: '/choose-cover',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <ChooseCover />,
    lock:false
  },
];

// Export the appropriate routes based on the user's login status
const routes = isUserLoggedIn() ? adminRoutes : authRoutes;

export default routes;
