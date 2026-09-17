import { auth, db } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    deleteDoc,
    updateDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const heroForm = document.getElementById("heroForm");
const itemForm = document.getElementById("itemForm");
const buildForm = document.getElementById("buildForm");
const skillForm = document.getElementById("skillForm");
const tipForm = document.getElementById("tipForm");
const counterForm = document.getElementById("counterForm");


const heroesList = document.getElementById("heroesList");
const itemsList = document.getElementById("itemsList");
const buildsList = document.getElementById("buildsList");
const skillsList = document.getElementById("skillsList");
const tipsList = document.getElementById("tipsList");
const countersList = document.getElementById("countersList");
const commentsList = document.getElementById("commentsList");


const adminMessage =
    document.getElementById("adminMessage");


let heroes = [];


onAuthStateChanged(auth, async (user) => {
    if (!user) {
        alert("Пользователь не авторизован");
        window.location.href = "auth.html";
        return;
    }

    try {
        console.log("UID:", user.uid);
        console.log("Email:", user.email);

        const userRef = doc(db, "users", user.uid);
        const userSnapshot = await getDoc(userRef);

        console.log("Документ пользователя существует:", userSnapshot.exists());

        if (!userSnapshot.exists()) {
            alert("Профиль пользователя не найден в Firestore");
            return;
        }

        const userData = userSnapshot.data();

        console.log("Данные пользователя:", userData);
        console.log("Роль:", userData.role);

        if (userData.role !== "admin") {
            alert("Доступ запрещён. Ваша роль: " + userData.role);
            window.location.href = "index.html";
            return;
        }

        console.log("Администратор подтверждён");

        await loadHeroes();
        await loadItems();
        await loadBuilds();

    } catch (error) {
        console.error("Ошибка проверки администратора:", error);
        alert("Ошибка проверки администратора: " + error.message);
    }
});

async function loadAll() {

    await loadHeroes();

    fillHeroSelects();

    await loadItems();

    await loadBuilds();

    await loadSkills();

    await loadTips();

    await loadCounters();

    await loadComments();

}


/* =========================
   ГЕРОИ
========================= */

heroForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const editId =
            document
                .getElementById("heroEditId")
                .value;


        const difficulty =
            Number(
                document
                    .getElementById("heroDifficulty")
                    .value
            );


        if (
            difficulty < 1 ||
            difficulty > 10 ||
            !Number.isInteger(difficulty)
        ) {

            showMessage(
                "Сложность должна быть от 1 до 10",
                true
            );

            return;
        }


        const data = {

            name:
                document
                    .getElementById("heroName")
                    .value
                    .trim(),

            image:
                document
                    .getElementById("heroImage")
                    .value
                    .trim(),

            role:
                document
                    .getElementById("heroRole")
                    .value,

            lane:
                document
                    .getElementById("heroLane")
                    .value,

            difficulty:

                difficulty,

            specialty:
                document
                    .getElementById("heroSpecialty")
                    .value
                    .trim(),

            releaseDate:
                document
                    .getElementById("heroRelease")
                    .value
                    .trim(),

            description:
                document
                    .getElementById("heroDescription")
                    .value
                    .trim(),

            lore:
                document
                    .getElementById("heroLore")
                    .value
                    .trim(),

            updatedAt:
                serverTimestamp()

        };


        try {

            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "heroes",
                        editId
                    ),
                    data
                );

                showMessage(
                    "Герой обновлён"
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "heroes"
                    ),
                    {
                        ...data,
                        createdAt:
                            serverTimestamp()
                    }
                );

                showMessage(
                    "Герой добавлен"
                );
            }


            resetHeroForm();

            await loadHeroes();

            fillHeroSelects();

        } catch (error) {

            console.error(error);

            showMessage(
                "Ошибка: " +
                error.message,
                true
            );
        }

    }
);


