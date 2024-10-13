import { Box, Textarea, Button, Spinner, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../firebase"; // Import Firestore config

// Define the Journal type
interface Journal {
  title: string;
  compiledJournal: string;
  timestamp: any;
  user: string;
  originalText: string;
  type: "dialogue" | "monologue";
}

export default function EditJournal() {
    const location = useLocation();
    const navigate = useNavigate();
    
    const journalId = location.state?.id;
    const collectionName = location.state?.type === "dialogue" ? "chats" : "chat_monologue"; // Set collection based on journal type
  
    const [journal, setJournal] = useState<Journal | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [editedText, setEditedText] = useState<string>("");
  
    const journalRef = doc(db, collectionName, journalId); // Use this in fetch and update
  
    const fetchJournal = async () => {
      setLoading(true);
  
      if (!journalId) {
        setError("Invalid journal ID.");
        setLoading(false);
        return;
      }
  
      try {
        const journalSnapshot = await getDoc(journalRef);
        if (journalSnapshot.exists()) {
          const data = journalSnapshot.data() as Journal;
          setJournal(data);
          setEditedText(data.compiledJournal);
        } else {
          setError(`No journal found with ID: ${journalId}`);
        }
      } catch (error) {
        console.error("Error fetching journal:", error);
        setError("Failed to load the journal. Please try again.");
      } finally {
        setTimeout(() => setLoading(false), 500);
      }
    };
  
    useEffect(() => {
      fetchJournal();
    }, [journalId]);
  
    const handleSave = async () => {
      try {
        await updateDoc(journalRef, { compiledJournal: editedText });
        console.log("Journal updated successfully!");
        navigate(-1); // Go back after saving
      } catch (error) {
        console.error("Error updating journal:", error);
        setError("Failed to save the journal. Please try again.");
      }
    };
  
    if (loading) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
          <Spinner size="xl" />
        </Box>
      );
    }
  
    if (error) {
      return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh" flexDirection="column">
          <Text color="red.500" mb={4}>{error}</Text>
          <Button onClick={fetchJournal} colorScheme="yellow">Retry</Button>
        </Box>
      );
    }
  
    return (
      <Box
        width={{ base: "95%", md: "800px" }}
        height="900px"
        margin="0 auto"
        padding="30px"
        bg="rgb(55, 60, 49)"
        boxShadow="lg"
        fontFamily="'Dancing Script', cursive"
        fontSize={{ base: "lg", md: "2xl" }}
        color="yellow.400"
      >
        <Textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          placeholder="Edit your journal..."
          size="lg"
          height="100%"
          border="none"
          resize="none"
          bg="transparent"
          fontSize={{ base: "xl", md: "2xl" }}
        />
        <Button mt={4} colorScheme="yellow" onClick={handleSave} fontSize="xl">
          Save
        </Button>
      </Box>
    );
  }
  