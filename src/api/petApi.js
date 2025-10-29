import axios from 'axios';
import { MOCK_PETS, MOCK_PET_SPECIES, MOCK_PET_BREEDS, MOCK_PET_GROUPS } from './mockData';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = () => {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
};

// Auth helper
const getCurrentUser = () => {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
};

// Permission check
const checkPermission = (user, permission) => {
    if (!user) return false;

    const rolePermissions = {
        'customer': [],
        'working_staff': ['pet_view_all', 'pet_management'],
        'manager': ['pet_view_all', 'pet_management'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// ==========  PET API ==========

/**
 * Get all pets (match official API structure)
 * @returns {Promise<Object>} { success: boolean, data: Array, pagination: Object }
 */
const getPets = async (params = {}) => {
    await delay(300);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_view_all')) {
        throw new Error('Không có quyền xem danh sách thú cưng');
    }

    const {
        page_index = 0,
        page_size = 10,
        search = '',
        species_id = null,
        breed_id = null,
        group_id = null
    } = params;

    let pets = [...MOCK_PETS].filter(p => !p.is_deleted);

    // Filter by search
    if (search) {
        const searchLower = search.toLowerCase();
        pets = pets.filter(p =>
            p.name.toLowerCase().includes(searchLower) ||
            p.color?.toLowerCase().includes(searchLower)
        );
    }

    // Filter by species
    if (species_id) {
        pets = pets.filter(p => p.species_id === species_id);
    }

    // Filter by breed
    if (breed_id) {
        pets = pets.filter(p => p.breed_id === breed_id);
    }

    // Filter by group
    if (group_id) {
        pets = pets.filter(p => p.group_id === group_id);
    }

    const total_items_count = pets.length;
    const total_pages_count = Math.ceil(total_items_count / page_size);
    const start = page_index * page_size;
    const paginatedPets = pets.slice(start, start + page_size);

    // Populate nested objects for list view
    const petsWithNestedData = paginatedPets.map(pet => ({
        ...pet,
        species: pet.species_id ? MOCK_PET_SPECIES.find(s => s.id === pet.species_id) || null : null,
        breed: pet.breed_id ? MOCK_PET_BREEDS.find(b => b.id === pet.breed_id) || null : null,
        group: pet.group_id ? MOCK_PET_GROUPS.find(g => g.id === pet.group_id) || null : null
    }));

    return {
        success: true,
        data: petsWithNestedData,
        pagination: {
            total_items_count,
            page_size,
            total_pages_count,
            page_index,
            has_next: page_index < total_pages_count - 1,
            has_previous: page_index > 0
        }
    };
};

/**
 * Get pet by ID
 * @param {string} petId
 * @returns {Promise<Object>}
 */
const getPetById = async (petId) => {
    await delay(200);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_view_all')) {
        throw new Error('Không có quyền xem thông tin thú cưng');
    }

    const pet = MOCK_PETS.find(p => p.id === petId && !p.is_deleted);

    if (!pet) {
        throw new Error('Không tìm thấy thú cưng');
    }

    return {
        success: true,
        data: pet
    };
};

/**
 * Add new pet (group_id is NOT allowed in create API)
 * @param {Object} petData - { name, age, species_id, breed_id, color, weight, preferences, special_notes, image_url, arrival_date, gender }
 * @returns {Promise<Object>}
 */
const addPet = async (petData) => {
    await delay(500);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền thêm thú cưng');
    }

    const newPet = {
        id: generateId(),
        name: petData.name,
        age: petData.age,
        species_id: petData.species_id,
        breed_id: petData.breed_id,
        color: petData.color,
        weight: petData.weight,
        preferences: petData.preferences || '',
        special_notes: petData.special_notes || '',
        image_url: petData.image_url || '',
        arrival_date: petData.arrival_date || new Date().toISOString(),
        gender: petData.gender,
        // group_id is NOT in create API - will be null
        group_id: null,
        // Nested objects are null (match API)
        species: null,
        breed: null,
        group: null,
        health_records: [],
        vaccination_records: [],
        vaccination_schedules: [],
        slots: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PETS.push(newPet);

    return {
        success: true,
        data: newPet,
        message: 'Thêm thú cưng thành công'
    };
};

/**
 * Update pet (group_id is allowed in edit API)
 * @param {string} petId
 * @param {Object} updates - { name, age, species_id, breed_id, color, weight, preferences, special_notes, image_url, arrival_date, gender, group_id }
 * @returns {Promise<Object>}
 */
const updatePet = async (petId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật thú cưng');
    }

    const petIndex = MOCK_PETS.findIndex(p => p.id === petId && !p.is_deleted);

    if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
    }

    const updatedPet = {
        ...MOCK_PETS[petIndex],
        ...updates,
        // Handle group_id update (can be set/changed in edit)
        group_id: updates.group_id !== undefined ? (updates.group_id || null) : MOCK_PETS[petIndex].group_id,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        // Keep nested objects as null (match API)
        species: null,
        breed: null,
        group: null
    };

    MOCK_PETS[petIndex] = updatedPet;

    return {
        success: true,
        data: updatedPet,
        message: 'Cập nhật thú cưng thành công'
    };
};

