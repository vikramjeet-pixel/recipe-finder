// Spoonacular API Key (Updated)
const API_KEY = '1ba84c64f3b84698bba6ff8eeb29057f';
const BASE_URL = 'https://api.spoonacular.com/recipes';

// Supported cuisines
const cuisines = [
    "all", "African", "American", "British", "Cajun", "Caribbean", "Chinese", 
    "Eastern European", "European", "French", "German", "Greek", "Indian", 
    "Irish", "Italian", "Japanese", "Jewish", "Korean", "Latin American", 
    "Mediterranean", "Mexican", "Middle Eastern", "Nordic", "Southern", 
    "Spanish", "Thai", "Vietnamese"
];

// Mock data for fallback if API fails
const mockRecipes = [
    {
        id: 1,
        title: "Mock Spaghetti",
        image: "https://via.placeholder.com/100",
        cuisine: "Italian"
    },
    {
        id: 2,
        title: "Mock Tacos",
        image: "https://via.placeholder.com/100",
        cuisine: "Mexican"
    }
];

// Populate cuisine dropdown
function populateCuisineFilter() {
    const select = document.getElementById('cuisine-filter');
    const formSelect = document.getElementById('recipe-cuisine');
    const options = cuisines.map(cuisine => 
        `<option value="${cuisine}">${cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}</option>`
    ).join('');

    if (select) select.innerHTML = options;
    if (formSelect) formSelect.innerHTML = `<option value="">Select Cuisine</option>${options}`;
}

// Fetch recipes from Spoonacular with fallback
async function fetchRecipes(query = '', cuisine = 'all') {
    try {
        const url = `${BASE_URL}/complexSearch?apiKey=${API_KEY}&query=${query}${cuisine !== 'all' ? `&cuisine=${cuisine}` : ''}&number=10`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.results) {
            throw new Error('No results in API response');
        }
        return data.results;
    } catch (error) {
        console.error('Error fetching recipes:', error.message);
        return mockRecipes.map(recipe => ({
            ...recipe,
            cuisine: cuisine === 'all' ? recipe.cuisine : cuisine
        }));
    }
}

