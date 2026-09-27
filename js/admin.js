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


const heroForm =
    document.getElementById("heroForm");

const itemForm =
    document.getElementById("itemForm");


const heroesList =
    document.getElementById("heroesList");

const itemsList =
    document.getElementById("itemsList");


const adminMessage =
    document.getElementById("adminMessage");


let heroes = [];

let isAdmin = false;



function showMessage(
    text,
    error = false
) {

    if (!adminMessage) {
        return;
    }

    adminMessage.textContent =
        text;

    adminMessage.className =
        error
            ? "auth-message error"
            : "auth-message success";
}



function getSelectedValues(select) {

    if (!select) {
        return [];
    }

    return Array.from(
        select.selectedOptions
    )
        .map(option => option.value)
        .filter(Boolean);
}



function fillHeroMultiSelect(
    selectId,
    selected = []
) {

    const select =
        document.getElementById(
            selectId
        );

    if (!select) {
        return;
    }

    select.innerHTML = "";


    heroes.forEach(hero => {

        const option =
            document.createElement(
                "option"
            );

        option.value =
            hero.id;

        option.textContent =
            hero.name;

        if (
            selected.includes(
                hero.id
            )
        ) {

            option.selected =
                true;

        }

        select.appendChild(
            option
        );

    });

}



function fillItemHeroSelects() {

    fillHeroMultiSelect(
        "itemRecommendedHeroes"
    );

    fillHeroMultiSelect(
        "itemCounterHeroes"
    );

}



onAuthStateChanged(
    auth,
    async user => {

        if (!user) {

            window.location.href =
                "auth.html";

            return;
        }


        try {

            const userRef =
                doc(
                    db,
                    "users",
                    user.uid
                );


            const userSnapshot =
                await getDoc(
                    userRef
                );


            if (
                !userSnapshot.exists()
            ) {

                showMessage(
                    "Профиль пользователя не найден.",
                    true
                );

                return;
            }


            const userData =
                userSnapshot.data();


            if (
                userData.role !== "admin"
            ) {

                alert(
                    "Доступ запрещён."
                );

                window.location.href =
                    "index.html";

                return;
            }


            isAdmin = true;


            await loadHeroes();


            fillItemHeroSelects();


            await loadItems();


        } catch (error) {

            console.error(
                error
            );

            showMessage(
                "Ошибка проверки администратора: " +
                error.message,
                true
            );

        }

    }
);



/* =========================================
   ГЕРОИ
========================================= */


if (heroForm) {

    heroForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isAdmin) {
                return;
            }


            const editId =
                document
                    .getElementById(
                        "heroEditId"
                    )
                    ?.value;


            const difficulty =
                Number(
                    document
                        .getElementById(
                            "heroDifficulty"
                        )
                        ?.value
                );


            if (
                difficulty < 1 ||
                difficulty > 5 ||
                !Number.isInteger(
                    difficulty
                )
            ) {

                showMessage(
                    "Сложность должна быть от 1 до 5.",
                    true
                );

                return;
            }


            const data = {

                name:
                    document
                        .getElementById(
                            "heroName"
                        )
                        .value
                        .trim(),

                image:
                    document
                        .getElementById(
                            "heroImage"
                        )
                        .value
                        .trim(),

                role:
                    document
                        .getElementById(
                            "heroRole"
                        )
                        .value,

                lane:
                    document
                        .getElementById(
                            "heroLane"
                        )
                        .value,

                difficulty,

                specialty:
                    document
                        .getElementById(
                            "heroSpecialty"
                        )
                        .value
                        .trim(),

                releaseDate:
                    document
                        .getElementById(
                            "heroRelease"
                        )
                        .value
                        .trim(),

                description:
                    document
                        .getElementById(
                            "heroDescription"
                        )
                        .value
                        .trim(),

                lore:
                    document
                        .getElementById(
                            "heroLore"
                        )
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
                        "Герой обновлён."
                    );


                } else {

                    await addDoc(
                        collection(
                            db,
                            "heroes"
                        ),
                        {

                            ...data,

                            skills: [],

                            tips: [],

                            createdAt:
                                serverTimestamp()

                        }
                    );


                    showMessage(
                        "Герой добавлен."
                    );

                }


                resetHeroForm();


                await loadHeroes();


                fillItemHeroSelects();


            } catch (error) {

                console.error(
                    error
                );

                showMessage(
                    "Ошибка: " +
                    error.message,
                    true
                );

            }

        }
    );

}



