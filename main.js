const SECRET_WORD_API = "https://words.dev-apis.com/word-of-the-day"
const VALIDATE_WORD_API = "https://words.dev-apis.com/validate-word";
const WORD_LENGTH = 5;

let spiral = document.querySelector(".status-bar__spiral");
let inputList = document.querySelectorAll(".game-board__cell__input");
let headerTitle = document.querySelector(".header__title");
let secretWord = "";
let currentInputIdx = 0;
let currentGuess = 1;
let isLoading = false;
let timeoutId;
let isGameEnded = false;

function fetchSecretWord () {
    toggleSpiral()
    fetch(SECRET_WORD_API).then(async res => {
        const response = await res.json();
        secretWord = response.word;
    }).finally(() => {
        toggleSpiral()
    })
}

async function validateWord () {
    toggleSpiral();
    const word = getCurrentGuessWord();
    try{
        const jsonRes = await fetch(VALIDATE_WORD_API, {
            method: "POST",
            body: JSON.stringify({word})
        })
        toggleSpiral();
        const res = await jsonRes.json()
        return res.validWord;
    }catch(err) {
        alert(`Error occurred while validating your word: ${err.message}`)
    }
}

function isLetter(letter) {
    return /^[a-zA-Z]$/.test(letter);
}

const toggleSpiral = () => {
    isLoading = !isLoading;
    spiral.classList.toggle('status-bar__spiral--loading')
}

function getCurrentGuessInputs() {
    const i = (currentGuess - 1) * WORD_LENGTH; // multiply by 5 since each word consists of 5 characters
    return Array.from(inputList).slice(i, i + WORD_LENGTH);

}

function getCurrentGuessWord() {
    const inputs = getCurrentGuessInputs();
    let word = "";
    inputs.forEach(input => word += input.value)
    return word;
}

function updateGameStatus() {
    const guessWord = getCurrentGuessWord();
    const isWon = guessWord === secretWord;
    const isLost = currentGuess === 6;
    isGameEnded = isWon || isLost;

    if (isWon) {
        alert("Congratulations, you won!")
        headerTitle.classList.add("header__title--rainbow")
    }else if (isLost) {
        alert(`ooh, you've lost the game. The word is: ${secretWord}`)
    }

    if (isGameEnded) {
        if (timeoutId) {
            clearTimeout(timeoutId)
        }
    }else {
        currentGuess++;
        currentInputIdx = 0
    }
}

function compareGuessAgainstSecretWord (guess) {
    const inputs = getCurrentGuessInputs();
    let secretCopy = secretWord;

    // Loop to catch characters that's exist and in the right place
    for (let i = 0; i < WORD_LENGTH; i++) {
        inputs[i].classList.add("game-board__cell__input--checked")
        if (i === secretCopy.indexOf(guess[i])) {
            inputs[i].classList.add("game-board__cell__input--exist")
            inputs[i].classList.add("game-board__cell__input--correct-order")
            // Mark characters as checked
            guess = guess.substring(0,i) + '_' + guess.substring(i + 1)
            secretCopy = secretCopy.substring(0,i) + '_' + secretCopy.substring(i + 1)
        }
    }
    // Loop to catch characters that either exist but in the wrong place or doesn't exist
    for (let i = 0; i < WORD_LENGTH; i++) {
        if (guess[i] === "_") {
            continue;
        }
        const charIdx = secretCopy.indexOf(guess[i]);
        if (charIdx === -1) {
            inputs[i].classList.add("game-board__cell__input--not-exist")
        }else {
            inputs[i].classList.add("game-board__cell__input--exist")
        }
    }
    updateGameStatus();
}

function handleInvalidWordGuess () {
    if (timeoutId) {
        clearTimeout(timeoutId)
    }

    const inputs = getCurrentGuessInputs();
    inputs.forEach((input) => {
        input.classList.add("game-board__cell__input--invalid");
    })
    timeoutId = setTimeout(() => {
        inputs.forEach((input) => {
            input.classList.remove("game-board__cell__input--invalid");
        })
    }, 500)
}

function handleKeyDown (e) {
    e.preventDefault()
    if (isLoading || isGameEnded) {
        return;
    }

    if (e.key === "Enter") {
        void handleEnterPress();
    }else if (e.key === "Backspace") {
        handleBackSpace()
    }
    else if (isLetter(e.key)) {
        handleValidLetter(e.key)
    }
}

function handleValidLetter(letter) {
    const inputs = getCurrentGuessInputs();
    const isLastGuessInput = currentInputIdx === 4
    inputs[currentInputIdx].value = letter;
    if (!isLastGuessInput) {
        currentInputIdx++;
        inputs[currentInputIdx].focus()
    }
}

function handleBackSpace() {
    const inputs = getCurrentGuessInputs();
    const input = inputs[currentInputIdx];
    if (currentInputIdx >= 0 && input.value) {
        input.value = "";
    }else if (currentInputIdx > 0 && !input.value) {
        currentInputIdx--;
        const prevInput = inputs[currentInputIdx];
        prevInput.value = "";
        prevInput.focus();

    }
}

async function handleEnterPress() {
    const word = getCurrentGuessWord();
    if (word.length < 5) {
        return;
    }
    const isValid = await validateWord();
    if (isValid) {
        compareGuessAgainstSecretWord(word)
    }else {
        handleInvalidWordGuess();
    }

}



function init() {
    document.addEventListener("keydown", handleKeyDown)
    fetchSecretWord();
}
init()


