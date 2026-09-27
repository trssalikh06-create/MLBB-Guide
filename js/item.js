import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const params =
    new URLSearchParams(
        window.location.search
    );

const itemId =
    params.get("id");

const container =
    document.getElementById(
        "itemContainer"
    );


async function loadHeroNames(ids) {

    if (!Array.isArray(ids)) {
        return [];
    }

    const result = [];

    for (const id of ids) {

        const heroSnapshot =
            await getDoc(
                doc(
                    db,
                    "heroes",
                    id
                )
            );

        if (heroSnapshot.exists()) {

            const hero =
                heroSnapshot.data();

            result.push({
                id,
                name: hero.name,
                image: hero.image
            });
        }
    }

    return result;
}


async function loadItem() {

    if (!itemId) {

        container.innerHTML =
            "<p>Предмет не найден.</p>";

        return;
    }


    const itemSnapshot =
        await getDoc(
            doc(
                db,
                "items",
                itemId
            )
        );


    if (!itemSnapshot.exists()) {

        container.innerHTML =
            "<p>Предмет не найден.</p>";

        return;
    }


    const item =
        itemSnapshot.data();


    const recommendedHeroes =
        await loadHeroNames(
            item.recommendedHeroes || []
        );


    const counterHeroes =
        await loadHeroNames(
            item.counterHeroes || []
        );


    let statsHTML = "";

    if (
        Array.isArray(item.stats) &&
        item.stats.length
    ) {

        statsHTML = `
            <section class="item-section">

                <h2>
                    Характеристики
                </h2>

                <div class="item-stats">

                    ${item.stats.map(stat => `

                        <div class="item-stat">

                            <span>
                                ${stat.name || ""}
                            </span>

                            <strong>
                                ${stat.value || ""}
                            </strong>

                        </div>

                    `).join("")}

                </div>

            </section>
        `;
    }


    let passiveHTML = "";

    if (
        item.passiveName ||
        item.passiveDescription
    ) {

        passiveHTML = `
            <section class="item-section">

                <h2>
                    Пассивная способность
                </h2>

                <div class="item-ability passive">

                    <h3>
                        ${item.passiveName || "Пассивный эффект"}
                    </h3>

                    <p>
                        ${item.passiveDescription || ""}
                    </p>

                </div>

            </section>
        `;
    }


    let activeHTML = "";

    if (
        item.activeName ||
        item.activeDescription
    ) {

        activeHTML = `
            <section class="item-section">

                <h2>
                    Активная способность
                </h2>

                <div class="item-ability active">

                    <h3>
                        ${item.activeName || "Активная способность"}
                    </h3>

                    <p>
                        ${item.activeDescription || ""}
                    </p>

                </div>

            </section>
        `;
    }


    let recommendedHTML = "";

    if (recommendedHeroes.length) {

        recommendedHTML = `
            <section class="item-section">

                <h2>
                    Рекомендуется для
                </h2>

                <div class="item-heroes">

                    ${recommendedHeroes.map(hero => `

                        <a
                            class="item-hero-card"
                            href="hero.html?id=${hero.id}"
                        >

                            <img
                                src="${hero.image || ""}"
                                alt="${hero.name || ""}"
                            >

                            <span>
                                ${hero.name || ""}
                            </span>

                        </a>

                    `).join("")}

                </div>

            </section>
        `;
    }


    let counterHTML = "";

    if (counterHeroes.length) {

        counterHTML = `
            <section class="item-section">

                <h2>
                    Собирается против
                </h2>

                <div class="item-heroes">

                    ${counterHeroes.map(hero => `

                        <a
                            class="item-hero-card"
                            href="hero.html?id=${hero.id}"
                        >

                            <img
                                src="${hero.image || ""}"
                                alt="${hero.name || ""}"
                            >

                            <span>
                                ${hero.name || ""}
                            </span>

                        </a>

                    `).join("")}

                </div>

            </section>
        `;
    }


    container.innerHTML = `

        <article class="item-detail">

            <div class="item-header">

                <div class="item-image-box">

                    <img
                        src="${item.image || ""}"
                        alt="${item.name || ""}"
                        class="item-main-image"
                    >

                </div>


                <div class="item-main-info">

                    <h1>
                        ${item.name || ""}
                    </h1>


                    <div class="item-tags">

                        <span class="tag">
                            ${item.category || "Предмет"}
                        </span>

                        <span class="item-price">
                            ${item.price || 0} золота
                        </span>

                    </div>


                    <p class="item-description">
                        ${item.description || ""}
                    </p>

                </div>

            </div>


            ${statsHTML}

            ${passiveHTML}

            ${activeHTML}

            ${recommendedHTML}

            ${counterHTML}

        </article>

    `;
}


loadItem();