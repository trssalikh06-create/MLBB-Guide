import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    getDoc,
    setDoc,
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const profileForm =
    document.getElementById("profileForm");

const profileName =
    document.getElementById("profileName");

const profileEmail =
    document.getElementById("profileEmail");

const profileNameInput =
    document.getElementById("profileNameInput");

const nicknameInput =
    document.getElementById("nickname");

const emailInput =
    document.getElementById("email");

const avatarInput =
    document.getElementById("avatar");

const favoriteRoleInput =
    document.getElementById("favoriteRole");

const favoriteHeroInput =
    document.getElementById("favoriteHero");

const bioInput =
    document.getElementById("bio");

const profileAvatar =
    document.getElementById("profileAvatar");

const profileMessage =
    document.getElementById("profileMessage");

const logoutBtn =
    document.getElementById("logoutBtn");

const favoritesContainer =
    document.getElementById("favoritesContainer");

const historyContainer =
    document.getElementById("historyContainer");


onAuthStateChanged(auth, async (user) => {

    if (!user) {

        window.location.href = "auth.html";

        return;
    }

    await loadProfile(user);

    await loadFavorites(user);

    await loadHistory(user);
});


async function loadProfile(user) {

    const userRef = doc(
        db,
        "users",
        user.uid
    );

    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
        return;
    }

    const data = snapshot.data();


    profileName.textContent =
        data.nickname ||
        data.name ||
        "Пользователь";


    profileEmail.textContent =
        data.email || user.email;


    profileNameInput.value =
        data.name || "";


    nicknameInput.value =
        data.nickname || "";


    emailInput.value =
        data.email || user.email;


    avatarInput.value =
        data.avatar || "";


    favoriteRoleInput.value =
        data.favoriteRole || "";


    favoriteHeroInput.value =
        data.favoriteHero || "";


    bioInput.value =
        data.bio || "";


    if (data.avatar) {

        profileAvatar.innerHTML =
            `<img src="${data.avatar}" alt="Аватар">`;

    } else {

        const name =
            data.nickname ||
            data.name ||
            "ML";

        profileAvatar.textContent =
            name.substring(0, 2).toUpperCase();
    }
}


profileForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();

        const user = auth.currentUser;

        if (!user) {
            return;
        }


        try {

            const userRef = doc(
                db,
                "users",
                user.uid
            );


            const oldData =
                await getDoc(userRef);


            const oldProfile =
                oldData.exists()
                    ? oldData.data()
                    : {};


            await setDoc(
                userRef,
                {
                    name:
                        profileNameInput.value.trim(),

                    nickname:
                        nicknameInput.value.trim(),

                    email:
                        user.email,

                    avatar:
                        avatarInput.value.trim(),

                    favoriteRole:
                        favoriteRoleInput.value,

                    favoriteHero:
                        favoriteHeroInput.value.trim(),

                    bio:
                        bioInput.value.trim(),

                    role:
                        oldProfile.role || "user"
                },
                {
                    merge: true
                }
            );


            profileMessage.textContent =
                "Профиль сохранён";

            profileMessage.className =
                "auth-message success";


            await loadProfile(user);


        } catch (error) {

            console.error(error);

            profileMessage.textContent =
                "Ошибка сохранения: " +
                error.message;

            profileMessage.className =
                "auth-message error";
        }
    }
);


async function loadFavorites(user) {

    favoritesContainer.innerHTML = "";


    const favoritesRef =
        collection(
            db,
            "users",
            user.uid,
            "favorites"
        );


    const snapshot =
        await getDocs(favoritesRef);


    if (snapshot.empty) {

        favoritesContainer.innerHTML =
            "<p>Избранных героев пока нет.</p>";

        return;
    }


    for (const favorite of snapshot.docs) {

        const data =
            favorite.data();


        const heroRef =
            doc(
                db,
                "heroes",
                data.heroId
            );


        const heroSnapshot =
            await getDoc(heroRef);


        if (!heroSnapshot.exists()) {
            continue;
        }


        const hero =
            heroSnapshot.data();


        const card =
            document.createElement("div");

        card.className = "card";


        card.innerHTML = `

            <img
                src="${hero.image || ""}"
                class="card-image"
                alt="${hero.name}"
            >

            <div class="card-content">

                <h3>
                    ${hero.name}
                </h3>

                <p>
                    ${hero.role || ""}
                </p>

                <a
                    href="hero.html?id=${favorite.id}"
                    class="btn"
                >
                    Открыть
                </a>

            </div>

        `;


        favoritesContainer.appendChild(card);
    }
}


async function loadHistory(user) {

    historyContainer.innerHTML = "";


    const historyRef =
        collection(
            db,
            "users",
            user.uid,
            "history"
        );


    const historyQuery =
        query(
            historyRef,
            orderBy("createdAt", "desc")
        );


    const snapshot =
        await getDocs(historyQuery);


    if (snapshot.empty) {

        historyContainer.innerHTML =
            "<p>История пока пустая.</p>";

        return;
    }


    snapshot.forEach((item) => {

        const data =
            item.data();


        const element =
            document.createElement("div");

        element.className =
            "history-item";


        let text = "Действие";


        if (data.type === "view_hero") {
            text =
                `Просмотр героя: ${data.heroName}`;
        }

        if (data.type === "favorite_add") {
            text =
                `Добавлен в избранное: ${data.heroName}`;
        }

        if (data.type === "favorite_remove") {
            text =
                `Удалён из избранного: ${data.heroName}`;
        }


        element.textContent = text;

        historyContainer.appendChild(element);
    });
}


logoutBtn.addEventListener(
    "click",
    async () => {

        await signOut(auth);

        window.location.href =
            "index.html";
    }
);