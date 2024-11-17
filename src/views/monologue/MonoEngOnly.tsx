import {
    Box,
    Text,
    VStack,
    IconButton,
    useColorModeValue,
    Spinner,
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalBody,
    useToast,
    Flex,
    Icon,
    Progress,
  } from "@chakra-ui/react";
  import { MdMic, MdStop } from "react-icons/md"; // Replacing icons with react-icons/md
  import React, { useState, useEffect, useRef } from "react";
  import { useNavigate } from "react-router-dom";
  import { db, auth } from "../../firebase";
  import { collection, addDoc } from "firebase/firestore";
  import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
  import Groq from "groq-sdk";
import { IoChevronBackOutline } from "react-icons/io5";
import OpenAI from "openai";
  

  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY!,
    dangerouslyAllowBrowser: true,
  });
  let languageCode;
  const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY,dangerouslyAllowBrowser: true});
  const MonologueEng = () => {
    const [originalText, setOriginalText] = useState<string>("");
    const textColor = useColorModeValue("gray.800", "gray.100");
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<string>(""); // Full chat history
    const [tempTranscript, setTempTranscript] = useState<string>(""); // Append transcripts as they come
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [isConnecting, setIsConnecting] = useState<boolean>(false);
    const [isProcessing, setIsProcessing] = useState<boolean>(false);
    const [firstSpeech, setFirstSpeech] = useState<boolean>(true); // Track if it's the first speech
    const navigate = useNavigate();
    const speechTimeout = useRef<NodeJS.Timeout | null>(null);
    const { transcript, resetTranscript } = useSpeechRecognition();
    const [progress, setProgress] = useState(0);
    const language = (localStorage.getItem("userLanguage") || "English");
     // Check if the browser is Chrome
     const toast = useToast(); // Initialize the toast hook

  // Check if the browser is Chrome
  const {browserSupportsSpeechRecognition } = useSpeechRecognition()

  useEffect(() => {
    if (!browserSupportsSpeechRecognition) {
      // Show Chakra UI toast instead of an alert
      toast({
        title: "Unsupported Browser",
        description: "The Dialogue feature is only for chrome for now, in future we will allow this browser as well . We Highly Recommend to switch to Google Chrome for a better experience.",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "top", // Show toast at the top of the screen
      });
      navigate('../monologue/')
    }
  }, [browserSupportsSpeechRecognition, toast]);
  
    const compileJournal = async () => {
        try {
          const journalPrompt = `In ${language} language , Based on the chat history , act as a personal journal assistant who writes journal entry in user's behalf. Focus exclusively on translating the user’s confirmed answers, emotions, and reflections into a natural narrative that reflects their day. Do not infer or assume details not provided by the user. Ensure the tone is personal, introspective, and authentic, as though the user is recording their own private journal. Do not introduce any events or emotions unless the user has directly referenced them. Only include thoughts, feelings, and points confirmed by the user. Remove dialogue structure, but maintain the essence of the user’s emotions and insights. Avoid adding or imagining details beyond what has been explicitly stated by the user.  Do not mention the date of the journal. Make it a full blown journal entry. Do not add things the user didn't say or imply. Write in a length of about 2,000 characters in several pargaraphs. It should be like this everytime. Not random. Do not make it sound poetic. Just a normal journal entry written by a real human.`;
          const journalCompletion = await openai.chat.completions.create({
            messages: [{ role: "system", content: journalPrompt },{ role: "user", content: `user's chat: ${tempTranscript}`}],
            model: "gpt-4o",
          });
          return journalCompletion.choices[0]?.message?.content || "";
        } catch (error) {
          return "";
        }
      };


      const saveChatAndNavigate = async () => {
        const user = auth.currentUser;
        if (!user) return;
      
        setIsSaving(true); // Start showing saving modal
      setProgress(10);

      const interval = setInterval(() => {
        setProgress((prev) => (prev < 80 ? prev + 1 : prev));
      }, 100);
      
        const compiledJournalEntry = await compileJournal();
        const chatData = {
          user: user.email!,
          timestamp: new Date(),
          original_text: tempTranscript,
          compiledJournal: compiledJournalEntry, // Save the user's speech as-is
        };
      
        try {
          await addDoc(collection(db, "chat_monologue"), chatData); // Save to 'chat_monologue' collection
          setIsSaving(false); // Hide saving modal
          setProgress(100);
          navigate("/savechatmono");
        } catch (error) {
          setIsSaving(false); // Hide saving modal even on error
          console.error("Error saving chat:", error);
        }
        finally {
            setIsSaving(false);
            setTimeout(() => setProgress(0), 500);
          }
      };
      
  
    const handleSpeechInput = async (transcript: string) => {
      setOriginalText(transcript);
      setChatHistory((prevHistory) => `${prevHistory} User: ${transcript}\n`);
      setTempTranscript((prevTranscript) => `${prevTranscript} ${transcript}\n`); // Append transcripts
      setFirstSpeech(false); // First speech has now occurred
    };
    
  
    const startListening = () => {
        if (language === "English") {
            languageCode = "en-CA"; // Canadian English
          } else if (language === "German") {
            languageCode = "de-DE"; // German
          } else {
            languageCode = "en-CA"; // Default to Canadian English if the language doesn't match
          }
      setIsListening(true);
      SpeechRecognition.startListening({ continuous: true ,language:languageCode});
    };
  
    const stopListening = () => {
      setIsListening(false);
      SpeechRecognition.stopListening();
      saveChatAndNavigate();
      setOriginalText("");
      setChatHistory("");
      setTempTranscript("");
    };
    const stopListeningBack = () => {
      setIsListening(false);
      SpeechRecognition.stopListening();
      
    };
  
    const toggleConnection = async () => {
      if (isConnected) {
        stopListening();
        setIsConnected(false);
      } else {
        setIsConnecting(true);
        setIsConnecting(false);
        setIsConnected(true);
        startListening();
      }
    };
  
    useEffect(() => {
      handleSpeechInput(transcript);
      }, [transcript]);
      
  
    useEffect(() => {
      const handleBeforeUnload = () => {
        setChatHistory("");
      };
      window.addEventListener("beforeunload", handleBeforeUnload);
      return () => {
        window.removeEventListener("beforeunload", handleBeforeUnload);
      };
    }, []);
  
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
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
        <Flex
        display={{ sm: 'flex', xl: 'flex' }}
        alignItems="center"
        position="fixed"
        top="20px"
        left="20px"
        zIndex="10"
      >
       <Icon
        as={IoChevronBackOutline}
        color='white'
        w="24px"
          h="24px"
          _hover={{ cursor: 'pointer' }}
          onClick={() => {
            stopListeningBack() // Disconnect the conversation
            navigate('../admin'); // Navigate to the admin page
          }}
      />
</Flex>
        <VStack spacing={6} align="center">     
        
            
          {isProcessing && <Spinner color="teal" size="xl" />}
          {/* Show "Speak to Write" only when connected and hide after first speech */}
          {isConnected && firstSpeech && (
            <Text
              color="gray.400"
              textAlign="center"
              fontSize={{ base: "md", md: "lg" }}
            >
              Speak to Write
            </Text>
          )}
  
  
          {/* Transcript Display */}
          {transcript && (
            <Text
              color="gray.300"
              textAlign="center"
              fontSize={{ base: "sm", md: "lg" }} // Responsive size
              maxW={{ base: "90%", md: "80%", lg: "60%" }} // Responsive width
              mx="auto"
            >
              {transcript}
            </Text>
          )}
  
          <IconButton
            icon={isConnecting ? <Spinner color="white" size="md" /> : isConnected ? <MdStop /> : <MdMic />}
            bg="#9ba192"
            color="white"
            onClick={toggleConnection}
            size="lg"
            isRound
            aria-label={isConnected ? "Stop" : "Start"}
            isDisabled={isProcessing || isConnecting} // Disable during processing or connecting
            transition="transform 1s ease"
            transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
          />
  
          <Text
            fontSize={{ base: "sm", md: "lg" }}
            color="gray.400"
            transition="transform 1s ease"
            transform={isConnected ? "translateY(140px)" : "translateY(0px)"}
          >
            {isConnecting
              ? "Connecting..."
              : isConnected
              ? "Connected! Click to End The Conversation"
              : "Disconnected - Click to Start the Conversation"}
          </Text>
        </VStack>
      </Box>
       )}
      </>
    );
  };
  
  export default MonologueEng;