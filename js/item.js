import { db } from "./firebase.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);

const itemId = params.get("id");

const container = document.getElementById("itemContainer");

async function loadItem() {

    if (!itemId) {
        container.innerHTML = "<h2>Предмет не найден</h2>";
        return;
    }

    const itemRef = doc(db, "items", itemId);

    const snapshot = await getDoc(itemRef);

    if (!snapshot.exists()) {
        container.innerHTML = "<h2>Предмет не найден</h2>";
        return;
    }

    const item = snapshot.data();

    container.innerHTML = `
        <div class="hero-detail">

            <div class="hero-main">

                <img
                    src="${item.image}"
                    alt="${item.name}"
                >

                <div class="hero-info">

                    <h1>${item.name}</h1>

                    <span class="tag">
                        ${item.category || "Предмет"}
                    </span>

                    <span class="tag">
                        ${item.price || 0} gold
                    </span>

                    <br><br>

                    <p>
                        ${item.description || ""}
                    </p>

                </div>

            </div>

        </div>
    `;
}

loadItem();