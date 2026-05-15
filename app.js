let flashcardSets = JSON.parse(localStorage.getItem('helpert_flashcards') || '[]');
let mcqSets = JSON.parse(localStorage.getItem('helpert_mcqs') || '[]');

let currentSet = null;
let currentIndex = 0;
let score = 0;
let timer = null;
let currentShuffledOptions = [];
let editingIndex = -1;
let currentModalType = '';

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    const target = document.getElementById(pageId);
    if (target) target.style.display = 'block';
    
    if (pageId === 'home') updateStats();
    if (pageId === 'flashcards') renderFlashcardSets();
    if (pageId === 'mcqs') renderMCQSets();
    clearTimeout(timer);
    window.scrollTo(0,0);
}

function updateStats() {
    document.getElementById('flashcard-count').innerText = flashcardSets.length;
    document.getElementById('mcq-count').innerText = mcqSets.length;
}

// Flashcard Renders
function renderFlashcardSets() {
    const list = document.getElementById('flashcard-list');
    list.innerHTML = flashcardSets.map((set, idx) => `
        <div class="set-card" onclick="openFlashcardSet(${idx})">
            <div class="set-actions">
                <button class="action-btn edit-btn icon-edit" onclick="editSet(event, 'flashcard', ${idx})" title="Edit"></button>
                <button class="action-btn delete-btn icon-trash" onclick="deleteSet(event, 'flashcard', ${idx})" title="Delete"></button>
            </div>
            <h3>${set.title}</h3>
            <p>${set.cards.length} terms</p>
        </div>
    `).join('');
}

function renderMCQSets() {
    const list = document.getElementById('mcq-list');
    list.innerHTML = mcqSets.map((set, idx) => `
        <div class="set-card" onclick="openMCQTest(${idx})">
            <div class="set-actions">
                <button class="action-btn edit-btn icon-edit" onclick="editSet(event, 'mcq', ${idx})" title="Edit"></button>
                <button class="action-btn delete-btn icon-trash" onclick="deleteSet(event, 'mcq', ${idx})" title="Delete"></button>
            </div>
            <h3>${set.title}</h3>
            <p>${set.questions.length} questions</p>
        </div>
    `).join('');
}

function deleteSet(e, type, index) {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this set?")) {
        if (type === 'flashcard') {
            flashcardSets.splice(index, 1);
            localStorage.setItem('helpert_flashcards', JSON.stringify(flashcardSets));
            renderFlashcardSets();
        } else {
            mcqSets.splice(index, 1);
            localStorage.setItem('helpert_mcqs', JSON.stringify(mcqSets));
            renderMCQSets();
        }
        updateStats();
    }
}

function editSet(e, type, index) {
    e.stopPropagation();
    editingIndex = index;
    currentModalType = type;
    const set = type === 'flashcard' ? flashcardSets[index] : mcqSets[index];
    
    document.getElementById('modal-container').style.display = 'flex';
    document.getElementById('modal-title').innerText = type === 'flashcard' ? 'Edit flashcard set' : 'Edit practice test';
    document.getElementById('btn-save-set').innerText = 'Save Changes';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('set-title').value = set.title;
    document.getElementById('set-topic').value = set.topic || '';
    
    const container = document.getElementById('items-container');
    container.innerHTML = '';
    
    if (type === 'flashcard') {
        set.cards.forEach(card => addFlashcardItem(card.front, card.back));
    } else {
        set.questions.forEach(q => addMCQItem(q.question, q.options, q.correct));
    }
}

// Study Mode Logic
function openFlashcardSet(idx) {
    currentSet = flashcardSets[idx];
    currentIndex = 0;
    document.getElementById('study-fc-title').innerText = currentSet.title;
    updateFlashcardUI();
    showPage('study-flashcards');
}

function updateFlashcardUI() {
    const card = currentSet.cards[currentIndex];
    document.getElementById('fc-content-front').innerText = card.front;
    document.getElementById('fc-content-back').innerText = card.back;
    document.getElementById('card-index').innerText = `${currentIndex + 1} / ${currentSet.cards.length}`;
    document.querySelector('.flashcard').classList.remove('flipped');
}

