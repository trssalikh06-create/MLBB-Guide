import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const itemsContainer =
    document.getElementById("itemsContainer");

const searchInput =
    document.getElementById("itemSearch");

const itemModal =
    document.getElementById("itemModal");

const itemModalBody =
    document.getElementById("itemModalBody");

const closeItemModal =
    document.getElementById("closeItemModal");

let items = [];

let heroesMap = {};



const categories = [
    {
        id: "Attack",
        title: "Атака"
    },
    {
        id: "Magic",
        title: "Магия"
    },
    {
        id: "Defense",
        title: "Защита"
    },
    {
        id: "Movement",
        title: "Передвижение"
    }
];



async function loadHeroes() {

    const snapshot =
        await getDocs(
            collection(db, "heroes")
        );

    heroesMap = {};

    snapshot.forEach(heroDoc => {

        heroesMap[heroDoc.id] = {
            id: heroDoc.id,
            ...heroDoc.data()
        };

    });
}



async function loadItems() {

    try {

        const snapshot =
            await getDocs(
                collection(db, "items")
            );

        items = snapshot.docs.map(itemDoc => ({
            id: itemDoc.id,
            ...itemDoc.data()
        }));

        renderItems();

    } catch (error) {

        console.error(
            "Ошибка загрузки предметов:",
            error
        );

        itemsContainer.innerHTML = `
            <div class="profile-box">
                <p>
                    Не удалось загрузить предметы.
                </p>
            </div>
        `;
    }
}



function renderItems() {

    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    itemsContainer.innerHTML = "";


    categories.forEach(category => {

        let categoryItems =
            items.filter(item => {

                const itemCategory =
                    item.category || "";

                const name =
                    (item.name || "").toLowerCase();

                const description =
                    (item.description || "").toLowerCase();


                const matchesCategory =
                    itemCategory === category.id;


                const matchesSearch =
                    !search ||
                    name.includes(search) ||
                    description.includes(search);


                return (
                    matchesCategory &&
                    matchesSearch
                );

            });


        if (!categoryItems.length) {
            return;
        }


        const section =
            document.createElement("section");

        section.className =
            "items-category-section";


        section.innerHTML = `
            <div class="items-category-header">

                <h2>
                    ${category.title}
                </h2>

                <span>
                    ${categoryItems.length}
                </span>

            </div>

            <div class="items-grid"></div>
        `;


        const grid =
            section.querySelector(".items-grid");


        categoryItems.forEach(item => {

            const card =
                createItemCard(item);

            grid.appendChild(card);

        });


        itemsContainer.appendChild(section);

    });


    if (!itemsContainer.children.length) {

        itemsContainer.innerHTML = `
            <div class="profile-box">
                <p>
                    Предметы не найдены.
                </p>
            </div>
        `;
    }

}



function createItemCard(item) {

    const card =
        document.createElement("article");

    card.className =
        "item-card";


    const stats =
        Array.isArray(item.stats)
            ? item.stats
            : [];


    const statsHTML =
        stats
            .slice(0, 3)
            .map(stat => `
                <span class="item-stat-mini">
                    ${escapeHTML(stat)}
                </span>
            `)
            .join("");


    card.innerHTML = `

        <div class="item-card-image">

            <img
                src="${escapeAttribute(item.image || "")}"
                alt="${escapeAttribute(item.name || "Предмет")}"
            >

        </div>


        <div class="item-card-content">

            <h3>
                ${escapeHTML(item.name || "Без названия")}
            </h3>


            <div class="item-card-price">

                ${Number(item.price) || 0}

                <span>
                    золота
                </span>

            </div>


            <div class="item-card-stats">

                ${statsHTML}

            </div>


            <button
                class="btn item-open-button"
            >
                Подробнее
            </button>

        </div>

    `;


    card
        .querySelector(".item-open-button")
        .addEventListener(
            "click",
            () => openItemModal(item)
        );


    card.addEventListener(
        "click",
        event => {

            if (
                event.target.closest("button")
            ) {
                return;
            }

            openItemModal(item);

        }
    );


    return card;

}



