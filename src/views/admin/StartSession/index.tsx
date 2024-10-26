import { Box, Button, Text, VStack, useColorModeValue, useDisclosure, Fade } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TypeAnimation } from 'react-type-animation';

export default function StartSession() {
  const textColor = useColorModeValue('black', 'white');
  const boxBg = useColorModeValue('secondaryGray.300', 'rgb(55, 60, 49)');
  const buttonBg = '#9ba192'; // Button color

  const navigate = useNavigate();
  const { isOpen, onOpen } = useDisclosure();

  // Get the display name from local storage
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const userDisplayName = userDetails.displayName || 'Guest';
  const firstName = userDisplayName.split(' ')[0];

  useEffect(() => {
    // Trigger the fade effect after animation completes
    const timer = setTimeout(onOpen, 3000); // Adjust timeout to match animation length
    return () => clearTimeout(timer);
  }, [onOpen]);

  const useTypingEffect = (text: string, speed: number) => {
  
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

  const { displayedText, isFinished } = useTypingEffect(`Goood day\u201A ${firstName}!,`+`What would you like to do today?,`, 50);

  useEffect(() => {
    if (isFinished) {
      onOpen();
    }
  }, [isFinished, onOpen]);

  return (
    <Box
      pt={{ base: '150px', md: '330px', xl: '330px' }}
      textAlign="center"
      bg={boxBg}
      minHeight="100vh"
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
    >
      <VStack spacing={8}>
      <Text color={textColor} fontSize="3xl">
          {/* Manually add <br> between "Good Evening" and the rest of the sentence */}
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
          <Box>
            <Button
              bg={buttonBg}
              color="white"
              size="lg"
              fontSize="xl"
              m={3}
              onClick={() => navigate('/monologue')}
            >
              Monologue
            </Button>
            <Button
              bg={buttonBg}
              color="white"
              size="lg"
              fontSize="xl"
              m={3}
              onClick={() => navigate('/dialogue')}
            >
              Dialogue
            </Button>
          </Box>
        </Fade>
      </VStack>
    </Box>
  );
}
