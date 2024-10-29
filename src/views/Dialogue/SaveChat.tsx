import React, { useState, useEffect } from "react";
import { 
  Box, Button, Textarea, VStack, Text, Spinner, 
  useColorModeValue, useToast 
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../../firebase";
import { collection, query, orderBy, limit, getDocs, updateDoc, doc } from "firebase/firestore";
import { TypeAnimation } from 'react-type-animation';
import Groq from "groq-sdk";
import OpenAI from "openai";
  

  const groq = new Groq({
    apiKey: process.env.REACT_APP_GROQ_API_KEY!,
    dangerouslyAllowBrowser: true,
  });
  const openai = new OpenAI({apiKey: process.env.REACT_APP_OPENAI_API_KEY,dangerouslyAllowBrowser: true});

const SaveChat: React.FC = () => {
  const [compiledJournal, setCompiledJournal] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedJournal, setEditedJournal] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [docId, setDocId] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);  // Track analysis section visibility
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);  // Track loading state for Analyze button

  const [mood, setMood] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [tasks, setTasks] = useState<string>("");
  const [moodEmoji, setMoodEmoji] = useState<string>("");

  const navigate = useNavigate();
  const toast = useToast();

  const boxBg = useColorModeValue('secondaryGray.300', 'rgb(55, 60, 49)');
  const SideboxBg = useColorModeValue('secondaryGray.300', 'rgb(76,80,71)');
  const buttonBg = '#9ba192';
  const textColor = useColorModeValue('black', 'white');
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchLatestJournal = async () => {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) return;

      const q = query(
        collection(db, "chats"),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      try {
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const latestDoc = querySnapshot.docs[0];
          const journalData = latestDoc.data().compiledJournal;
          setCompiledJournal(journalData);
          setEditedJournal(journalData);
          setDocId(latestDoc.id);
        }
      } catch (error) {
        console.error("Error fetching the latest journal:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLatestJournal();
  }, []);
  const formattedTasks = tasks.split(/(?=\d+\.)/); 

  useEffect(() => {
    const loadAudio = async () => {
      const audioInstance = new Audio("https://github.com/gitone912/testaudio/raw/refs/heads/main/deepgram-stella-1727359968635.mp3");
      audioInstance.load();
      setAudio(audioInstance);
    };
    loadAudio();
  }, []);

  const handleSave = async () => {
    if (!docId) return;
  
    setIsSaving(true);
  
    try {
      const journalRef = doc(db, "chats", docId);
      
      // Update the document with the edited journal, mood, summary, and tasks
      await updateDoc(journalRef, {
        compiledJournal: editedJournal,
        moodEmoji: `${moodEmoji}`, // Save mood emoji + mood string
        mood:mood,
        summary: summary,             // Save summary
        actions: tasks                // Save tasks (action recommendations)
      });
  
      if (audio) {
        await audio.play();
      }
  
      toast({
        title: "Journal Saved",
        description: "Your journal has been successfully saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
  
      setTimeout(() => navigate("/admin/journals"), 2000);
    } catch (error) {
      console.error("Error saving the journal:", error);
      toast({
        title: "Error",
        description: "There was an error saving your journal.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };
  

  const fetchAnalysis = async () => {
    setIsAnalyzing(true); // Start loading state

    try {
      // Simulate Groq API calls for mood, summary, and tasks
      const moodResponse = await fetchData("find my current mood based on this journal in 3 words"+compiledJournal);

      const moodEmojiRes = await fetchData("find my current mood based on this journal and send it in one emoji only, show only face emojis"+compiledJournal);

      const summaryResponse = await fetchData("Summarize the journal entry in the second person, keeping it brief and concise at 430 characters."+compiledJournal);

      const tasksResponse = await fetchData("Based on the journal entry, recommend three specific and realistic actions that the person can take to improve their well-being and productivity. Keep the suggestions concise, without any additional explanations. Make it specific with actions that can be performed in real life."+compiledJournal);
      setMood(moodResponse);
      setSummary(summaryResponse);
      setTasks(tasksResponse);
      setMoodEmoji(moodEmojiRes);

      setShowAnalysis(true); // Display the analysis section
    } catch (error) {
      console.error("Error fetching analysis:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analysis data.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsAnalyzing(false); // Stop loading state
    }
  };

  const fetchData = async (prompt: string): Promise<string> => {
    const MoodTracker = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4o",
    });
    return MoodTracker.choices[0]?.message?.content || "";
  };

  if (loading) {
    return (
      <Box minH="100vh" display="flex" justifyContent="center" alignItems="center">
        <Spinner size="xl" />
      </Box>
    );
  }


  return (
    <Box
      pt={{ base: '100px', md: '150px' }}
      textAlign="center"
      bg={boxBg}
      display="flex"
      justifyContent="center"
      alignItems="flex-start"
    >
      
      <VStack spacing={3} width={{ base: '90%', md: '80%', lg: '60%' }} maxW="800px" mx="auto">
        {!isEditing ? (
          <>
            <Box
              width="100%"
              padding={4}
              borderRadius="md"
              border="1px solid"
              borderColor={boxBg}
              bg={boxBg}
            >
              <Text
                color={textColor}
                fontSize={{ base: 'md', md: 'lg' }}
                whiteSpace="pre-wrap"
              >
                {/* Use the TypeAnimation component */}
                <TypeAnimation
                  sequence={[
                    compiledJournal, // The journal text
                    1000, // Pause for a second after typing is finished
                  ]}
                  speed={75} // Typing speed
                  wrapper="span"
                  cursor={true} // Show the cursor
                  repeat={0} // Don't repeat the animation
                  style={{ whiteSpace: 'pre-wrap' }}
                />
              </Text>
            </Box>

            <Box>
              <Button
                bg={buttonBg}
                color="white"
                size={{ base: 'sm', md: 'md' }}
                fontSize={{ base: 'sm', md: 'md' }}
                m={3}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                bg={buttonBg}
                color="white"
                size={{ base: 'sm', md: 'md' }}
                fontSize={{ base: 'sm', md: 'md' }}
                m={3}
                onClick={handleSave}
                isLoading={isSaving} // Show spinner while saving
              >
                Save
              </Button>
              <Button bg={buttonBg} color="white" m={3} onClick={fetchAnalysis} isLoading={isAnalyzing}>Analyze</Button>
            </Box>
          </>
        ) : (
          <>
            <Textarea
              value={editedJournal}
              onChange={(e) => setEditedJournal(e.target.value)}
              size="md"
              border="1px solid"
              borderColor={boxBg}
              height="700px"  // Increased the height for a larger edit box
              resize="vertical"  // Allows the user to resize the box vertically if needed
            />

            <Button
              bg={buttonBg}
              color="white"
              size={{ base: 'sm', md: 'md' }}
              fontSize={{ base: 'sm', md: 'md' }}
              onClick={handleSave}
              isLoading={isSaving} // Show spinner while saving
            >
              Save
            </Button>
            <Button bg={buttonBg} color="white" m={3} onClick={fetchAnalysis} isLoading={isAnalyzing}>Analyze</Button>
          </>
        )}
      </VStack>


{/* stack that i need to get appeared only when analyse button get clicked , and content here will be generated by groq */}
{showAnalysis && (
      <VStack
      spacing={5}
      width={{ base: '90%', md: '80%', lg: '60%' }}
      maxW="500px"
      mx="auto"
      bg={boxBg}
      justifyContent="center"
      padding={5}
    >
      {/* Mood Box */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Mood
      </Text>
      <Box
  bg={SideboxBg}
  padding={8}
  borderRadius="16px"
  width="100%"
>
  <Box display="flex" alignItems="center">
    <Text fontSize="7xl" color="white" mr={4}>
      {moodEmoji}
    </Text>
    <Text fontSize="lg" color="white">
    {mood}
    </Text>
  </Box>
</Box>


      {/* Summary Title */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Summary
      </Text>

      {/* Summary Box */}
      <Box
        bg={SideboxBg}
        padding={6}
        borderRadius="16px"
        width="100%"
        maxH="300px" // Set max height for scrollable content
        overflowY="auto" // Enable vertical scroll if needed
      >
        <Text color="white" fontSize="md" lineHeight="1.6">
        {summary}
        </Text>
      </Box>

      {/* Action Recommendations Title */}
      <Text
        fontSize="lg"
        fontWeight="bold"
        color="#b8b9b7"
        width="100%"
        textAlign="left"
      >
        Action Recommendations
      </Text>

      {/* Action Recommendations Box */}
      <Box
        bg={SideboxBg}
        padding={6}
        borderRadius="16px"
        width="100%"
        maxH="200px" // Set max height for scrollable content
        overflowY="auto" // Enable vertical scroll if needed
      >
       <Text color="white" fontSize="md" lineHeight="1.6">
  {formattedTasks.map((task, index) => (
    <span key={index} style={{ display: 'block', marginBottom: '8px' }}>
      {task.trim()}
    </span>
  ))}
</Text>

      </Box>
    </VStack>
)}
    </Box>
  );
};

export default SaveChat;