function flipCard(el) { el.classList.toggle('flipped'); }
function nextCard() { if (currentIndex < currentSet.cards.length - 1) { currentIndex++; updateFlashcardUI(); } }
function prevCard() { if (currentIndex > 0) { currentIndex--; updateFlashcardUI(); } }

// MCQ Test Logic
function openMCQTest(idx) {
    currentSet = mcqSets[idx];
    currentIndex = 0;
    score = 0;
    document.getElementById('take-mcq-title').innerText = currentSet.title;
    document.getElementById('test-main-view').style.display = 'block';
    document.getElementById('test-score-view').style.display = 'none';
    updateMCQUI();
    showPage('take-mcq');
}

function updateMCQUI() {
    const q = currentSet.questions[currentIndex];
    document.getElementById('q-index-display').innerText = `Question ${currentIndex + 1} of ${currentSet.questions.length}`;
    document.getElementById('q-text').innerText = q.question;
    document.getElementById('test-feedback').innerText = '';
    
    const options = q.options.map((text, index) => ({ text, isCorrect: index === q.correct }));
    currentShuffledOptions = options.sort(() => Math.random() - 0.5);
    
    const container = document.getElementById('options-container');
    container.innerHTML = currentShuffledOptions.map((opt, idx) => `
        <button class="option-btn" id="opt-${idx}" onclick="checkMCQAnswer(${idx})">${opt.text}</button>
    `).join('');
}

function checkMCQAnswer(selectedIdx) {
    const buttons = document.querySelectorAll('.option-btn');
    buttons.forEach(b => b.disabled = true);
    
    const correctIdx = currentShuffledOptions.findIndex(o => o.isCorrect);
    document.getElementById(`opt-${correctIdx}`).classList.add('correct');
    
    if (selectedIdx === correctIdx) {
        score++;
        document.getElementById('test-feedback').innerText = "Correct!";
        document.getElementById('test-feedback').style.color = "var(--primary-green)";
        timer = setTimeout(nextQuestion, 1500);
    } else {
        document.getElementById(`opt-${selectedIdx}`).classList.add('wrong');
        document.getElementById('test-feedback').innerText = "Incorrect";
        document.getElementById('test-feedback').style.color = "var(--danger)";
        timer = setTimeout(nextQuestion, 3000);
    }
}

function nextQuestion() {
    clearTimeout(timer);
    if (currentIndex < currentSet.questions.length - 1) {
        currentIndex++;
        updateMCQUI();
    } else {
        showResults();
    }
}

function prevQuestion() {
    if (currentIndex > 0) {
        currentIndex--;
        updateMCQUI();
    }
}

function restartTest() {
    currentIndex = 0;
    score = 0;
    document.getElementById('test-main-view').style.display = 'block';
    document.getElementById('test-score-view').style.display = 'none';
    updateMCQUI();
}

function showResults() {
    document.getElementById('test-main-view').style.display = 'none';
    document.getElementById('test-score-view').style.display = 'block';
    document.getElementById('final-score').innerText = `${score} / ${currentSet.questions.length}`;
}

// Modal Form Management
function showCreateForm(type) {
    currentModalType = type;
    editingIndex = -1;
    document.getElementById('modal-container').style.display = 'flex';
    document.getElementById('modal-title').innerText = type === 'flashcard' ? 'Create new flashcard set' : 'Create new practice test';
    document.getElementById('btn-save-set').innerText = 'Create';
    document.getElementById('modal-error').style.display = 'none';
    document.getElementById('items-container').innerHTML = '';
    document.getElementById('set-title').value = '';
    document.getElementById('set-topic').value = '';
    addItem();
}

function closeModals() {
    document.getElementById('modal-container').style.display = 'none';
}

function addItem() {
    if (currentModalType === 'flashcard') addFlashcardItem();
    else addMCQItem();
}

