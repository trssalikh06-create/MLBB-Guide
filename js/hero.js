import { db, auth } from "./firebase.js";

import {
    doc,
    getDoc,
    getDocs,
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
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


const addSkillButton = document.getElementById("addSkillButton");
const addTipButton = document.getElementById("addTipButton");
const addBuildButton = document.getElementById("addBuildButton");
const addCounterButton = document.getElementById("addCounterButton");


const skillFormContainer = document.getElementById("skillFormContainer");
const tipFormContainer = document.getElementById("tipFormContainer");
const buildFormContainer = document.getElementById("buildFormContainer");
const counterFormContainer = document.getElementById("counterFormContainer");


const skillForm = document.getElementById("skillForm");
const tipForm = document.getElementById("tipForm");
const buildForm = document.getElementById("buildForm");
const counterForm = document.getElementById("counterForm");


const skillEditId = document.getElementById("skillEditId");
const skillName = document.getElementById("skillName");
const skillType = document.getElementById("skillType");
const skillUltimate = document.getElementById("skillUltimate");
const skillImage = document.getElementById("skillImage");
const skillDescription = document.getElementById("skillDescription");


const tipEditId = document.getElementById("tipEditId");
const tipText = document.getElementById("tipText");


const buildEditId = document.getElementById("buildEditId");
const buildName = document.getElementById("buildName");
const buildDescription = document.getElementById("buildDescription");
const buildItems = document.getElementById("buildItems");


const counterEditId = document.getElementById("counterEditId");
const counterHeroId = document.getElementById("counterHeroId");
const counterReason = document.getElementById("counterReason");


const commentText = document.getElementById("commentText");
const commentBtn = document.getElementById("commentBtn");


const skillCancel = document.getElementById("skillCancel");
const tipCancel = document.getElementById("tipCancel");
const buildCancel = document.getElementById("buildCancel");
const counterCancel = document.getElementById("counterCancel");


let currentUser = null;
let isAdmin = false;
let currentHero = null;
let allHeroes = [];
let allItems = [];


function escapeHTML(value = "") {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


async function checkAdmin(user) {

    if (!user) {
        isAdmin = false;
        return;
    }

    try {

        const userRef = doc(
            db,
            "users",
            user.uid
        );

        const userSnapshot = await getDoc(userRef);

        if (!userSnapshot.exists()) {
            isAdmin = false;
            return;
        }

        const userData = userSnapshot.data();

        isAdmin = userData.role === "admin";

    } catch (error) {

        console.error(
            "Ошибка проверки администратора:",
            error
        );

        isAdmin = false;
    }


    if (isAdmin) {

        addSkillButton.classList.remove("hidden");
        addTipButton.classList.remove("hidden");
        addBuildButton.classList.remove("hidden");
        addCounterButton.classList.remove("hidden");

    } else {

        addSkillButton.classList.add("hidden");
        addTipButton.classList.add("hidden");
        addBuildButton.classList.add("hidden");
        addCounterButton.classList.add("hidden");
    }
}


async function loadHero() {

    if (!heroId) {

        heroContainer.innerHTML =
            "<p>Герой не найден.</p>";

        return;
    }


    try {

        const heroRef = doc(
            db,
            "heroes",
            heroId
        );

        const snapshot = await getDoc(heroRef);


        if (!snapshot.exists()) {

            heroContainer.innerHTML =
                "<p>Герой не найден.</p>";

            return;
        }


        currentHero = {
            id: snapshot.id,
            ...snapshot.data()
        };


        const difficulty = Math.max(
            1,
            Math.min(
                5,
                Number(currentHero.difficulty) || 1
            )
        );


        const stars =
            "★".repeat(difficulty) +
            "☆".repeat(5 - difficulty);


        heroContainer.innerHTML = `

            <div class="hero-container">

                <div class="hero-header">

                    <h1 class="hero-name">
                        ${escapeHTML(currentHero.name)}
                    </h1>


                    <div class="hero-tags">

                        ${
                            currentHero.role
                                ? `
                                    <span class="tag">
                                        ${escapeHTML(currentHero.role)}
                                    </span>
                                  `
                                : ""
                        }


                        ${
                            currentHero.lane
                                ? `
                                    <span class="tag">
                                        ${escapeHTML(currentHero.lane)}
                                    </span>
                                  `
                                : ""
                        }


                        ${
                            currentHero.specialty
                                ? `
                                    <span class="tag">
                                        ${escapeHTML(currentHero.specialty)}
                                    </span>
                                  `
                                : ""
                        }

                    </div>


                    <div class="hero-difficulty">

                        <span>
                            Сложность:
                        </span>

                        <span class="difficulty-stars">
                            ${stars}
                        </span>

                    </div>

                </div>


                <div class="hero-body">

                    <div class="hero-image-wrapper">

                        <img
                            src="${escapeHTML(currentHero.image || "")}"
                            alt="${escapeHTML(currentHero.name)}"
                            class="hero-image"
                        >

                    </div>


                    <div class="hero-info">

                        <div class="hero-summary">

                            <h2>
                                Описание
                            </h2>

                            <p>
                                ${
                                    escapeHTML(
                                        currentHero.description ||
                                        "Описание героя пока отсутствует."
                                    )
                                }
                            </p>

                        </div>


                        <div class="hero-story">

                            <h2>
                                История
                            </h2>

                            <p>
                                ${
                                    escapeHTML(
                                        currentHero.lore ||
                                        "История героя пока отсутствует."
                                    )
                                }
                            </p>

                        </div>


                        <button
                            class="btn"
                            id="favoriteBtn"
                        >
                            Добавить в избранное
                        </button>

                    </div>

                </div>

            </div>
        `;


        document
            .getElementById("favoriteBtn")
            .addEventListener(
                "click",
                addFavorite
            );


        await loadAllHeroes();
        await loadAllItems();

        loadSkills(
            currentHero.skills || []
        );

        loadTips(
            currentHero.tips || []
        );

        await loadBuilds();
        await loadCounters();
        loadComments();

        fillBuildItems();
        fillCounterHeroes();

    } catch (error) {

        console.error(
            "Ошибка загрузки героя:",
            error
        );

        heroContainer.innerHTML =
            "<p>Не удалось загрузить героя.</p>";
    }
}


function loadSkills(skills) {

    skillsContainer.innerHTML = "";


    if (!skills.length) {

        skillsContainer.innerHTML =
            "<p>Навыки пока не добавлены.</p>";

        return;
    }


    skills.forEach((skill, index) => {

        const type =
            skill.type === "passive"
                ? "Пассивный"
                : skill.type || index + 1;


        const ultimate =
            skill.ultimate
                ? `<span class="skill-ultimate">УЛЬТИМЕЙТ</span>`
                : "";


        const skillNumber =
            skill.type === "passive"
                ? ""
                : `<span class="skill-number">${escapeHTML(type)}</span>`;


        const buttons = isAdmin
            ? `
                <div class="admin-card-actions">

                    <button
                        class="btn btn-secondary"
                        onclick="editSkill(${index})"
                    >
                        Изменить
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="deleteSkill(${index})"
                    >
                        Удалить
                    </button>

                </div>
              `
            : "";


        skillsContainer.innerHTML += `

            <article class="skill-card-wide">

                <div class="skill-icon-wrapper">

                    <img
                        src="${escapeHTML(skill.image || "")}"
                        alt="${escapeHTML(skill.name || "Навык")}"
                        class="skill-icon-large"
                    >

                </div>


                <div class="skill-content">

                    <div class="skill-title-row">

                        ${skillNumber}

                        <h3>
                            ${escapeHTML(skill.name)}
                        </h3>

                        ${ultimate}

                    </div>


                    <p>
                        ${escapeHTML(skill.description)}
                    </p>


                    ${buttons}

                </div>

            </article>
        `;
    });
}


window.editSkill = function(index) {

    if (!isAdmin) return;

    const skills =
        currentHero.skills || [];

    const skill =
        skills[index];

    if (!skill) return;


    skillEditId.value = index;

    skillName.value =
        skill.name || "";

    skillType.value =
        skill.type || "passive";

    skillUltimate.checked =
        skill.ultimate === true;

    skillImage.value =
        skill.image || "";

    skillDescription.value =
        skill.description || "";


    document.getElementById(
        "skillFormTitle"
    ).textContent =
        "Изменить навык";


    skillFormContainer.classList.remove(
        "hidden"
    );


    skillFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


window.deleteSkill = async function(index) {

    if (!isAdmin) return;


    if (!confirm("Удалить этот навык?")) {
        return;
    }


    try {

        const skills =
            [...(currentHero.skills || [])];


        skills.splice(index, 1);


        await updateDoc(
            doc(
                db,
                "heroes",
                heroId
            ),
            {
                skills,
                updatedAt: serverTimestamp()
            }
        );


        currentHero.skills = skills;

        loadSkills(skills);

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось удалить навык."
        );
    }
};


skillForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isAdmin) return;


        const skills =
            [...(currentHero.skills || [])];


        const newSkill = {

            name:
                skillName.value.trim(),

            type:
                skillType.value,

            ultimate:
                skillUltimate.checked,

            image:
                skillImage.value.trim(),

            description:
                skillDescription.value.trim()
        };


        const editIndex =
            skillEditId.value;


        if (editIndex === "") {

            skills.push(newSkill);

        } else {

            skills[
                Number(editIndex)
            ] = newSkill;
        }


        try {

            await updateDoc(
                doc(
                    db,
                    "heroes",
                    heroId
                ),
                {
                    skills,
                    updatedAt:
                        serverTimestamp()
                }
            );


            currentHero.skills =
                skills;


            loadSkills(skills);

            resetSkillForm();

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось сохранить навык."
            );
        }

    }
);


