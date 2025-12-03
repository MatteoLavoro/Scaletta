import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import app from "./config";

const auth = getAuth(app);

export const registerUser = async (email, password, username) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  await updateProfile(userCredential.user, { displayName: username });
  return userCredential.user;
};

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
};

export const logoutUser = () => signOut(auth);

export const updateUsername = async (newUsername) => {
  if (!auth.currentUser) throw new Error("Utente non autenticato");
  await updateProfile(auth.currentUser, { displayName: newUsername });
  return auth.currentUser;
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);

export { auth };
