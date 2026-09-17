import { db } from "./firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const container = document.getElementById("heroesContainer");
const searchInput = document.getElementById("searchInput");
const roleFilter = document.getElementById("roleFilter");
const sortSelect = document.getElementById("sortSelect");
const loadMoreBtn = document.getElementById("loadMoreBtn");


let allHeroes = [];
let displayedCount = 12;


async function loadHeroes() {

    try {

        container.innerHTML = "<p>Загрузка героев...</p>";

        const snapshot = await getDocs(
            collection(db, "heroes")
        );

        allHeroes = [];

        snapshot.forEach((heroDoc) => {

            allHeroes.push({
                id: heroDoc.id,
                ...heroDoc.data()
            });

        });

        displayedCount = 12;

        renderHeroes();

    } catch (error) {

        console.error("Ошибка загрузки героев:", error);

        container.innerHTML = `
            <p>
                Не удалось загрузить героев.
            </p>
        `;

        loadMoreBtn.style.display = "none";
    }
}


function renderHeroes() {

    container.innerHTML = "";

    const search = searchInput.value
        .trim()
        .toLowerCase();

    const role = roleFilter.value;
    const sort = sortSelect.value;


    let filteredHeroes = allHeroes.filter((hero) => {

        const heroName = String(
            hero.name || ""
        ).toLowerCase();

        const heroDescription = String(
            hero.description || ""
        ).toLowerCase();


        const matchesSearch =
            !search ||
            heroName.includes(search) ||
            heroDescription.includes(search);


        const matchesRole =
            !role ||
            hero.role === role;


        return matchesSearch && matchesRole;

    });


    if (sort === "difficulty") {

        filteredHeroes.sort((a, b) => {

            const difficultyA =
                Number(a.difficulty) || 0;

            const difficultyB =
                Number(b.difficulty) || 0;

            return difficultyA - difficultyB;

        });

    } else {

        filteredHeroes.sort((a, b) => {

            const nameA =
                String(a.name || "").toLowerCase();

            const nameB =
                String(b.name || "").toLowerCase();

            return nameA.localeCompare(
                nameB,
                "ru"
            );

        });

    }


    const visibleHeroes =
        filteredHeroes.slice(
            0,
            displayedCount
        );


    if (visibleHeroes.length === 0) {

        container.innerHTML = `
            <p>
                Герои не найдены.
            </p>
        `;

        loadMoreBtn.style.display = "none";

        return;
    }


    visibleHeroes.forEach((hero) => {

        const card =
            document.createElement("div");

        card.className = "card";


        const difficulty =
            Number(hero.difficulty) || 0;


        card.innerHTML = `

            <img
                class="card-image"
                src="${hero.image || ""}"
                alt="${hero.name || "Герой"}"
            >

            <div class="card-content">

                <h3>
                    ${hero.name || "Без названия"}
                </h3>

                <p>
                    ${hero.description || ""}
                </p>

                <span class="tag">
                    ${hero.role || "Не указано"}
                </span>

                <span class="tag">
                    ${hero.lane || "Не указано"}
                </span>

                <span class="tag">
                    Сложность: ${difficulty}/10
                </span>

                <br>
                <br>

                <a
                    class="btn"
                    href="hero.html?id=${hero.id}"
                >
                    Подробнее
                </a>

            </div>
        `;


        container.appendChild(card);

    });


    if (
        visibleHeroes.length <
        filteredHeroes.length
    ) {

        loadMoreBtn.style.display = "block";

    } else {

        loadMoreBtn.style.display = "none";

    }
}


searchInput.addEventListener(
    "input",
    () => {

        displayedCount = 12;

        renderHeroes();

    }
);


roleFilter.addEventListener(
    "change",
    () => {

        displayedCount = 12;

        renderHeroes();

    }
);


sortSelect.addEventListener(
    "change",
    () => {

        displayedCount = 12;

        renderHeroes();

    }
);


loadMoreBtn.addEventListener(
    "click",
    () => {

        displayedCount += 12;

        renderHeroes();

    }
);


loadHeroes();