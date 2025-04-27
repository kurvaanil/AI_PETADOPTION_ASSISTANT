const API_KEY = process.env.NEW_API_KEY;
const BASE_URL = 'https://api.thedogapi.com/v1';

const headers = {
    'x-api-key': API_KEY,
    'Content-Type': 'application/json'
};

// Add CORS headers to allow API requests
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, x-api-key');
    next();
});

// Test function to verify API key
async function testApiKey() {
    try {
        const response = await fetch(`${BASE_URL}/breeds`, { headers });
        if (response.ok) {
            console.log('✅ API Key is working!');
            const data = await response.json();
            console.log(`Found ${data.length} breeds`);
        } else {
            console.error('❌ API Key test failed:', response.status, response.statusText);
        }
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

// Run the test
testApiKey();

export const dogApi = {
    // Get all breeds
    async getBreeds() {
        try {
            const response = await fetch(`${BASE_URL}/breeds`, {
                headers,
                mode: 'cors'
            });
            if (!response.ok) {
                console.error('API Error:', response.status, response.statusText);
                throw new Error('Failed to fetch breeds');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching breeds:', error);
            throw error;
        }
    },

    // Search breeds
    async searchBreeds(query) {
        try {
            const response = await fetch(`${BASE_URL}/breeds/search?q=${query}`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to search breeds');
            return await response.json();
        } catch (error) {
            console.error('Error searching breeds:', error);
            throw error;
        }
    },

    // Get breed images
    async getBreedImages(breedId) {
        try {
            const response = await fetch(`${BASE_URL}/images/search?breed_id=${breedId}&limit=5`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch breed images');
            return await response.json();
        } catch (error) {
            console.error('Error fetching breed images:', error);
            throw error;
        }
    },

    // Get random dog images
    async getRandomDogs(limit = 10) {
        try {
            const response = await fetch(`${BASE_URL}/images/search?limit=${limit}`, {
                headers
            });
            if (!response.ok) throw new Error('Failed to fetch random dogs');
            return await response.json();
        } catch (error) {
            console.error('Error fetching random dogs:', error);
            throw error;
        }
    }
}; 