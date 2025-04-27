// API Configuration
const PETFINDER_API_KEY = 'qeixhxjPaQ6MHhM9hs7BtBZFGkotFNJ8sA4gEl0k1u3ybDfwqX';
const PETFINDER_SECRET = 'cExDbIgZeTCc7E4Ky5lUoxx1GeTgRNQ0B92RzFV8';
const PETFINDER_BASE_URL = 'https://api.petfinder.com/v2';

let accessToken = null;

// DOM Elements
const petsContainer = document.getElementById('pets-container');
const adoptedPetsContainer = document.getElementById('adopted-pets-container');
const searchBtn = document.getElementById('search-btn');
const animalTypeSelect = document.getElementById('animal-type');
const sizeSelect = document.getElementById('size');
const ageSelect = document.getElementById('age');
const genderSelect = document.getElementById('gender');

// Add fallback image URL at the top of the file
const FALLBACK_PET_IMAGE = 'https://t4.ftcdn.net/jpg/03/83/45/91/360_F_383459167_DHkr83LNgVkjHUFN8IAmAxnjBJUf7eVB.jpg';

// Get OAuth token from Petfinder
async function getAccessToken() {
    try {
        const response = await fetch('https://api.petfinder.com/v2/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: PETFINDER_API_KEY,
                client_secret: PETFINDER_SECRET
            })
        });

        if (!response.ok) {
            throw new Error('Failed to get access token');
        }

        const data = await response.json();
        accessToken = data.access_token;
        return accessToken;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// Fetch pets from Petfinder API
async function fetchPets(filters = {}) {
    try {
        petsContainer.innerHTML = '<div class="loading-message">Finding pets...</div>';
        if (!accessToken) {
            await getAccessToken();
        }

        const animalType = animalTypeSelect.value || 'dog';
        const size = sizeSelect.value;
        const age = ageSelect.value;
        const gender = genderSelect.value;

        let uniquePets = [];
        let seenIds = new Set();
        let page = 1;
        const desiredCount = 30;
        let morePages = true;

        while (uniquePets.length < desiredCount && morePages) {
            let queryParams = `type=${animalType}&status=adoptable&limit=20&page=${page}`;
            if (size) queryParams += `&size=${size}`;
            if (age) queryParams += `&age=${age}`;
            if (gender) queryParams += `&gender=${gender}`;

            const response = await fetch(`${PETFINDER_BASE_URL}/animals?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    await getAccessToken();
                    return fetchPets(filters);
                }
                throw new Error(`Failed to fetch pets: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            if (!data.animals || data.animals.length === 0) break;

            data.animals.forEach(pet => {
                if (!seenIds.has(pet.id)) {
                    uniquePets.push(pet);
                    seenIds.add(pet.id);
                }
            });

            // Check if there are more pages
            if (data.pagination && data.pagination.total_pages && page < data.pagination.total_pages) {
                page++;
            } else {
                morePages = false;
            }
        }

        displayPets(uniquePets.slice(0, desiredCount), petsContainer);
    } catch (error) {
        console.error('Error fetching pets:', error);
        petsContainer.innerHTML = `<p class="error-message">Failed to load pets: ${error.message}. Please try again later.</p>`;
    }
}

// Display pets in the grid
function displayPets(pets, container) {
    container.innerHTML = '';
    
    if (!pets || pets.length === 0) {
        container.innerHTML = '<p class="no-pets-message">No pets found matching your criteria.</p>';
        return;
    }

    // Deduplicate pets by ID
    const uniquePets = [];
    const seenIds = new Set();
    pets.forEach(pet => {
        if (!seenIds.has(pet.id)) {
            uniquePets.push(pet);
            seenIds.add(pet.id);
        }
    });

    uniquePets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card';
        petCard.dataset.id = pet.id;

        // Use fallback image if no image is available
        const imageUrl = pet.photos[0]?.medium || FALLBACK_PET_IMAGE;
        
        petCard.innerHTML = `
            <img src="${imageUrl}" alt="${pet.name || 'Pet'}" onerror="this.src='${FALLBACK_PET_IMAGE}'">
            <div class="pet-info">
                <h3>${pet.name || 'Unnamed Pet'}</h3>
                <div class="pet-details">
                    <p><strong>Type:</strong> ${pet.type || 'Unknown'}</p>
                    <p><strong>Breed:</strong> ${pet.breeds?.primary || 'Unknown'}</p>
                    <p><strong>Age:</strong> ${pet.age || 'Unknown'}</p>
                    <p><strong>Gender:</strong> ${pet.gender || 'Unknown'}</p>
                </div>
                <div class="pet-description">
                    ${pet.description || 'No description available.'}
                </div>
                <div class="pet-actions">
                    <button class="adopt-btn" data-pet-id="${pet.id}">Adopt Pet</button>
                </div>
            </div>
        `;
        container.appendChild(petCard);

        // Add click handler for the adopt button
        const adoptBtn = petCard.querySelector('.adopt-btn');
        adoptBtn.addEventListener('click', () => adoptPet(pet));
    });
}

