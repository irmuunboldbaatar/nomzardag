// firebase-config.js - UPDATE THESE LINES
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";

// ... the rest of your config ...

const firebaseConfig = {
  apiKey: "AIzaSyBo975fUWgxYJwGb2Ie4zIcxPb2-etH8ic",
  authDomain: "used-book-shop.firebaseapp.com",
  projectId: "used-book-shop",
  storageBucket: "used-book-shop.firebasestorage.app",
  messagingSenderId: "95397772472",
  appId: "1:95397772472:web:2e70a9cd2e5e532f2e884d",
  measurementId: "G-EEZ7CYSM1E"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);