async function loadHeroes() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "heroes"
            )
        );


    heroes = [];


    snapshot.forEach((heroDoc) => {

        heroes.push({
            id: heroDoc.id,
            ...heroDoc.data()
        });

    });


    heroesList.innerHTML = "";


    if (heroes.length === 0) {

        heroesList.innerHTML =
            "<p>Героев пока нет.</p>";

        return;
    }


    heroes.forEach((hero) => {

        const element =
            document.createElement("div");

        element.className =
            "admin-item";


        element.innerHTML = `

            <div class="admin-item-info">

                <img
                    src="${hero.image || ""}"
                    alt="${hero.name || ""}"
                >

                <div>

                    <strong>
                        ${hero.name || ""}
                    </strong>

                    <span>
                        ${hero.role || ""}
                        ·
                        ${hero.lane || ""}
                        ·
                        Сложность:
                        ${hero.difficulty || 0}/10
                    </span>

                </div>

            </div>

            <div>

                <button
                    class="btn"
                    data-edit-hero="${hero.id}"
                >
                    Изменить
                </button>

                <button
                    class="btn btn-danger"
                    data-delete-hero="${hero.id}"
                >
                    Удалить
                </button>

            </div>
        `;


        heroesList.appendChild(
            element
        );

    });


    document
        .querySelectorAll(
            "[data-edit-hero]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editHero(
                    button.dataset.editHero
                )
            );

        });


    document
        .querySelectorAll(
            "[data-delete-hero]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteHero(
                    button.dataset.deleteHero
                )
            );

        });

}


function editHero(id) {

    const hero =
        heroes.find(
            item => item.id === id
        );


    if (!hero) {
        return;
    }


    document.getElementById(
        "heroEditId"
    ).value = id;


    document.getElementById(
        "heroName"
    ).value = hero.name || "";


    document.getElementById(
        "heroImage"
    ).value = hero.image || "";


    document.getElementById(
        "heroRole"
    ).value = hero.role || "";


    document.getElementById(
        "heroLane"
    ).value = hero.lane || "";


    document.getElementById(
        "heroDifficulty"
    ).value =
        hero.difficulty || 1;


    document.getElementById(
        "heroSpecialty"
    ).value =
        hero.specialty || "";


    document.getElementById(
        "heroRelease"
    ).value =
        hero.releaseDate || "";


    document.getElementById(
        "heroDescription"
    ).value =
        hero.description || "";


    document.getElementById(
        "heroLore"
    ).value =
        hero.lore || "";


    document.getElementById(
        "heroSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "heroCancel"
    ).style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document
    .getElementById("heroCancel")
    .addEventListener(
        "click",
        resetHeroForm
    );


function resetHeroForm() {

    heroForm.reset();

    document.getElementById(
        "heroEditId"
    ).value = "";


    document.getElementById(
        "heroSubmit"
    ).textContent =
        "Добавить героя";


    document.getElementById(
        "heroCancel"
    ).style.display =
        "none";

}


async function deleteHero(id) {

    if (
        !confirm(
            "Удалить героя и все его сборки?"
        )
    ) {
        return;
    }


    try {

        const builds =
            await getDocs(
                collection(
                    db,
                    "heroes",
                    id,
                    "builds"
                )
            );


        for (
            const build
            of builds.docs
        ) {

            await deleteDoc(
                build.ref
            );

        }


        await deleteDoc(
            doc(
                db,
                "heroes",
                id
            )
        );


        showMessage(
            "Герой удалён"
        );


        await loadAll();

    } catch (error) {

        showMessage(
            "Ошибка удаления: " +
            error.message,
            true
        );

    }

}


/* =========================
   SELECT ГЕРОЕВ
========================= */

function fillHeroSelects() {

    const selects = [

        "buildHeroId",
        "skillHeroId",
        "tipHeroId",
        "counterHeroId"

    ];


    selects.forEach((id) => {

        const select =
            document.getElementById(id);


        if (!select) {
            return;
        }


        select.innerHTML =
            '<option value="">Выберите героя</option>';


        heroes.forEach((hero) => {

            select.innerHTML += `

                <option value="${hero.id}">
                    ${hero.name}
                </option>

            `;

        });

    });


    const enemySelect =
        document.getElementById(
            "counterEnemyId"
        );


    enemySelect.innerHTML =
        '<option value="">Выберите контрпика</option>';


    heroes.forEach((hero) => {

        enemySelect.innerHTML += `

            <option value="${hero.id}">
                ${hero.name}
            </option>

        `;

    });

}


/* =========================
   ПРЕДМЕТЫ
========================= */

itemForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const editId =
            document.getElementById(
                "itemEditId"
            ).value;


        const data = {

            name:
                document
                    .getElementById(
                        "itemName"
                    )
                    .value
                    .trim(),

            image:
                document
                    .getElementById(
                        "itemImage"
                    )
                    .value
                    .trim(),

            price:
                Number(
                    document
                        .getElementById(
                            "itemPrice"
                        )
                        .value
                ),

            category:
                document
                    .getElementById(
                        "itemCategory"
                    )
                    .value,

            description:
                document
                    .getElementById(
                        "itemDescription"
                    )
                    .value
                    .trim()

        };


        try {

            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "items",
                        editId
                    ),
                    data
                );

                showMessage(
                    "Предмет обновлён"
                );

            } else {

                await addDoc(
                    collection(
                        db,
                        "items"
                    ),
                    {
                        ...data,
                        createdAt:
                            serverTimestamp()
                    }
                );

                showMessage(
                    "Предмет добавлен"
                );

            }


            resetItemForm();

            await loadItems();

        } catch (error) {

            showMessage(
                "Ошибка: " +
                error.message,
                true
            );

        }

    }
);