async function openItemModal(item) {

    const recommendedHeroes =
        Array.isArray(
            item.recommendedHeroes
        )
            ? item.recommendedHeroes
            : [];


    const counterHeroes =
        Array.isArray(
            item.counterHeroes
        )
            ? item.counterHeroes
            : [];


    const stats =
        Array.isArray(item.stats)
            ? item.stats
            : [];


    const statsHTML =
        stats.length

            ? `
                <div class="item-modal-section">

                    <h3>
                        Характеристики
                    </h3>

                    <div class="item-stats-list">

                        ${stats.map(stat => `
                            <div class="item-stat">
                                ${escapeHTML(stat)}
                            </div>
                        `).join("")}

                    </div>

                </div>
            `

            : "";


    const passiveHTML =
        item.passiveName ||
        item.passiveDescription

            ? `
                <div class="item-ability passive-ability">

                    <div class="ability-label">
                        ПАССИВНАЯ СПОСОБНОСТЬ
                    </div>

                    <h3>
                        ${escapeHTML(
                            item.passiveName || "Пассивка"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.passiveDescription || ""
                        )}
                    </p>

                </div>
            `

            : "";


    const activeHTML =
        item.activeName ||
        item.activeDescription

            ? `
                <div class="item-ability active-ability">

                    <div class="ability-label">
                        АКТИВНАЯ СПОСОБНОСТЬ
                    </div>

                    <h3>
                        ${escapeHTML(
                            item.activeName || "Активная способность"
                        )}
                    </h3>

                    <p>
                        ${escapeHTML(
                            item.activeDescription || ""
                        )}
                    </p>

                </div>
            `

            : "";


    const recommendedHTML =
        createHeroesList(
            recommendedHeroes,
            "Рекомендуется для"
        );


    const countersHTML =
        createHeroesList(
            counterHeroes,
            "Полезен против"
        );


    itemModalBody.innerHTML = `

        <div class="item-modal-top">

            <div class="item-modal-image">

                <img
                    src="${escapeAttribute(item.image || "")}"
                    alt="${escapeAttribute(item.name || "")}"
                >

            </div>


            <div class="item-modal-title">

                <div class="item-modal-category">

                    ${getCategoryName(item.category)}

                </div>

                <h2>
                    ${escapeHTML(item.name || "Предмет")}
                </h2>

                <div class="item-modal-price">

                    ${Number(item.price) || 0}
                    золота

                </div>

                ${
                    item.description
                        ? `
                            <p>
                                ${escapeHTML(item.description)}
                            </p>
                        `
                        : ""
                }

            </div>

        </div>


        ${statsHTML}


        ${passiveHTML}


        ${activeHTML}


        ${
            recommendedHTML
                ? `
                    <div class="item-modal-section">
                        ${recommendedHTML}
                    </div>
                `
                : ""
        }


        ${
            countersHTML
                ? `
                    <div class="item-modal-section">
                        ${countersHTML}
                    </div>
                `
                : ""
        }

    `;


    itemModal.classList.remove("hidden");

    document.body.classList.add(
        "modal-open"
    );

}



function createHeroesList(
    heroIds,
    title
) {

    if (!heroIds.length) {
        return "";
    }


    const validHeroes =
        heroIds
            .map(id => heroesMap[id])
            .filter(Boolean);


    if (!validHeroes.length) {
        return "";
    }


    return `

        <h3>
            ${title}
        </h3>

        <div class="item-heroes-list">

            ${validHeroes.map(hero => `

                <a
                    class="item-hero"
                    href="hero.html?id=${hero.id}"
                >

                    <img
                        src="${escapeAttribute(hero.image || "")}"
                        alt="${escapeAttribute(hero.name || "")}"
                    >

                    <span>
                        ${escapeHTML(hero.name || "")}
                    </span>

                </a>

            `).join("")}

        </div>

    `;

}



function getCategoryName(category) {

    const found =
        categories.find(
            item => item.id === category
        );


    return found
        ? found.title
        : category || "Предмет";

}



function closeModal() {

    itemModal.classList.add(
        "hidden"
    );

    document.body.classList.remove(
        "modal-open"
    );

}



closeItemModal.addEventListener(
    "click",
    closeModal
);


document
    .querySelector(".item-modal-overlay")
    ?.addEventListener(
        "click",
        closeModal
    );


document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape"
        ) {
            closeModal();
        }

    }
);


searchInput.addEventListener(
    "input",
    renderItems
);



function escapeHTML(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}



function escapeAttribute(value) {

    return escapeHTML(value);

}



async function init() {

    await loadHeroes();

    await loadItems();

}



init();