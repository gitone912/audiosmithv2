import React, { useEffect, useState } from 'react';
import { Box, Flex, Text, Progress, VStack, Icon } from '@chakra-ui/react';
import { CheckCircleIcon, LockIcon } from '@chakra-ui/icons';
import axios from 'axios';

interface StreakResponse {
  streak: number;
}

const DailyStreak: React.FC = () => {
  const [streak, setStreak] = useState(0);

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
        const response = await axios.post<StreakResponse>('https://audiosmith-backendv2.vercel.app/updateStreak', { 
          email, 
          utcOffsetMinutes 
        });
        setStreak(response.data.streak);
      } catch (error) {
        console.error('Error fetching streak:', error);
      }
    };

    fetchStreak();
  }, []);

  const milestones = [
    { label: 'Reflective Novice', days: 3, icon: '🌱', description: "You are just beginning your reflective journey. By reaching this level, you’ve taken the first step toward self-awareness. Every big journey starts with small, meaningful steps." },
{ label: 'Thoughtful Apprentice', days: 7, icon: '🌿', description: "You are starting to build a consistent habit of introspection. At this level, you are learning how to make reflection a part of your daily life, growing more in tune with your emotions." },
{ label: 'Mindful Explorer', days: 14, icon: '🌳', description: "You are exploring your thoughts and emotions with increasing curiosity and consistency. You’ve developed enough momentum that self-reflection is now a genuine part of your routine." },
{ label: 'Insightful Pathfinder', days: 30, icon: '🌲', description: "You’ve become adept at finding insights within yourself. Your regular reflections are guiding you through the emotional landscape, revealing a deeper understanding of your experiences." },
{ label: 'Emotional Champion', days: 60, icon: '🏆', description: "You have shown resilience and dedication in your pursuit of emotional growth. At this level, you are embracing the challenges of your emotional journey and coming out stronger each time." },
{ label: 'Master of Reflection', days: 90, icon: '🔮', description: "You are now a master of self-reflection. Reaching this level signifies that you have developed the ability to look within with clarity and compassion, and you are beginning to see lasting changes in your outlook." },
{ label: 'Sage of Self-Awareness', days: 150, icon: '🧘‍♂️', description: "You have cultivated deep self-awareness. You understand your emotional patterns well and are capable of recognizing your feelings with wisdom. Your consistency has led you to a deeper understanding of yourself." },
{ label: 'Enlightened Guide', days: 200, icon: '🌟', description: "You have become a guiding force, not only for yourself but also for those around you. Your insights bring clarity to your journey, and your dedication inspires others to reflect and grow." },
{ label: 'Transcendent Mentor', days: 250, icon: '💠', description: "You have reached a profound level of self-mastery. Your reflections transcend daily experiences, helping you understand yourself on a deeply emotional and spiritual level. You are setting a standard for dedication to self-growth." },
{ label: 'Reflection Luminary', days: 365, icon: '🌞', description: "You are a beacon of reflection and personal growth. By reaching this level, you have shown a full year of commitment to understanding yourself. Your journey illuminates the power of self-awareness and stands as a testament to your resilience and insight." }
  ];

  const latestCompleted = milestones.filter(m => streak >= m.days).slice(-1)[0];

  const renderMilestone = (milestone: any, index: any) => {
    const isCompleted = streak >= milestone.days;
    const isCurrent = streak < milestone.days && (index === 0 || streak >= milestones[index - 1].days);
    
    // Calculate progress relative to the milestone
    let progress = 0;
    if (isCurrent) {
      const previousMilestoneDays = index > 0 ? milestones[index - 1].days : 0;
      const milestoneRange = milestone.days - previousMilestoneDays;
      progress = ((streak - previousMilestoneDays) / milestoneRange) * 100;
    } else if (isCompleted) {
      progress = 100;
    }

    return (
      <React.Fragment key={index}>
        <Flex align="center" width="100%" position="relative" direction="column">
          {/* Milestone Box */}
          <Box
            borderRadius="30px"
            p={6}
            textAlign="center"
            opacity={isCompleted ? 1 : 0.6}
            width="90%"
            border="2px solid"
            borderColor="gray.600"
          >
            <Text color={isCompleted ? "green.300" : "gray.400"} fontSize="lg" fontWeight="bold">
              {milestone.icon} {milestone.label}
            </Text>
            <Text color="gray.300" fontSize="sm">{`${milestone.days}-Day Streak`}</Text>

            {/* Progress Bar */}
            {isCurrent && (
              <Progress
                value={progress}
                size="sm"
                colorScheme="green"
                width="full"
                borderRadius="md"
                mt={4}
              />
            )}
          
          <Box mt={2}>
            {isCompleted ? (
              <></>
            ) : (
              
              <Text color="gray.500" fontSize="xs" ml={2}>{`Day ${streak} of ${milestone.days}`}</Text>

            )}
          </Box>

          {/* Completion/Lock Icon */}
          <Box mt={2}>
            {isCompleted ? (
              <Icon as={CheckCircleIcon} color="green.300" boxSize={6} />
            ) : (
              
              <Icon as={LockIcon} color="gray.500" boxSize={6} />
            )}
            </Box>
          </Box>
        </Flex>

        {/* Vertical Line - Only add if not the last milestone */}
        {index < milestones.length - 1 && (
          <Box
            height="150px" // Adjust height as needed for spacing between boxes
            width="2px"
            bg="gray.500"
            alignSelf="center"
            mt={2}
            mb={2}
          />
        )}
      </React.Fragment>
    );
  };

  return (
    <VStack spacing={4} align="center" mt={8}>
      {/* Display the Latest Completed Milestone's Description */}
      <Text fontSize="2xl" color="white" fontWeight="bold">
        {`Day ${streak}`}
      </Text>
      <Text color="gray.300" textAlign="center" px={4} maxW="400px">
        {latestCompleted ? latestCompleted.description : "Start your journey toward self-awareness and emotional growth."}
      </Text>

      <Flex direction="column" align="center" width="100%" maxW="500px" mt={4}>
        {milestones.map((milestone, index) => renderMilestone(milestone, index))}
      </Flex>
    </VStack>
  );
};

export default DailyStreak;
