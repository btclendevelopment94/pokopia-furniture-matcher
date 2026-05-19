document.addEventListener('DOMContentLoaded', () => {
    let allPokemon = [];
    let allItems = [];

    const selectors = document.querySelectorAll('.pkmn-select');

    async function loadData() {
        try {
            // Version queries bumped to v=1.4
            const pkmnResponse = await fetch('pokemon.json?v=1.5');
            allPokemon = await pkmnResponse.json();

            const itemResponse = await fetch('items.json?v=1.5');
            allItems = await itemResponse.json();

            populateDropdowns();
            updateDisplay();
        } catch (error) {
            console.error("Critical Error: JSON files could not be loaded. Check file names and locations.", error);
        }
    }

    function populateDropdowns() {
        const datalist = document.getElementById('pokemon-options');
        if (!datalist) return;
        datalist.innerHTML = "";

        allPokemon.forEach(pkmn => {
            let option = document.createElement('option');
            option.value = pkmn.name;
            datalist.appendChild(option);
        });
    }

    selectors.forEach((select) => {
        select.addEventListener('input', () => {
            updateDisplay();
        });
    });

    function updateDisplay() {
        const selectedPkmnObjects = [];

        selectors.forEach((select, index) => {
            const infoDiv = document.getElementById(`info-${index + 1}`);
            if (!infoDiv) return;

            const name = select.value.trim().toLowerCase();
            const pkmn = allPokemon.find(p => p.name.toLowerCase() === name);

            if (pkmn) {
                selectedPkmnObjects.push(pkmn);
                infoDiv.innerHTML = `
                    <div><strong>No.</strong> ${pkmn.pokedex} | <strong>Habitat:</strong> ${pkmn.habitat}</div>
                    <div class="fav-list">
                        <div class="fav-title">Favorites:</div>
                        ${pkmn.favorites.join(", ")}
                    </div>
                `;
            } else {
                infoDiv.innerHTML = "";
            }
        });

        renderItems(selectedPkmnObjects);
        checkHabitatConflicts(selectedPkmnObjects);
    }

    function checkHabitatConflicts(selectedPkmn) {
        const banner = document.getElementById('conflict-banner');
        const messageEl = document.getElementById('conflict-message');

        if (!banner || !messageEl) return;

        const currentHabitats = [...new Set(selectedPkmn.map(p => p.habitat.toLowerCase()))];
        let conflictsFound = [];

        if (currentHabitats.includes('bright') && currentHabitats.includes('dark')) {
            conflictsFound.push("<strong>Bright</strong> and <strong>Dark</strong> preferences clash!");
        }
        if (currentHabitats.includes('warm') && currentHabitats.includes('cool')) {
            conflictsFound.push("<strong>Warm</strong> and <strong>Cool</strong> preferences clash!");
        }
        if (currentHabitats.includes('dry') && currentHabitats.includes('humid')) {
            conflictsFound.push("<strong>Dry</strong> and <strong>Humid</strong> preferences clash!");
        }

        if (conflictsFound.length > 0) {
            messageEl.innerHTML = `<strong>Habitat Conflict Warning:</strong> ${conflictsFound.join(" | ")}`;
            banner.style.display = "flex";
        } else {
            banner.style.display = "none";
        }
    }

    function renderItems(selectedPkmn) {
        const columnIds = ["list-Relaxation", "list-Decoration", "list-Toy"];
        columnIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.innerHTML = "";
        });

        if (selectedPkmn.length === 0) return;

        let matchedItems = [];

        allItems.forEach(item => {
            let matchCount = 0;

            selectedPkmn.forEach(pkmn => {
                const isMatch = item.tags && item.tags.some(tag =>
                    pkmn.favorites.some(fav => fav.toLowerCase() === tag.toLowerCase())
                );

                if (isMatch) matchCount++;
            });

            if (matchCount > 0) {
                matchedItems.push({ ...item, matchCount: matchCount });
            }
        });

        matchedItems.sort((a, b) => b.matchCount - a.matchCount);

        matchedItems.forEach(matchedItem => {
            displayItem(matchedItem, matchedItem.matchCount, selectedPkmn);
        });
    }

    function displayItem(item, matchCount, selectedPkmn) {
        let typeId = item.type;
        if (typeId === "Toys") typeId = "Toy";

        const list = document.getElementById(`list-${typeId}`);
        if (!list) return;

        const totalSelected = selectedPkmn.length;

        const matchingNames = selectedPkmn
            .filter(pkmn => item.tags && item.tags.some(tag =>
                pkmn.favorites.some(fav => fav.toLowerCase() === tag.toLowerCase())
            ))
            .map(pkmn => pkmn.name)
            .join(", ");

        const itemCard = document.createElement('div');
        itemCard.className = 'item-card';

        if (totalSelected === 2 && matchCount === 2) {
            itemCard.classList.add('match-perfect');
        } else if (totalSelected >= 3) {
            if (matchCount === totalSelected) {
                itemCard.classList.add('match-perfect');
            } else if (matchCount >= 2) {
                itemCard.classList.add('match-partial');
            }
        }

        itemCard.innerHTML = `
            <div class="item-header">
                <span class="item-title">${item.name}</span>
                <span class="match-badge">${matchCount}/${totalSelected}</span>
            </div>
            <div class="item-details">
                <span class="item-category">${item.tags.join(" / ")}</span>
                <div class="matched-pokemon">Matches: ${matchingNames}</div>
            </div>
        `;

        list.appendChild(itemCard);
    }

    // --- RESET WORKSPACE LOGIC ---
    const clearAllBtn = document.getElementById('clear-all-btn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', () => {
            selectors.forEach(select => {
                select.value = "";
            });
            updateDisplay();
        });
    }

    // --- THEME TOGGLE LOGIC ---
    const themeBtn = document.getElementById('theme-toggle');
    if (themeBtn) {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
        }

        themeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const currentTheme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
            localStorage.setItem('theme', currentTheme);
        });
    }

    loadData();
});