// 1. Data Source
import { db, storage } from './firebase-config.js';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js";
import { collection, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

let allBooks = [];

window.showHome = showHome;
window.addNewBook = addNewBook;

async function loadBooksFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        // Clear the array and fill it with fresh data
        allBooks = [];
        querySnapshot.forEach((doc) => {
            allBooks.push({ id: doc.id, ...doc.data() });
        });
        
        console.log("Books loaded from Firebase:", allBooks); // Check your console for this!
        
        // 2. Immediately call display with the full list
        displayBooks(allBooks); 
    } catch (error) {
        console.error("Error fetching books:", error);
        bookGrid.innerHTML = `<p class="no-results">Error connecting to database.</p>`;
    }
}

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
        bookGrid.innerHTML = `<p class="no-results">Хайлтад тохирох ном олдсонгүй.</p>`;
        return;
    }

    filteredBooks.forEach(book => {
        // Add || "..." to handle any missing data gracefully
        const title = book.title || "Гарчиггүй";
        const price = book.price || -404;
        const grade = book.grade || "Хоосон";
        const subject = book.subject || "Хоосон";
        const year = book.year || "----";
        const image = book.image || "img/no-img.png";

        const card = `
        <a href="product.html?id=${book.id}" class="book-card-link">
            <div class="book-card">
                <div class="book-image"><img src="${image}" alt="${title}"></div>
                <div class="book-info">
                    <div class="price-row">
                        <span class="price">₮${price.toLocaleString()}</span>
                    </div>
                    <h3>${title}</h3>
                    <p class="meta">${grade} | ${subject}</p>
                    <p class="year">Хэвлэгдсэн: <span>${year}он</span></p>
                </div>
            </div>
        </a>
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
    document.getElementById('detailYear').innerText = book.year;
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

    const filtered = allBooks.filter(book => {
        // Add fallbacks (|| "") in case some data fields are missing in Firebase
        const title = (book.title || "").toLowerCase();
        const code = (book.code || "").toLowerCase();
        
        const matchesSearch = title.includes(searchTerm) || code.includes(searchTerm);
        const matchesGrade = selectedGrade === 'all' || book.grade === selectedGrade;
        const matchesSubject = selectedSubject === 'all' || book.subject === selectedSubject;
        
        return matchesSearch && matchesGrade && matchesSubject;
    });

    displayBooks(filtered);
}

// 7. Sell Form Logic
async function addNewBook(event) {
    event.preventDefault();
    
    const file = document.getElementById('formImage').files[0];
    const uploadContainer = document.getElementById('uploadContainer');
    const progressBar = document.getElementById('progressBar');
    const uploadStatus = document.getElementById('uploadStatus');

    if (!file) return alert("Please select an image!");

    // Show the progress bar
    uploadContainer.classList.remove('hidden');

    const fileName = Date.now() + "-" + file.name;
    const storageRef = ref(storage, 'books/' + fileName);
    
    // 1. Start Resumable Upload
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on('state_changed', 
        (snapshot) => {
            // 2. Calculate Progress Percentage
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            progressBar.style.width = progress + '%';
            uploadStatus.innerText = `Uploading: ${Math.round(progress)}%`;
        }, 
        (error) => {
            // Handle unsuccessful uploads
            console.error("Upload failed", error);
            alert("Upload failed! Try a smaller image.");
        }, 
        async () => {
            // 3. Handle successful uploads on completion
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save to Firestore exactly like before
            await addDoc(collection(db, "books"), {
                title: document.getElementById('formTitle').value,
                image: downloadURL,
                // ... include all your other form fields here ...
                createdAt: new Date()
            });

            alert("Book posted!");
            location.reload(); 
        }
    );
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooksFromDatabase();
    searchInput.addEventListener('input', applyFilters);
    gradeFilter.addEventListener('change', applyFilters);
    subjectFilter.addEventListener('change', applyFilters);
});