async function loadItems() {

    const snapshot =
        await getDocs(
            collection(
                db,
                "items"
            )
        );


    itemsList.innerHTML = "";


    if (snapshot.empty) {

        itemsList.innerHTML =
            "<p>Предметов пока нет.</p>";

        return;
    }


    snapshot.forEach((itemDoc) => {

        const item =
            itemDoc.data();


        const element =
            document.createElement("div");


        element.className =
            "admin-item";


        element.innerHTML = `

            <div class="admin-item-info">

                <img
                    src="${item.image || ""}"
                    alt="${item.name || ""}"
                >

                <div>

                    <strong>
                        ${item.name || ""}
                    </strong>

                    <span>
                        ${item.category || ""}
                        ·
                        ${item.price || 0} золота
                    </span>

                </div>

            </div>

            <div>

                <button
                    class="btn"
                    data-edit-item="${itemDoc.id}"
                >
                    Изменить
                </button>

                <button
                    class="btn btn-danger"
                    data-delete-item="${itemDoc.id}"
                >
                    Удалить
                </button>

            </div>
        `;


        itemsList.appendChild(
            element
        );

    });


    document
        .querySelectorAll(
            "[data-edit-item]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editItem(
                    button.dataset.editItem
                )
            );

        });


    document
        .querySelectorAll(
            "[data-delete-item]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteItem(
                    button.dataset.deleteItem
                )
            );

        });

}


async function editItem(id) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "items",
                id
            )
        );


    if (!snapshot.exists()) {
        return;
    }


    const item =
        snapshot.data();


    document.getElementById(
        "itemEditId"
    ).value = id;


    document.getElementById(
        "itemName"
    ).value =
        item.name || "";


    document.getElementById(
        "itemImage"
    ).value =
        item.image || "";


    document.getElementById(
        "itemPrice"
    ).value =
        item.price || 0;


    document.getElementById(
        "itemCategory"
    ).value =
        item.category || "";


    document.getElementById(
        "itemDescription"
    ).value =
        item.description || "";


    document.getElementById(
        "itemSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "itemCancel"
    ).style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document
    .getElementById("itemCancel")
    .addEventListener(
        "click",
        resetItemForm
    );


