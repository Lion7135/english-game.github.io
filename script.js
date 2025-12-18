let currentDeck = [];
let currentCardIndex = 0;
let score = 0;
let timer = null;
let timeLeft = 0;
let gameMode = null; 
let totalTimeUsed = 0;
let correctAnswers = 0;
let totalAnswers = 0;
let selectedDeckType = 'random30';

const menuScreen = document.getElementById('menuScreen');
const gameScreen = document.getElementById('gameScreen');
const resultScreen = document.getElementById('resultScreen');
const practiceBtn = document.getElementById('practiceBtn');
const level1Btn = document.getElementById('level1Btn');
const level2Btn = document.getElementById('level2Btn');
const level3Btn = document.getElementById('level3Btn');
const quitBtn = document.getElementById('quitBtn');
const restartBtn = document.getElementById('restartBtn');
const backToMenuBtn = document.getElementById('backToMenuBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const timerDisplay = document.getElementById('timerDisplay');
const progressDisplay = document.getElementById('progressDisplay');
const englishWord = document.getElementById('englishWord');
const partOfSpeech = document.getElementById('partOfSpeech');
const pronunciation = document.getElementById('pronunciation');
const optionsContainer = document.getElementById('optionsContainer');
const speakBtn = document.getElementById('speakBtn');
const feedback = document.getElementById('feedback');
const correctAnswerText = document.getElementById('correctAnswerText');
const nextBtn = document.getElementById('nextBtn');
const finalScore = document.getElementById('finalScore');
const accuracy = document.getElementById('accuracy');
const totalTime = document.getElementById('totalTime');

const deckButtons = document.querySelectorAll('.deck-btn');
const deckOptionsContainer = document.getElementById('deckOptions');

let synth = window.speechSynthesis;
let isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
let isYandex = /yabrowser/i.test(navigator.userAgent);
let speechSupported = true;

function getDeckInfo(deckType) {
    const deck = decks[deckType];
    const size = deck ? deck.length : 0;
    
    const names = {
        all: 'All Words',
        random30: 'Random Cards',
        unit1: 'Unit 1',
        unit2: 'Unit 2',
        unit3: 'Unit 3',
        unit4: 'Unit 4',
        unit5: 'Unit 5',
        unit6: 'Unit 6',
        unit7: 'Unit 7',
        unit8: 'Unit 8',
        unit9: 'Unit 9',
        unit10: 'Unit 10'
    };
    
    return {
        name: names[deckType] || 'Unknown Deck',
        size: size
    };
}

function updateDeckButtonsDisplay() {
    deckButtons.forEach(btn => {
        const deckType = btn.dataset.deck;
        const deckInfo = getDeckInfo(deckType);
        
        btn.innerHTML = `
            <i class="fas fa-book"></i> 
            ${deckInfo.name} (${deckInfo.size})
        `;
    });
}

function updateRandomDeck() {
    const allWords = decks.all || [];
    const shuffled = [...allWords].sort(() => Math.random() - 0.5);
    decks.random30 = shuffled.slice(0, 30);
    
    updateDeckButtonsDisplay();
    
    if (selectedDeckType === 'random30') {
        currentDeck = [...decks.random30];
    }
    
    console.log('Random deck updated with 30 new random cards');
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function getRandomWrongAnswers(correctRussian, count) {
    const wrongs = currentDeck
        .map(w => w.russian)
        .filter(r => r !== correctRussian);
    
    if (wrongs.length < count) {
        const additionalWrongs = decks.all
            .map(w => w.russian)
            .filter(r => r !== correctRussian && !wrongs.includes(r));
        wrongs.push(...additionalWrongs);
    }
    
    shuffleArray(wrongs);
    return wrongs.slice(0, Math.min(count, wrongs.length));
}

function checkSpeechSupport() {
    if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported in this browser.');
        speechSupported = false;
        speakBtn.disabled = true;
        speakBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Speak Not Supported';
        speakBtn.style.opacity = '0.6';
        return false;
    }
    
    setTimeout(() => {
        const voices = synth.getVoices();
        if (voices.length === 0) {
            console.warn('No speech voices available.');
            
            if (isSafari) {
                console.log('Detected Safari browser');
                if (typeof SpeechSynthesisUtterance === 'undefined') {
                    speechSupported = false;
                    speakBtn.disabled = true;
                    speakBtn.innerHTML = '<i class="fas fa-volume-mute"></i> Speak Not Supported';
                    speakBtn.style.opacity = '0.6';
                }
            }
            
            if (isYandex) {
                console.log('Detected Yandex browser');
                speechSupported = true; 
            }
        } else {
            console.log(`Available voices: ${voices.length}`);
            console.log('Speech synthesis is supported');
            speechSupported = true;
            speakBtn.disabled = false;
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
            speakBtn.style.opacity = '1';
        }
    }, 100);
}

function speakWord() {
    if (!speechSupported) {
        showTemporaryMessage('Speech synthesis is not supported in your browser', 'warning');
        return;
    }
    
    const word = currentDeck[currentCardIndex].english;
    synth.cancel();
    
    setTimeout(() => {
        try {
            const utterance = new SpeechSynthesisUtterance(word);
            
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.lang = 'en-US';
            
            if (isSafari) {
                utterance.rate = 1.0; 
                const voices = synth.getVoices();
                const englishVoice = voices.find(v => v.lang.startsWith('en-'));
                if (englishVoice) {
                    utterance.voice = englishVoice;
                }
            }
            
            if (isYandex) {
                utterance.rate = 0.85; 
                utterance.volume = 0.9;
            }
            
            utterance.onstart = () => {
                console.log('Speech started');
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speaking...';
                speakBtn.disabled = true;
            };
            
            utterance.onend = () => {
                console.log('Speech ended');
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
                speakBtn.disabled = false;
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
                speakBtn.disabled = false;
                
                showTemporaryMessage('Could not speak the word. Please try again.', 'error');
            };
            
            synth.speak(utterance);
            
        } catch (error) {
            console.error('Error in speakWord:', error);
            speakBtn.innerHTML = '<i class="fas fa-volume-up"></i> Speak Word';
            speakBtn.disabled = false;
            
            if (isSafari && error.name === 'TypeError') {
                showTemporaryMessage('Please enable speech in Safari settings', 'info');
            }
        }
    }, 50);
}

function showTemporaryMessage(message, type = 'info') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `temp-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: fadeInOut 3s ease-in-out;
    `;
    
    if (type === 'warning') {
        messageDiv.style.backgroundColor = '#ffc107';
        messageDiv.style.color = '#212529';
    } else if (type === 'error') {
        messageDiv.style.backgroundColor = '#dc3545';
    } else {
        messageDiv.style.backgroundColor = '#17a2b8';
    }
    
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 500);
        }
    }, 2500);
}

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(-20px); }
        15% { opacity: 1; transform: translateY(0); }
        85% { opacity: 1; transform: translateY(0); }
        100% { opacity: 0; transform: translateY(-20px); }
    }
    
    .btn-speak:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }
    
    .btn-speak.speaking {
        background-color: #28a745;
        animation: pulse 1s infinite;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0.4); }
        70% { box-shadow: 0 0 0 10px rgba(40, 167, 69, 0); }
        100% { box-shadow: 0 0 0 0 rgba(40, 167, 69, 0); }
    }
