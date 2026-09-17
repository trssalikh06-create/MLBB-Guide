import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";

import {
    getAuth
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    getFirestore
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const firebaseConfig = {
    apiKey: "AIzaSyDAGHA0EsvGTo2lgXdy2uNC3CmplMkZOT0",
    authDomain: "mlbb-guide-874e6.firebaseapp.com",
    projectId: "mlbb-guide-874e6",
    storageBucket: "mlbb-guide-874e6.firebasestorage.app",
    messagingSenderId: "1089786176510",
    appId: "1:1089786176510:web:c7b83973df4d9fd8bb96af"
};


const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const db = getFirestore(app);


export { app, auth, db };