function resetItemForm() {

    itemForm.reset();

    document.getElementById(
        "itemEditId"
    ).value = "";


    document.getElementById(
        "itemSubmit"
    ).textContent =
        "Добавить предмет";


    document.getElementById(
        "itemCancel"
    ).style.display =
        "none";

}


async function deleteItem(id) {

    if (
        !confirm(
            "Удалить этот предмет?"
        )
    ) {
        return;
    }


    try {

        await deleteDoc(
            doc(
                db,
                "items",
                id
            )
        );


        showMessage(
            "Предмет удалён"
        );


        await loadItems();

    } catch (error) {

        showMessage(
            "Ошибка: " +
            error.message,
            true
        );

    }

}


/* =========================
   СБОРКИ
========================= */

buildForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const heroId =
            document
                .getElementById(
                    "buildHeroId"
                )
                .value;


        const editId =
            document
                .getElementById(
                    "buildEditId"
                )
                .value;


        const data = {

            name:
                document
                    .getElementById(
                        "buildName"
                    )
                    .value
                    .trim(),

            description:
                document
                    .getElementById(
                        "buildDescription"
                    )
                    .value
                    .trim(),

            items:
                document
                    .getElementById(
                        "buildItems"
                    )
                    .value
                    .split(",")
                    .map(item => item.trim())
                    .filter(item => item)

        };


        try {

            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "heroes",
                        heroId,
                        "builds",
                        editId
                    ),
                    {
                        ...data,
                        updatedAt:
                            serverTimestamp()
                    }
                );

                showMessage(
                    "Сборка обновлена"
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
                            serverTimestamp(),
                        updatedAt:
                            serverTimestamp()
                    }
                );

                showMessage(
                    "Сборка добавлена"
                );

            }


            resetBuildForm();

            await loadBuilds();

        } catch (error) {

            showMessage(
                "Ошибка: " +
                error.message,
                true
            );

        }

    }
);


async function loadBuilds() {

    buildsList.innerHTML = "";

    let found = false;


    for (
        const hero
        of heroes
    ) {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "heroes",
                    hero.id,
                    "builds"
                )
            );


        snapshot.forEach((buildDoc) => {

            found = true;


            const build =
                buildDoc.data();


            const element =
                document.createElement("div");


            element.className =
                "admin-item";


            element.innerHTML = `

                <div class="admin-item-info">

                    <div>

                        <strong>
                            ${build.name || ""}
                        </strong>

                        <span>
                            Герой: ${hero.name}
                        </span>

                    </div>

                </div>

                <div>

                    <button
                        class="btn"
                        data-edit-build="${hero.id}/${buildDoc.id}"
                    >
                        Изменить
                    </button>

                    <button
                        class="btn btn-danger"
                        data-delete-build="${hero.id}/${buildDoc.id}"
                    >
                        Удалить
                    </button>

                </div>

            `;


            buildsList.appendChild(
                element
            );

        });

    }


    if (!found) {

        buildsList.innerHTML =
            "<p>Сборок пока нет.</p>";

    }


    document
        .querySelectorAll(
            "[data-edit-build]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        buildId
                    ] =
                        button
                            .dataset
                            .editBuild
                            .split("/");


                    editBuild(
                        heroId,
                        buildId
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-build]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        buildId
                    ] =
                        button
                            .dataset
                            .deleteBuild
                            .split("/");


                    deleteBuild(
                        heroId,
                        buildId
                    );

                }
            );

        });

}


async function editBuild(
    heroId,
    buildId
) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "heroes",
                heroId,
                "builds",
                buildId
            )
        );


    if (!snapshot.exists()) {
        return;
    }


    const build =
        snapshot.data();


    document.getElementById(
        "buildEditId"
    ).value =
        buildId;


    document.getElementById(
        "buildHeroId"
    ).value =
        heroId;


    document.getElementById(
        "buildName"
    ).value =
        build.name || "";


    document.getElementById(
        "buildDescription"
    ).value =
        build.description || "";


    document.getElementById(
        "buildItems"
    ).value =
        (build.items || []).join(", ");


    document.getElementById(
        "buildSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "buildCancel"
    ).style.display =
        "inline-block";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


