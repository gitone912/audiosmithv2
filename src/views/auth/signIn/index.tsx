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
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, storage } from "../../../firebase"; // Import Firebase auth
import DefaultAuth from "layouts/auth/Default";
import { HSeparator } from "components/separator/Separator";
import { ref, getDownloadURL } from "firebase/storage"; // Import Firebase Storage


function SignIn() {
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorDetails = useColorModeValue("navy.700", "secondaryGray.600");
  const textColorBrand = useColorModeValue("brand.500", "white");
  const brandStars = useColorModeValue("brand.500", "brand.400");
  
  
  // State management
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(""); // New state for notifications
  const navigate = useNavigate(); // For navigation

  // Handle visibility of password
  const handleClick = () => setShow(!show);

  // Handle form submission
  // Function to check for user profile image in Firebase Storage
const checkUserImage = async (email : string) => {
  try {
    const imageRef = ref(storage, `${email}.png`);
    const url = await getDownloadURL(imageRef);
    localStorage.setItem("userImage", url);
  } catch (error) {
    console.log("No profile image found for this user.");
  }
};

// Handle form submission
const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(null);
  setNotification(""); // Clear previous messages

  try {
    // Sign in with Firebase
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Check if the profile image is in localStorage, if not, check Firebase Storage
    const userDetails = localStorage.getItem("userDetails");
    if (!userDetails || !JSON.parse(userDetails).userImage) {
      await checkUserImage(user.email);
    }

    // Save user details to local storage based on "Keep me logged in"
    const newUserDetails = {
      email: user.email,
      displayName: user.displayName || "User",
      phoneNumber: user.phoneNumber || "Not provided",
      userImage: localStorage.getItem("userImage") || null, // Store user image URL if available
    };

    const storageDuration = keepLoggedIn ? 7 : 1;
    localStorage.setItem("userDetails", JSON.stringify(newUserDetails));
    localStorage.setItem("storageExpiry", JSON.stringify(Date.now() + storageDuration * 24 * 60 * 60 * 1000));

    // Success message and redirect
    setNotification("Successfully signed in! Redirecting...");
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  } catch (error) {
    setError("Failed to sign in. Please check your credentials.");
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
            bg="secondaryGray.300"
            color="navy.700"
            fontWeight="500"
            _hover={{ bg: "gray.200" }}
            _active={{ bg: "secondaryGray.300" }}
            _focus={{ bg: "secondaryGray.300" }}
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
                placeholder="mail@simmmple.com"
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

              {/* Submit the form via the button */}
              <Button fontSize="sm" variant="brand" fontWeight="500" w="100%" h="50" mb="24px" type="submit">
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