function addFlashcardItem(front = '', back = '') {
    const container = document.getElementById('items-container');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <div class="item-fields">
            <input type="text" placeholder="Term" class="fc-front" value="${front}">
            <input type="text" placeholder="Definition" class="fc-back" value="${back}">
        </div>
    `;
    container.appendChild(div);
}

function addMCQItem(question = '', options = ['', '', '', ''], correct = 0) {
    const container = document.getElementById('items-container');
    const div = document.createElement('div');
    div.className = 'item-row';
    div.innerHTML = `
        <div class="mcq-item-fields">
            <input type="text" placeholder="Question" class="mcq-q" value="${question}">
            <div class="mcq-opts-grid">
                <input type="text" placeholder="Option 1" class="mcq-o1" value="${options[0]}">
                <input type="text" placeholder="Option 2" class="mcq-o2" value="${options[1]}">
                <input type="text" placeholder="Option 3" class="mcq-o3" value="${options[2]}">
                <input type="text" placeholder="Option 4" class="mcq-o4" value="${options[3]}">
            </div>
            <select class="mcq-correct-select">
                <option value="0" ${correct === 0 ? 'selected' : ''}>Correct Answer: Option 1</option>
                <option value="1" ${correct === 1 ? 'selected' : ''}>Correct Answer: Option 2</option>
                <option value="2" ${correct === 2 ? 'selected' : ''}>Correct Answer: Option 3</option>
                <option value="3" ${correct === 3 ? 'selected' : ''}>Correct Answer: Option 4</option>
            </select>
        </div>
    `;
    container.appendChild(div);
}

document.getElementById('btn-add-item').onclick = addItem;

document.getElementById('btn-save-set').onclick = function() {
    const title = document.getElementById('set-title').value.trim();
    const topic = document.getElementById('set-topic').value.trim();
    const errorBox = document.getElementById('modal-error');
    
    if (!title) {
        errorBox.innerText = "Please enter a title.";
        errorBox.style.display = 'block';
        return;
    }

    if (currentModalType === 'flashcard') {
        const rows = document.querySelectorAll('.fc-front');
        const cards = [];
        rows.forEach((row, i) => {
            const front = row.value.trim();
            const back = document.querySelectorAll('.fc-back')[i].value.trim();
            if (front && back) cards.push({ front, back });
        });
        
        if (cards.length === 0) {
            errorBox.innerText = "Please fill out at least one term and definition.";
            errorBox.style.display = 'block';
            return;
        }
        
        const newSet = { title, topic, cards };
        if (editingIndex === -1) flashcardSets.push(newSet);
        else flashcardSets[editingIndex] = newSet;
        localStorage.setItem('helpert_flashcards', JSON.stringify(flashcardSets));
        showPage('flashcards');
    } else {
        const rows = document.querySelectorAll('.mcq-q');
        const questions = [];
        rows.forEach((row, i) => {
            const q = row.value.trim();
            const opts = [
                document.querySelectorAll('.mcq-o1')[i].value.trim(),
                document.querySelectorAll('.mcq-o2')[i].value.trim(),
                document.querySelectorAll('.mcq-o3')[i].value.trim(),
                document.querySelectorAll('.mcq-o4')[i].value.trim()
            ];
            const correct = parseInt(document.querySelectorAll('.mcq-correct-select')[i].value);
            
            if (q && opts.every(o => o !== "")) questions.push({ question: q, options: opts, correct });
        });
        
        if (questions.length === 0) {
            errorBox.innerText = "Please fill out at least one complete question with 4 options.";
            errorBox.style.display = 'block';
            return;
        }
        
        const newSet = { title, topic, questions };
        if (editingIndex === -1) mcqSets.push(newSet);
        else mcqSets[editingIndex] = newSet;
        localStorage.setItem('helpert_mcqs', JSON.stringify(mcqSets));
        showPage('mcqs');
    }
    closeModals();
};

showPage('home');

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    const flashcardPage = document.getElementById('study-flashcards');
    if (flashcardPage.style.display === 'block') {
        if (e.code === 'ArrowRight') {
            nextCard();
        } else if (e.code === 'ArrowLeft') {
            prevCard();
        } else if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scroll
            const cardEl = document.querySelector('.flashcard');
            if (cardEl) flipCard(cardEl);
        }
    }
});
