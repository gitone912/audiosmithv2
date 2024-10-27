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
  MdFeedback,
  MdSentimentNeutral,
  MdDashboard,
  MdRequestPage
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
import LockedPage from 'views/admin/500';
import { LineChart } from 'recharts';
import ReqFeatures from 'views/admin/ReqFeatures';


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
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
    lock:false
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
    name: 'Request Feature',
    layout: '/admin',
    path: '/request-feature',
    icon: <Icon as={MdRequestPage} width="20px" height="20px" color="inherit" />,
    component: <ReqFeatures />,
    lock:false
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
];

// Export the appropriate routes based on the user's login status
const routes = isUserLoggedIn() ? adminRoutes : authRoutes;

export default routes;
