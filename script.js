// 1. Data Source
const books = [
    { id: 1, title: "Principles of Economics", author: "Mankiw", price: 45, grade: "10-р анги", subject: "Иргэний боловсрол", code: "ECON101", condition: "Good", image: "img/Alfred_Marshall_-_Principles_of_Economics_(1890).jpeg" },
    { id: 2, title: "Organic Chemistry", author: "Klein", price: 80, grade: "Sophomore", subject: "Хими", code: "BIO202", condition: "Like New", image: "https://via.placeholder.com/150" },
    { id: 3, title: "Calculus: Early Transcendentals", author: "Stewart", price: 60, grade: "10-р анги", subject: "Math", code: "MATH150", condition: "Fair", image: "https://via.placeholder.com/150" },
    { id: 4, title: "The Great Gatsby", author: "Fitzgerald", price: 10, grade: "Junior", subject: "Literature", code: "LIT300", condition: "Excellent", image: "https://via.placeholder.com/150" }
];

let recentlyViewed = [];

// 2. Selectors
const bookGrid = document.getElementById('bookGrid');
const searchInput = document.querySelector('.search-bar input');
const gradeFilter = document.getElementById('gradeFilter');
const subjectFilter = document.getElementById('subjectFilter');

// 3. Main Display Function
function displayBooks(filteredBooks) {
    bookGrid.innerHTML = ''; 
    
    if (filteredBooks.length === 0) {
        bookGrid.innerHTML = `<p class="no-results">No books found for your criteria.</p>`;
        return;
    }

    filteredBooks.forEach(book => {
        const card = `
            <div class="book-card" onclick="openBook(${book.id})">
                <div class="badge">${book.code}</div>
                <div class="book-image"><img src="${book.image}" alt="${book.title}"></div>
                <div class="book-info">
                    <div class="price-row">
                        <span class="price">₮${book.price}</span>
                    </div>
                    <h3>${book.title}</h3>
                    <p class="meta">${book.grade} | ${book.subject}</p>
                    <p class="condition">Condition: <span>${book.condition}</span></p>
                    <button class="buy-btn">View Details</button>
                </div>
            </div>
        `;
        bookGrid.innerHTML += card;
    });
}

// 4. Detail View Logic
function openBook(id) {
    const book = books.find(b => b.id === id);
    if (!book) return;

    // Toggle Visibility
    document.querySelector('.hero').classList.add('hidden');
    document.querySelector('.filter-section').classList.add('hidden');
    document.getElementById('bookGrid').classList.add('hidden');
    document.getElementById('detailPage').classList.remove('hidden');

    // Populate Detail Content
    document.getElementById('detailTitle').innerText = book.title;
    document.getElementById('detailAuthor').innerText = "By " + book.author;
    document.getElementById('detailPrice').innerText = "$" + book.price;
    document.getElementById('detailCode').innerText = book.code;
    document.getElementById('detailGrade').innerText = book.grade;
    document.getElementById('detailCondition').innerText = book.condition;
    document.getElementById('detailImg').innerHTML = `<img src="${book.image}" style="width:100%; height:100%; object-fit:cover; border-radius:12px;">`;

    // History Tracking
    if (!recentlyViewed.some(b => b.id === book.id)) {
        recentlyViewed.unshift(book);
        if (recentlyViewed.length > 5) recentlyViewed.pop();
    }

    renderSuggested(book.subject, book.id);
    renderHistory();
    window.scrollTo(0, 0);
}

// 5. Sidebar/Bottom List Rendering
function renderSuggested(subject, currentId) {
    const suggested = books.filter(b => b.subject === subject && b.id !== currentId);
    const grid = document.getElementById('suggestedGrid');
    grid.innerHTML = suggested.length > 0 ? suggested.map(b => miniCard(b)).join('') : "<p>No similar books found.</p>";
}

function renderHistory() {
    const grid = document.getElementById('historyGrid');
    grid.innerHTML = recentlyViewed.map(b => miniCard(b)).join('');
}

function miniCard(book) {
    return `
        <div class="mini-card" onclick="openBook(${book.id})">
            <div class="mini-img"><img src="${book.image}" style="width:100%; height:100%; object-fit:cover;"></div>
            <p>${book.title}</p>
            <span>$${book.price}</span>
        </div>
    `;
}

// 6. Navigation & Filters
function showHome() {
    document.querySelector('.hero').classList.remove('hidden');
    document.querySelector('.filter-section').classList.remove('hidden');
    document.getElementById('bookGrid').classList.remove('hidden');
    document.getElementById('detailPage').classList.add('hidden');
}

function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedGrade = gradeFilter.value;
    const selectedSubject = subjectFilter.value;

    const filtered = books.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm) || book.code.toLowerCase().includes(searchTerm);
        const matchesGrade = selectedGrade === 'all' || book.grade === selectedGrade;
        const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject;
        return matchesSearch && matchesGrade && matchesSubject;
    });
    displayBooks(filtered);
}

// 7. Sell Form Logic
function addNewBook(event) {
    event.preventDefault(); // Stop page refresh
    
    const newBook = {
        id: books.length + 1,
        title: document.getElementById('formTitle').value,
        author: document.getElementById('formAuthor').value,
        price: document.getElementById('formPrice').value,
        grade: document.getElementById('formGrade').value,
        subject: document.getElementById('formSubject').value,
        code: document.getElementById('formCode').value,
        condition: document.getElementById('formCondition').value,
        image: "https://via.placeholder.com/150" // Default placeholder
    };

    books.push(newBook);
    displayBooks(books);
    alert("Book listed successfully!");
    // Close modal logic here if applicable
}

// Initialize
displayBooks(books);
searchInput.addEventListener('input', applyFilters);
gradeFilter.addEventListener('change', applyFilters);
subjectFilter.addEventListener('change', applyFilters);