import axios from 'axios';

// Base configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Utility functions
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateId = (prefix = 'id') => {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
        // Khách hàng không quản lý thú cưng của quán
        'customer': [],
        // Nhân viên và quản lý có thể xem/tác động lên thú cưng của quán
        'working_staff': ['pet_view_all', 'pet_management'],
        'manager': ['pet_view_all', 'pet_management'],
        'admin': ['full_access']
    };

    const userPermissions = rolePermissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('full_access');
};

// Mock pets database
let MOCK_PETS = [
    {
        id: 'pet-001',
        ownerId: 'cafe',
        name: 'Bông',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        weight: 25.5,
        gender: 'female',
        color: 'Vàng',
        avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234567',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-01-15',
                nextDue: '2024-01-15',
                veterinarian: 'Dr. Nguyễn Văn A'
            },
            {
                name: 'Viêm gan',
                date: '2023-06-20',
                nextDue: '2024-06-20',
                veterinarian: 'Dr. Trần Thị B'
            }
        ],
        medicalHistory: [
            {
                date: '2023-12-10',
                condition: 'Khám định kỳ',
                treatment: 'Khỏe mạnh',
                veterinarian: 'Dr. Nguyễn Văn A',
                notes: 'Sức khỏe tốt, cần tiếp tục chế độ ăn hiện tại'
            }
        ],
        preferences: {
            favoriteToys: ['Bóng tennis', 'Dây kéo'],
            favoriteFood: 'Royal Canin Adult',
            allergies: [],
            specialNeeds: 'Cần vận động nhiều'
        },
        behavior: {
            temperament: 'friendly',
            energyLevel: 'high',
            trainingLevel: 'basic',
            socializedWithDogs: true,
            socializedWithCats: false,
            goodWithChildren: true
        },
        services: ['grooming', 'training'],
        notes: 'Rất thân thiện và năng động',
        createdAt: '2023-01-10T10:00:00',
        updatedAt: '2023-12-10T15:30:00'
    },
    {
        id: 'pet-002',
        ownerId: 'cafe',
        name: 'Miu',
        species: 'cat',
        breed: 'Mèo Anh lông ngắn',
        age: 2,
        weight: 4.2,
        gender: 'female',
        color: 'Xám',
        avatar: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234568',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-03-10',
                nextDue: '2024-03-10',
                veterinarian: 'Dr. Lê Văn C'
            }
        ],
        medicalHistory: [
            {
                date: '2023-11-15',
                condition: 'Cảm lạnh nhẹ',
                treatment: 'Thuốc kháng sinh',
                veterinarian: 'Dr. Lê Văn C',
                notes: 'Đã khỏi hoàn toàn'
            }
        ],
        preferences: {
            favoriteToys: ['Chuột nhồi bông', 'Banh nhỏ'],
            favoriteFood: 'Whiskas Adult',
            allergies: ['Cá ngừ'],
            specialNeeds: 'Cần môi trường yên tĩnh'
        },
        behavior: {
            temperament: 'calm',
            energyLevel: 'medium',
            trainingLevel: 'none',
            socializedWithDogs: false,
            socializedWithCats: true,
            goodWithChildren: true
        },
        services: ['grooming', 'healthcare'],
        notes: 'Tính tình hiền lành, dễ thương',
        createdAt: '2023-02-15T14:20:00',
        updatedAt: '2023-11-15T09:45:00'
    },
    {
        id: 'pet-003',
        ownerId: 'cafe',
        name: 'Max',
        species: 'dog',
        breed: 'Husky',
        age: 4,
        weight: 30.0,
        gender: 'male',
        color: 'Đen trắng',
        avatar: 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234569',
        vaccinations: [
            {
                name: 'Dại',
                date: '2023-02-20',
                nextDue: '2024-02-20',
                veterinarian: 'Dr. Phạm Thị D'
            }
        ],
        medicalHistory: [],
        preferences: {
            favoriteToys: ['Frisbee', 'Xương cao su'],
            favoriteFood: 'Pedigree Adult',
            allergies: ['Gà'],
            specialNeeds: 'Cần luyện tập thường xuyên'
        },
        behavior: {
            temperament: 'energetic',
            energyLevel: 'very_high',
            trainingLevel: 'intermediate',
            socializedWithDogs: true,
            socializedWithCats: false,
            goodWithChildren: true
        },
        services: ['training', 'healthcare'],
        notes: 'Thông minh, cần luyện tập thường xuyên',
        createdAt: '2023-01-05T16:30:00',
        updatedAt: '2023-12-01T11:20:00'
    },
    {
        id: 'pet-004',
        ownerId: 'cafe',
        name: 'Luna',
        species: 'cat',
        breed: 'Persian',
        age: 3,
        weight: 4.8,
        gender: 'female',
        color: 'Trắng kem',
        avatar: 'https://images.unsplash.com/photo-1596854307943-279c4d3c7433?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234570',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Cần câu lông vũ'], favoriteFood: 'Royal Canin Persian', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'calm', energyLevel: 'low', trainingLevel: 'none', socializedWithDogs: false, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-18T10:00:00',
        updatedAt: '2024-01-18T10:00:00'
    },
    {
        id: 'pet-005',
        ownerId: 'cafe',
        name: 'Buddy',
        species: 'dog',
        breed: 'Labrador',
        age: 5,
        weight: 28.3,
        gender: 'male',
        color: 'Vàng nhạt',
        avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234571',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Xương cao su'], favoriteFood: 'Pedigree Adult', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'friendly', energyLevel: 'medium', trainingLevel: 'intermediate', socializedWithDogs: true, socializedWithCats: true, goodWithChildren: true },
        services: ['training', 'grooming'],
        notes: '',
        createdAt: '2024-01-19T10:00:00',
        updatedAt: '2024-01-19T10:00:00'
    },
    {
        id: 'pet-006',
        ownerId: 'cafe',
        name: 'Coco',
        species: 'cat',
        breed: 'Siamese',
        age: 1,
        weight: 3.1,
        gender: 'female',
        color: 'Be nâu',
        avatar: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234572',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Chuột vải'], favoriteFood: 'Whiskas', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'curious', energyLevel: 'medium', trainingLevel: 'none', socializedWithDogs: false, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-20T10:00:00',
        updatedAt: '2024-01-20T10:00:00'
    },
    {
        id: 'pet-007',
        ownerId: 'cafe',
        name: 'Rocky',
        species: 'dog',
        breed: 'German Shepherd',
        age: 6,
        weight: 34.7,
        gender: 'male',
        color: 'Nâu đen',
        avatar: 'https://images.unsplash.com/photo-1546527868-ccb7ee7dfa6a?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234573',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Bóng cao su'], favoriteFood: 'Royal Canin', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'alert', energyLevel: 'high', trainingLevel: 'advanced', socializedWithDogs: true, socializedWithCats: false, goodWithChildren: true },
        services: ['training'],
        notes: '',
        createdAt: '2024-01-21T10:00:00',
        updatedAt: '2024-01-21T10:00:00'
    },
    {
        id: 'pet-008',
        ownerId: 'cafe',
        name: 'Mochi',
        species: 'cat',
        breed: 'British Shorthair',
        age: 2,
        weight: 4.5,
        gender: 'male',
        color: 'Xám xanh',
        avatar: 'https://images.unsplash.com/photo-1555685812-4b943f1cb0eb?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234574',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Banh nhỏ'], favoriteFood: 'Royal Canin British', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'calm', energyLevel: 'low', trainingLevel: 'none', socializedWithDogs: false, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-22T10:00:00',
        updatedAt: '2024-01-22T10:00:00'
    },
    {
        id: 'pet-009',
        ownerId: 'cafe',
        name: 'Zoe',
        species: 'dog',
        breed: 'Poodle',
        age: 2,
        weight: 6.2,
        gender: 'female',
        color: 'Nâu đỏ',
        avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234575',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Búp bê vải'], favoriteFood: 'SmartHeart', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'playful', energyLevel: 'medium', trainingLevel: 'basic', socializedWithDogs: true, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-23T10:00:00',
        updatedAt: '2024-01-23T10:00:00'
    },
    {
        id: 'pet-010',
        ownerId: 'cafe',
        name: 'Leo',
        species: 'cat',
        breed: 'Ragdoll',
        age: 3,
        weight: 5.1,
        gender: 'male',
        color: 'Trắng nâu',
        avatar: 'https://images.unsplash.com/photo-1561948955-570b270e7c36?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234576',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Cần câu lông vũ'], favoriteFood: 'Monge', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'friendly', energyLevel: 'low', trainingLevel: 'none', socializedWithDogs: true, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-24T10:00:00',
        updatedAt: '2024-01-24T10:00:00'
    },
    {
        id: 'pet-011',
        ownerId: 'cafe',
        name: 'Bolt',
        species: 'dog',
        breed: 'Shiba Inu',
        age: 2,
        weight: 10.4,
        gender: 'male',
        color: 'Vàng cam',
        avatar: 'https://images.unsplash.com/photo-1583511655826-05700d52f4d9?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234577',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Bóng'], favoriteFood: 'Fitmin', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'alert', energyLevel: 'high', trainingLevel: 'intermediate', socializedWithDogs: true, socializedWithCats: false, goodWithChildren: true },
        services: ['training', 'grooming'],
        notes: '',
        createdAt: '2024-01-25T10:00:00',
        updatedAt: '2024-01-25T10:00:00'
    },
    {
        id: 'pet-012',
        ownerId: 'cafe',
        name: 'Mimi',
        species: 'cat',
        breed: 'Maine Coon',
        age: 4,
        weight: 6.8,
        gender: 'female',
        color: 'Nâu sọc',
        avatar: 'https://images.unsplash.com/photo-1574158622682-e40e69881006?q=80&w=300&auto=format&fit=crop',
        microchipId: 'MC001234578',
        vaccinations: [],
        medicalHistory: [],
        preferences: { favoriteToys: ['Bóng lò xo'], favoriteFood: 'Hill’s', allergies: [], specialNeeds: '' },
        behavior: { temperament: 'curious', energyLevel: 'medium', trainingLevel: 'none', socializedWithDogs: true, socializedWithCats: true, goodWithChildren: true },
        services: ['grooming'],
        notes: '',
        createdAt: '2024-01-26T10:00:00',
        updatedAt: '2024-01-26T10:00:00'
    }
];

