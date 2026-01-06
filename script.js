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
        bookGrid.innerHTML = `<p class="no-results">No books found for your criteria.</p>`;
        return;
    }

    filteredBooks.forEach(book => {
        // Currency Formatter: Adds commas (e.g., 45,000)
        const formattedPrice = Number(book.price || 0).toLocaleString();

        const card = `
        <a href="product.html?id=${book.id}" class="book-card-link">
            <div class="book-card">
                <div class="book-image"><img src="${book.image}" alt="${book.title}"></div>
                <div class="book-info">
                    <div class="price-row">
                        <span class="price">₮${formattedPrice}</span>
                    </div>

                    <h3 class="truncate-title">${book.title}</h3>

                    <p class="meta">${book.year || '---'}</p>
                    <p class="meta">${book.grade || '---'} | ${book.subject || '---'}</p>
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
    
    const fileInput = document.getElementById('formImage');
    let file = fileInput.files[0];
    const uploadContainer = document.getElementById('uploadContainer');
    const progressBar = document.getElementById('progressBar');
    const uploadStatus = document.getElementById('uploadStatus');

    if (!file) return alert("Зураг сонгоно уу!");

    // 1. Show the UI immediately so the user knows something is happening
    uploadContainer.classList.remove('hidden');
    uploadStatus.innerText = "Зургийг жижигсгэж байна..."; // "Reducing image..."

    try {
        // 2. COMPRESSION STEP (Wait for this to finish!)
        const options = {
            maxSizeMB: 1,
            maxWidthOrHeight: 800,
            useWebWorker: true
        };
        
        // Ensure imageCompression is available
        if (typeof imageCompression !== 'undefined') {
            file = await imageCompression(file, options);
        }

        // 3. START FIREBASE UPLOAD
        const fileName = Date.now() + "-" + file.name;
        const storageRef = ref(storage, 'books/' + fileName);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on('state_changed', 
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                progressBar.style.width = progress + '%';
                uploadStatus.innerText = `Уншиж байна: ${Math.round(progress)}%`;
            }, 
            (error) => {
                console.error("Upload Error:", error);
                alert("Алдаа гарлаа: " + error.message);
            }, 
            async () => {
                // 4. GET URL AND SAVE DATA
                const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                
                await addDoc(collection(db, "books"), {
                    title: document.getElementById('formTitle').value,
                    price: Number(document.getElementById('formPrice').value),
                    grade: document.getElementById('formGrade').value,
                    subject: document.getElementById('formSubject').value,
                    year: document.getElementById('formYear').value,
                    image: downloadURL,
                    createdAt: new Date()
                });

                // After the addDoc is successful
                document.querySelector('form').reset();
                document.getElementById('sellModal').classList.add('hidden');
                uploadContainer.classList.add('hidden'); // Hide progress bar
                loadBooksFromDatabase(); // Just refresh the list without reloading the whole page

                alert("Амжилттай нэмэгдлээ!");
                location.reload();
            }
        );
    } catch (err) {
        console.error("Process Error:", err);
        uploadStatus.innerText = "Алдаа гарлаа.";
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadBooksFromDatabase();
    searchInput.addEventListener('input', applyFilters);
    gradeFilter.addEventListener('change', applyFilters);
    subjectFilter.addEventListener('change', applyFilters);
});

window.previewFile = function() {
    const preview = document.getElementById('previewImg');
    const file = document.getElementById('formImage').files[0];
    const reader = new FileReader();

    reader.onloadend = function() {
        preview.src = reader.result;
        preview.style.display = "block";
    }

    if (file) {
        reader.readAsDataURL(file);
    }
};

window.addNewBook = addNewBook;