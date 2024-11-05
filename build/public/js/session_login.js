import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import firebaseConfig from './firebaseConfig.js';
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

//init firebase app
const app = initializeApp(firebaseConfig);

//get auth and firestore instances
const auth = getAuth(app);
const db = getFirestore(app);


document.getElementById('loginForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    //console.log("Auth Successful " + userCridential);
    // On successful login, redirect the user
    window.location.href = "list.html"; // Redirect to the list page after successful login
  } catch (error) {
    // Show error message for failed login
    document.getElementById('errorMessage').textContent = "Login failed. Please check your credentials.";
    document.getElementById('errorMessage').style.display = "block";
    console.error('Login failed:', error.message);
  }
});


document.getElementById('signupForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;

  const passwordMismatch = document.getElementById('passwordMismatch');
  const errorMessage = document.getElementById('errorMessage-signup');
  
  // Check if passwords match
  if (password !== confirmPassword) {
    passwordMismatch.style.display = 'block';
    errorMessage.style.display = 'none'
    return; // Prevent form submission if passwords don't match
  } else {
    passwordMismatch.style.display = 'none';
  }

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    // On successful sign-up, redirect the user
    window.location.href = "list.html"; // Redirect to the list page after successful sign-up
  } catch (error) {
    // Show error message for failed sign-up
    switch (error.code) {
      case 'auth/weak-password':
        errorMessage.textContent = 'Password should be at least 6 characters';
        break;
      case 'auth/email-already-in-use':
        errorMessage.textContent = 'Email is already in use';
        break;
      default:
        errorMessage.textContent = 'Sign-up failed. Please try again.';
        break;
    }
    errorMessage.style.display = 'block';
    console.error('Sign-up failed:', error.message);
  }
});

// Forgot Password Button
const forgotPasswordButton = document.getElementById('forgotPasswordButton');

forgotPasswordButton.addEventListener('click', () => {
  // Hide the forgot password button
  forgotPasswordButton.style.display = 'none';

  // Show the reset password form and hide the login form (replace with your actual login form ID)
  document.getElementById('loginForm').style.display = 'none';
  document.getElementById('resetPasswordForm').style.display = 'block';
});

// Cancel Reset Button
const cancelResetButton = document.getElementById('cancelReset');

cancelResetButton.addEventListener('click', () => {
  // Show the forgot password button when canceling the reset
  forgotPasswordButton.style.display = 'block';

  // Hide the reset password form and show the login form (replace with your actual login form ID)
  document.getElementById('resetPasswordForm').style.display = 'none';
  document.getElementById('loginForm').style.display = 'block';
});

// Reset Password Form
const resetPasswordForm = document.getElementById('resetPasswordForm');
const resetEmailInput = document.getElementById('resetEmail');
const errorMessageReset = document.getElementById('errorMessageReset');

resetPasswordForm.addEventListener('submit', (e) => {
  e.preventDefault();

  const resetEmail = resetEmailInput.value;

  sendPasswordResetEmail(auth, resetEmail)
    .then(() => {
      console.log('Password reset email sent.');
      errorMessageReset.style.color = 'green';
      errorMessageReset.textContent = 'Password reset email sent successfully. Please check your email.';
      
      // Redirect the user back to the login form after a delay (adjust the delay as needed)
      setTimeout(() => {
        // Hide the reset password form and show the login form
        document.getElementById('resetPasswordForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
      }, 2000); // 2000 milliseconds (2 seconds) delay
    })
    .catch((error) => {
      console.error(error.message);
      // Display an error message
      errorMessageReset.style.color = 'red';
      errorMessageReset.textContent = 'Failed to reset password. Please try again.';
    });
});

