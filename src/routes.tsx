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
  MdFeedback
} from 'react-icons/md';

// Admin Imports
import MainDashboard from 'views/admin/default';
import Profile from 'views/admin/profile';
import StartSession from 'views/admin/StartSession';
import Journals from 'views/admin/Journals';

// Auth Imports
import SignInCentered from 'views/auth/signIn';
import SignUp from 'views/auth/signup';
import SignOut from 'views/auth/signOut';
import ActionRec from 'views/admin/ActionRec';
import Feedback from 'views/admin/Feedback';


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
    name: 'Journals',
    layout: '/admin',
    path: '/journals',
    icon: <Icon as={MdNotes} width="20px" height="20px" color="inherit" />,
    component: <Journals />,
  },
  {
    name: 'Mental Health Status',
    layout: '/admin',
    path: '/default',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <MainDashboard />,
  },
  {
    name: 'Action Recommendation',
    layout: '/admin',
    path: '/action',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <ActionRec />,
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
    path: '/sign-out',
    icon: <Icon as={MdLock} width="20px" height="20px" color="inherit" />,
    component: <SignOut />,
  },
  {
    name: 'Feedback',
    layout: '/admin',
    path: '/feedback',
    icon: <Icon as={MdFeedback} width="20px" height="20px" color="inherit" />,
    component: <Feedback />,
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