// Fetch recipe details with fallback
async function fetchRecipeDetails(id) {
    try {
        const url = `${BASE_URL}/${id}/information?apiKey=${API_KEY}&includeNutrition=false`;
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`API request failed with status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching recipe details:', error.message);
        return {
            id,
            title: "Mock Recipe Details",
            image: "https://via.placeholder.com/200",
            readyInMinutes: 30,
            servings: 4,
            extendedIngredients: [
                { amount: 1, unit: "cup", name: "Mock Ingredient 1" },
                { amount: 2, unit: "tbsp", name: "Mock Ingredient 2" }
            ],
            instructions: "1. Mock step 1\n2. Mock step 2",
            sourceUrl: "#"
        };
    }
}

// Load recipes with search and filter
async function loadRecipes() {
    const container = document.getElementById('recipe-container');
    const filter = document.getElementById('cuisine-filter');
    const searchBar = document.getElementById('search-bar');
    if (!container || !filter || !searchBar) return;

    async function updateRecipes() {
        container.innerHTML = '<p>Loading recipes...</p>';
        const query = searchBar.value.trim();
        const selectedCuisine = filter.value;
        const recipes = await fetchRecipes(query, selectedCuisine);
        
        container.innerHTML = recipes.length > 0 ? recipes.map(recipe => `
            <div class="recipe-card animate__animated animate__fadeIn">
                <h3>${recipe.title}</h3>
                <img src="${recipe.image || 'https://via.placeholder.com/100'}" alt="${recipe.title}" style="max-width: 100px;">
                <p>Cuisine: ${selectedCuisine === 'all' ? (recipe.cuisine || 'Various') : selectedCuisine}</p>
                <a href="details.html?id=${recipe.id}" class="button">View Recipe</a>
            </div>
        `).join('') : '<p>No recipes found! Try a different search or cuisine.</p>';
    }

    filter.addEventListener('change', updateRecipes);
    searchBar.addEventListener('input', debounce(updateRecipes, 500));
    updateRecipes();
}

// Load recipe details
async function loadRecipeDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const recipeId = urlParams.get('id');
    if (!recipeId) {
        document.getElementById('recipe-content').innerHTML = '<p>Error: No recipe ID provided.</p>';
        return;
    }

    const recipe = await fetchRecipeDetails(recipeId);
    const titleEl = document.getElementById('recipe-title');
    const contentEl = document.getElementById('recipe-content');

    if (titleEl && contentEl) {
        const ingredients = recipe.extendedIngredients ? recipe.extendedIngredients.map(ing => `${ing.amount} ${ing.unit} ${ing.name}`).join('\n') : 'Ingredients not available';
        titleEl.textContent = recipe.title || 'Recipe Title Not Available';
        contentEl.innerHTML = `
            <img src="${recipe.image || 'https://via.placeholder.com/200'}" alt="${recipe.title}">
            <p><strong>Ready in:</strong> ${recipe.readyInMinutes || 'N/A'} minutes</p>
            <p><strong>Servings:</strong> ${recipe.servings || 'N/A'}</p>
            <p><strong>Ingredients:</strong></p>
            <pre>${ingredients}</pre>
            <p><strong>Instructions:</strong></p>
            <pre>${recipe.instructions || 'Instructions not available'}</pre>
            <p><a href="${recipe.sourceUrl || '#'}" target="_blank">View Original Recipe</a></p>
        `;
    }
}

// Theme Toggle
function setupThemeToggle() {
    const themeButton = document.getElementById('theme-toggle');
    if (!themeButton) return;

    const currentTheme = localStorage.getItem('theme') || 'light';
    if (currentTheme === 'dark') document.body.classList.add('dark-theme');

    themeButton.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const newTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
    });
}

// Convert image file to Base64 with size limit
async function readImageAsBase64(file) {
    if (!file) return 'https://via.placeholder.com/100';

    // Limit file size to 1MB to prevent localStorage issues
    const MAX_SIZE = 1 * 1024 * 1024; // 1MB in bytes
    if (file.size > MAX_SIZE) {
        alert('Image size exceeds 1MB. Please upload a smaller image.');
        return 'https://via.placeholder.com/100';
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

// Add Recipe Form Handling with Image Upload
async function setupAddRecipeForm() {
    const form = document.getElementById('add-recipe-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = Date.now().toString();
        const title = document.getElementById('recipe-title').value;
        const cuisine = document.getElementById('recipe-cuisine').value;
        const imageInput = document.getElementById('recipe-image');
        const ingredients = document.getElementById('recipe-ingredients').value;
        const instructions = document.getElementById('recipe-instructions').value;
        const time = document.getElementById('recipe-time').value;
        const servings = document.getElementById('recipe-servings').value;

        let image = 'https://via.placeholder.com/100';
        if (imageInput.files && imageInput.files[0]) {
            try {
                image = await readImageAsBase64(imageInput.files[0]);
            } catch (error) {
                console.error('Error reading image:', error);
                alert('Failed to upload image. Using placeholder instead.');
            }
        }

        const newRecipe = {
            id,
            title,
            cuisine,
            image,
            ingredients: ingredients.split('\n').filter(item => item.trim() !== ''),
            instructions,
            readyInMinutes: time,
            servings
        };

        // Save to localStorage with error handling
        try {
            const recipes = JSON.parse(localStorage.getItem('newRecipes') || '[]');
            recipes.push(newRecipe);
            const dataString = JSON.stringify(recipes);
            if (dataString.length > 5 * 1024 * 1024) {
                alert('Local storage is full! Please clear some recipes.');
                return;
            }
            localStorage.setItem('newRecipes', dataString);
            alert('Recipe added! Check "New Recipes" to view.');
            form.reset();
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            alert('Failed to save recipe. Local storage might be full.');
        }
    });
}

// Load newly added recipes
function loadNewRecipes() {
    const container = document.getElementById('new-recipe-container');
    if (!container) return;

    try {
        const recipes = JSON.parse(localStorage.getItem('newRecipes') || '[]');
        container.innerHTML = recipes.length > 0 ? recipes.map(recipe => `
            <div class="recipe-card animate__animated animate__fadeIn">
                <h3>${recipe.title}</h3>
                <img src="${recipe.image}" alt="${recipe.title}" style="max-width: 100px;">
                <p>Cuisine: ${recipe.cuisine}</p>
                <p><strong>Ready in:</strong> ${recipe.readyInMinutes} minutes</p>
                <p><strong>Servings:</strong> ${recipe.servings}</p>
                <p><strong>Ingredients:</strong></p>
                <pre>${recipe.ingredients.join('\n')}</pre>
                <p><strong>Instructions:</strong></p>
                <pre>${recipe.instructions}</pre>
            </div>
        `).join('') : '<p>No new recipes added yet!</p>';
    } catch (error) {
        console.error('Error loading new recipes:', error);
        container.innerHTML = '<p>Error loading new recipes. Please try again.</p>';
    }
}

// Debounce function for search
function debounce(func, delay) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), delay);
    };
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    populateCuisineFilter();
    setupThemeToggle();
    setupAddRecipeForm();
    if (document.getElementById('recipe-container')) loadRecipes();
    if (document.getElementById('recipe-title')) loadRecipeDetails();
    if (document.getElementById('new-recipe-container')) loadNewRecipes();
});