/**
 * Delete pet (soft delete)
 * @param {string} petId
 * @returns {Promise<Object>}
 */
const deletePet = async (petId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa thú cưng');
    }

    const petIndex = MOCK_PETS.findIndex(p => p.id === petId && !p.is_deleted);

    if (petIndex === -1) {
        throw new Error('Không tìm thấy thú cưng');
    }

    MOCK_PETS[petIndex].is_deleted = true;
    MOCK_PETS[petIndex].updated_at = new Date().toISOString();
    MOCK_PETS[petIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa thú cưng thành công'
    };
};

// ========== PET SPECIES API ==========

/**
 * Get all pet species (Loài)
 * @returns {Promise<Object>}
 */
const getPetSpecies = async () => {
    await delay(200);

    return {
        success: true,
        data: MOCK_PET_SPECIES.filter(s => !s.is_deleted),
        pagination: {
            total_items_count: MOCK_PET_SPECIES.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

// ========== PET BREEDS API ==========

/**
 * Get all pet breeds (Giống) - List view populates species for UI
 * @param {string} speciesId - Optional filter by species
 * @returns {Promise<Object>}
 */
const getPetBreeds = async (speciesId = null) => {
    await delay(200);

    let breeds = [...MOCK_PET_BREEDS].filter(b => !b.is_deleted);

    if (speciesId) {
        breeds = breeds.filter(b => b.species_id === speciesId);
    }

    // Populate species for list view (detail view has species = null)
    const breedsWithSpecies = breeds.map(breed => ({
        ...breed,
        species: breed.species_id ? MOCK_PET_SPECIES.find(s => s.id === breed.species_id) || null : null
    }));

    return {
        success: true,
        data: breedsWithSpecies,
        pagination: {
            total_items_count: breeds.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create pet breed (species is null in API response)
 * @param {Object} breedData - { name, species_id, description, average_weight, average_lifespan }
 * @returns {Promise<Object>}
 */
const createPetBreed = async (breedData) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền tạo giống');
    }

    const newBreed = {
        id: generateId(),
        name: breedData.name,
        species_id: breedData.species_id,
        description: breedData.description || '',
        average_weight: breedData.average_weight,
        average_lifespan: breedData.average_lifespan,
        species: null, // Match API: species is null in detail response
        pets: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PET_BREEDS.push(newBreed);

    return {
        success: true,
        data: newBreed,
        message: 'Tạo giống thành công'
    };
};

/**
 * Update pet breed (species is null in API response)
 * @param {string} breedId
 * @param {Object} updates - { name, species_id, description, average_weight, average_lifespan }
 * @returns {Promise<Object>}
 */
const updatePetBreed = async (breedId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật giống');
    }

    const breedIndex = MOCK_PET_BREEDS.findIndex(b => b.id === breedId && !b.is_deleted);

    if (breedIndex === -1) {
        throw new Error('Không tìm thấy giống');
    }

    const updatedBreed = {
        ...MOCK_PET_BREEDS[breedIndex],
        ...updates,
        species: null, // Match API: species is null in detail response
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    MOCK_PET_BREEDS[breedIndex] = updatedBreed;

    return {
        success: true,
        data: updatedBreed,
        message: 'Cập nhật giống thành công'
    };
};

/**
 * Delete pet breed
 * @param {string} breedId
 * @returns {Promise<Object>}
 */
const deletePetBreed = async (breedId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa giống');
    }

    const breedIndex = MOCK_PET_BREEDS.findIndex(b => b.id === breedId && !b.is_deleted);

    if (breedIndex === -1) {
        throw new Error('Không tìm thấy giống');
    }

    MOCK_PET_BREEDS[breedIndex].is_deleted = true;
    MOCK_PET_BREEDS[breedIndex].updated_at = new Date().toISOString();
    MOCK_PET_BREEDS[breedIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa giống thành công'
    };
};

// ========== PET GROUPS API ==========

/**
 * Get all pet groups (Nhóm Pet) - List view populates nested objects for UI
 * @returns {Promise<Object>}
 */
const getPetGroups = async () => {
    await delay(200);

    const groups = MOCK_PET_GROUPS.filter(g => !g.is_deleted);

    // Populate nested objects for list view
    const groupsWithNested = groups.map(group => ({
        ...group,
        pet_species: group.pet_species_id ? MOCK_PET_SPECIES.find(s => s.id === group.pet_species_id) || null : null,
        pet_breed: group.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === group.pet_breed_id) || null : null
    }));

    return {
        success: true,
        data: groupsWithNested,
        pagination: {
            total_items_count: groups.length,
            page_size: 10,
            total_pages_count: 1,
            page_index: 0,
            has_next: false,
            has_previous: false
        }
    };
};

/**
 * Create pet group (nested objects ARE populated in API response, unlike Pet/Breed)
 * @param {Object} groupData - { name, description, pet_species_id, pet_breed_id }
 * @returns {Promise<Object>}
 */
const createPetGroup = async (groupData) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền tạo nhóm');
    }

    // Get nested species object
    const species = MOCK_PET_SPECIES.find(s => s.id === groupData.pet_species_id);
    const breed = groupData.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === groupData.pet_breed_id) : null;

    const newGroup = {
        id: generateId(),
        name: groupData.name,
        description: groupData.description || '',
        pet_species_id: groupData.pet_species_id,
        pet_species: species ? {
            ...species,
            pet_breeds: [],
            pets: [],
            vaccine_types: []
        } : null,
        pet_breed_id: groupData.pet_breed_id,
        pet_breed: breed ? {
            ...breed,
            species: null,
            pets: []
        } : null,
        pets: [],
        slots: [],
        created_at: new Date().toISOString(),
        created_by: currentUser?.id || '00000000-0000-0000-0000-000000000000',
        updated_at: new Date().toISOString(),
        updated_by: null,
        is_deleted: false
    };

    MOCK_PET_GROUPS.push(newGroup);

    return {
        success: true,
        data: newGroup,
        message: 'Tạo nhóm thành công'
    };
};

