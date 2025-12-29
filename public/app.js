const ANALIST_URL = 'https://graphql.anilist.co';
let popularPage = 1;
let isFetchingPopular = false;
let hasNextPage = true;

document.addEventListener('DOMContentLoaded', () => {
    // Add mobile header
    if (window.innerWidth <= 600) {
        createMobileHeader();
    }
    fetchTrending();
    fetchPopular();
    setupSearch();
    setupInfiniteScroll();

    // Sidebar Toggle
    const sidebar = document.querySelector('.sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mainContent = document.querySelector('main');

    if (sidebarToggle && sidebar) {
        sidebarToggle.addEventListener('click', () => {
            if (window.innerWidth <= 600) {
                sidebar.classList.toggle('open');
            } else {
                sidebar.classList.toggle('collapsed');
                if (mainContent) mainContent.classList.toggle('expanded');
            }
        });
    }

    // Close sidebar on link click (mobile)
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 600) {
                sidebar.classList.remove('open');
            }
        });
    });

    const exploreBtn = document.querySelector('.btn-primary');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', () => {
            const trendingSection = document.getElementById('trending');
            if (trendingSection) trendingSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Modal Logic
    const modal = document.getElementById('learn-more-modal');
    const learnMoreBtn = document.querySelector('.btn-secondary');
    const closeBtn = document.getElementById('close-modal-btn');

    if (modal && learnMoreBtn && closeBtn) {
        learnMoreBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        const closeModal = () => {
            modal.classList.remove('active');
        };

        closeBtn.addEventListener('click', closeModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }
});

async function fetchAniList(query, variables) {
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    };
    const response = await fetch(ANALIST_URL, options);
    const data = await response.json();
    return data.data;
}

async function fetchTrending() {
    const query = `
        query {
            Page(page: 1, perPage: 12) {
                media(type: ANIME, sort: TRENDING_DESC) {
                    id
                    title { romaji english }
                    coverImage { large extraLarge }
                    averageScore
                    format
                }
            }
        }
    `;
    try {
        const data = await fetchAniList(query);
        renderGrid('trending-grid', data.Page.media, false);
    } catch (error) {
        console.error('Error fetching trending:', error);
    }
}

async function fetchPopular() {
    if (isFetchingPopular || !hasNextPage) return;
    isFetchingPopular = true;

    const query = `
        query ($page: Int) {
            Page(page: $page, perPage: 15) {
                pageInfo {
                    hasNextPage
                }
                media(type: ANIME, sort: POPULARITY_DESC) {
                    id
                    title { romaji english }
                    coverImage { large extraLarge }
                    averageScore
                    format
                }
            }
        }
    `;
    try {
        const data = await fetchAniList(query, { page: popularPage });
        hasNextPage = data.Page.pageInfo.hasNextPage;
        renderGrid('popular-grid', data.Page.media, true);
        popularPage++;
    } catch (error) {
        console.error('Error fetching popular:', error);
    } finally {
        isFetchingPopular = false;
    }
}

function setupInfiniteScroll() {
    const sentinel = document.getElementById('load-more-sentinel');
    if (!sentinel) return;
    const observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
            fetchPopular();
        }
    }, { threshold: 0.1 });

    observer.observe(sentinel);
}

function setupSearch() {
    const searchInput = document.getElementById('anime-search');
    if (!searchInput) return;

    const handleSearch = async () => {
        const queryText = searchInput.value.trim();
        if (queryText.length < 2) return;

        hasNextPage = false;
        const trendingSection = document.getElementById('trending');
        if (trendingSection) trendingSection.style.display = 'none';

        const popularHeader = document.querySelector('#popular h2');
        if (popularHeader) popularHeader.textContent = `Search Results: ${queryText}`;

        const popularGrid = document.getElementById('popular-grid');
        if (popularGrid) popularGrid.innerHTML = '<div class="skeleton-card"></div>'.repeat(5);

        const query = `
            query ($search: String) {
                Page(page: 1, perPage: 20) {
                    media(search: $search, type: ANIME) {
                        id
                        title { romaji english }
                        coverImage { large extraLarge }
                        averageScore
                        format
                    }
                }
            }
        `;
        try {
            const data = await fetchAniList(query, { search: queryText });
            renderGrid('popular-grid', data.Page.media, false);
            const popularSection = document.getElementById('popular');
            if (popularSection) window.scrollTo({ top: popularSection.offsetTop - 100, behavior: 'smooth' });
        } catch (error) {
            console.error('Error searching:', error);
        }
    };

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
}

function renderGrid(containerId, mediaList, append = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (!append) container.innerHTML = '';

    mediaList.forEach(anime => {
        const card = document.createElement('div');
        card.className = 'anime-card';
        const title = anime.title.english || anime.title.romaji;
        card.innerHTML = `
            <img class="card-img" src="${anime.coverImage.extraLarge || anime.coverImage.large}" alt="${title}" loading="lazy">
            <div class="card-info">
                <h3 class="card-title">${title}</h3>
                <div class="card-meta">
                    <span>${anime.format || 'ANIME'}</span>
                    <span>★ ${anime.averageScore ? anime.averageScore + '%' : 'N/A'}</span>
                </div>
            </div>
        `;
        card.addEventListener('click', () => {
            window.location.href = `info.html?id=${anime.id}`;
        });
        container.appendChild(card);
    });
}

// ---- Mobile Header ----
function createMobileHeader() {
    const header = document.createElement('header');
    header.className = 'mobile-header';
    header.innerHTML = `
        <button id="sidebar-toggle" class="hamburger" aria-label="Menu">
          <span></span><span></span><span></span>
        </button>
        <a href="index.html" class="mobile-logo"><img src="Netame-logo.png" alt="NETAME" /></a>
        <nav class="mobile-nav">
          <a href="index.html">Home</a>
          <a href="movies.html">Movies</a>
          <a href="tv.html">TV</a>
          <a href="schedule.html">Schedule</a>
        </nav>`;
    document.body.prepend(header);

    // Inject CSS only once
    if (!document.getElementById('mobile-header-css')) {
        const style = document.createElement('style');
        style.id = 'mobile-header-css';
        style.textContent = `
        @media(max-width:600px){
          .mobile-header{display:flex;align-items:center;justify-content:space-between;height:60px;width:100%;position:fixed;top:0;left:0;padding:0 1rem;z-index:10000;background:rgba(5,5,5,.9);backdrop-filter:blur(15px);border-bottom:1px solid var(--border-color);}  
          .mobile-logo img{height:38px}
          .hamburger{background:none;border:none;display:flex;flex-direction:column;gap:4px;cursor:pointer;padding:0}
          .hamburger span{width:24px;height:2px;background:#fff;transition:transform .3s}
          .mobile-nav{display:flex;gap:0.8rem}
          .mobile-nav a{color:#fff;text-decoration:none;font-size:.85rem}
        }
        @media(min-width:601px){.mobile-header{display:none}}
        `;
        document.head.appendChild(style);
    }

    // add toggle for mobile button
    const sidebar = document.querySelector('.sidebar');
    const mobileBtn = header.querySelector('#mobile-menu-btn');
    if (sidebar && mobileBtn) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('open');
        });
    }
}
