// You should move your 'const books = [...]' array to a separate file 
// called data.js and link it to both HTML files so they share the same data.

const books = [ /* ... your same book array here ... */ ];

// 1. Get the ID from the URL (e.g., ?id=1)
const urlParams = new URLSearchParams(window.location.search);
const bookId = parseInt(urlParams.get('id'));

// 2. Find the book
const book = books.find(b => b.id === bookId);

// 3. Display the book
if (book) {
    document.getElementById('product-detail-content').innerHTML = `
        <div class="product-container">
            <div class="main-img">
                <img src="${book.image}" style="width:100%; border-radius:12px;">
            </div>
            <div class="product-specs">
                <h1>${book.title}</h1>
                <p class="author">By ${book.author}</p>
                <p class="price-tag">$${book.price}</p>
                <div class="detail-grid">
                    <p><strong>Course:</strong> ${book.code}</p>
                    <p><strong>Condition:</strong> ${book.condition}</p>
                </div>
                <button class="buy-btn large">Message Seller</button>
            </div>
        </div>
    `;
    
    // Save to Recently Viewed (LocalStorage so it persists across pages)
    updateHistory(book);
}

function updateHistory(book) {
    let history = JSON.parse(localStorage.getItem('recentBooks')) || [];
    // Remove if already exists, then add to front
    history = history.filter(item => item.id !== book.id);
    history.unshift(book);
    if(history.length > 4) history.pop();
    
    localStorage.setItem('recentBooks', JSON.stringify(history));
    renderHistory(history);
}

function renderHistory(history) {
    const grid = document.getElementById('historyGrid');
    grid.innerHTML = history.map(b => `
        <div class="mini-card">
            <a href="product.html?id=${b.id}">
                <img src="${b.image}" width="100">
                <p>${b.title}</p>
            </a>
        </div>
    `).join('');
}