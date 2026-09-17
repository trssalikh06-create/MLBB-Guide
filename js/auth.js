import { auth, db } from "./firebase.js";

import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

import {
    doc,
    setDoc,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";


const form = document.getElementById("authForm");
const formTitle = document.getElementById("formTitle");
const nameGroup = document.getElementById("nameGroup");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const submitBtn = document.getElementById("submitBtn");
const switchBtn = document.getElementById("switchBtn");
const resetBtn = document.getElementById("resetBtn");
const message = document.getElementById("message");


let isRegister = false;


switchBtn.addEventListener("click", function () {

    isRegister = !isRegister;

    message.textContent = "";

    if (isRegister) {

        formTitle.textContent = "Регистрация";

        nameGroup.classList.remove("hidden");

        nameInput.required = true;

        submitBtn.textContent = "Зарегистрироваться";

        switchBtn.textContent = "Уже есть аккаунт";

        resetBtn.style.display = "none";

    } else {

        formTitle.textContent = "Вход";

        nameGroup.classList.add("hidden");

        nameInput.required = false;

        submitBtn.textContent = "Войти";

        switchBtn.textContent = "Регистрация";

        resetBtn.style.display = "block";
    }

});


form.addEventListener("submit", async function (event) {

    event.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const name = nameInput.value.trim();

    message.textContent = "";
    message.className = "auth-message";


    try {

        if (isRegister) {

            if (!name) {
                showMessage("Введите имя", true);
                return;
            }

            if (password.length < 6) {
                showMessage(
                    "Пароль должен содержать минимум 6 символов",
                    true
                );
                return;
            }


            const result =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );


            await setDoc(
                doc(db, "users", result.user.uid),
                {
                    name: name,
                    email: email,
                    role: "user",
                    createdAt: serverTimestamp()
                }
            );


            showMessage(
                "Регистрация успешна!"
            );


            setTimeout(function () {
                window.location.href = "index.html";
            }, 1000);


        } else {

            await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            window.location.href = "index.html";
        }


    } catch (error) {

        console.error("Firebase error:", error);

        if (error.code === "auth/email-already-in-use") {

            showMessage(
                "Этот email уже зарегистрирован",
                true
            );

        } else if (error.code === "auth/invalid-email") {

            showMessage(
                "Неверный формат email",
                true
            );

        } else if (error.code === "auth/weak-password") {

            showMessage(
                "Пароль должен содержать минимум 6 символов",
                true
            );

        } else if (
            error.code === "auth/invalid-credential" ||
            error.code === "auth/wrong-password"
        ) {

            showMessage(
                "Неверный email или пароль",
                true
            );

        } else if (error.code === "auth/user-not-found") {

            showMessage(
                "Пользователь не найден",
                true
            );

        } else {

            showMessage(
                "Ошибка: " + error.message,
                true
            );
        }
    }

});


resetBtn.addEventListener("click", async function () {

    const email = emailInput.value.trim();

    if (!email) {

        showMessage(
            "Введите email для восстановления пароля",
            true
        );

        return;
    }


    try {

        await sendPasswordResetEmail(
            auth,
            email
        );

        showMessage(
            "Письмо для восстановления отправлено"
        );

    } catch (error) {

        console.error(error);

        showMessage(
            "Ошибка: " + error.message,
            true
        );
    }

});


function showMessage(text, error = false) {

    message.textContent = text;

    if (error) {
        message.classList.add("error");
    } else {
        message.classList.add("success");
    }
}