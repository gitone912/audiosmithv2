import { ChangeEvent, useState, useEffect } from 'react';
import { Box, Grid, Button, Input, Avatar, Flex, Text, useColorModeValue, Stack, Spinner, useToast, Icon } from '@chakra-ui/react';
import avatarDefault from 'assets/img/avatars/image.png';
import banner from 'assets/img/auth/banner.png';
import { storage, ref, uploadBytes, getDownloadURL, db, auth } from '../../../firebase'; // Adjust path as needed
import { doc, updateDoc, setDoc, getDoc } from 'firebase/firestore'; // Firestore functions
import { IoChevronBackOutline } from 'react-icons/io5';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from './nabar';

export default function Overview() {
  const [userDetails, setUserDetails] = useState(() => {
    const storedDetails = localStorage.getItem('userDetails');
    return storedDetails ? JSON.parse(storedDetails) : { email: '', displayName: '', phoneNumber: '' };
  });

  const [isEditing, setIsEditing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState(avatarDefault);
  const [isLoading, setIsLoading] = useState(false); // Spinner control
  const navigate = useNavigate();
  const location = useLocation();

  const toast = useToast(); // Chakra toast notification

  useEffect(() => {
    const savedImage = localStorage.getItem('userImage');
    if (savedImage) setPreviewImage(savedImage);
  }, []);

  const handleEditToggle = () => setIsEditing(!isEditing);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUserDetails({ ...userDetails, [name]: value });
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setUploadedImage(file);
    if (file) {
      const previewURL = URL.createObjectURL(file);
      setPreviewImage(previewURL);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true); // Show spinner
      let imageUrl = previewImage;

      // Get the current user UID from Firebase Auth
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found");
      const uid = user.uid;

      if (uploadedImage && userDetails.email) {
        const imageName = `${userDetails.email}.png`;
        const storageRef = ref(storage, imageName);
        await uploadBytes(storageRef, uploadedImage);
        imageUrl = await getDownloadURL(storageRef);
        localStorage.setItem('userImage', imageUrl);
        setPreviewImage(imageUrl);
      }

      // Update localStorage
      localStorage.setItem('userDetails', JSON.stringify(userDetails));

      // Get the Firestore user document reference using UID
      const userDocRef = doc(db, 'users', uid);  // Using UID instead of email

      // Check if the document exists
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        // If document exists, update it
        await updateDoc(userDocRef, {
          fullName: userDetails.displayName,
          phoneNumber: userDetails.phoneNumber,
          userImage: imageUrl, // Optional: save the image URL in Firestore as well
        });
      } else {
        // If document does not exist, create it
        await setDoc(userDocRef, {
          email: userDetails.email,
          fullName: userDetails.displayName,
          phoneNumber: userDetails.phoneNumber,
          userImage: imageUrl, // Save the image URL in Firestore
        });
      }

      toast({
        title: 'Profile saved.',
        description: 'Your profile details have been successfully updated!',
        status: 'success',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error saving profile.',
        description: 'There was an issue saving your profile. Please try again.',
        status: 'error',
        duration: 3000,
        isClosable: true,
        position: 'top',
      });
      console.error('Error saving data:', error);
    } finally {
      setIsLoading(false); // Hide spinner
    }
  };

  // Styling improvements for light/dark mode
  const textColorPrimary = useColorModeValue('black', 'white');
  const inputBg = useColorModeValue('gray.100', 'gray.700');
  const inputTextColor = useColorModeValue('black', 'white');
  const borderColor = useColorModeValue('gray.300', 'gray.500');
  const activeButtonColor = useColorModeValue('teal.500', 'teal.200'); // Color for active button
  const inactiveButtonColor = useColorModeValue('gray.500', 'gray.200'); // Color for inactive buttons


  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }} display="flex" flexDirection="column" alignItems="center">
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
          onClick={() => navigate("../admin")} // Navigate to the previous page
        />
      </Flex>
      {/* Navbar with buttons */}
      <Text fontSize="2xl" fontWeight="bold" mb="6" textAlign="center">Profile Settings</Text>
    <Navbar/>

      {/* Profile Content */}
      <Box bg="transparent" borderRadius="lg" shadow="xl" p="6" w={{ base: '90%', md: '70%', lg: '50%' }}>
        <Box bg={`url(${banner})`} bgSize="cover" borderRadius="16px" h="150px" w="100%" mb="6" />
        <Avatar mx="auto" src={previewImage} h="120px" w="120px" mt="-75px" border="4px solid" borderColor="white" />
        <Text textAlign="center" color={textColorPrimary} fontWeight="bold" fontSize="2xl" mt="6">
          {userDetails.displayName || 'Your Name'}
        </Text>
        <Flex justify="center" mt="4">
          <Text color={textColorPrimary} fontSize="lg">
            {userDetails.email || 'Your Email'}
          </Text>
        </Flex>
        <Box mt="8">
          {isEditing ? (
            <Stack spacing="4">
              <Input
                name="displayName"
                placeholder="Display Name"
                value={userDetails.displayName}
                onChange={handleInputChange}
                bg={inputBg}
                color={inputTextColor}
                borderColor={borderColor}
              />
              <Input type="file" accept="image/*" onChange={handleImageUpload} bg={inputBg} color={inputTextColor} borderColor={borderColor} />
              <Button onClick={handleSave} colorScheme="teal" isDisabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Save Changes'}
              </Button>
            </Stack>
          ) : (
            <Button onClick={handleEditToggle} colorScheme="blue" mt="6" w="full">
              Edit Profile
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