function resetSkillForm() {

    skillForm.reset();

    skillEditId.value = "";

    document.getElementById(
        "skillFormTitle"
    ).textContent =
        "Добавить навык";

    skillFormContainer.classList.add(
        "hidden"
    );
}


skillCancel.addEventListener(
    "click",
    resetSkillForm
);


addSkillButton.addEventListener(
    "click",
    () => {

        resetSkillForm();

        skillFormContainer.classList.remove(
            "hidden"
        );

        skillFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
);



/* ================================= */
/* СОВЕТЫ */
/* ================================= */

function loadTips(tips) {

    tipsContainer.innerHTML = "";


    if (!tips.length) {

        tipsContainer.innerHTML =
            "<p>Советы пока не добавлены.</p>";

        return;
    }


    tips.forEach(
        (tip, index) => {

            const text =
                typeof tip === "string"
                    ? tip
                    : tip.text || "";


            tipsContainer.innerHTML += `

                <div class="build">

                    <div class="content-row">

                        <div>

                            <strong>
                                Совет ${index + 1}
                            </strong>

                            <p>
                                ${escapeHTML(text)}
                            </p>

                        </div>


                        ${
                            isAdmin
                                ? `
                                    <div class="admin-card-actions">

                                        <button
                                            class="btn btn-secondary"
                                            onclick="editTip(${index})"
                                        >
                                            Изменить
                                        </button>

                                        <button
                                            class="btn btn-danger"
                                            onclick="deleteTip(${index})"
                                        >
                                            Удалить
                                        </button>

                                    </div>
                                  `
                                : ""
                        }

                    </div>

                </div>
            `;
        }
    );
}


window.editTip = function(index) {

    const tips =
        [...(currentHero.tips || [])];


    const tip =
        tips[index];


    if (!tip) return;


    tipEditId.value = index;


    tipText.value =
        typeof tip === "string"
            ? tip
            : tip.text || "";


    document.getElementById(
        "tipFormTitle"
    ).textContent =
        "Изменить совет";


    tipFormContainer.classList.remove(
        "hidden"
    );

    tipFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


window.deleteTip = async function(index) {

    if (!isAdmin) return;


    if (!confirm("Удалить этот совет?")) {
        return;
    }


    const tips =
        [...(currentHero.tips || [])];


    tips.splice(index, 1);


    try {

        await updateDoc(
            doc(
                db,
                "heroes",
                heroId
            ),
            {
                tips,
                updatedAt:
                    serverTimestamp()
            }
        );


        currentHero.tips =
            tips;


        loadTips(tips);

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось удалить совет."
        );
    }
};


tipForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isAdmin) return;


        const tips =
            [...(currentHero.tips || [])];


        const value =
            tipText.value.trim();


        const editIndex =
            tipEditId.value;


        if (editIndex === "") {

            tips.push({
                text: value
            });

        } else {

            tips[
                Number(editIndex)
            ] = {
                text: value
            };
        }


        try {

            await updateDoc(
                doc(
                    db,
                    "heroes",
                    heroId
                ),
                {
                    tips,
                    updatedAt:
                        serverTimestamp()
                }
            );


            currentHero.tips =
                tips;


            loadTips(tips);

            resetTipForm();

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось сохранить совет."
            );
        }
    }
);