document
    .getElementById("buildCancel")
    .addEventListener(
        "click",
        resetBuildForm
    );


function resetBuildForm() {

    buildForm.reset();

    document.getElementById(
        "buildEditId"
    ).value = "";


    document.getElementById(
        "buildSubmit"
    ).textContent =
        "Добавить сборку";


    document.getElementById(
        "buildCancel"
    ).style.display =
        "none";

}


async function deleteBuild(
    heroId,
    buildId
) {

    if (
        !confirm(
            "Удалить эту сборку?"
        )
    ) {
        return;
    }


    await deleteDoc(
        doc(
            db,
            "heroes",
            heroId,
            "builds",
            buildId
        )
    );


    showMessage(
        "Сборка удалена"
    );


    await loadBuilds();

}


/* =========================
   НАВЫКИ
========================= */

skillForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const heroId =
            document
                .getElementById(
                    "skillHeroId"
                )
                .value;


        const editId =
            document
                .getElementById(
                    "skillEditId"
                )
                .value;


        const skill = {

            name:
                document
                    .getElementById(
                        "skillName"
                    )
                    .value
                    .trim(),

            description:
                document
                    .getElementById(
                        "skillDescription"
                    )
                    .value
                    .trim()

        };


        try {

            const heroRef =
                doc(
                    db,
                    "heroes",
                    heroId
                );


            const snapshot =
                await getDoc(heroRef);


            const currentSkills =
                snapshot.data().skills || [];


            if (editId) {

                const index =
                    Number(editId);


                currentSkills[index] =
                    skill;

            } else {

                currentSkills.push(
                    skill
                );

            }


            await updateDoc(
                heroRef,
                {
                    skills:
                        currentSkills,
                    updatedAt:
                        serverTimestamp()
                }
            );


            showMessage(
                editId
                    ? "Навык обновлён"
                    : "Навык добавлен"
            );


            resetSkillForm();

            await loadSkills();

        } catch (error) {

            showMessage(
                "Ошибка: " +
                error.message,
                true
            );

        }

    }
);


async function loadSkills() {

    skillsList.innerHTML = "";


    heroes.forEach((hero) => {

        const skills =
            hero.skills || [];


        skills.forEach(
            (skill, index) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "admin-item";


                element.innerHTML = `

                    <div>

                        <strong>
                            ${skill.name || ""}
                        </strong>

                        <span>
                            Герой: ${hero.name}
                        </span>

                        <p>
                            ${skill.description || ""}
                        </p>

                    </div>

                    <div>

                        <button
                            class="btn"
                            data-edit-skill="${hero.id}/${index}"
                        >
                            Изменить
                        </button>

                        <button
                            class="btn btn-danger"
                            data-delete-skill="${hero.id}/${index}"
                        >
                            Удалить
                        </button>

                    </div>

                `;


                skillsList.appendChild(
                    element
                );

            }
        );

    });


    if (!skillsList.children.length) {

        skillsList.innerHTML =
            "<p>Навыков пока нет.</p>";

    }


    document
        .querySelectorAll(
            "[data-edit-skill]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        index
                    ] =
                        button
                            .dataset
                            .editSkill
                            .split("/");


                    editSkill(
                        heroId,
                        Number(index)
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-skill]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        index
                    ] =
                        button
                            .dataset
                            .deleteSkill
                            .split("/");


                    deleteSkill(
                        heroId,
                        Number(index)
                    );

                }
            );

        });

}


