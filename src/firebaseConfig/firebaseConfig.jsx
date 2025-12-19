import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// TODO: Replace the following with your app's Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyD1XvDJrBs9uQmtI7GrETI_SFVKghgGzAc",
    authDomain: "digital-dynamo-cb555.firebaseapp.com",
    projectId: "digital-dynamo-cb555",
    storageBucket: "digital-dynamo-cb555.appspot.com",
    messagingSenderId: "280926937672",
    appId: "1:280926937672:web:e8e7c775278ed6977c2e7d"
  };

const app = initializeApp(firebaseConfig);
export const Authentication = getAuth(app);