// Search functionality
searchBtn.addEventListener('click', () => {
    fetchPets();
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchPets();
    fetchAdoptedPets();
    fetchFeaturedPets();
    displayFeaturedBreeds();
    setupNavigation();
    
    // Handle initial active state based on URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        scrollToSection(hash);
    }
});

// Add event listeners to pet cards
function addPetCardEventListeners() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const petId = e.currentTarget.dataset.petId;
            await toggleFavorite(petId);
        });
    });

    document.querySelectorAll('.adopt-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const petId = e.currentTarget.dataset.petId;
            await handleAdoption(petId);
        });
    });
}

// Toggle favorite status
async function toggleFavorite(petId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${PETFINDER_BASE_URL}/pets/${petId}/favorite`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const btn = document.querySelector(`.favorite-btn[data-pet-id="${petId}"]`);
            btn.classList.toggle('favorited');
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
    }
}

// Handle adoption process
async function handleAdoption(petId) {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        const response = await fetch(`${PETFINDER_BASE_URL}/pets/${petId}/adopt`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const btn = document.querySelector(`.adopt-btn[data-pet-id="${petId}"]`);
            btn.classList.add('adopted');
            btn.textContent = 'Adopted';
            btn.removeEventListener('click', handleAdoption);
        }
    } catch (error) {
        console.error('Error handling adoption:', error);
    }
}

// Handle pet adoption
async function adoptPet(pet) {
    try {
        // Open the exact pet's page on Petfinder
        if (pet.url) {
            window.open(pet.url, '_blank');
        } else {
            // Fallback to breed search if URL not available
            const breedName = encodeURIComponent(pet.breeds?.primary || pet.name);
            window.open(`https://www.petfinder.com/search/dogs-for-adoption/?breed=${breedName}`, '_blank');
        }

        // Add to adopted pets
        const response = await fetch('/api/adopt-pet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...pet,
                id: pet.id.toString() // Ensure ID is a string
            })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                // Update the button state
                const adoptBtn = document.querySelector(`.adopt-btn[data-pet-id="${pet.id}"]`);
                if (adoptBtn) {
                    adoptBtn.textContent = 'Adopted!';
                    adoptBtn.disabled = true;
                    adoptBtn.style.backgroundColor = '#ccc';
                }
                // Refresh adopted pets display
                await fetchAdoptedPets();
                
                // Show success message
                showSuccessMessage('Pet added to your adopted list!');
            }
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to adopt pet');
        }
    } catch (error) {
        console.error('Error adopting pet:', error);
        showErrorMessage(error.message || 'Failed to adopt pet. Please try again.');
    }
}

// Show success message
function showSuccessMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Show error message
function showErrorMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'error-message';
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    // Remove message after 3 seconds
    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

// Fetch and display adopted pets
async function fetchAdoptedPets() {
    try {
        const response = await fetch('/api/adopted-pets');
        if (response.ok) {
            const adoptedPets = await response.json();
            displayAdoptedPets(adoptedPets);
        }
    } catch (error) {
        console.error('Error fetching adopted pets:', error);
    }
}