function editSkill(
    heroId,
    index
) {

    const hero =
        heroes.find(
            item => item.id === heroId
        );


    const skill =
        hero.skills[index];


    document.getElementById(
        "skillEditId"
    ).value =
        index;


    document.getElementById(
        "skillHeroId"
    ).value =
        heroId;


    document.getElementById(
        "skillName"
    ).value =
        skill.name || "";


    document.getElementById(
        "skillDescription"
    ).value =
        skill.description || "";


    document.getElementById(
        "skillSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "skillCancel"
    ).style.display =
        "inline-block";

}


async function deleteSkill(
    heroId,
    index
) {

    if (
        !confirm(
            "Удалить этот навык?"
        )
    ) {
        return;
    }


    const heroRef =
        doc(
            db,
            "heroes",
            heroId
        );


    const snapshot =
        await getDoc(heroRef);


    const skills =
        snapshot.data().skills || [];


    skills.splice(
        index,
        1
    );


    await updateDoc(
        heroRef,
        {
            skills,
            updatedAt:
                serverTimestamp()
        }
    );


    showMessage(
        "Навык удалён"
    );


    await loadSkills();

}


document
    .getElementById("skillCancel")
    .addEventListener(
        "click",
        resetSkillForm
    );


function resetSkillForm() {

    skillForm.reset();

    document.getElementById(
        "skillEditId"
    ).value = "";


    document.getElementById(
        "skillSubmit"
    ).textContent =
        "Добавить навык";


    document.getElementById(
        "skillCancel"
    ).style.display =
        "none";

}


/* =========================
   СОВЕТЫ
========================= */

tipForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const heroId =
            document
                .getElementById(
                    "tipHeroId"
                )
                .value;


        const editId =
            document
                .getElementById(
                    "tipEditId"
                )
                .value;


        const text =
            document
                .getElementById(
                    "tipText"
                )
                .value
                .trim();


        const heroRef =
            doc(
                db,
                "heroes",
                heroId
            );


        const snapshot =
            await getDoc(heroRef);


        const tips =
            snapshot.data().tips || [];


        if (editId) {

            tips[
                Number(editId)
            ] = text;

        } else {

            tips.push(text);

        }


        await updateDoc(
            heroRef,
            {
                tips,
                updatedAt:
                    serverTimestamp()
            }
        );


        showMessage(
            editId
                ? "Совет обновлён"
                : "Совет добавлен"
        );


        resetTipForm();

        await loadTips();

    }
);


async function loadTips() {

    tipsList.innerHTML = "";


    heroes.forEach((hero) => {

        const tips =
            hero.tips || [];


        tips.forEach(
            (tip, index) => {

                const element =
                    document.createElement(
                        "div"
                    );


                element.className =
                    "admin-item";


                element.innerHTML = `

                    <div>

                        <strong>
                            Совет
                        </strong>

                        <span>
                            Герой: ${hero.name}
                        </span>

                        <p>
                            ${tip}
                        </p>

                    </div>

                    <div>

                        <button
                            class="btn"
                            data-edit-tip="${hero.id}/${index}"
                        >
                            Изменить
                        </button>

                        <button
                            class="btn btn-danger"
                            data-delete-tip="${hero.id}/${index}"
                        >
                            Удалить
                        </button>

                    </div>

                `;


                tipsList.appendChild(
                    element
                );

            }
        );

    });


    if (!tipsList.children.length) {

        tipsList.innerHTML =
            "<p>Советов пока нет.</p>";

    }


    document
        .querySelectorAll(
            "[data-edit-tip]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        index
                    ] =
                        button
                            .dataset
                            .editTip
                            .split("/");


                    editTip(
                        heroId,
                        Number(index)
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-tip]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    const [
                        heroId,
                        index
                    ] =
                        button
                            .dataset
                            .deleteTip
                            .split("/");


                    deleteTip(
                        heroId,
                        Number(index)
                    );

                }
            );

        });

}


function editTip(
    heroId,
    index
) {

    const hero =
        heroes.find(
            item => item.id === heroId
        );


    document.getElementById(
        "tipEditId"
    ).value =
        index;


    document.getElementById(
        "tipHeroId"
    ).value =
        heroId;


    document.getElementById(
        "tipText"
    ).value =
        hero.tips[index];


    document.getElementById(
        "tipSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "tipCancel"
    ).style.display =
        "inline-block";

}


