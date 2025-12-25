const ANALIST_URL = 'https://graphql.anilist.co';
let popularPage = 1;
let isFetchingPopular = false;
let hasNextPage = true;

document.addEventListener('DOMContentLoaded', () => {
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
            sidebar.classList.toggle('collapsed');
            if (mainContent) mainContent.classList.toggle('expanded');
        });
    }

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