/**
 * Update pet group (nested objects ARE populated in API response, unlike Pet/Breed)
 * @param {string} groupId
 * @param {Object} updates - { name, description, pet_species_id, pet_breed_id }
 * @returns {Promise<Object>}
 */
const updatePetGroup = async (groupId, updates) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền cập nhật nhóm');
    }

    const groupIndex = MOCK_PET_GROUPS.findIndex(g => g.id === groupId && !g.is_deleted);

    if (groupIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    const updatedGroup = {
        ...MOCK_PET_GROUPS[groupIndex],
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: currentUser?.id || '00000000-0000-0000-0000-000000000000'
    };

    // Update nested objects if IDs changed
    if (updates.pet_species_id !== undefined) {
        const species = MOCK_PET_SPECIES.find(s => s.id === updates.pet_species_id);
        updatedGroup.pet_species = species ? {
            ...species,
            pet_breeds: [],
            pets: [],
            vaccine_types: []
        } : null;
    }
    if (updates.pet_breed_id !== undefined) {
        const breed = updates.pet_breed_id ? MOCK_PET_BREEDS.find(b => b.id === updates.pet_breed_id) : null;
        updatedGroup.pet_breed = breed ? {
            ...breed,
            species: null,
            pets: []
        } : null;
    }

    MOCK_PET_GROUPS[groupIndex] = updatedGroup;

    return {
        success: true,
        data: updatedGroup,
        message: 'Cập nhật nhóm thành công'
    };
};

/**
 * Delete pet group
 * @param {string} groupId
 * @returns {Promise<Object>}
 */
const deletePetGroup = async (groupId) => {
    await delay(400);
    const currentUser = getCurrentUser();

    if (!checkPermission(currentUser, 'pet_management')) {
        throw new Error('Không có quyền xóa nhóm');
    }

    const groupIndex = MOCK_PET_GROUPS.findIndex(g => g.id === groupId && !g.is_deleted);

    if (groupIndex === -1) {
        throw new Error('Không tìm thấy nhóm');
    }

    MOCK_PET_GROUPS[groupIndex].is_deleted = true;
    MOCK_PET_GROUPS[groupIndex].updated_at = new Date().toISOString();
    MOCK_PET_GROUPS[groupIndex].updated_by = currentUser?.id || '00000000-0000-0000-0000-000000000000';

    return {
        success: true,
        message: 'Xóa nhóm thành công'
    };
};

// Export API
export const petApi = {
    // Pets
    getPets,
    getMyPets: getPets,  // Alias for backward compatibility
    getPetById,
    addPet,
    updatePet,
    deletePet,
    // Species
    getPetSpecies,
    // Breeds
    getPetBreeds,
    createPetBreed,
    updatePetBreed,
    deletePetBreed,
    // Groups
    getPetGroups,
    createPetGroup,
    updatePetGroup,
    deletePetGroup
};

export default petApi;