async function deleteTip(
    heroId,
    index
) {

    if (
        !confirm(
            "Удалить этот совет?"
        )
    ) {
        return;
    }


    const heroRef =
        doc(
            db,
            "heroes",
            heroId
        );


    const snapshot =
        await getDoc(heroRef);


    const tips =
        snapshot.data().tips || [];


    tips.splice(
        index,
        1
    );


    await updateDoc(
        heroRef,
        {
            tips,
            updatedAt:
                serverTimestamp()
        }
    );


    showMessage(
        "Совет удалён"
    );


    await loadTips();

}


document
    .getElementById("tipCancel")
    .addEventListener(
        "click",
        resetTipForm
    );


function resetTipForm() {

    tipForm.reset();

    document.getElementById(
        "tipEditId"
    ).value = "";


    document.getElementById(
        "tipSubmit"
    ).textContent =
        "Добавить совет";


    document.getElementById(
        "tipCancel"
    ).style.display =
        "none";

}


/* =========================
   КОНТРПИКИ
========================= */

counterForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const editId =
            document
                .getElementById(
                    "counterEditId"
                )
                .value;


        const data = {

            heroId:
                document
                    .getElementById(
                        "counterHeroId"
                    )
                    .value,

            counterId:
                document
                    .getElementById(
                        "counterEnemyId"
                    )
                    .value,

            strength:
                Number(
                    document
                        .getElementById(
                            "counterStrength"
                        )
                        .value
                ),

            reason:
                document
                    .getElementById(
                        "counterReason"
                    )
                    .value
                    .trim()

        };


        if (
            data.strength < 1 ||
            data.strength > 5
        ) {

            showMessage(
                "Сила контрпика должна быть от 1 до 5",
                true
            );

            return;
        }


        try {

            if (editId) {

                await updateDoc(
                    doc(
                        db,
                        "counters",
                        editId
                    ),
                    data
                );

                showMessage(
                    "Контрпик обновлён"
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

                showMessage(
                    "Контрпик добавлен"
                );

            }


            resetCounterForm();

            await loadCounters();

        } catch (error) {

            showMessage(
                "Ошибка: " +
                error.message,
                true
            );

        }

    }
);


async function loadCounters() {

    countersList.innerHTML = "";


    const snapshot =
        await getDocs(
            collection(
                db,
                "counters"
            )
        );


    if (snapshot.empty) {

        countersList.innerHTML =
            "<p>Контрпиков пока нет.</p>";

        return;
    }


    snapshot.forEach((counterDoc) => {

        const counter =
            counterDoc.data();


        const hero =
            heroes.find(
                item =>
                    item.id ===
                    counter.heroId
            );


        const enemy =
            heroes.find(
                item =>
                    item.id ===
                    counter.counterId
            );


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "admin-item";


        element.innerHTML = `

            <div>

                <strong>
                    ${hero?.name || "Неизвестный герой"}
                    →
                    ${enemy?.name || "Неизвестный контрпик"}
                </strong>

                <span>
                    Сила:
                    ${counter.strength || 0}/5
                </span>

                <p>
                    ${counter.reason || ""}
                </p>

            </div>

            <div>

                <button
                    class="btn"
                    data-edit-counter="${counterDoc.id}"
                >
                    Изменить
                </button>

                <button
                    class="btn btn-danger"
                    data-delete-counter="${counterDoc.id}"
                >
                    Удалить
                </button>

            </div>

        `;


        countersList.appendChild(
            element
        );

    });


    document
        .querySelectorAll(
            "[data-edit-counter]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editCounter(
                    button.dataset.editCounter
                )
            );

        });


    document
        .querySelectorAll(
            "[data-delete-counter]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteCounter(
                    button.dataset.deleteCounter
                )
            );

        });

}


