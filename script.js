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
        
        // ADD THIS LINE:
        const booksArray = []; 
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Document ID:", doc.id, "Data:", data);
            booksArray.push({ id: doc.id, ...data });
        });
        
        // Update your global allBooks and display them
        allBooks = booksArray;
        displayBooks(allBooks);
        
    } catch (error) {
        console.error("Error fetching books:", error);
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

    // script.js

    filteredBooks.forEach(book => {
        // Format the price with commas and the currency symbol
        const formattedPrice = Number(book.price).toLocaleString();

        const card = `
        <a href="product.html?id=${book.id}" class="book-card-link">
            <div class="book-card">
                <div class="book-image"><img src="${book.image}" alt="${book.title}"></div>
                <div class="book-info">
                    <div class="price-row">
                        <span class="price">₮${formattedPrice}</span>
                    </div>
                    
                    <h3>${book.title}</h3>
                    
                    <p class="meta">${book.grade} | ${book.subject}</p>
                    
                    <p class="year">Хэвлэгдсэн: <span>${book.year} он</span></p>
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
            // Inside addNewBook, make sure you include ALL of these:
            await addDoc(collection(db, "books"), {
                title: document.getElementById('formTitle').value,
                author: document.getElementById('formAuthor').value,
                price: Number(document.getElementById('formPrice').value),
                grade: document.getElementById('formGrade').value,
                subject: document.getElementById('formSubject').value,
                year: document.getElementById('formYear').value, // This was missing in your screenshot!
                image: downloadURL,
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