async function loadHeroes() {

    if (!heroesList) {
        return;
    }


    const snapshot =
        await getDocs(
            collection(
                db,
                "heroes"
            )
        );


    heroes =
        snapshot.docs.map(
            heroDoc => ({

                id:
                    heroDoc.id,

                ...heroDoc.data()

            })
        );


    heroesList.innerHTML = "";


    if (!heroes.length) {

        heroesList.innerHTML =
            "<p>Героев пока нет.</p>";

        return;
    }


    heroes.forEach(hero => {

        const element =
            document.createElement(
                "div"
            );


        element.className =
            "admin-item";


        const stars =
            "★".repeat(
                Math.max(
                    1,
                    Math.min(
                        5,
                        Number(
                            hero.difficulty
                        ) || 1
                    )
                )
            );


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
                    </span>

                    <span class="admin-stars">
                        ${stars}
                    </span>

                </div>

            </div>


            <div class="admin-actions">

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
                () => {

                    editHero(
                        button.dataset.editHero
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-hero]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteHero(
                        button.dataset.deleteHero
                    );

                }
            );

        });

}



async function editHero(id) {

    const hero =
        heroes.find(
            item =>
                item.id === id
        );


    if (!hero) {
        return;
    }


    document.getElementById(
        "heroEditId"
    ).value = id;


    document.getElementById(
        "heroName"
    ).value =
        hero.name || "";


    document.getElementById(
        "heroImage"
    ).value =
        hero.image || "";


    document.getElementById(
        "heroRole"
    ).value =
        hero.role || "";


    document.getElementById(
        "heroLane"
    ).value =
        hero.lane || "";


    document.getElementById(
        "heroDifficulty"
    ).value =
        Math.max(
            1,
            Math.min(
                5,
                Number(
                    hero.difficulty
                ) || 1
            )
        );


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
        "inline-flex";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



function resetHeroForm() {

    if (!heroForm) {
        return;
    }


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



document
    .getElementById(
        "heroCancel"
    )
    ?.addEventListener(
        "click",
        resetHeroForm
    );



async function deleteHero(id) {

    if (
        !confirm(
            "Удалить героя? Сборки этого героя также будут удалены."
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
            "Герой удалён."
        );


        await loadHeroes();


        fillItemHeroSelects();


    } catch (error) {

        console.error(
            error
        );


        showMessage(
            "Ошибка удаления: " +
            error.message,
            true
        );

    }

}



/* =========================================
   ПРЕДМЕТЫ
========================================= */


if (itemForm) {

    itemForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isAdmin) {
                return;
            }


            const editId =
                document
                    .getElementById(
                        "itemEditId"
                    )
                    ?.value;


            const statsText =
                document
                    .getElementById(
                        "itemStats"
                    )
                    ?.value
                    .trim() || "";


            const stats =
                statsText
                    .split("\n")
                    .map(
                        value =>
                            value.trim()
                    )
                    .filter(Boolean);


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
                    ) || 0,

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
                        .trim(),

                stats,

                passiveName:
                    document
                        .getElementById(
                            "itemPassiveName"
                        )
                        .value
                        .trim(),

                passiveDescription:
                    document
                        .getElementById(
                            "itemPassiveDescription"
                        )
                        .value
                        .trim(),

                activeName:
                    document
                        .getElementById(
                            "itemActiveName"
                        )
                        .value
                        .trim(),

                activeDescription:
                    document
                        .getElementById(
                            "itemActiveDescription"
                        )
                        .value
                        .trim(),

                recommendedHeroes:
                    getSelectedValues(
                        document.getElementById(
                            "itemRecommendedHeroes"
                        )
                    ),

                counterHeroes:
                    getSelectedValues(
                        document.getElementById(
                            "itemCounterHeroes"
                        )
                    ),

                updatedAt:
                    serverTimestamp()

            };


            if (!data.name) {

                showMessage(
                    "Введите название предмета.",
                    true
                );

                return;
            }


            if (!data.category) {

                showMessage(
                    "Выберите категорию предмета.",
                    true
                );

                return;
            }


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
                        "Предмет обновлён."
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
                        "Предмет добавлен."
                    );

                }


                resetItemForm();


                await loadItems();


            } catch (error) {

                console.error(
                    error
                );


                showMessage(
                    "Ошибка: " +
                    error.message,
                    true
                );

            }

        }
    );

}



