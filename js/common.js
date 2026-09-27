import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    addDoc,
    collection,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const authLink = document.getElementById("authLink");
const profileLink = document.getElementById("profileLink");
const adminLink = document.getElementById("adminLink");


onAuthStateChanged(auth, async (user) => {

    if (user) {

        if (authLink) {
            authLink.textContent = "Выйти";
            authLink.href = "#";

            authLink.onclick = async (event) => {

                event.preventDefault();

                await signOut(auth);

                window.location.href = "index.html";
            };
        }


        if (profileLink) {
            profileLink.classList.remove("hidden");
        }


        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const snapshot = await getDoc(userRef);


        if (snapshot.exists()) {

            const userData = snapshot.data();

            if (
                adminLink &&
                userData.role === "admin"
            ) {
                adminLink.classList.remove("hidden");
            }
        }

    } else {

        if (authLink) {
            authLink.textContent = "Войти";
            authLink.href = "auth.html";
            authLink.onclick = null;
        }

        if (profileLink) {
            profileLink.classList.add("hidden");
        }

        if (adminLink) {
            adminLink.classList.add("hidden");
        }
    }
});


export async function getCurrentUserData() {

    const user = auth.currentUser;

    if (!user) {
        return null;
    }

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return null;
    }

    return {
        uid: user.uid,
        ...snapshot.data()
    };
}


export async function addHistory(
    type,
    heroId,
    heroName
) {

    const user = auth.currentUser;

    if (!user) {
        return;
    }

    await addDoc(
        collection(
            db,
            "users",
            user.uid,
            "history"
        ),
        {
            type,
            heroId,
            heroName,
            createdAt: serverTimestamp()
        }
    );
}


export function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}