// Display adopted pets
function displayAdoptedPets(pets) {
    const adoptedPetsContainer = document.getElementById('adopted-pets-container');
    if (!adoptedPetsContainer) return;

    adoptedPetsContainer.innerHTML = '';
    
    if (!pets || pets.length === 0) {
        adoptedPetsContainer.innerHTML = '<p class="no-pets-message">No adopted pets yet.</p>';
        return;
    }

    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'pet-card adopted';
        petCard.setAttribute('data-pet-id', pet.id); // Add data attribute for easier selection
        petCard.innerHTML = `
            <img src="${pet.photos[0]?.medium || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${pet.name}">
            <div class="pet-info">
                <h3>${pet.name}</h3>
                <div class="pet-details">
                    <p><strong>Age:</strong> ${pet.age || 'Not specified'}</p>
                    <p><strong>Breed:</strong> ${pet.breeds?.primary || 'Mixed Breed'}</p>
                    <p><strong>Size:</strong> ${pet.size || 'Not specified'}</p>
                    <p><strong>Gender:</strong> ${pet.gender || 'Not specified'}</p>
                    <p><strong>Location:</strong> ${pet.contact?.address?.city || 'Location not specified'}</p>
                </div>
                <div class="pet-description">
                    <p>${pet.description || 'No description available'}</p>
                </div>
                <div class="pet-actions">
                    <button class="remove-btn" data-pet-id="${pet.id}">Remove from Adopted</button>
                </div>
            </div>
        `;
        adoptedPetsContainer.appendChild(petCard);

        // Add click handler for the remove button
        const removeBtn = petCard.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
            if (confirm('Are you sure you want to remove this pet from your adopted list?')) {
                removeAdoptedPet(pet.id);
            }
        });
    });
}

