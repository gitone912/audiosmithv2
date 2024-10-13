import { Icon } from '@chakra-ui/react';
import {
  MdBarChart,
  MdPerson,
  MdHome,
  MdLock,
  MdOutlineShoppingCart,
  MdAddIcCall,
  MdRecordVoiceOver,
  MdNotes,
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import Profile from 'views/admin/profile';
import StartSession from 'views/admin/StartSession';
import Journals from 'views/admin/Journals';

// Auth Imports
import SignInCentered from 'views/auth/signIn';
import SignUp from 'views/auth/signup';

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
  },
  {
    name: 'Dashboard',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  {
    name: 'Journals',
    layout: '/admin',
    path: '/journals',
    icon: <Icon as={MdNotes} width="20px" height="20px" color="inherit" />,
    component: <Journals />,
  },
  {
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  {
    name: 'Logout',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
];

// Routes for non-logged-in users (Auth routes)
const authRoutes = [
  {
    name: 'Sign In',
    layout: '/auth',
    path: '/sign-in',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignInCentered />,
  },
  {
    name: 'Sign Up',
    layout: '/auth',
    path: '/sign-up',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignUp />,
  },
];

// Export the appropriate routes based on the user's login status
const routes = isUserLoggedIn() ? adminRoutes : authRoutes;

export default routes;