function resetTipForm() {

    tipForm.reset();

    tipEditId.value = "";

    document.getElementById(
        "tipFormTitle"
    ).textContent =
        "Добавить совет";

    tipFormContainer.classList.add(
        "hidden"
    );
}


tipCancel.addEventListener(
    "click",
    resetTipForm
);


addTipButton.addEventListener(
    "click",
    () => {

        resetTipForm();

        tipFormContainer.classList.remove(
            "hidden"
        );

        tipFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
);



/* ================================= */
/* ПРЕДМЕТЫ */
/* ================================= */

async function loadAllItems() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "items"
            )
        );


    allItems =
        snapshot.docs.map(
            itemDoc => ({
                id: itemDoc.id,
                ...itemDoc.data()
            })
        );
}


function fillBuildItems() {

    buildItems.innerHTML = "";


    allItems.forEach(item => {

        buildItems.innerHTML += `

            <option value="${item.id}">
                ${escapeHTML(item.name)}
            </option>

        `;
    });
}



/* ================================= */
/* ГЕРОИ */
/* ================================= */

async function loadAllHeroes() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "heroes"
            )
        );


    allHeroes =
        snapshot.docs.map(
            heroDoc => ({
                id: heroDoc.id,
                ...heroDoc.data()
            })
        );
}


