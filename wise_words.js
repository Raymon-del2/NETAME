async function fetchWiseWord() {
    const container = document.getElementById('wise-words');
    if (!container) return;

    // Fallback list of quotes
    const quotes = [
        { quote: "Power comes in response to a need, not a desire. You have to create that need.", anime: "Dragon Ball Z" },
        { quote: "The world isn't perfect. But it's there for us, doing the best it can... that's what makes it so damn beautiful.", anime: "Fullmetal Alchemist" },
        { quote: "Fear is not evil. It tells you what your weakness is. And once you know your weakness, you can become stronger as well as kinder.", anime: "Fairy Tail" },
        { quote: "Whatever you lose, you'll find it again. But what you throw away you'll never get back.", anime: "Rurouni Kenshin" },
        { quote: "Human beings are strong because we have the ability to change ourselves.", anime: "One Punch Man" },
        { quote: "If you don't take risks, you can't create a future.", anime: "One Piece" },
        { quote: "Hard work betrays none, but dreams betray many.", anime: "Oregairu" }
    ];

    // Try to fetch from API, else fallback
    try {
        const response = await fetch('https://animechan.xyz/api/random');
        if (!response.ok) throw new Error('API failed');
        const data = await response.json();
        renderQuote(data.quote, data.anime);
    } catch (e) {
        // Use random fallback
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        renderQuote(randomQuote.quote, randomQuote.anime);
    }

    function renderQuote(text, anime) {
        container.innerHTML = `
            <div class="wise-words-quote">${text}</div>
            <div class="wise-words-anime">- ${anime}</div>
        `;
    }
}