async function editCounter(id) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "counters",
                id
            )
        );


    const counter =
        snapshot.data();


    document.getElementById(
        "counterEditId"
    ).value = id;


    document.getElementById(
        "counterHeroId"
    ).value =
        counter.heroId;


    document.getElementById(
        "counterEnemyId"
    ).value =
        counter.counterId;


    document.getElementById(
        "counterStrength"
    ).value =
        counter.strength;


    document.getElementById(
        "counterReason"
    ).value =
        counter.reason || "";


    document.getElementById(
        "counterSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "counterCancel"
    ).style.display =
        "inline-block";

}


async function deleteCounter(id) {

    if (
        !confirm(
            "Удалить этот контрпик?"
        )
    ) {
        return;
    }


    await deleteDoc(
        doc(
            db,
            "counters",
            id
        )
    );


    showMessage(
        "Контрпик удалён"
    );


    await loadCounters();

}


document
    .getElementById("counterCancel")
    .addEventListener(
        "click",
        resetCounterForm
    );


function resetCounterForm() {

    counterForm.reset();

    document.getElementById(
        "counterEditId"
    ).value = "";


    document.getElementById(
        "counterSubmit"
    ).textContent =
        "Добавить контрпик";


    document.getElementById(
        "counterCancel"
    ).style.display =
        "none";

}


/* =========================
   КОММЕНТАРИИ
========================= */

async function loadComments() {

    commentsList.innerHTML = "";


    const snapshot =
        await getDocs(
            collection(
                db,
                "comments"
            )
        );


    if (snapshot.empty) {

        commentsList.innerHTML =
            "<p>Комментариев пока нет.</p>";

        return;
    }


    snapshot.forEach((commentDoc) => {

        const comment =
            commentDoc.data();


        const element =
            document.createElement(
                "div"
            );


        element.className =
            "admin-item";


        element.innerHTML = `

            <div>

                <strong>
                    ${comment.userName || "Пользователь"}
                </strong>

                <span>
                    Герой ID:
                    ${comment.heroId || ""}
                </span>

                <p>
                    ${comment.text || ""}
                </p>

            </div>

            <div>

                <button
                    class="btn"
                    data-edit-comment="${commentDoc.id}"
                >
                    Изменить
                </button>

                <button
                    class="btn btn-danger"
                    data-delete-comment="${commentDoc.id}"
                >
                    Удалить
                </button>

            </div>

        `;


        commentsList.appendChild(
            element
        );

    });


    document
        .querySelectorAll(
            "[data-edit-comment]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => editComment(
                    button.dataset.editComment
                )
            );

        });


    document
        .querySelectorAll(
            "[data-delete-comment]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => deleteComment(
                    button.dataset.deleteComment
                )
            );

        });

}


async function editComment(id) {

    const snapshot =
        await getDoc(
            doc(
                db,
                "comments",
                id
            )
        );


    if (!snapshot.exists()) {
        return;
    }


    const comment =
        snapshot.data();


    const newText =
        prompt(
            "Изменить комментарий:",
            comment.text || ""
        );


    if (
        newText === null ||
        !newText.trim()
    ) {
        return;
    }


    await updateDoc(
        doc(
            db,
            "comments",
            id
        ),
        {
            text:
                newText.trim(),

            updatedAt:
                serverTimestamp()
        }
    );


    showMessage(
        "Комментарий обновлён"
    );


    await loadComments();

}


async function deleteComment(id) {

    if (
        !confirm(
            "Удалить этот комментарий?"
        )
    ) {
        return;
    }


    await deleteDoc(
        doc(
            db,
            "comments",
            id
        )
    );


    showMessage(
        "Комментарий удалён"
    );


    await loadComments();

}


/* =========================
   СООБЩЕНИЕ
========================= */

function showMessage(
    text,
    error = false
) {

    adminMessage.textContent =
        text;


    adminMessage.className =
        error
            ? "auth-message error"
            : "auth-message success";

}