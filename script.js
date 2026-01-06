// 1. Data Source
import { auth, db, storage } from './firebase-config.js'; //
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js"; //

import {
    ref,
    uploadBytesResumable,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-storage.js"; //

import {
    collection,
    addDoc, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js"; //
let isSignUp = true;
let currentUserProfile = null;

onAuthStateChanged(auth, async (user) => {
    const authBtn = document.getElementById('authBtn');
    const sellBtn = document.querySelector('.sell-btn[onclick*="sellModal"]');

    if (user) {
        // User is logged in
        const userDoc = await getDoc(doc(db, "users", user.uid));
        currentUserProfile = userDoc.data();
        authBtn.innerText = "Profile / Logout";
        authBtn.onclick = handleLogout;
        sellBtn.style.display = "block"; // Only show sell button when logged in
    } else {
        // User is logged out
        currentUserProfile = null;
        authBtn.innerText = "Login";
        authBtn.onclick = openAuthModal;
        sellBtn.style.display = "none"; 
    }
});

async function handleAuth(event) {
    event.preventDefault();
    
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;

    // Basic validation to prevent 400 errors
    if (password.length < 6) {
        alert("Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.");
        return;
    }

    try {
        if (isSignUp) {
            // --- SIGN UP LOGIC ---
            const email = document.getElementById('authEmail').value;
            const password = document.getElementById('authPassword').value;

            const res = await createUserWithEmailAndPassword(auth, email, password);
            
            // Save Profile Info to Firestore
            await setDoc(doc(db, "users", res.user.uid), {
                name: document.getElementById('userName').value || "",
                phone: document.getElementById('userPhone').value || "",
                fb: document.getElementById('userFB').value.trim() || "",
                ig: document.getElementById('userIG').value.trim() || "",
                uid: res.user.uid,
                createdAt: new Date()
            });
            
            if (!phone) {
                alert("Утасны дугаар заавал шаардлагатай!");
                return;
            }

            alert("Амжилттай бүртгүүллээ!");
        } else {
            // --- LOGIN LOGIC ---
            await signInWithEmailAndPassword(auth, email, password);
            alert("Амжилттай нэвтэрлээ!");
        }
        closeAuthModal();
    } catch (err) {
        console.error("Auth Error Code:", err.code);
        // Handle common Firebase 400 errors
        if (err.code === 'auth/invalid-email') alert("И-мэйл хаяг буруу байна.");
        else if (err.code === 'auth/email-already-in-use') alert("Энэ и-мэйл аль хэдийн бүртгэгдсэн байна.");
        else if (err.code === 'auth/wrong-password') alert("Нууц үг буруу байна.");
        else alert("Алдаа: " + err.message);
    }
}

async function deleteBook(bookId) {
    // 1. Double check with the user
    const confirmDelete = confirm("Та энэ номыг устгахдаа итгэлтэй байна уу? (Зарагдсан бол устгана уу)");
    
    if (confirmDelete) {
        try {
            // 2. Remove from Firestore
            await deleteDoc(doc(db, "books", bookId));
            
            alert("Амжилттай устгагдлаа!");
            
            // 3. Refresh the UI
            location.reload(); 
        } catch (error) {
            console.error("Устгахад алдаа гарлаа:", error);
            alert("Танд энэ номыг устгах эрх байхгүй байна.");
        }
    }
}

// Make it global so the button can see it
window.deleteBook = deleteBook;

let allBooks = [];

window.showHome = showHome;
window.addNewBook = addNewBook;

async function loadBooksFromDatabase() {
    try {
        const querySnapshot = await getDocs(collection(db, "books"));
        
        const booksArray = []; 
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            booksArray.push({ id: doc.id, ...data });
        });
        
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

    const user = auth.currentUser;

    if (filteredBooks.length === 0) {
        bookGrid.innerHTML = `<p class="no-results">No books found for your criteria.</p>`;
        return;
    }

    filteredBooks.forEach(book => {
        // Currency Formatter: Adds commas (e.g., 45,000)
        const formattedPrice = Number(book.price || 0).toLocaleString();
        const isOwner = user && book.sellerId === user.uid;

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
                ${isOwner ? `
                    <div class="owner-controls">
                        <button onclick="deleteBook('${book.id}')" class="delete-btn">Delete</button>
                    </div>
                ` : ''}
            </div>
        </a>
        `;
        bookGrid.innerHTML += card;
    });
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
                    image: downloadURL,
                    sellerId: auth.currentUser.uid,
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

// Add these at the very end of script.js
window.openAuthModal = () => {
    isSignUp = false; // Default to login
    document.getElementById('authTitle').innerText = "Login";
    document.getElementById('signupFields').classList.add('hidden');
    document.getElementById('toggleText').innerText = "Don't have an account? Sign Up";
    document.getElementById('authModal').classList.remove('hidden');
};

window.closeAuthModal = () => {
    document.getElementById('authModal').classList.add('hidden');
};

window.toggleAuthMode = () => {
    isSignUp = !isSignUp;
    const signupFields = document.getElementById('signupFields');
    const userPhone = document.getElementById('userPhone');
    const authTitle = document.getElementById('authTitle');
    const toggleText = document.getElementById('toggleText');

    authTitle.innerText = isSignUp ? "Sign Up" : "Login";
    toggleText.innerText = isSignUp ? "Already have an account? Login" : "Don't have an account? Sign Up";
    
    if (isSignUp) {
        signupFields.classList.remove('hidden');
        userPhone.setAttribute('required', ''); // Required for Sign Up
    } else {
        signupFields.classList.add('hidden');
        userPhone.removeAttribute('required'); // NOT required for Login
    }
};

window.handleLogout = () => {
    signOut(auth).then(() => {
        location.reload();
    });
};

window.handleAuth = handleAuth;