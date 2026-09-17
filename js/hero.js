import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    collection,
    getDocs,
    addDoc,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const params = new URLSearchParams(window.location.search);
const heroId = params.get("id");

const heroContainer = document.getElementById("heroContainer");
const skillsContainer = document.getElementById("skillsContainer");
const tipsContainer = document.getElementById("tipsContainer");
const buildsContainer = document.getElementById("buildsContainer");
const countersContainer = document.getElementById("countersContainer");
const commentsContainer = document.getElementById("commentsContainer");

const commentText = document.getElementById("commentText");
const commentBtn = document.getElementById("commentBtn");

let currentUser = null;

async function loadHero() {
    if (!heroId) {
        heroContainer.innerHTML = "<p>Герой не найден.</p>";
        return;
    }

    const heroRef = doc(db, "heroes", heroId);
    const snapshot = await getDoc(heroRef);

    if (!snapshot.exists()) {
        heroContainer.innerHTML = "<p>Герой не найден.</p>";
        return;
    }

    const hero = snapshot.data();

    heroContainer.innerHTML = `
        <div class="hero-detail">

            <div class="hero-main">

                <img
                    src="${hero.image}"
                    alt="${hero.name}"
                >

                <div class="hero-info">

                    <h1>${hero.name}</h1>

                    <span class="tag">${hero.role}</span>
                    <span class="tag">${hero.lane}</span>
                    <span class="tag">
                        Сложность: ${hero.difficulty}
                    </span>

                    <br><br>

                    <p>
                        ${hero.description || ""}
                    </p>

                    <h2>История</h2>

                    <p>
                        ${hero.lore || ""}
                    </p>

                    <button class="btn" id="favoriteBtn">
                        Добавить в избранное
                    </button>

                </div>

            </div>

        </div>
    `;

    document
        .getElementById("favoriteBtn")
        .addEventListener("click", addFavorite);

    loadSkills(hero.skills || []);
    loadTips(hero.tips || []);
    loadBuilds();
    loadCounters();
    loadComments();
}

function loadSkills(skills) {
    skillsContainer.innerHTML = "";

    skills.forEach(skill => {
        skillsContainer.innerHTML += `
            <div class="skill">
                <h3>${skill.name}</h3>
                <p>${skill.description}</p>
            </div>
        `;
    });
}

function loadTips(tips) {
    tipsContainer.innerHTML = "";

    tips.forEach((tip, index) => {
        tipsContainer.innerHTML += `
            <div class="build">
                <strong>Совет ${index + 1}</strong>
                <p>${tip}</p>
            </div>
        `;
    });
}

async function loadBuilds() {
    buildsContainer.innerHTML = "";

    const buildsRef = collection(
        db,
        "heroes",
        heroId,
        "builds"
    );

    const snapshot = await getDocs(buildsRef);

    for (const buildDoc of snapshot.docs) {
        const build = buildDoc.data();

        let itemsHTML = "";

        for (const itemId of build.items || []) {

            const itemRef = doc(db, "items", itemId);
            const itemSnapshot = await getDoc(itemRef);

            if (itemSnapshot.exists()) {
                const item = itemSnapshot.data();

                itemsHTML += `
                    <img
                        class="item-icon"
                        src="${item.image}"
                        alt="${item.name}"
                        title="${item.name}"
                    >
                `;
            }
        }

        buildsContainer.innerHTML += `
            <div class="build">

                <h3>${build.name}</h3>

                <p>
                    ${build.description || ""}
                </p>

                <div class="items-row">
                    ${itemsHTML}
                </div>

            </div>
        `;
    }
}

async function loadCounters() {
    countersContainer.innerHTML = "";

    const q = query(
        collection(db, "counters"),
        where("heroId", "==", heroId)
    );

    const snapshot = await getDocs(q);

    for (const counterDoc of snapshot.docs) {

        const counter = counterDoc.data();

        const heroRef = doc(
            db,
            "heroes",
            counter.counterId
        );

        const heroSnapshot = await getDoc(heroRef);

        if (!heroSnapshot.exists()) {
            continue;
        }

        const hero = heroSnapshot.data();

        countersContainer.innerHTML += `
            <div class="build">

                <h3>${hero.name}</h3>

                <p>
                    ${counter.reason || ""}
                </p>

            </div>
        `;
    }
}

function loadComments() {
    const q = query(
        collection(db, "comments"),
        where("heroId", "==", heroId),
        orderBy("createdAt", "desc")
    );

    onSnapshot(q, snapshot => {

        commentsContainer.innerHTML = "";

        snapshot.forEach(commentDoc => {

            const comment = commentDoc.data();

            commentsContainer.innerHTML += `
                <div class="comment">

                    <strong>
                        ${comment.userName}
                    </strong>

                    <p>
                        ${comment.text}
                    </p>

                </div>
            `;
        });
    });
}

async function addFavorite() {

    if (!currentUser) {
        alert("Сначала войдите в аккаунт.");
        window.location.href = "auth.html";
        return;
    }

    const favoriteRef = doc(
        db,
        "users",
        currentUser.uid,
        "favorites",
        heroId
    );

    const heroRef = doc(db, "heroes", heroId);
    const heroSnapshot = await getDoc(heroRef);

    await import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
    ).then(async ({ setDoc, serverTimestamp }) => {

        await setDoc(favoriteRef, {
            heroId,
            heroName: heroSnapshot.data().name,
            addedAt: serverTimestamp()
        });

        alert("Герой добавлен в избранное.");
    });
}

commentBtn.addEventListener("click", async () => {

    if (!currentUser) {
        alert("Для комментариев необходимо войти.");
        return;
    }

    const text = commentText.value.trim();

    if (!text) {
        alert("Введите комментарий.");
        return;
    }

    const userRef = doc(
        db,
        "users",
        currentUser.uid
    );

    const userSnapshot = await getDoc(userRef);

    const user = userSnapshot.data();

    await addDoc(collection(db, "comments"), {
        heroId,
        userId: currentUser.uid,
        userName: user?.name || currentUser.email,
        text,
        createdAt: serverTimestamp()
    });

    commentText.value = "";
});

onAuthStateChanged(auth, user => {
    currentUser = user;
});

loadHero();