function fillCounterHeroes() {

    counterHeroId.innerHTML =
        `<option value="">
            Выберите героя
        </option>`;


    allHeroes
        .filter(hero => hero.id !== heroId)
        .forEach(hero => {

            counterHeroId.innerHTML += `

                <option value="${hero.id}">
                    ${escapeHTML(hero.name)}
                </option>

            `;
        });
}



/* ================================= */
/* СБОРКИ */
/* ================================= */

async function loadBuilds() {

    buildsContainer.innerHTML = "";


    const buildsRef =
        collection(
            db,
            "heroes",
            heroId,
            "builds"
        );


    const snapshot =
        await getDocs(buildsRef);


    if (snapshot.empty) {

        buildsContainer.innerHTML =
            "<p>Сборки пока не добавлены.</p>";

        return;
    }


    for (const buildDoc of snapshot.docs) {

        const build =
            buildDoc.data();


        let itemsHTML = "";


        for (
            const itemId
            of build.items || []
        ) {

            const item =
                allItems.find(
                    x => x.id === itemId
                );


            if (!item) continue;


            itemsHTML += `

                <img
                    class="item-icon"
                    src="${escapeHTML(item.image || "")}"
                    alt="${escapeHTML(item.name)}"
                    title="${escapeHTML(item.name)}"
                >

            `;
        }


        buildsContainer.innerHTML += `

            <div class="build">

                <div class="content-row">

                    <div>

                        <h3>
                            ${escapeHTML(build.name)}
                        </h3>

                        <p>
                            ${escapeHTML(
                                build.description || ""
                            )}
                        </p>


                        <div class="items-row">
                            ${itemsHTML}
                        </div>

                    </div>


                    ${
                        isAdmin
                            ? `
                                <div class="admin-card-actions">

                                    <button
                                        class="btn btn-secondary"
                                        onclick="editBuild('${buildDoc.id}')"
                                    >
                                        Изменить
                                    </button>

                                    <button
                                        class="btn btn-danger"
                                        onclick="deleteBuild('${buildDoc.id}')"
                                    >
                                        Удалить
                                    </button>

                                </div>
                              `
                            : ""
                    }

                </div>

            </div>
        `;
    }
}


window.editBuild = async function(buildId) {

    const buildSnapshot =
        await getDoc(
            doc(
                db,
                "heroes",
                heroId,
                "builds",
                buildId
            )
        );


    if (!buildSnapshot.exists()) {
        return;
    }


    const build =
        buildSnapshot.data();


    buildEditId.value =
        buildId;


    buildName.value =
        build.name || "";


    buildDescription.value =
        build.description || "";


    Array.from(
        buildItems.options
    ).forEach(option => {

        option.selected =
            (build.items || [])
                .includes(option.value);

    });


    document.getElementById(
        "buildFormTitle"
    ).textContent =
        "Изменить сборку";


    buildFormContainer.classList.remove(
        "hidden"
    );

    buildFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


window.deleteBuild = async function(buildId) {

    if (!isAdmin) return;


    if (!confirm("Удалить эту сборку?")) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "heroes",
                heroId,
                "builds",
                buildId
            )
        );


        await loadBuilds();

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось удалить сборку."
        );
    }
};


buildForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isAdmin) return;


        const selectedItems =
            Array.from(
                buildItems.selectedOptions
            ).map(
                option => option.value
            );


        const data = {

            name:
                buildName.value.trim(),

            description:
                buildDescription.value.trim(),

            items:
                selectedItems,

            updatedAt:
                serverTimestamp()
        };


        try {

            const editId =
                buildEditId.value;


            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "heroes",
                        heroId,
                        "builds",
                        editId
                    ),
                    data
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "heroes",
                        heroId,
                        "builds"
                    ),
                    {
                        ...data,
                        createdAt:
                            serverTimestamp()
                    }
                );
            }


            resetBuildForm();

            await loadBuilds();

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось сохранить сборку."
            );
        }
    }
);


function resetBuildForm() {

    buildForm.reset();

    buildEditId.value = "";

    document.getElementById(
        "buildFormTitle"
    ).textContent =
        "Добавить сборку";


    Array.from(
        buildItems.options
    ).forEach(
        option => option.selected = false
    );


    buildFormContainer.classList.add(
        "hidden"
    );
}


buildCancel.addEventListener(
    "click",
    resetBuildForm
);


addBuildButton.addEventListener(
    "click",
    () => {

        resetBuildForm();

        buildFormContainer.classList.remove(
            "hidden"
        );

        buildFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
);



/* ================================= */
/* КОНТРПИКИ */
/* ================================= */

async function loadCounters() {

    countersContainer.innerHTML = "";


    const q =
        query(
            collection(
                db,
                "counters"
            ),
            where(
                "heroId",
                "==",
                heroId
            )
        );


    const snapshot =
        await getDocs(q);


    if (snapshot.empty) {

        countersContainer.innerHTML =
            "<p>Контрпики пока не добавлены.</p>";

        return;
    }


    for (
        const counterDoc
        of snapshot.docs
    ) {

        const counter =
            counterDoc.data();


        const enemy =
            allHeroes.find(
                hero =>
                    hero.id ===
                    counter.counterId
            );


        if (!enemy) continue;


        countersContainer.innerHTML += `

            <div class="counter-card-wide">

                <div>

                    <h3>
                        ${escapeHTML(enemy.name)}
                    </h3>

                    <p>
                        ${escapeHTML(
                            counter.reason || ""
                        )}
                    </p>

                </div>


                ${
                    isAdmin
                        ? `
                            <div class="admin-card-actions">

                                <button
                                    class="btn btn-secondary"
                                    onclick="editCounter('${counterDoc.id}')"
                                >
                                    Изменить
                                </button>

                                <button
                                    class="btn btn-danger"
                                    onclick="deleteCounter('${counterDoc.id}')"
                                >
                                    Удалить
                                </button>

                            </div>
                          `
                        : ""
                }

            </div>
        `;
    }
}


window.editCounter = async function(counterId) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "counters",
                counterId
            )
        );


    if (!snapshot.exists()) {
        return;
    }


    const counter =
        snapshot.data();


    counterEditId.value =
        counterId;


    counterHeroId.value =
        counter.counterId || "";


    counterReason.value =
        counter.reason || "";


    document.getElementById(
        "counterFormTitle"
    ).textContent =
        "Изменить контрпик";


    counterFormContainer.classList.remove(
        "hidden"
    );


    counterFormContainer.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
};


window.deleteCounter = async function(counterId) {

    if (!isAdmin) return;


    if (!confirm("Удалить этот контрпик?")) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "counters",
                counterId
            )
        );


        await loadCounters();

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось удалить контрпик."
        );
    }
};


counterForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        if (!isAdmin) return;


        const data = {

            heroId,

            counterId:
                counterHeroId.value,

            reason:
                counterReason.value.trim(),

            updatedAt:
                serverTimestamp()
        };


        try {

            const editId =
                counterEditId.value;


            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "counters",
                        editId
                    ),
                    data
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "counters"
                    ),
                    {
                        ...data,
                        createdAt:
                            serverTimestamp()
                    }
                );
            }


            resetCounterForm();

            await loadCounters();

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось сохранить контрпик."
            );
        }
    }
);


function resetCounterForm() {

    counterForm.reset();

    counterEditId.value = "";

    document.getElementById(
        "counterFormTitle"
    ).textContent =
        "Добавить контрпик";


    counterFormContainer.classList.add(
        "hidden"
    );
}