// Remove pet from adopted list
async function removeAdoptedPet(petId) {
    try {
        // Show loading state for just this pet
        const petCard = document.querySelector(`.pet-card.adopted[data-pet-id="${petId}"]`);
        if (petCard) {
            petCard.innerHTML = '<div class="loading-message">Removing pet...</div>';
        }

        // Make sure petId is a string
        const stringPetId = petId.toString();

        // Make the DELETE request
        const response = await fetch(`/api/adopted-pets/${stringPetId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Check if the response is successful
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to remove pet');
        }

        // Parse the response
        const result = await response.json();

        // If successful, update the UI
        if (result.success) {
            // Remove just this pet card from the UI
            if (petCard) {
                petCard.remove();
            }

            // Reset the adopt button in the main pets list
            const adoptBtn = document.querySelector(`.adopt-btn[data-pet-id="${stringPetId}"]`);
            if (adoptBtn) {
                adoptBtn.textContent = 'Adopt Pet';
                adoptBtn.disabled = false;
                adoptBtn.style.backgroundColor = '#4CAF50';
            }

            // Show success message
            showSuccessMessage('Pet removed successfully');

            // Check if there are any remaining adopted pets
            const remainingPets = document.querySelectorAll('.pet-card.adopted');
            if (remainingPets.length === 0) {
                const adoptedPetsContainer = document.getElementById('adopted-pets-container');
                if (adoptedPetsContainer) {
                    adoptedPetsContainer.innerHTML = '<div class="no-pets-message">No adopted pets yet.</div>';
                }
            }
        } else {
            throw new Error(result.message || 'Failed to remove pet');
        }
    } catch (error) {
        console.error('Error removing pet:', error);
        showErrorMessage(error.message || 'Failed to remove pet. Please try again.');
        
        // Refresh the adopted pets list to ensure consistency
        try {
            await fetchAdoptedPets();
        } catch (fetchError) {
            console.error('Error refreshing adopted pets:', fetchError);
        }
    }
}

// Fetch and display featured pets
async function fetchFeaturedPets() {
    try {
        const featuredPetsContainer = document.getElementById('featured-pets-container');
        if (!featuredPetsContainer) return;

        // Show loading state
        featuredPetsContainer.innerHTML = '<div class="loading-message">Loading featured pets...</div>';

        if (!accessToken) {
            await getAccessToken();
        }

        // Fetch featured pets (we'll get a mix of different types)
        const response = await fetch(`${PETFINDER_BASE_URL}/animals?status=adoptable&limit=6`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch featured pets');
        }

        const data = await response.json();
        displayFeaturedPets(data.animals);
    } catch (error) {
        console.error('Error fetching featured pets:', error);
        const featuredPetsContainer = document.getElementById('featured-pets-container');
        if (featuredPetsContainer) {
            featuredPetsContainer.innerHTML = '<p class="error-message">Failed to load featured pets. Please try again later.</p>';
        }
    }
}

// Display featured pets
function displayFeaturedPets(pets) {
    const featuredPetsContainer = document.getElementById('featured-pets-container');
    if (!featuredPetsContainer) return;

    featuredPetsContainer.innerHTML = '';
    
    if (!pets || pets.length === 0) {
        featuredPetsContainer.innerHTML = '<p class="no-pets-message">No featured pets available at the moment.</p>';
        return;
    }

    pets.forEach(pet => {
        const petCard = document.createElement('div');
        petCard.className = 'featured-pet-card';
        petCard.setAttribute('data-pet-id', pet.id);
        
        // Add featured badge
        const badge = document.createElement('div');
        badge.className = 'featured-badge';
        badge.textContent = 'Featured';
        
        petCard.innerHTML = `
            <img src="${pet.photos[0]?.medium || 'https://via.placeholder.com/300x200?text=No+Image'}" alt="${pet.name}">
            <div class="featured-pet-info">
                <h3>${pet.name}</h3>
                <div class="featured-pet-details">
                    <p><strong>Type:</strong> ${pet.type || 'Not specified'}</p>
                    <p><strong>Age:</strong> ${pet.age || 'Not specified'}</p>
                    <p><strong>Breed:</strong> ${pet.breeds?.primary || 'Mixed Breed'}</p>
                    <p><strong>Location:</strong> ${pet.contact?.address?.city || 'Location not specified'}</p>
                </div>
                <div class="featured-pet-actions">
                    <button class="featured-adopt-btn" data-pet-id="${pet.id}">Adopt Me</button>
                </div>
            </div>
        `;
        
        // Add the badge to the card
        petCard.insertBefore(badge, petCard.firstChild);
        
        featuredPetsContainer.appendChild(petCard);

        // Add click handler for the adopt button
        const adoptBtn = petCard.querySelector('.featured-adopt-btn');
        adoptBtn.addEventListener('click', () => adoptPet(pet));
    });
}

// Featured breeds data with external links
const FEATURED_BREEDS = [
    {
        name: "Labrador Retriever",
        description: "Friendly, outgoing, and high-spirited companions who have more than enough affection to go around.",
        image: "https://images.unsplash.com/photo-1543857408-5e0c3c4f1a0a?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        link: "https://www.akc.org/dog-breeds/labrador-retriever/"
    },
    {
        name: "German Shepherd",
        description: "Intelligent, capable, and hardworking dogs that are among the most popular breeds.",
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        link: "https://www.akc.org/dog-breeds/german-shepherd-dog/"
    },
    {
        name: "Golden Retriever",
        description: "Intelligent, friendly, and devoted dogs that are great family pets.",
        image: "https://images.unsplash.com/photo-1633722715463-d30f4f325e24?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        link: "https://www.akc.org/dog-breeds/golden-retriever/"
    },
    {
        name: "French Bulldog",
        description: "Playful, smart, and adaptable dogs that are perfect for city living.",
        image: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60",
        link: "https://www.akc.org/dog-breeds/french-bulldog/"
    }
];

// Function to create breed card
function createBreedCard(breed) {
    const card = document.createElement('div');
    card.className = 'breed-card';
    
    card.innerHTML = `
        <img src="${breed.image}" alt="${breed.name}" onerror="this.src='${FALLBACK_PET_IMAGE}'">
        <h3>${breed.name}</h3>
        <p>${breed.description}</p>
        <a href="${breed.link}" target="_blank" class="breed-btn">
            <i class="fas fa-external-link-alt"></i> Learn More
        </a>
    `;

    return card;
}

// Function to display featured breeds
function displayFeaturedBreeds() {
    const breedsContainer = document.getElementById('breeds-container');
    breedsContainer.innerHTML = '';

    FEATURED_BREEDS.forEach(breed => {
        const breedCard = createBreedCard(breed);
        breedsContainer.appendChild(breedCard);
    });
}

// Function to search for a specific breed
function searchBreed(breedName) {
    const animalTypeSelect = document.getElementById('animal-type');
    animalTypeSelect.value = 'dog'; // Set to dog since we're showing dog breeds
    fetchPets({ breed: breedName });
    window.scrollTo({ top: document.getElementById('pets').offsetTop, behavior: 'smooth' });
}

// Navigation functionality
function setupNavigation() {
    // Header navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });

    // Footer navigation
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href').substring(1);
            scrollToSection(targetId);
        });
    });
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const headerHeight = document.querySelector('.navbar').offsetHeight;
        const sectionPosition = section.offsetTop - headerHeight;
        
        window.scrollTo({
            top: sectionPosition,
            behavior: 'smooth'
        });

        // Update active state in navigation
        updateActiveNavLink(sectionId);
    }
}

// Update active navigation link
function updateActiveNavLink(sectionId) {
    // Update header navigation
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });

    // Update footer navigation
    const footerLinks = document.querySelectorAll('.footer-links a');
    footerLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
        }
    });
}

// Initialize navigation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    displayFeaturedBreeds();
    
    // Handle initial active state based on URL hash
    const hash = window.location.hash.substring(1);
    if (hash) {
        scrollToSection(hash);
    }
});