`;
document.head.appendChild(style);

practiceBtn.addEventListener('click', () => startGame('practice'));
level1Btn.addEventListener('click', () => startGame('level1'));
level2Btn.addEventListener('click', () => startGame('level2'));
level3Btn.addEventListener('click', () => startGame('level3'));
quitBtn.addEventListener('click', quitGame);
restartBtn.addEventListener('click', restartGame);
backToMenuBtn.addEventListener('click', backToMenu);
speakBtn.addEventListener('click', speakWord);
nextBtn.addEventListener('click', nextCard);

deckButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        deckButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        selectedDeckType = this.dataset.deck;

        if (selectedDeckType === 'random30') {
            updateRandomDeck();
        }
        
        const deckInfo = getDeckInfo(selectedDeckType);
        console.log(`Selected deck: ${deckInfo.name} (${deckInfo.size} words)`);
    });
});

function startGame(mode) {
    gameMode = mode;

    if (selectedDeckType === 'random30') {
        updateRandomDeck();
    }

    let selectedDeck = decks[selectedDeckType] || decks.all;
    
    if (!selectedDeck || selectedDeck.length === 0) {
        selectedDeck = decks.all;
    }
    
    currentDeck = shuffleArray([...selectedDeck]);
    
    currentCardIndex = 0;
    score = 0;
    totalTimeUsed = 0;
    correctAnswers = 0;
    totalAnswers = 0;

    updateScoreDisplay();
    menuScreen.classList.add('hidden');
    gameScreen.classList.remove('hidden');
    resultScreen.classList.add('hidden');

    loadCard();
}

function loadCard() {
    if (currentCardIndex >= currentDeck.length) {
        endGame();
        return;
    }

    const card = currentDeck[currentCardIndex];
    englishWord.textContent = card.english;
    partOfSpeech.textContent = card.partOfSpeech;
    pronunciation.textContent = card.pronunciation;

    const correctAnswer = card.russian;
    const wrongAnswers = getRandomWrongAnswers(correctAnswer, 3);
    const allAnswers = shuffleArray([correctAnswer, ...wrongAnswers]);

    optionsContainer.innerHTML = '';
    allAnswers.forEach(answer => {
        const option = document.createElement('div');
        option.className = 'option';
        option.textContent = answer;
        option.addEventListener('click', () => selectAnswer(answer, correctAnswer));
        optionsContainer.appendChild(option);
    });

    const deckInfo = getDeckInfo(selectedDeckType);
    progressDisplay.textContent = `${deckInfo.name}: ${currentCardIndex + 1}/${currentDeck.length}`;

    feedback.classList.add('hidden');
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.classList.remove('correct', 'wrong');
        opt.style.pointerEvents = 'auto';
    });

    if (gameMode !== 'practice') {
        startTimer();
    } else {
        timerDisplay.textContent = 'Practice Mode';
    }
}

function startTimer() {
    if (timer) clearInterval(timer);

    switch (gameMode) {
        case 'level1': timeLeft = 30; break;
        case 'level2': timeLeft = 15; break;
        case 'level3': timeLeft = 5; break;
        default: timeLeft = 30;
    }

    timerDisplay.textContent = `Time: ${timeLeft}s`;
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `Time: ${timeLeft}s`;
        totalTimeUsed++;

        if (timeLeft <= 0) {
            clearInterval(timer);
            timeOut();
        }
    }, 1000);
}

function timeOut() {
    const card = currentDeck[currentCardIndex];
    showFeedback(null, card.russian, false);
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
    });
}

function selectAnswer(selected, correct) {
    if (gameMode !== 'practice') {
        clearInterval(timer);
    }

    const isCorrect = selected === correct;
    totalAnswers++;
    if (isCorrect) {
        score += 10;
        correctAnswers++;
        updateScoreDisplay();
    }

    showFeedback(selected, correct, isCorrect);
}

function showFeedback(selected, correct, isCorrect) {
    optionsContainer.querySelectorAll('.option').forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.textContent === correct) {
            opt.classList.add('correct');
        }
        if (opt.textContent === selected && !isCorrect) {
            opt.classList.add('wrong');
        }
    });

    if (isCorrect) {
        correctAnswerText.textContent = '✅ Correct! Well done.';
        correctAnswerText.style.color = '#28a745';
    } else {
        correctAnswerText.textContent = `❌ Incorrect. The correct answer is: ${correct}`;
        correctAnswerText.style.color = '#dc3545';
    }

    feedback.classList.remove('hidden');
}

function nextCard() {
    currentCardIndex++;
    if (currentCardIndex < currentDeck.length) {
        loadCard();
    } else {
        endGame();
    }
}

function updateScoreDisplay() {
    scoreDisplay.textContent = `Score: ${score}`;
}

function endGame() {
    clearInterval(timer);
    gameScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');

    const accuracyPercent = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const deckInfo = getDeckInfo(selectedDeckType);
    
    finalScore.textContent = score;
    accuracy.textContent = `${accuracyPercent}%`;
    totalTime.textContent = totalTimeUsed;
    
    const statsElement = document.querySelector('.score-summary');
    statsElement.innerHTML = `
        <p><i class="fas fa-trophy"></i> Your Score: <span id="finalScore">${score}</span></p>
        <p><i class="fas fa-chart-bar"></i> Accuracy: <span id="accuracy">${accuracyPercent}%</span></p>
        <p><i class="fas fa-clock"></i> Total Time: <span id="totalTime">${totalTimeUsed}</span>s</p>
        <p><i class="fas fa-layer-group"></i> Deck: ${deckInfo.name}</p>
        <p><i class="fas fa-check-circle"></i> Correct: ${correctAnswers}/${totalAnswers}</p>
        <p><i class="fas fa-list-ol"></i> Deck Size: ${currentDeck.length} words</p>
    `;
}

function quitGame() {
    clearInterval(timer)
    if (confirm('Are you sure you want to quit? Your progress will be lost.')) {
        backToMenu()
    }
}

function restartGame() {
    if (selectedDeckType === 'random30') {
        updateRandomDeck()
    }
    startGame(gameMode)
}

function backToMenu() {
    clearInterval(timer)
    gameScreen.classList.add('hidden')
    resultScreen.classList.add('hidden')
    menuScreen.classList.remove('hidden')
}

document.addEventListener('DOMContentLoaded', function() {
    updateDeckButtonsDisplay();
    
    console.log('Available decks:');
    Object.keys(decks).forEach(deckType => {
        const info = getDeckInfo(deckType);
        console.log(`- ${info.name}: ${info.size} words`);
    });
    
    checkSpeechSupport();
    
    setTimeout(checkSpeechSupport, 1000);
    
    console.log('Browser info:', {
        userAgent: navigator.userAgent,
        isSafari: isSafari,
        isYandex: isYandex,
        speechSynthesis: 'speechSynthesis' in window
    });
    
    const refreshRandomBtn = document.createElement('button');
    refreshRandomBtn.className = 'btn-refresh-random';
    refreshRandomBtn.innerHTML = '<i class="fas fa-redo"></i> Refresh Random Deck';
    refreshRandomBtn.style.cssText = `
        display: block;
        margin: 10px auto;
        padding: 10px 15px;
        background: #17a2b8;
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-size: 0.9rem;
        transition: background 0.3s;
    `;
    
    refreshRandomBtn.addEventListener('mouseover', () => {
        refreshRandomBtn.style.backgroundColor = '#138496';
    });
    
    refreshRandomBtn.addEventListener('mouseout', () => {
        refreshRandomBtn.style.backgroundColor = '#17a2b8';
    });
    
    refreshRandomBtn.addEventListener('click', function() {
        updateRandomDeck();
        if (selectedDeckType === 'random30') {
            showTemporaryMessage('Random deck refreshed with 30 new cards!', 'info');
        } else {
            showTemporaryMessage('Random deck refreshed! Select it to use new cards.', 'info');
        }
    });
    
    const deckSelection = document.querySelector('.deck-selection');
    if (deckSelection) {
        deckSelection.appendChild(refreshRandomBtn);
    }
    
    if (isSafari) {
        const safariHelp = document.createElement('div');
        safariHelp.className = 'safari-help';
        safariHelp.innerHTML = `
            <p style="font-size: 0.9rem; color: #6c757d; margin-top: 10px;">
                <i class="fas fa-info-circle"></i> 
                <strong>Safari Tip:</strong> If speech doesn't work, check Safari Preferences → Websites → Speech and enable it.
            </p>
        `;
        
        const instructions = document.querySelector('.instructions');
        if (instructions) {
            instructions.appendChild(safariHelp);
        }
    }

function adjustWordSize() {
    const englishWordElement = document.getElementById('englishWord');
    if (!englishWordElement) return;
    
    const word = englishWordElement.textContent;
    const wordLength = word.length;
    
    englishWordElement.classList.remove('long-word', 'very-long-word', 'extremely-long-word');
    
    if (wordLength > 15) {
        englishWordElement.classList.add('long-word');
    }
    if (wordLength > 25) {
        englishWordElement.classList.add('very-long-word');
    }
    if (wordLength > 35) {
        englishWordElement.classList.add('extremely-long-word');
    }
}

const originalLoadCard = loadCard;
loadCard = function() {
    originalLoadCard();
    
    setTimeout(() => {
        adjustWordSize();
    }, 50);
};

const originalSpeakWord = speakWord;
speakWord = function() {
    originalSpeakWord();
    
    setTimeout(adjustWordSize, 100);
};

window.addEventListener('resize', adjustWordSize);

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        adjustWordSize();
    }, 500);
    
    const originalNextCard = nextCard;
    nextCard = function() {
        originalNextCard();
        setTimeout(adjustWordSize, 100);
    };
    
    const originalSelectAnswer = selectAnswer;
    selectAnswer = function(selected, correct) {
        originalSelectAnswer(selected, correct);
        setTimeout(adjustWordSize, 100);
    };
});
});