// Pet breeds by species
const PET_BREEDS = {
    dog: [
        'Golden Retriever', 'Labrador', 'Husky', 'Poodle', 'Bulldog',
        'German Shepherd', 'Shiba Inu', 'Corgi', 'Chihuahua', 'Pug',
        'Border Collie', 'Rottweiler', 'Beagle', 'Dachshund', 'Boxer'
    ],
    cat: [
        'Mèo Anh lông ngắn', 'Mèo Anh lông dài', 'Mèo Nga', 'Persian',
        'Maine Coon', 'Siamese', 'Ragdoll', 'Bengal', 'Scottish Fold',
        'Munchkin', 'Sphynx', 'Abyssinian', 'Mèo ta', 'Exotic Shorthair', 'British Shorthair'
    ]
};

// Pet APIs
const petApi = {
    // Get all pets of cafe (manager/staff)
    async getPets() {
        await delay(300);
        // Development mode: always return all cafe pets; role guard handled at page level if needed
        const pets = [...MOCK_PETS];

        // Sort by creation date (newest first)
        pets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        return { success: true, data: pets };
    },

    // Backward compatibility (alias)
    async getMyPets() { return await this.getPets(); },

    // Get pet by ID
    async getPetById(petId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem thú cưng');
        }

        const pet = MOCK_PETS.find(p => p.id === petId);

        if (!pet) {
            throw new Error('Không tìm thấy thú cưng');
        }

        return { success: true, data: pet };
    },

    // Add new pet
    async addPet(petData) {
        await delay(500);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền thêm thú cưng');
        }

        // Validate required fields
        if (!petData.name || !petData.name.trim()) {
            throw new Error('Tên thú cưng là bắt buộc');
        }

        if (!petData.species) {
            throw new Error('Loài thú cưng là bắt buộc');
        }

        if (!petData.breed) {
            throw new Error('Giống thú cưng là bắt buộc');
        }

        if (!petData.age || petData.age < 0) {
            throw new Error('Tuổi thú cưng không hợp lệ');
        }

        if (!petData.gender || !['male', 'female'].includes(petData.gender)) {
            throw new Error('Giới tính thú cưng không hợp lệ');
        }

        // Check if pet name already exists in cafe
        const existingPet = MOCK_PETS.find(pet =>
            pet.name.toLowerCase() === petData.name.toLowerCase().trim()
        );

        if (existingPet) {
            throw new Error('Bạn đã có thú cưng với tên này rồi');
        }

        const newPet = {
            id: generateId('pet'),
            ownerId: 'cafe',
            name: petData.name.trim(),
            species: petData.species,
            breed: petData.breed,
            age: parseInt(petData.age),
            weight: parseFloat(petData.weight) || 0,
            gender: petData.gender,
            color: petData.color || '',
            avatar: petData.avatar || `https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=300&auto=format&fit=crop`,
            microchipId: petData.microchipId || '',
            vaccinations: petData.vaccinations || [],
            medicalHistory: petData.medicalHistory || [],
            preferences: {
                favoriteToys: petData.preferences?.favoriteToys || [],
                favoriteFood: petData.preferences?.favoriteFood || '',
                allergies: petData.preferences?.allergies || [],
                specialNeeds: petData.preferences?.specialNeeds || ''
            },
            behavior: {
                temperament: petData.behavior?.temperament || 'friendly',
                energyLevel: petData.behavior?.energyLevel || 'medium',
                trainingLevel: petData.behavior?.trainingLevel || 'none',
                socializedWithDogs: petData.behavior?.socializedWithDogs || false,
                socializedWithCats: petData.behavior?.socializedWithCats || false,
                goodWithChildren: petData.behavior?.goodWithChildren || true
            },
            services: petData.services || [],
            notes: petData.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        MOCK_PETS.push(newPet);

        return { success: true, data: newPet, message: 'Thêm thú cưng thành công' };
    },

    // Update pet information
    async updatePet(petId, updates) {
        await delay(400);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p => p.id === petId);

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng hoặc không có quyền cập nhật');
        }

        // Validate updates
        if (updates.name && !updates.name.trim()) {
            throw new Error('Tên thú cưng không được để trống');
        }

        if (updates.age && updates.age < 0) {
            throw new Error('Tuổi thú cưng không hợp lệ');
        }

        if (updates.weight && updates.weight < 0) {
            throw new Error('Cân nặng thú cưng không hợp lệ');
        }

        // Check for duplicate name if name is being updated
        if (updates.name && updates.name.toLowerCase().trim() !== MOCK_PETS[petIndex].name.toLowerCase()) {
            const existingPet = MOCK_PETS.find(pet =>
                pet.id !== petId &&
                pet.name.toLowerCase() === updates.name.toLowerCase().trim()
            );

            if (existingPet) {
                throw new Error('Bạn đã có thú cưng với tên này rồi');
            }
        }

        // Apply updates
        const allowedFields = [
            'name', 'breed', 'age', 'weight', 'color', 'avatar', 'microchipId',
            'vaccinations', 'medicalHistory', 'preferences', 'behavior',
            'services', 'notes'
        ];

        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                if (field === 'name') {
                    MOCK_PETS[petIndex][field] = updates[field].trim();
                } else if (field === 'age' || field === 'weight') {
                    MOCK_PETS[petIndex][field] = parseFloat(updates[field]);
                } else {
                    MOCK_PETS[petIndex][field] = updates[field];
                }
            }
        });

        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: MOCK_PETS[petIndex],
            message: 'Cập nhật thông tin thú cưng thành công'
        };
    },

    // Delete pet
    async deletePet(petId) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền xóa thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p => p.id === petId);

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng hoặc không có quyền xóa');
        }

        // Check if pet has active bookings
        // This would be imported from bookingApi in real implementation
        const hasActiveBookings = false; // Placeholder

        if (hasActiveBookings) {
            throw new Error('Không thể xóa thú cưng có lịch hẹn đang hoạt động');
        }

        const deletedPet = MOCK_PETS[petIndex];
        MOCK_PETS.splice(petIndex, 1);

        return {
            success: true,
            data: deletedPet,
            message: 'Xóa thú cưng thành công'
        };
    },

    // Get pet breeds by species
    async getPetBreeds(species = null) {
        await delay(100);

        if (species) {
            const breeds = PET_BREEDS[species] || [];
            return { success: true, data: breeds };
        }

        return { success: true, data: PET_BREEDS };
    },

    // Add vaccination record
    async addVaccination(petId, vaccinationData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thông tin thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p => p.id === petId);

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        const newVaccination = {
            id: generateId('vacc'),
            name: vaccinationData.name,
            date: vaccinationData.date,
            nextDue: vaccinationData.nextDue,
            veterinarian: vaccinationData.veterinarian || '',
            notes: vaccinationData.notes || '',
            addedAt: new Date().toISOString()
        };

        if (!MOCK_PETS[petIndex].vaccinations) {
            MOCK_PETS[petIndex].vaccinations = [];
        }

        MOCK_PETS[petIndex].vaccinations.push(newVaccination);
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: newVaccination,
            message: 'Thêm thông tin tiêm phòng thành công'
        };
    },

    // Add medical history record
    async addMedicalRecord(petId, medicalData) {
        await delay(300);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật thông tin thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p => p.id === petId);

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        const newRecord = {
            id: generateId('med'),
            date: medicalData.date,
            condition: medicalData.condition,
            treatment: medicalData.treatment || '',
            veterinarian: medicalData.veterinarian || '',
            notes: medicalData.notes || '',
            addedAt: new Date().toISOString()
        };

        if (!MOCK_PETS[petIndex].medicalHistory) {
            MOCK_PETS[petIndex].medicalHistory = [];
        }

        MOCK_PETS[petIndex].medicalHistory.push(newRecord);
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: newRecord,
            message: 'Thêm hồ sơ y tế thành công'
        };
    },

    // Get pet statistics for owner
    async getPetStats(petId) {
        await delay(200);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_view_all')) {
            throw new Error('Không có quyền xem thú cưng');
        }

        const pet = MOCK_PETS.find(p => p.id === petId);

        if (!pet) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // This would integrate with booking and feedback APIs in real implementation
        const stats = {
            totalBookings: 5, // Placeholder
            completedServices: 4,
            upcomingBookings: 1,
            totalSpent: 850000,
            averageServiceRating: 4.8,
            lastVisit: '2024-01-27T10:30:00',
            nextAppointment: '2024-02-05T14:00:00',
            favoriteServices: ['grooming', 'healthcare'],
            healthStatus: 'excellent',
            vaccinationStatus: 'up_to_date'
        };

        return { success: true, data: stats };
    },

    // Upload pet photo
    async uploadPetPhoto(petId, photoFile) {
        await delay(800);
        const currentUser = getCurrentUser();

        if (!checkPermission(currentUser, 'pet_management')) {
            throw new Error('Không có quyền cập nhật ảnh thú cưng');
        }

        const petIndex = MOCK_PETS.findIndex(p =>
            p.id === petId && p.ownerId === currentUser.id
        );

        if (petIndex === -1) {
            throw new Error('Không tìm thấy thú cưng');
        }

        // Validate file
        if (!photoFile) {
            throw new Error('Không có file ảnh được chọn');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        if (!allowedTypes.includes(photoFile.type)) {
            throw new Error('Chỉ chấp nhận file ảnh định dạng JPG, PNG, WEBP');
        }

        const maxSize = 5 * 1024 * 1024; // 5MB
        if (photoFile.size > maxSize) {
            throw new Error('File ảnh không được vượt quá 5MB');
        }

        // Simulate upload process
        const mockUploadUrl = URL.createObjectURL(photoFile);

        MOCK_PETS[petIndex].avatar = mockUploadUrl;
        MOCK_PETS[petIndex].updatedAt = new Date().toISOString();

        return {
            success: true,
            data: {
                petId,
                avatar: mockUploadUrl
            },
            message: 'Cập nhật ảnh thú cưng thành công'
        };
    }
};

// Export both named and default
export { petApi };
export default petApi;
