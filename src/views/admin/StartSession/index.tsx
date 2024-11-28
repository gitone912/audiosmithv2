import { Box, Text, VStack, useColorModeValue, useDisclosure, Fade, Image } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import imgMonologue from 'assets/img/session/Monologue.png';
import imgDialogue from 'assets/img/session/Dialogue.png'
import imgType from 'assets/img/session/Type.png'
import imgChat from 'assets/img/session/Chat.png'
import axios from 'axios';
interface StreakResponse {
  streak: number;
}

export default function StartSession() {
  const textColor = useColorModeValue('black', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'rgb(55, 60, 49)');
  const navigate = useNavigate();
  const { isOpen, onOpen } = useDisclosure();

  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const userDisplayName = userDetails.displayName || 'Guest';
  const firstName = userDisplayName.split(' ')[0];
  const utcOffsetMinutes = new Date().getTimezoneOffset() * -1;

  const getEmailFromLocalStorage = (): string | null => {
    const userDetails = localStorage.getItem('userDetails');
    return userDetails ? JSON.parse(userDetails).email : null;
  };


  useEffect(() => {
    const email = getEmailFromLocalStorage();

    if (!email) {
      console.error("No email found in local storage");
      return;
    }

    const fetchStreak = async () => {
      try {
        const response = axios.post<StreakResponse>('https://audiosmith-backendv2.vercel.app/updateStreak', { 
          email, 
          utcOffsetMinutes 
        });
      } catch (error) {
        console.error('Error fetching streak:', error);
      }
    };

    fetchStreak();
  }, []);

  useEffect(() => {
    const timer = setTimeout(onOpen, 3000); 
    return () => clearTimeout(timer);
  }, [onOpen]);

  const useTypingEffect = (text:any, speed:any) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isFinished, setIsFinished] = useState(false);

    useEffect(() => {
      let currentIndex = 0;
      const typeCharacter = () => {
        if (currentIndex < text.length) {
          setDisplayedText((prev) => prev + text[currentIndex]);
          currentIndex++;
        } else {
          setIsFinished(true);
        }
      };
      const interval = setInterval(typeCharacter, speed);
      return () => clearInterval(interval);
    }, [text, speed]);

    return { displayedText, isFinished };
  };

  const { displayedText, isFinished } = useTypingEffect(`Goood day\u201A ${firstName}!,What would you like to do today?,`, 50);

  useEffect(() => {
    if (isFinished) {
      onOpen();
    }
  }, [isFinished, onOpen]);

  return (
    <Box
      bg={boxBg}
      minHeight="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"  // Center vertically
      alignItems="center"
      textAlign="center"
      mt="-50px"  // Shift everything upward
    >
      <VStack spacing={8}>
        <Text color={textColor} fontSize="3xl">
          {displayedText.includes(',') ? (
            <>
              {displayedText.split(',')[0]}
              <br />
              {displayedText.split(',')[1]}
            </>
          ) : (
            displayedText
          )}
        </Text>
        <Fade in={isOpen}>
  <Box 
    display="flex" 
    flexDirection={{ base: 'row', md: 'row' }}  // Stack on phones, row on larger screens
    gap={{ base: 4, md: 6 }}  // Adjust gap based on screen size
    alignItems="center"  // Ensure alignment in both layouts
  >
    <Image
      src={imgMonologue}
      alt="Monologue"
      boxSize={{ base: '150px', md: '220px' }}  // Smaller image for phones
      cursor="pointer"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ transform: 'scale(1.10)', boxShadow: 'lg' }}
      _active={{ transform: 'scale(0.95)', boxShadow: 'md' }}
      onClick={() => navigate('/fetching-mono')}
    />
    <Image
      src={imgDialogue}
      alt="Dialogue"
      boxSize={{ base: '150px', md: '220px' }}  // Smaller image for phones
      cursor="pointer"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ transform: 'scale(1.10)', boxShadow: 'lg' }}
      _active={{ transform: 'scale(0.95)', boxShadow: 'md' }}
      onClick={() => navigate('/fetching')}
    />
  </Box>
</Fade>
<Fade in={isOpen}>
  <Box 
    display="flex" 
    flexDirection={{ base: 'row', md: 'row' }}  // Stack on phones, row on larger screens
    gap={{ base: 4, md: 6 }}  // Adjust gap based on screen size
    alignItems="center"  // Ensure alignment in both layouts
  >
    <Image
      src={imgType}
      alt="Monologue"
      boxSize={{ base: '150px', md: '220px' }}  // Smaller image for phones
      cursor="pointer"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ transform: 'scale(1.10)', boxShadow: 'lg' }}
      _active={{ transform: 'scale(0.95)', boxShadow: 'md' }}
      onClick={() => navigate('/fetching-lang-for-type')}
    />
    <Image
      src={imgChat}
      alt="Dialogue"
      boxSize={{ base: '150px', md: '220px' }}  // Smaller image for phones
      cursor="pointer"
      transition="transform 0.3s, box-shadow 0.3s"
      _hover={{ transform: 'scale(1.10)', boxShadow: 'lg' }}
      _active={{ transform: 'scale(0.95)', boxShadow: 'md' }}
      onClick={() => navigate('/fetching-lang-for-chat')}
    />
  </Box>
</Fade>

      </VStack>
    </Box>
  );
}