counterCancel.addEventListener(
    "click",
    resetCounterForm
);


addCounterButton.addEventListener(
    "click",
    () => {

        resetCounterForm();

        counterFormContainer.classList.remove(
            "hidden"
        );

        counterFormContainer.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
);



/* ================================= */
/* ИЗБРАННОЕ */
/* ================================= */

async function addFavorite() {

    if (!currentUser) {

        alert(
            "Сначала войдите в аккаунт."
        );

        window.location.href =
            "auth.html";

        return;
    }


    try {

        const favoriteRef =
            doc(
                db,
                "users",
                currentUser.uid,
                "favorites",
                heroId
            );


        await setDoc(
            favoriteRef,
            {
                heroId,
                heroName:
                    currentHero.name,
                addedAt:
                    serverTimestamp()
            }
        );


        alert(
            "Герой добавлен в избранное."
        );

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось добавить героя."
        );
    }
}



/* ================================= */
/* КОММЕНТАРИИ */
/* ================================= */

function loadComments() {

    const q =
        query(
            collection(
                db,
                "comments"
            ),
            where(
                "heroId",
                "==",
                heroId
            )
        );


    import(
        "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"
    ).then(
        ({ onSnapshot }) => {

            onSnapshot(
                q,
                snapshot => {

                    const comments =
                        snapshot.docs.map(
                            commentDoc => ({
                                id:
                                    commentDoc.id,
                                ...commentDoc.data()
                            })
                        );


                    comments.sort(
                        (a, b) => {

                            const aTime =
                                a.createdAt
                                    ?.toMillis?.() || 0;

                            const bTime =
                                b.createdAt
                                    ?.toMillis?.() || 0;

                            return bTime - aTime;
                        }
                    );


                    commentsContainer.innerHTML = "";


                    if (!comments.length) {

                        commentsContainer.innerHTML =
                            "<p>Комментариев пока нет.</p>";

                        return;
                    }


                    comments.forEach(
                        comment => {

                            commentsContainer.innerHTML += `

                                <div class="comment">

                                    <div>

                                        <strong>
                                            ${escapeHTML(
                                                comment.userName ||
                                                "Пользователь"
                                            )}
                                        </strong>

                                        <p>
                                            ${escapeHTML(
                                                comment.text || ""
                                            )}
                                        </p>

                                    </div>


                                    ${
                                        isAdmin
                                            ? `
                                                <button
                                                    class="btn btn-danger"
                                                    onclick="deleteComment('${comment.id}')"
                                                >
                                                    Удалить
                                                </button>
                                              `
                                            : ""
                                    }

                                </div>

                            `;
                        }
                    );
                },

                error => {

                    console.error(
                        "Ошибка комментариев:",
                        error
                    );

                    commentsContainer.innerHTML =
                        "<p>Не удалось загрузить комментарии.</p>";
                }
            );
        }
    );
}


window.deleteComment = async function(commentId) {

    if (!isAdmin) return;


    if (!confirm("Удалить комментарий?")) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "comments",
                commentId
            )
        );

    } catch (error) {

        console.error(error);

        alert(
            "Не удалось удалить комментарий."
        );
    }
};


commentBtn.addEventListener(
    "click",
    async () => {

        if (!currentUser) {

            alert(
                "Для комментариев необходимо войти."
            );

            return;
        }


        const text =
            commentText.value.trim();


        if (!text) {

            alert(
                "Введите комментарий."
            );

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    currentUser.uid
                );


            const userSnapshot =
                await getDoc(userRef);


            const user =
                userSnapshot.exists()
                    ? userSnapshot.data()
                    : {};


            await addDoc(
                collection(
                    db,
                    "comments"
                ),
                {

                    heroId,

                    userId:
                        currentUser.uid,

                    userName:
                        user.name ||
                        currentUser.email,

                    text,

                    createdAt:
                        serverTimestamp()
                }
            );


            commentText.value = "";

        } catch (error) {

            console.error(error);

            alert(
                "Не удалось добавить комментарий."
            );
        }
    }
);



/* ================================= */
/* АВТОРИЗАЦИЯ */
/* ================================= */

onAuthStateChanged(
    auth,
    async user => {

        currentUser = user;

        await checkAdmin(user);

        if (heroId) {
            loadHero();
        }
    }
);