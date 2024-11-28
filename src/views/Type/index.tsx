import React, { useState } from "react";
import {
  Box,
  Button,
  Textarea,
  VStack,
  Spinner,
  useColorModeValue,
  useToast,
  Icon,
  Flex,
  Text,
  Progress,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../../firebase";
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { IoChevronBackOutline } from "react-icons/io5";
import OpenAI from "openai";
const openai = new OpenAI({
  apiKey: process.env.REACT_APP_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});


const CreateTypeJournal: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [newJournal, setNewJournal] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const boxBg = useColorModeValue("secondaryGray.300", "rgb(55, 60, 49)");
  const buttonBg = "#9ba192";
  const textColor = useColorModeValue("black", "white");
  const language = localStorage.getItem('userLanguage') || 'English';
  const [progress, setProgress] = useState(0);
  
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
        chatHistory:newJournal,
        compiledJournal: compiledJournalEntry,
      };

      // Save chat data in Firebase
      await addDoc(collection(db, 'typejournal'), chatData);
      clearInterval(interval);
      setProgress(100);
      navigate('/save-type-journal');
    } catch (error) {
      console.error('Error saving chat:', error);
    } finally {
      setIsSaving(false);
      setTimeout(() => setProgress(0), 500); // Reset progress after save
    }
  };

  const compileJournal = async () => {
    try {
      const journalPrompt = `In ${language} Do not include any heading , based on the chat history, act as a personal journal assistant who writes a journal entry on the user’s behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user. Make it a full-blown journal entry in several paragraphs, remember to use ${language} language`;

      const journalCompletion = await openai.chat.completions.create({
        messages: [
          { role: 'system', content: journalPrompt },
          { role: 'user', content: `Chat History: ${newJournal}` },
        ],
        model: 'gpt-4',
      });

      return journalCompletion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error compiling journal:', error);
      return '';
    }
  };

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
      pt={{ base: "80px", md: "150px" }}
      textAlign="center"
      bg={boxBg}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      minH="100vh"
      px={{ base: "4", md: "8" }}
    >
      {/* Back Button */}
      <Flex
        display={{ base: "flex", xl: "flex" }}
        alignItems="center"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="10"
      >
        <Icon
          as={IoChevronBackOutline}
          color="white"
          w="24px"
          h="24px"
          _hover={{ cursor: "pointer" }}
          onClick={() => navigate(-1)}
        />
      </Flex>

      {/* Journal Input */}
      <VStack spacing={4} width="100%" maxW="600px" mx="auto">
  <Textarea
    value={newJournal}
    onChange={(e) => setNewJournal(e.target.value)}
    size="md"
    border="1px solid"
    borderColor={boxBg}
    height="600px" // Reduced height
    resize="vertical"
    borderRadius="16px" // Added curves to the corners
    placeholder="Start typing here..."
    bg="rgb(88, 94, 86)" // Background color update
    color="white" // Ensure text is visible
    _placeholder={{ color: "gray.300" }} // Placeholder styling
  />
  <Button
    bg={buttonBg}
    color="white"
    size="md"
    fontSize="md"
    borderRadius="12px" // Consistent rounded corners for the button
    onClick={saveChatHistory}
    isLoading={isSaving}
  >
    Finish
  </Button>
</VStack>


      {/* Loading Spinner */}
      {isSaving && (
        <Box mt={4}>
          <Spinner size="lg" />
        </Box>
      )}
    </Box>
      
    )}
  </>
);
};

export default CreateTypeJournal;
