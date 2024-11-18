import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
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
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  CloseButton,
} from "@chakra-ui/react";
import { FcGoogle } from "react-icons/fc";
import { MdOutlineRemoveRedEye } from "react-icons/md";
import { RiEyeCloseLine } from "react-icons/ri";
import { HSeparator } from "components/separator/Separator";
import DefaultAuth from "layouts/auth/Default";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../../firebase"; // Ensure db is initialized properly in your firebase.js file
import { doc, setDoc } from "firebase/firestore"; // For Firestore

function SignUp() {
  const textColor = useColorModeValue("navy.700", "white");
  const textColorSecondary = "gray.400";
  const textColorDetails = useColorModeValue("navy.700", "secondaryGray.600");
  const textColorBrand = useColorModeValue("brand.500", "white");
  const brandStars = useColorModeValue("brand.500", "brand.400");
  const googleBg = useColorModeValue("secondaryGray.300", "whiteAlpha.200");
  const googleText = useColorModeValue("navy.700", "white");
  const [notification, setNotification] = useState("");
  const buttonBg = useColorModeValue("rgb(55, 60, 49)", "white");
  const buttonText= useColorModeValue("white", "rgb(55, 60, 49)");
  const googleHover = useColorModeValue(
    { bg: "gray.200" },
    { bg: "whiteAlpha.300" }
  );
  const googleActive = useColorModeValue(
    { bg: "secondaryGray.300" },
    { bg: "whiteAlpha.200" }
  );

  const [show, setShow] = useState(false);
  const handleClick = () => setShow(!show);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });

  const [alert, setAlert] = useState({ message: "", type: "" });
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  // Handle form data change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle signup
  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotification("");
    const { email, password, confirmPassword, fullName, phone } = formData;
  
    if (password !== confirmPassword) {
      console.log("Passwords do not match");
      setAlert({ message: "Passwords do not match", type: "error" });
      return;
    }
  
    setLoading(true);
    console.log("Starting sign up process");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log("User created with ID:", user.uid);
  
      // Attempt to create the user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        fullName,
        email,
        phone,
      });
      console.log("User document created in Firestore");
  
      // Send the sign-up data to the webhook
      const webhookPayload = {
        uid: user.uid,
        email: user.email,
        displayName: fullName || "No Name",
      };
  
      // Send POST request to webhook URL
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
  
      setAlert({ message: "Signup Successful!", type: "success" });
      navigate("/auth/sign-in");
    } catch (err) {
      if (err instanceof Error) {
        console.error("Error during sign up or Firestore save:", err.message);
        setAlert({ message: err.message, type: "error" });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
  
    setLoading(true); // Show loading state during sign-up process
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      // Optionally, you can store user info in Firestore here as well
      await setDoc(doc(db, "users", user.uid), {
        fullName: user.displayName || "No Name", // Fallback if no display name is found
        email: user.email,
        phone: user.phoneNumber || "", // Fallback to empty if phone not provided
      });
  
      // Send the Google sign-up data to the webhook
      const webhookPayload = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || "No Name",
      };
  
      // Send POST request to webhook URL
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
  
      setAlert({ message: "Google sign-up successful!", type: "success" });
      navigate("/auth/sign-in");
    } catch (err) {
      if (err instanceof Error) {
        setAlert({ message: err.message, type: "error" });
      }
    } finally {
      setLoading(false); // End loading
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
            Sign Up
          </Heading>
          <Text
            mb="36px"
            ms="4px"
            color={textColorSecondary}
            fontWeight="400"
            fontSize="md"
          >
            Fill in your details to create an account!
          </Text>
        </Box>

        {alert.message && (
          <Alert status={alert.type === "error" ? "error" : "success"} mb="24px">
            <AlertIcon />
            <AlertTitle mr={2}>{alert.type === "error" ? "Error!" : "Success!"}</AlertTitle>
            <AlertDescription>{alert.message}</AlertDescription>
            <CloseButton onClick={() => setAlert({ message: "", type: "" })} position="absolute" right="8px" top="8px" />
          </Alert>
        )}
        {notification && (
          <Text color="green.500" mb="10px" textAlign="center">
            {notification}
          </Text>
        )}

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
            onClick={handleGoogleSignUp}
          >
            <Icon as={FcGoogle} w="20px" h="20px" me="10px" />
            Sign up with Google
          </Button>
          <Flex align="center" mb="25px">
            <HSeparator />
            <Text color="gray.400" mx="14px">
              or
            </Text>
            <HSeparator />
          </Flex>

          <form onSubmit={handleSignUp}>
            <FormControl>
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Full Name<Text color={brandStars}>*</Text>
              </FormLabel>
              <Input
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                isRequired={true}
                variant="auth"
                fontSize="sm"
                placeholder="John Doe"
                mb="24px"
                fontWeight="500"
                size="lg"
              />
              <FormLabel
                display="flex"
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                mb="8px"
              >
                Email<Text color={brandStars}>*</Text>
              </FormLabel>
              <Input
                name="email"
                value={formData.email}
                onChange={handleChange}
                isRequired={true}
                variant="auth"
                fontSize="sm"
                type="email"
                placeholder="mail@example.com"
                mb="24px"
                fontWeight="500"
                size="lg"
              />
              <FormLabel
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                display="flex"
              >
                Password<Text color={brandStars}>*</Text>
              </FormLabel>
              <InputGroup size="md">
                <Input
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  isRequired={true}
                  fontSize="sm"
                  placeholder="Min. 8 characters"
                  mb="24px"
                  size="lg"
                  type={show ? "text" : "password"}
                  variant="auth"
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{ cursor: "pointer" }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={handleClick}
                  />
                </InputRightElement>
              </InputGroup>

              <FormLabel
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                display="flex"
              >
                Confirm Password<Text color={brandStars}>*</Text>
              </FormLabel>
              <InputGroup size="md">
                <Input
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  isRequired={true}
                  fontSize="sm"
                  placeholder="Confirm your password"
                  mb="24px"
                  size="lg"
                  type={show ? "text" : "password"}
                  variant="auth"
                />
                <InputRightElement display="flex" alignItems="center" mt="4px">
                  <Icon
                    color={textColorSecondary}
                    _hover={{ cursor: "pointer" }}
                    as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                    onClick={handleClick}
                  />
                </InputRightElement>
              </InputGroup>

              <FormLabel
                ms="4px"
                fontSize="sm"
                fontWeight="500"
                color={textColor}
                display="flex"
              >
                Phone Number (Optional)
              </FormLabel>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                fontSize="sm"
                placeholder="Enter your phone number"
                mb="24px"
                size="lg"
                type="tel"
                variant="auth"
              />

              <Button
                type="submit" // Ensure the button submits the form
                fontSize="sm"
                variant="brand"
                fontWeight="500"
                w="100%"
                h="50"
                mb="24px"
                isLoading={loading} // Add loading state to button
                loadingText="Signing Up" // Text to display while loading
                color={buttonText}
                bg={buttonBg}
                _hover={{ bg: "gray.200" }}
              >
                Sign Up
              </Button>
            </FormControl>
          </form>

          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
            maxW="100%"
            mt="0px"
          >
            <Text color={textColorDetails} fontWeight="400" fontSize="14px">
              Already have an account?
              <NavLink to="/auth/sign-in">
                <Text
                  color={textColorBrand}
                  as="span"
                  ms="5px"
                  fontWeight="500"
                >
                  Sign In
                </Text>
              </NavLink>
            </Text>
          </Flex>
        </Flex>
      </Flex>
    </DefaultAuth>
  );
}

export default SignUp;
