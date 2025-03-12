import React, { useEffect, useRef, useState } from 'react';
import { Box, VStack, Input, Button, Text, Progress, Spinner, Flex, Icon } from '@chakra-ui/react';
import { IoChevronBackOutline, IoSend } from 'react-icons/io5';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase';
import OpenAI from 'openai';
import { getPrompt } from 'views/OpenAIDialogue/utils/system';

const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

const TypeChatJournal = () => {
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false); // For AI response loading state
  const navigate = useNavigate();
  const chatContainerRef = useRef(null); // Reference for the chat container
  const userDetails = JSON.parse(localStorage.getItem('userDetails') || '{}');
  const fullname = userDetails.displayName || "There"; // Fallback to "Korean" if not set
  const VOICE = localStorage.getItem("userVoice") || "sage";
  
  const language = localStorage.getItem('userLanguage') || 'English';
  const assistantName = VOICE === "sage" ? "Laura" : "William";
  const SYSTEM_MESSAGE = getPrompt(language);
  
  
  const getGreeting = async () => {
    try {
      const Prompt = `In language ${language} Send a random greeting for user like this - Hi ${fullname}, I'm ${assistantName}. Mindleaf's mental health and journaling companion. How do you feel today?, user's and assitant's sname should not change and give greetings in ${language} only`;
  
      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'user', content: Prompt },
        ],
        model: 'gpt-4',
      });
  
      return journalCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error compiling journal:', error);
      return '';
    }
  };
  
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const fetchGreeting = async () => {
      const greetingMessage = await getGreeting();
      setGreeting(greetingMessage);
    };

    fetchGreeting();
  }, []);
  

  const handleSendMessage = async () => {
    if (chatInput.trim() === '') return;
  
    // Append user input to chat history
    const userMessage = `User: ${chatInput}`;
    setChatHistory((prevHistory) => [...prevHistory, userMessage]);
  
    setChatInput('');
    setIsLoadingResponse(true); // Show loading spinner while getting AI response
  
    try {
      // Prepare the system prompt for context
      const botPrompt = SYSTEM_MESSAGE;
  
      const formattedMessages= { ...chatHistory.map((msg) => ({
        role: msg.startsWith('User:') ? 'user' : 'assistant',
        content: msg.replace(/^(User:|AI:)\s*/, ''), // Remove prefixes
      }))}
      // Send messages to OpenAI
      const aiResponse = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: `respond in${language} language only, ${botPrompt}` },
          
          { role: 'user', content: chatInput }, // Include the latest user input
        ],
        model: 'gpt-4',
      });
  
      // Append AI's response to chat history
      const aiMessage = `AI: ${aiResponse.choices[0]?.message?.content || 'Sorry, I could not generate a response.'}`;
      setChatHistory((prevHistory) => [...prevHistory, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      setChatHistory((prevHistory) => [...prevHistory, 'AI: Sorry, I encountered an error processing your input.']);
    } finally {
      setIsLoadingResponse(false); // Hide loading spinner after response
    }
  };
  

  const saveChatHistory = async () => {
    setIsSaving(true);
    setProgress(10);
    const interval = setInterval(() => {
      setProgress(prev => (prev < 80 ? prev + 1 : prev));
    }, 100); // Increment progress every 100ms up to 80%

    try {
      const compiledJournalEntry = await compileJournal();
      const chatData = {
        user: auth.currentUser?.email || 'Anonymous',
        timestamp: new Date(),
        chatHistory,
        compiledJournal: compiledJournalEntry,
      };

      // Save chat data in Firebase
      await addDoc(collection(db, 'typechatjournal'), chatData);
      clearInterval(interval);
      setProgress(100);
      navigate('/save-type-chat');
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setProgress(0), 500); // Reset progress after save
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `Use this language ${language} and based on the chat history, act as a personal journal assistant who writes a journal entry on the user’s behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user. Make it a full-blown journal entry in several paragraphs in ${language}.`;

      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: journalPrompt },
          { role: 'user', content: `Chat History: ${chatHistory.join('\n')}` },
        ],
        model: 'gpt-4',
      });

      return journalCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error compiling journal:', error);
      return '';
    }
  };
  useEffect(() => {
    // Scroll to the bottom of the chat container when chatHistory changes
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory]);

  return (
    <>
      {isSaving ? (
        <Box
        minH="100vh"
        display="flex"
        justifyContent="center"
        alignItems="center"
        flexDirection="column"
        position="fixed"
        top="0"
        left="0"
        width="100%"
        height="100%"
        zIndex="20"
        bg="rgb(51, 56, 46)" // Dark green background
      >
        <Text fontSize="xl" mb={4} color="white">
          Generating Journal Entry
        </Text>
        <Progress
          value={progress}
          size="xs" // Smaller size as shown in the image
          width="200px" // Adjust this width to control the bar's length
          sx={{
            "& > div": {
              backgroundColor: "rgb(137, 142, 133)", // Filling element color
            },
          }}
          bg="rgb(51, 56, 46)" // Non-filled part color to match the background
        />
      </Box>
      ) : (
        <Box 
        minH="100vh" 
        p={4} 
        bg="transparent" 
        display="flex" 
        alignItems="center" 
        justifyContent="center" 
        position="relative"
      >
        <Flex position="absolute" top="20px" left="20px">
          <Icon
            as={IoChevronBackOutline}
            color="white"
            w="24px"
            h="24px"
            _hover={{ cursor: 'pointer' }}
            onClick={() => navigate('../admin')}
          />
        </Flex>
      
        <VStack 
          spacing={4} 
          align="stretch" 
          maxW="750px" 
          mx="auto" 
          mt="50px" 
          width="100%" 
          bg="transparent"
        >
        <Box
  p={4}
  borderRadius="2xl"
  overflowY="auto"
  maxHeight="600px"
  minHeight="200px"
  css={{
    scrollbarWidth: 'none', // For Firefox
    '-ms-overflow-style': 'none', // For Internet Explorer and Edge
    '&::-webkit-scrollbar': {
      display: 'none', // For Chrome, Safari, and Opera
    },
  }}
  ref={chatContainerRef} // Add a reference to the chat container
>
  {/* Static Greeting */}
  
  {greeting ? (
  <Box
    bg="rgb(88, 94, 86)" // Background color of the greeting
    p={3}
    borderRadius="2xl"
    mb={2}
    maxW="60%"
    textAlign="left"
  >
    <Text color="white" fontSize="lg">
      {greeting}
    </Text>
  </Box>
) : (
  <Flex justify="center" align="center" mt={2}>
    <Spinner color="white" size="sm" />
  </Flex>
)}



  {/* Dynamic Chat History */}
  {chatHistory.map((msg, index) => {
  const wordCount = msg.replace(/^(User:|AI:)\s*/, '').split(/\s+/).length;
  let maxWidth;

  if (wordCount <= 3) {
    maxWidth = '20%';
  } else if (wordCount === 4) {
    maxWidth = '30%';
  } else if (wordCount === 5) {
    maxWidth = '40%';
  } 
  else if (wordCount === 6) {
    maxWidth = '50%';
  }else if (wordCount >= 8) {
    maxWidth = '60%';
  } else {
    maxWidth = '50%'; // Default fallback
  }

  return (
    <Box
      key={index}
      bg={msg.startsWith('User:') ? 'rgb(132, 135, 114)' : 'rgb(88, 94, 86)'}
      p={3}
      borderRadius="2xl"
      mb={2}
      alignSelf={msg.startsWith('User:') ? 'flex-end' : 'flex-start'}
      maxW={maxWidth}
      width="auto"
      textAlign={msg.startsWith('User:') ? 'right' : 'left'}
      marginLeft={msg.startsWith('User:') ? 'auto' : 'unset'}
      marginRight={msg.startsWith('AI:') ? 'auto' : 'unset'}
    >
      <Text
        color="white"
        fontSize={msg.startsWith('User:') ? 'md' : 'lg'} // Smaller font size for user messages
      >
        {msg.replace(/^(User:|AI:)\s*/, '')}
      </Text>
    </Box>
  );
})}


  {isLoadingResponse && (
    <Flex justify="center" align="center" mt={2}>
      <Spinner color="white" size="sm" />
    </Flex>
  )}
</Box>

      
<Flex 
  bg="transparent" 
  p={2} 
  borderRadius="3xl" 
  align="center" 
  border="1px solid white"
>
<Input
  placeholder="Type your message..."
  value={chatInput}
  onChange={(e) => setChatInput(e.target.value)}
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  }}
  bg="transparent"
  color="white"
  border="none" // No border on the input
  flex="1"
  _placeholder={{ color: 'gray.400' }}
  _focus={{ boxShadow: 'none' }} // Remove focus box shadow
/>

  <Button
    onClick={handleSendMessage}
    isDisabled={!chatInput.trim() || isLoadingResponse}
    ml={2}
    _focus={{ boxShadow: 'none' }} // Ensure no focus outline on the button
  >
    <Icon as={IoSend} w={6} h={6} color='white' bg="transparent"/>
  </Button>
</Flex>

      
          <Flex
  justify="center"
  width="100%" // Ensure the container spans the full width
  mt={4} // Add margin-top to give some space from the content above
>
  <Button
    color='white'
    onClick={saveChatHistory}
    isDisabled={chatHistory.length === 0}
    width="120px" // You can adjust the width of the button here
    bg='rgb(132, 135, 114)'
  >
    Finish
  </Button>
</Flex>

        </VStack>
      </Box>
      
      )}
    </>
  );
};

export default TypeChatJournal;