async function loadItems() {

    if (!itemsList) {
        return;
    }


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


    snapshot.forEach(
        itemDoc => {

            const item =
                itemDoc.data();


            const element =
                document.createElement(
                    "div"
                );


            element.className =
                "admin-item";


            const recommendedCount =
                Array.isArray(
                    item.recommendedHeroes
                )
                    ? item
                        .recommendedHeroes
                        .length
                    : 0;


            const counterCount =
                Array.isArray(
                    item.counterHeroes
                )
                    ? item
                        .counterHeroes
                        .length
                    : 0;


            const statsCount =
                Array.isArray(
                    item.stats
                )
                    ? item.stats.length
                    : 0;


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
                            ${getCategoryName(
                                item.category
                            )}
                            ·
                            ${item.price || 0}
                            золота
                        </span>

                        <span>
                            Характеристик:
                            ${statsCount}
                        </span>

                        <span>
                            Рекомендуется:
                            ${recommendedCount}
                            ·
                            Против:
                            ${counterCount}
                        </span>

                    </div>

                </div>


                <div class="admin-actions">

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

        }
    );


    document
        .querySelectorAll(
            "[data-edit-item]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    editItem(
                        button.dataset.editItem
                    );

                }
            );

        });


    document
        .querySelectorAll(
            "[data-delete-item]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    deleteItem(
                        button.dataset.deleteItem
                    );

                }
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
        "itemStats"
    ).value =
        Array.isArray(
            item.stats
        )
            ? item.stats.join("\n")
            : "";


    document.getElementById(
        "itemPassiveName"
    ).value =
        item.passiveName || "";


    document.getElementById(
        "itemPassiveDescription"
    ).value =
        item.passiveDescription || "";


    document.getElementById(
        "itemActiveName"
    ).value =
        item.activeName || "";


    document.getElementById(
        "itemActiveDescription"
    ).value =
        item.activeDescription || "";


    fillHeroMultiSelect(
        "itemRecommendedHeroes",
        item.recommendedHeroes || []
    );


    fillHeroMultiSelect(
        "itemCounterHeroes",
        item.counterHeroes || []
    );


    document.getElementById(
        "itemSubmit"
    ).textContent =
        "Сохранить изменения";


    document.getElementById(
        "itemCancel"
    ).style.display =
        "inline-flex";


    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}



function resetItemForm() {

    if (!itemForm) {
        return;
    }


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


    fillItemHeroSelects();

}



document
    .getElementById(
        "itemCancel"
    )
    ?.addEventListener(
        "click",
        resetItemForm
    );



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
            "Предмет удалён."
        );


        await loadItems();


    } catch (error) {

        console.error(
            error
        );


        showMessage(
            "Ошибка удаления: " +
            error.message,
            true
        );

    }

}



function getCategoryName(
    category
) {

    const names = {

        Attack:
            "Атака",

        Magic:
            "Магия",

        Defense:
            "Защита",

        Movement:
            "Передвижение"

    };


    return (
        names[category] ||
        category ||
        "Без категории"
    );

}