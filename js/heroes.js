import {
    db
} from "./firebase.js";


import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const container =
    document.getElementById(
        "heroesContainer"
    );


const searchInput =
    document.getElementById(
        "searchInput"
    );


const roleFilter =
    document.getElementById(
        "roleFilter"
    );


const sortSelect =
    document.getElementById(
        "sortSelect"
    );


const loadMoreBtn =
    document.getElementById(
        "loadMoreBtn"
    );


let allHeroes = [];


function renderDifficulty(value) {

    const difficulty =
        Math.min(
            5,
            Math.max(
                1,
                Number(value) || 1
            )
        );

    return (
        "★".repeat(difficulty) +
        "☆".repeat(5 - difficulty)
    );
}


async function loadHeroes() {

    try {

        const snapshot =
            await getDocs(
                collection(
                    db,
                    "heroes"
                )
            );


        allHeroes = snapshot.docs.map(
            heroDoc => ({

                id: heroDoc.id,

                ...heroDoc.data()

            })
        );


        renderHeroes();


        if (loadMoreBtn) {

            loadMoreBtn.style.display =
                "none";

        }


    } catch (error) {

        console.error(error);


        container.innerHTML = `

            <p>
                Ошибка загрузки героев:
                ${error.message}
            </p>

        `;
    }
}


function renderHeroes() {

    let heroes =
        [...allHeroes];


    const search =
        searchInput.value
            .trim()
            .toLowerCase();


    const role =
        roleFilter.value;


    if (search) {

        heroes =
            heroes.filter(
                hero =>
                    (
                        hero.name || ""
                    )
                        .toLowerCase()
                        .includes(search)
            );

    }


    if (role) {

        heroes =
            heroes.filter(
                hero =>
                    hero.role === role
            );

    }


    if (
        sortSelect.value ===
        "difficulty"
    ) {

        heroes.sort(
            (a, b) =>
                Number(a.difficulty || 0)
                -
                Number(b.difficulty || 0)
        );

    } else {

        heroes.sort(
            (a, b) =>
                (a.name || "")
                    .localeCompare(
                        b.name || "",
                        "ru"
                    )
        );

    }


    container.innerHTML = "";


    if (!heroes.length) {

        container.innerHTML = `

            <p>
                Герои не найдены.
            </p>

        `;

        return;
    }


    heroes.forEach(
        hero => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "card";


            card.innerHTML = `

                <img
                    class="card-image"
                    src="${hero.image || ""}"
                    alt="${hero.name || ""}"
                >


                <div class="card-content">

                    <h3>
                        ${hero.name || ""}
                    </h3>


                    <p>
                        ${hero.description || ""}
                    </p>


                    <span class="tag">
                        ${hero.role || ""}
                    </span>


                    <span class="tag">
                        ${hero.lane || ""}
                    </span>


                    <div class="difficulty-card">

                        ${renderDifficulty(
                            hero.difficulty
                        )}

                    </div>


                    <br>


                    <a
                        class="btn"
                        href="hero.html?id=${hero.id}"
                    >
                        Подробнее
                    </a>

                </div>

            `;


            container.appendChild(
                card
            );

        }
    );
}


searchInput.addEventListener(
    "input",
    renderHeroes
);


roleFilter.addEventListener(
    "change",
    renderHeroes
);


sortSelect.addEventListener(
    "change",
    renderHeroes
);


loadHeroes();