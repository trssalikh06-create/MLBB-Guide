import { db } from "./firebase.js";

import {
    collection,
    getDocs,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const container = document.getElementById("itemsContainer");
const searchInput = document.getElementById("searchInput");

let items = [];

async function loadItems() {

    const q = query(
        collection(db, "items"),
        orderBy("name")
    );

    const snapshot = await getDocs(q);

    items = [];

    snapshot.forEach(itemDoc => {
        items.push({
            id: itemDoc.id,
            ...itemDoc.data()
        });
    });

    renderItems();
}

function renderItems() {

    const search = searchInput.value.toLowerCase();

    container.innerHTML = "";

    items
        .filter(item =>
            item.name.toLowerCase().includes(search)
        )
        .forEach(item => {

            container.innerHTML += `
                <div class="card">

                    <img
                        class="card-image"
                        src="${item.image}"
                        alt="${item.name}"
                    >

                    <div class="card-content">

                        <h3>${item.name}</h3>

                        <p>
                            ${item.description || ""}
                        </p>

                        <span class="tag">
                            ${item.category || "Предмет"}
                        </span>

                        <span class="tag">
                            ${item.price || 0} gold
                        </span>

                        <br><br>

                        <a
                            href="item.html?id=${item.id}"
                            class="btn"
                        >
                            Подробнее
                        </a>

                    </div>

                </div>
            `;
        });
}

searchInput.addEventListener("input", renderItems);

loadItems();