import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  Spinner, // Import Spinner
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, storage, db } from "../../../firebase"; // Import Firestore
import { doc, getDoc, setDoc } from "firebase/firestore";
import DefaultAuth from "layouts/auth/Default";
import { HSeparator } from "components/separator/Separator";
import { ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage

function SignIn() {
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorDetails = useColorModeValue("navy.700", "secondaryGray.600");
  const textColorBrand = useColorModeValue("brand.500", "white");
  const buttonBg = useColorModeValue("rgb(55, 60, 49)", "white");
  const buttonText= useColorModeValue("white", "rgb(55, 60, 49)");
  const googleBg = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const googleText = useColorModeValue("navy.700", "white");
  const googleHover = useColorModeValue(
    { bg: "gray.200" },
    { bg: "whiteAlpha.300" }
  );
  const googleActive = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.200" }
  );

  // State management
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(""); // New state for notifications
  const [loading, setLoading] = useState(false); // New loading state
  const navigate = useNavigate(); // For navigation
  

  // Handle visibility of password
  const handleClick = () => setShow(!show);

  // Function to check for user profile image in Firebase Storage
  const checkUserImage = async (email: string) => {
    try {
      const imageRef = ref(storage, `${email}.png`);
      const url = await getDownloadURL(imageRef);
      localStorage.setItem("userImage", url);
    } catch (error) {
      console.log("No profile image found for this user.");
    }
  };
  const checkOnboardingStatus = async (uid:any) => {
    const userDocRef = doc(db, "users", uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const { onboarding } = userDoc.data();
      return onboarding === true;
    }
    return false;
  };

  // Fetch user's fullName and phoneNumber from Firestore
  const fetchUserDetails = async (uid: string) => {
    try {
      const userDocRef = doc(db, "users", uid); // Use db here instead of firestore
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          fullName: userData.fullName || "User",
          phoneNumber: userData.phoneNumber || "Not provided",
        };
      } else {
        console.log("No user data found in Firestore.");
        return {
          fullName: "User",
          phoneNumber: "Not provided",
        };
      }
    } catch (error) {
      console.error("Error fetching user details from Firestore:", error);
      return {
        fullName: "User",
        phoneNumber: "Not provided",
      };
    }
  };

  // Handle form submission
  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNotification(""); // Clear previous messages
    setLoading(true); // Start loading

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      const uid = user.uid; // Get user's UID

      // Fetch additional user details from Firestore
      const { fullName, phoneNumber } = await fetchUserDetails(uid);

      // Check if the profile image is in localStorage, if not, check Firebase Storage
      const userDetails = localStorage.getItem("userDetails");
      if (!userDetails || !JSON.parse(userDetails).userImage) {
        await checkUserImage(user.email);
      }

      const newUserDetails = {
        email: user.email,
        displayName: fullName,
        phoneNumber: phoneNumber,
        userImage: localStorage.getItem("userImage") || null, // Store user image URL if available
      };

      const storageDuration = keepLoggedIn ? 7 : 1;
      localStorage.setItem("userDetails", JSON.stringify(newUserDetails));
      localStorage.setItem("storageExpiry", JSON.stringify(Date.now() + storageDuration * 24 * 60 * 60 * 1000));

      setNotification("Successfully signed in! Redirecting...");
      const hasOnboarded = await checkOnboardingStatus(user.uid);
      
      // Redirect based on onboarding status
      if (hasOnboarded) {
        navigate("../../admin/session");
        window.location.reload();
      } else {
        navigate("../onboarding");
      }
    } catch (error) {
      setError("Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false); // Stop loading after sign-in attempt
    }
  };
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
  
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Check if the user's document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        // If the user is new, create a new document for the user
        await setDoc(userDocRef, {
          fullName: user.displayName || "No Name", // Fallback if no display name
          email: user.email,
          phone: user.phoneNumber || "Not provided",
          createdAt: new Date(),
        });
  
        // Send the new user data to the webhook only if they are new
        const webhookPayload = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || "No Name",
        };
  
        // Send POST request to the webhook URL
        const response = await fetch("https://audiosmith-app-apis.vercel.app/webhook", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(webhookPayload),
        });
  
        if (!response.ok) {
          throw new Error("Failed to send data to webhook");
        }
        console.log("Webhook sent successfully");
      }
  
      // Fetch the user details from Firestore
      const { fullName, phoneNumber } = await fetchUserDetails(user.uid);
  
      // Check if the user has an image set, and if not, run the check
      const userDetails = localStorage.getItem("userDetails");
      if (!userDetails || !JSON.parse(userDetails).userImage) {
        await checkUserImage(user.email);
      }
  
      const newUserDetails = {
        email: user.email,
        displayName: fullName || user.displayName,
        phoneNumber: phoneNumber || user.phoneNumber || "Not provided",
        userImage: user.photoURL,
      };
  
      // Set the details in localStorage with an expiration time
      const storageDuration = keepLoggedIn ? 7 : 1;
      localStorage.setItem("userDetails", JSON.stringify(newUserDetails));
      localStorage.setItem(
        "storageExpiry",
        JSON.stringify(Date.now() + storageDuration * 24 * 60 * 60 * 1000)
      );
  
      setNotification("Google sign-in successful! Redirecting...");
      const hasOnboarded = await checkOnboardingStatus(user.uid);
  
      // Redirect based on onboarding status
      if (hasOnboarded) {
        navigate("../../admin/session");
        window.location.reload();
      } else {
        navigate("../onboarding");
      }
    } catch (error) {
      setError("Google sign-in failed.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <DefaultAuth>
      <Flex
        maxW={{ base: "100%", md: "max-content" }}
        w="100%"
        mx={{ base: "auto", lg: "0px" }}
        me="auto"
        h="100%"
        alignItems="start"
        justifyContent="center"
        mb={{ base: "30px", md: "60px" }}
        px={{ base: "25px", md: "0px" }}
        mt={{ base: "40px", md: "14vh" }}
        flexDirection="column"
      >
        <Box me="auto">
          <Heading color={textColor} fontSize="36px" mb="10px">
            Sign In
          </Heading>
          <Text mb="36px" ms="4px" color={textColorSecondary} fontWeight="400" fontSize="md">
            Enter your email and password to sign in!
          </Text>
        </Box>

        <Flex
          zIndex="2"
          direction="column"
          w={{ base: "100%", md: "420px" }}
          maxW="100%"
          background="transparent"
          borderRadius="15px"
          mx={{ base: "auto", lg: "unset" }}
          me="auto"
          mb={{ base: "20px", md: "auto" }}
        >
          <Button
            fontSize="sm"
            me="0px"
            mb="26px"
            py="15px"
            h="50px"
            borderRadius="16px"
            bg={googleBg}
            color={googleText}
            fontWeight="500"
            _hover={googleHover}
            _active={googleActive}
            _focus={googleActive}
            onClick={handleGoogleSignIn}
          >
            <Icon as={FcGoogle} w="20px" h="20px" me="10px" />
            Sign in with Google
          </Button>

          <Flex align="center" mb="25px">
            <HSeparator />
            <Text color="gray.400" mx="14px">
              or
            </Text>
            <HSeparator />
          </Flex>

          {/* Notification Display */}
          {error && (
            <Text color="red.500" mb="10px" textAlign="center">
              {error}
            </Text>
          )}
          {notification && (
            <Text color="green.500" mb="10px" textAlign="center">
              {notification}
            </Text>
          )}

          <form onSubmit={handleSignIn}>
            <FormControl>
              <FormLabel display="flex" ms="4px" fontSize="sm" fontWeight="500" color={textColor} mb="8px">
                Email<Text color={textColorBrand}>*</Text>
              </FormLabel>
              <Input
                isRequired
                variant="auth"
                fontSize="sm"
                type="email"
                placeholder="mail@mindleaf.me"
                mb="24px"
                size="lg"
                onChange={(e) => setEmail(e.target.value)} // Update email state
              />
              <FormLabel ms="4px" fontSize="sm" fontWeight="500" color={textColor} display="flex">
                Password<Text color={textColorBrand}>*</Text>
              </FormLabel>
              <InputGroup size="md">
                <Input
                  isRequired
                  fontSize="sm"
                  placeholder="Min. 8 characters"
                  mb="24px"
                  size="lg"
                  type={show ? "text" : "password"}
                  variant="auth"
                  onChange={(e) => setPassword(e.target.value)} // Update password state
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color="gray.400"
                    _hover={{ cursor: "pointer" }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={handleClick}
                  />
                </InputRightElement>
              </InputGroup>

              <Flex justifyContent="space-between" align="center" mb="24px">
                <FormControl display="flex" alignItems="center">
                  <Checkbox
                    id="remember-login"
                    colorScheme="brandScheme"
                    me="10px"
                    onChange={(e) => setKeepLoggedIn(e.target.checked)} // Update keepLoggedIn state
                  />
                  <FormLabel htmlFor="remember-login" mb="0" fontWeight="normal" color={textColor} fontSize="sm">
                    Keep me logged in
                  </FormLabel>
                </FormControl>
                <NavLink to="/auth/forgot-password">
                  <Text color={textColorBrand} fontSize="sm" w="124px" fontWeight="500">
                    Forgot password?
                  </Text>
                </NavLink>
              </Flex>

              {/* Submit button */}
              <Button 
                fontSize="sm" 
                variant="brand" 
                fontWeight="500" 
                w="100%" 
                h="50" 
                mb="24px" 
                type="submit" 
                color={buttonText} 
                bg={buttonBg} 
                _hover={{ bg: "gray.200" }}
                isLoading={loading} // Use isLoading prop
                loadingText="Signing In..." // Loading text
              >
                Sign In
              </Button>
            </FormControl>
          </form>

          <Flex flexDirection="column" justifyContent="center" alignItems="start" maxW="100%" mt="0px">
            <Text color="gray.400" fontWeight="400" fontSize="14px">
              Not registered yet?
              <NavLink to="/auth/sign-up">
                <Text color={textColorBrand} as="span" ms="5px" fontWeight="500">
                  Create an Account
                </Text>
              </NavLink>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignIn;
